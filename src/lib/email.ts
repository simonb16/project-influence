import { log } from "@/lib/agents";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "SWAY <onboarding@resend.dev>";

// Only send notifications for runs that actually took a while — nobody needs
// an email for something they watched finish.
export const EMAIL_MIN_DURATION_MS = 2 * 60 * 1000;

export function isEmailEnabled(): boolean {
  return Boolean(RESEND_API_KEY);
}

function isValidEmail(email: string | null | undefined): email is string {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return "http://localhost:3000";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    log(`Email skipped (RESEND_API_KEY not set — local dev): "${subject}" → ${to}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      log(`Email send failed (${res.status}): ${body}`);
    }
  } catch (err) {
    log(`Email send failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  // Non-fatal by design — callers never await failure into the run's outcome.
}

export async function sendCompletionEmail(
  email: string | null | undefined,
  reportId: string,
  title: string,
  audienceOneLiner: string
): Promise<void> {
  if (!isValidEmail(email)) {
    log("Completion email skipped — no valid recipient address for this run");
    return;
  }
  const link = `${appUrl()}/report/${reportId}`;
  const html = `
    <p>Your SWAY report is ready.</p>
    <p><strong>${escapeHtml(title)}</strong><br/>${escapeHtml(audienceOneLiner)}</p>
    <p><a href="${link}">${link}</a></p>
  `;
  await sendEmail(email, `Your SWAY report is ready: ${title}`, html);
}

export async function sendFailureEmail(
  email: string | null | undefined,
  errorMessage: string
): Promise<void> {
  if (!isValidEmail(email)) {
    log("Failure email skipped — no valid recipient address for this run");
    return;
  }
  const link = appUrl();
  const html = `
    <p>Your SWAY run hit a problem.</p>
    <p>${escapeHtml(errorMessage)}</p>
    <p><a href="${link}">${link}</a> to re-run.</p>
  `;
  await sendEmail(email, "Your SWAY run hit a problem", html);
}
