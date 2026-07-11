import { Resend } from "resend";

// Resend email integration, isolated here like the other providers. Server-only
// (reads RESEND_API_KEY). Used by the deadline-alert cron job.

let client: Resend | null = null;

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY in .env.local");
  }
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

/**
 * Sender address. Resend only delivers from a verified domain; until one is set
 * up, the shared onboarding@resend.dev sender works for testing (delivers to
 * the Resend account owner). Override with EMAIL_FROM once a domain is verified.
 */
function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "FounderPrep <onboarding@resend.dev>";
}

export interface DeadlineEmail {
  to: string;
  founderName: string;
  itemName: string;
  dueDate: string; // YYYY-MM-DD
  daysOut: number; // 7, 1, or 0
  penalty?: string | null;
}

/** Human phrasing for the alert window. */
function windowPhrase(daysOut: number): string {
  if (daysOut <= 0) return "is due today";
  if (daysOut === 1) return "is due tomorrow";
  return `is due in ${daysOut} days`;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendDeadlineEmail(email: DeadlineEmail): Promise<SendResult> {
  const phrase = windowPhrase(email.daysOut);
  const subject = `Reminder: ${email.itemName} ${phrase}`;
  const penaltyLine = email.penalty
    ? `<p style="margin:0 0 12px;color:#8a2b2b"><strong>If missed:</strong> ${email.penalty}</p>`
    : "";

  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#17201b;max-width:520px">
      <p style="margin:0 0 12px">Hi ${email.founderName || "there"},</p>
      <p style="margin:0 0 12px">Your compliance task <strong>${email.itemName}</strong> ${phrase} (${email.dueDate}).</p>
      ${penaltyLine}
      <p style="margin:0 0 12px">Open your FounderPrep dashboard to review and mark it done.</p>
      <p style="margin:16px 0 0;font-size:12px;color:#8a978c">FounderPrep is a guide, not a substitute for advice from a qualified CA or lawyer.</p>
    </div>`;

  try {
    const { data, error } = await getClient().emails.send({
      from: fromAddress(),
      to: email.to,
      subject,
      html,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface ExpiryEmail {
  to: string;
  founderName: string;
  documentName: string;
  expiryDate: string; // YYYY-MM-DD
  daysOut: number; // 30, 7, 1, or 0
}

function expiryPhrase(daysOut: number): string {
  if (daysOut <= 0) return "expires today";
  if (daysOut === 1) return "expires tomorrow";
  return `expires in ${daysOut} days`;
}

/** Alert that a vault document is approaching its expiry date (M9). */
export async function sendDocumentExpiryEmail(
  email: ExpiryEmail,
): Promise<SendResult> {
  const phrase = expiryPhrase(email.daysOut);
  const subject = `Reminder: ${email.documentName} ${phrase}`;

  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#17201b;max-width:520px">
      <p style="margin:0 0 12px">Hi ${email.founderName || "there"},</p>
      <p style="margin:0 0 12px">Your document <strong>${email.documentName}</strong> ${phrase} (${email.expiryDate}).</p>
      <p style="margin:0 0 12px">Renew it in time, then upload the new copy to your FounderPrep vault.</p>
      <p style="margin:16px 0 0;font-size:12px;color:#8a978c">FounderPrep is a guide, not a substitute for advice from a qualified CA or lawyer.</p>
    </div>`;

  try {
    const { data, error } = await getClient().emails.send({
      from: fromAddress(),
      to: email.to,
      subject,
      html,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
