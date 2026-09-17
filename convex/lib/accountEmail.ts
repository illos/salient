// SPDX-License-Identifier: GPL-3.0-only
export const RESET_TOKEN_SECONDS = 30 * 60;
const ACCOUNT_ID = '462b5ee1e395c11b8523d6c38de0577a';
const FROM = 'salient@blackgate.studio';

export function passwordRecoveryEnabled(): boolean {
  return Boolean(process.env.CLOUDFLARE_EMAIL_API_TOKEN && process.env.SITE_URL);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char]!;
  });
}

/** Called only from the internal action. Never include provider payloads in errors/logs. */
export async function deliverPasswordReset(email: string, token: string): Promise<void> {
  const apiToken = process.env.CLOUDFLARE_EMAIL_API_TOKEN;
  const siteUrl = process.env.SITE_URL;
  if (!apiToken || !siteUrl) throw new Error('Account email is not configured.');
  const url = new URL('/reset-password', siteUrl);
  url.searchParams.set('token', token);
  const text = `Reset your Salient password

Use this link within 30 minutes:
${url.href}

If you did not request a password reset, you can ignore this email.`;
  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/email/sending/send`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: email,
          subject: 'Reset your Salient password',
          text,
          html: `<h1>Reset your Salient password</h1><p><a href="${escapeHtml(url.href)}">Choose a new password</a></p><p>This link expires in 30 minutes.</p><p>If you did not request a password reset, you can ignore this email.</p>`,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    throw new Error('Account email delivery failed: network error.');
  }
  if (!response.ok) throw new Error(`Account email delivery failed: HTTP ${response.status}.`);
  // REST uses recipient lists, unlike the Workers binding's messageId response.
  const body: unknown = await response.json().catch(() => null);
  const result = body as {
    success?: boolean;
    result?: { delivered?: unknown; queued?: unknown; permanent_bounces?: unknown };
  } | null;
  const includesRecipient = (list: unknown) => Array.isArray(list) && list.includes(email);
  if (
    result?.success !== true ||
    includesRecipient(result.result?.permanent_bounces) ||
    !(includesRecipient(result.result?.delivered) || includesRecipient(result.result?.queued))
  ) {
    throw new Error('Account email delivery failed: recipient not accepted.');
  }
}
