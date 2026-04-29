import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export function getAITools(workspaceId: string, supabase: SupabaseClient) {
  return {
    get_project_summary: tool({
      description:
        "Get a summary of a project including task counts, bug counts, completion percentage.",
      inputSchema: z.object({
        project_id: z.string().uuid().describe("The project ID"),
      }),
      execute: async ({ project_id }) => {
        const { data: project } = await supabase
          .from("projects")
          .select("name, status, priority, target_date")
          .eq("id", project_id)
          .single();

        const { count: totalTasks } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project_id);

        const { count: completedTasks } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project_id)
          .not("completed_at", "is", null);

        const { count: openBugs } = await supabase
          .from("bugs")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project_id)
          .in("status", ["open", "confirmed", "in_progress"]);

        const total = totalTasks ?? 0;
        const completed = completedTasks ?? 0;

        return {
          project: project?.name ?? "Unknown",
          status: project?.status,
          completion: total > 0 ? Math.round((completed / total) * 100) : 0,
          total_tasks: total,
          completed_tasks: completed,
          open_bugs: openBugs ?? 0,
          target_date: project?.target_date,
        };
      },
    }),

    get_task_details: tool({
      description: "Get details of a task by its identifier (e.g., PROJ-42).",
      inputSchema: z.object({
        identifier: z.string().describe("Task identifier like PROJ-42"),
      }),
      execute: async ({ identifier }) => {
        const { data } = await supabase
          .from("tasks")
          .select(
            "identifier, title, description, status, priority, type, due_date, created_at, completed_at, assignee:workspace_members!tasks_assignee_id_fkey(display_name)"
          )
          .eq("identifier", identifier.toUpperCase())
          .single();

        if (!data) return { error: `Task ${identifier} not found` };

        return {
          ...data,
          assignee: (data.assignee as unknown as { display_name: string | null })?.display_name,
          description: data.description?.slice(0, 500),
        };
      },
    }),

    search_tasks: tool({
      description: "Search tasks by keyword.",
      inputSchema: z.object({
        query: z.string().describe("Search keyword"),
        status: z.string().optional().describe("Optional status filter"),
      }),
      execute: async ({ query, status }) => {
        let q = supabase
          .from("tasks")
          .select("identifier, title, status, priority, due_date")
          .eq("workspace_id", workspaceId)
          .textSearch("fts", query)
          .limit(10);

        if (status) q = q.eq("status", status);
        const { data } = await q;
        return { tasks: data ?? [], count: data?.length ?? 0 };
      },
    }),

    get_member_workload: tool({
      description: "Get a member's workload — open tasks, completion rate.",
      inputSchema: z.object({
        member_name: z.string().describe("Display name of the member"),
      }),
      execute: async ({ member_name }) => {
        const { data: members } = await supabase
          .from("workspace_members")
          .select("id, display_name")
          .eq("workspace_id", workspaceId)
          .ilike("display_name", `%${member_name}%`)
          .limit(1);

        if (!members?.length) return { error: `Member "${member_name}" not found` };

        const mid = members[0].id;
        const [total, completed, overdue] = await Promise.all([
          supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assignee_id", mid),
          supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assignee_id", mid).not("completed_at", "is", null),
          supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assignee_id", mid).is("completed_at", null).lt("due_date", new Date().toISOString()),
        ]);

        const t = total.count ?? 0;
        const c = completed.count ?? 0;
        return {
          member: members[0].display_name,
          total_tasks: t,
          completed: c,
          open: t - c,
          overdue: overdue.count ?? 0,
          completion_rate: t > 0 ? Math.round((c / t) * 100) : 0,
        };
      },
    }),

    list_projects: tool({
      description: "List all projects in the workspace.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await supabase
          .from("projects")
          .select("id, name, slug, status, priority, target_date")
          .eq("workspace_id", workspaceId)
          .neq("status", "archived")
          .order("name");

        return { projects: data ?? [] };
      },
    }),

    create_task: tool({
      description: "Create a new task in a project.",
      inputSchema: z.object({
        project_id: z.string().uuid().describe("Project ID"),
        title: z.string().min(1).max(500).describe("Task title"),
        priority: z.enum(["none", "low", "medium", "high", "urgent"]).default("none"),
        due_date: z.string().optional().describe("Due date YYYY-MM-DD"),
      }),
      execute: async ({ project_id, title, priority, due_date }) => {
        const { data: member } = await supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", workspaceId)
          .limit(1)
          .single();

        const { data, error } = await supabase
          .from("tasks")
          .insert({
            project_id,
            workspace_id: workspaceId,
            title,
            priority,
            reporter_id: member?.id ?? "",
            due_date: due_date ? `${due_date}T00:00:00Z` : undefined,
          })
          .select("identifier, title")
          .single();

        if (error) return { error: error.message };
        return { message: `Created task ${data.identifier}: ${data.title}` };
      },
    }),

    update_task_status: tool({
      description: "Change a task's status.",
      inputSchema: z.object({
        identifier: z.string().describe("Task identifier like PROJ-42"),
        new_status: z.string().describe("New status"),
      }),
      execute: async ({ identifier, new_status }) => {
        const { data, error } = await supabase
          .from("tasks")
          .update({ status: new_status })
          .eq("identifier", identifier.toUpperCase())
          .select("identifier, status")
          .single();

        if (error) return { error: error.message };
        return { message: `Updated ${data.identifier} to "${data.status}"` };
      },
    }),

    get_bug_summary: tool({
      description: "Get bug summary for a project by severity and status.",
      inputSchema: z.object({
        project_id: z.string().uuid().describe("Project ID"),
      }),
      execute: async ({ project_id }) => {
        const { data: bugs } = await supabase
          .from("bugs")
          .select("status, severity")
          .eq("project_id", project_id);

        if (!bugs) return { total: 0, by_status: {}, by_severity: {} };

        const byStatus: Record<string, number> = {};
        const bySeverity: Record<string, number> = {};
        for (const b of bugs) {
          byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
          bySeverity[b.severity] = (bySeverity[b.severity] ?? 0) + 1;
        }

        return { total: bugs.length, by_status: byStatus, by_severity: bySeverity };
      },
    }),

    create_bug: tool({
      description: "Report a new bug.",
      inputSchema: z.object({
        project_id: z.string().uuid().describe("Project ID"),
        title: z.string().min(1).describe("Bug title"),
        severity: z.enum(["cosmetic", "minor", "major", "critical", "blocker"]).default("minor"),
      }),
      execute: async ({ project_id, title, severity }) => {
        const { data: member } = await supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", workspaceId)
          .limit(1)
          .single();

        const { data, error } = await supabase
          .from("bugs")
          .insert({
            project_id,
            workspace_id: workspaceId,
            title,
            severity,
            reporter_id: member?.id ?? "",
          })
          .select("identifier, title")
          .single();

        if (error) return { error: error.message };
        return { message: `Reported ${data.identifier}: ${data.title}` };
      },
    }),
  };
}
