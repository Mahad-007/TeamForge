import { streamText } from "ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAIProvider, getDefaultModel, type WorkspaceAISettings } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { getAITools } from "@/lib/ai/tools";

export async function POST(req: Request) {
  const { messages, workspaceId, workspaceName, userName, projectName, projectId } =
    await req.json();

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => {
          try {
            c.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in streaming context
          }
        },
      },
    }
  );

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get workspace AI settings
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", workspaceId)
    .single();

  const aiSettings = (workspace?.settings ?? {}) as WorkspaceAISettings;
  const provider = getAIProvider(aiSettings);
  const modelName = getDefaultModel(aiSettings);

  const context = {
    workspaceName: workspaceName ?? "Workspace",
    workspaceId,
    userName: userName ?? "User",
    projectName,
    projectId,
  };

  const tools = getAITools(workspaceId, supabase);

  const result = streamText({
    model: provider(modelName),
    system: buildSystemPrompt(context),
    messages,
    tools,
  });

  return result.toTextStreamResponse();
}
