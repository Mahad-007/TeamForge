import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "TeamForge <notifications@teamforge.app>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log("[Email] Resend not configured. Would send:", { to, subject });
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send:", error);
  }
}

export async function sendTaskAssignmentEmail(
  email: string,
  taskIdentifier: string,
  taskTitle: string,
  projectName: string,
  assignerName: string
) {
  await sendEmail({
    to: email,
    subject: `[TeamForge] You've been assigned: ${taskIdentifier} ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Task Assignment</h2>
        <p><strong>${assignerName}</strong> assigned you a task:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 600;">${taskIdentifier}: ${taskTitle}</p>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Project: ${projectName}</p>
        </div>
        <p style="color: #64748b; font-size: 12px;">— TeamForge</p>
      </div>
    `,
  });
}

export async function sendDueDateReminderEmail(
  email: string,
  taskIdentifier: string,
  taskTitle: string,
  dueDate: string,
  isOverdue: boolean
) {
  const status = isOverdue ? "overdue" : "due soon";
  const color = isOverdue ? "#dc2626" : "#f59e0b";

  await sendEmail({
    to: email,
    subject: `[TeamForge] Task ${status}: ${taskIdentifier} ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: ${color};">Task ${isOverdue ? "Overdue" : "Due Soon"}</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 600;">${taskIdentifier}: ${taskTitle}</p>
          <p style="margin: 4px 0 0; color: ${color}; font-size: 14px;">Due: ${new Date(dueDate).toLocaleDateString()}</p>
        </div>
        <p style="color: #64748b; font-size: 12px;">— TeamForge</p>
      </div>
    `,
  });
}
