export const LOGIN_FAILURE_REASONS = [
  "email_not_confirmed",
  "invalid_credentials",
  "rate_limited",
  "service_unavailable",
  "unknown",
] as const;

export type LoginFailureReason = (typeof LOGIN_FAILURE_REASONS)[number];

export function classifyLoginFailure(message: string): LoginFailureReason {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "email_not_confirmed";
  }

  if (
    normalized.includes("invalid login")
    || normalized.includes("invalid credentials")
  ) {
    return "invalid_credentials";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "rate_limited";
  }

  if (
    normalized.includes("network")
    || normalized.includes("fetch")
    || normalized.includes("service unavailable")
  ) {
    return "service_unavailable";
  }

  return "unknown";
}
