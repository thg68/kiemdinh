export const EMAIL_VERIFICATION_COOLDOWN_SECONDS = 60;
export const EMAIL_VERIFICATION_TTL_MINUTES = 60;

const RESEND_STORAGE_KEY = "pdt-email-verification-resend";

type StoredResend = {
  email: string;
  sentAt: number;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isEmailNotConfirmedError(error: { code?: string; message?: string } | string) {
  const code = typeof error === "string" ? "" : error.code?.toLowerCase() ?? "";
  const message = typeof error === "string" ? error : error.message ?? "";
  return code === "email_not_confirmed" || message.toLowerCase().includes("email not confirmed");
}

export function buildEmailVerificationRedirectUrl(baseUrl: string) {
  return new URL("/xac-thuc-email", `${baseUrl.replace(/\/$/, "")}/`).toString();
}

export function remainingResendCooldown(sentAt: number, now = Date.now()) {
  const elapsedSeconds = Math.floor(Math.max(0, now - sentAt) / 1_000);
  return Math.max(0, EMAIL_VERIFICATION_COOLDOWN_SECONDS - elapsedSeconds);
}

export function readResendCooldown(storage: Pick<Storage, "getItem">, email: string, now = Date.now()) {
  try {
    const raw = storage.getItem(RESEND_STORAGE_KEY);
    if (!raw) return 0;
    const stored = JSON.parse(raw) as Partial<StoredResend>;
    if (normalizeEmail(stored.email ?? "") !== normalizeEmail(email) || typeof stored.sentAt !== "number") {
      return 0;
    }
    return remainingResendCooldown(stored.sentAt, now);
  } catch {
    return 0;
  }
}

export function rememberResend(storage: Pick<Storage, "setItem">, email: string, sentAt = Date.now()) {
  const value: StoredResend = { email: normalizeEmail(email), sentAt };
  storage.setItem(RESEND_STORAGE_KEY, JSON.stringify(value));
}
