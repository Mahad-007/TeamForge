interface TaskRow {
  identifier: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  due_date: string | null;
  created_at: string | null;
  completed_at: string | null;
  labels: string[] | null;
  assignee_name?: string;
}

export function exportTasksCSV(tasks: TaskRow[]): string {
  const headers = [
    "Identifier",
    "Title",
    "Status",
    "Priority",
    "Type",
    "Assignee",
    "Due Date",
    "Created",
    "Completed",
    "Labels",
  ];

  const rows = tasks.map((t) => [
    t.identifier,
    `"${t.title.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.type,
    t.assignee_name ?? "",
    t.due_date ? new Date(t.due_date).toLocaleDateString() : "",
    t.created_at ? new Date(t.created_at).toLocaleDateString() : "",
    t.completed_at ? new Date(t.completed_at).toLocaleDateString() : "",
    (t.labels ?? []).join("; "),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
