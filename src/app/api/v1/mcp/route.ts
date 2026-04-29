import { NextResponse } from "next/server";
import { authenticateAPIKey } from "@/lib/api/auth";
import { handleAPIError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAITools } from "@/lib/ai/tools";

// MCP Streamable HTTP transport
export async function POST(req: Request) {
  try {
    const { workspaceId } = await authenticateAPIKey(req);
    const body = await req.json();
    const supabase = createAdminClient();

    // Handle MCP protocol messages
    const { method, params, id } = body;

    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "teamforge-mcp",
            version: "1.0.0",
          },
        },
      });
    }

    if (method === "tools/list") {
      const toolDefs = getMCPToolDefinitions();
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: { tools: toolDefs },
      });
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params;
      const tools = getAITools(workspaceId, supabase);

      const toolFn = (tools as unknown as Record<string, { execute: (args: unknown) => Promise<unknown> }>)[name];
      if (!toolFn) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Tool "${name}" not found` },
        });
      }

      const result = await toolFn.execute(args);
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        },
      });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method "${method}" not supported` },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

function getMCPToolDefinitions() {
  return [
    {
      name: "list_projects",
      description: "List all projects in the workspace.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_project_summary",
      description: "Get project summary with task/bug counts and completion %.",
      inputSchema: {
        type: "object",
        properties: { project_id: { type: "string", description: "Project UUID" } },
        required: ["project_id"],
      },
    },
    {
      name: "get_task_details",
      description: "Get task details by identifier (e.g., PROJ-42).",
      inputSchema: {
        type: "object",
        properties: { identifier: { type: "string", description: "Task identifier" } },
        required: ["identifier"],
      },
    },
    {
      name: "search_tasks",
      description: "Search tasks by keyword.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          status: { type: "string", description: "Optional status filter" },
        },
        required: ["query"],
      },
    },
    {
      name: "create_task",
      description: "Create a new task in a project.",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project UUID" },
          title: { type: "string", description: "Task title" },
          priority: { type: "string", enum: ["none", "low", "medium", "high", "urgent"] },
          due_date: { type: "string", description: "Due date YYYY-MM-DD" },
        },
        required: ["project_id", "title"],
      },
    },
    {
      name: "update_task_status",
      description: "Change a task's status.",
      inputSchema: {
        type: "object",
        properties: {
          identifier: { type: "string", description: "Task identifier" },
          new_status: { type: "string", description: "New status" },
        },
        required: ["identifier", "new_status"],
      },
    },
    {
      name: "get_member_workload",
      description: "Get a member's task workload.",
      inputSchema: {
        type: "object",
        properties: { member_name: { type: "string", description: "Member name" } },
        required: ["member_name"],
      },
    },
    {
      name: "get_bug_summary",
      description: "Get bug summary for a project.",
      inputSchema: {
        type: "object",
        properties: { project_id: { type: "string", description: "Project UUID" } },
        required: ["project_id"],
      },
    },
    {
      name: "create_bug",
      description: "Report a new bug.",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project UUID" },
          title: { type: "string", description: "Bug title" },
          severity: { type: "string", enum: ["cosmetic", "minor", "major", "critical", "blocker"] },
        },
        required: ["project_id", "title"],
      },
    },
  ];
}
