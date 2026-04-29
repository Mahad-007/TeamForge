interface TaskRow {
  identifier: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_name?: string;
}

interface BugRow {
  identifier: string;
  title: string;
  status: string;
  severity: string;
  priority: string;
  assignee_name?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPrintableDocument(title: string, tableHtml: string): string {
  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #111;
      padding: 40px;
      font-size: 12px;
    }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 11px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      text-align: left;
      padding: 6px 10px;
      border: 1px solid #ccc;
    }
    th {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    tr:nth-child(even) td { background: #fafafa; }
    @media print {
      body { padding: 20px; }
      tr:nth-child(even) td { background: none !important; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Exported on ${escapeHtml(exportDate)}</p>
  ${tableHtml}
</body>
</html>`;
}

export function exportTasksPDF(tasks: TaskRow[], projectName: string): void {
  const rows = tasks
    .map(
      (t) => `<tr>
      <td>${escapeHtml(t.identifier)}</td>
      <td>${escapeHtml(t.title)}</td>
      <td>${escapeHtml(t.status)}</td>
      <td>${escapeHtml(t.priority)}</td>
      <td>${escapeHtml(t.assignee_name ?? "--")}</td>
      <td>${t.due_date ? new Date(t.due_date).toLocaleDateString() : "--"}</td>
    </tr>`
    )
    .join("\n");

  const tableHtml = `<table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Title</th>
        <th>Status</th>
        <th>Priority</th>
        <th>Assignee</th>
        <th>Due Date</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;

  const html = buildPrintableDocument(
    `${projectName} - Tasks Export`,
    tableHtml
  );

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }
}

export function exportBugsPDF(bugs: BugRow[], projectName: string): void {
  const rows = bugs
    .map(
      (b) => `<tr>
      <td>${escapeHtml(b.identifier)}</td>
      <td>${escapeHtml(b.title)}</td>
      <td>${escapeHtml(b.status)}</td>
      <td>${escapeHtml(b.severity)}</td>
      <td>${escapeHtml(b.priority)}</td>
      <td>${escapeHtml(b.assignee_name ?? "--")}</td>
    </tr>`
    )
    .join("\n");

  const tableHtml = `<table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Title</th>
        <th>Status</th>
        <th>Severity</th>
        <th>Priority</th>
        <th>Assignee</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;

  const html = buildPrintableDocument(
    `${projectName} - Bug Report`,
    tableHtml
  );

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }
}
