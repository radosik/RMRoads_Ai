export function parseAlertRecipients(value: string | null | undefined) {
  return Array.from(
    new Set(
      (value || "")
        .split(/[\n,;]/)
        .map((recipient) => recipient.trim().toLowerCase())
        .filter((recipient) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)),
    ),
  );
}

export function canEnableCriticalAlerts(alertEmailsEnabled: boolean, alertRecipients: string[]) {
  return !alertEmailsEnabled || alertRecipients.length > 0;
}

export function normalizeInviteEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidInviteEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeInviteEmail(value));
}

export function buildManualInviteInstruction(contactEmail: string) {
  return `Collect the teammate email and create the account from the admin side during pilot onboarding. Operational contact: ${contactEmail}`;
}
