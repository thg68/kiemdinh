export type SecurityHeader = {
  key: string;
  value: string;
};

function compactPolicy(value: string) {
  return value.replace(/\s{2,}/g, " ").trim();
}

export function buildSecurityHeaders(isProduction = process.env.NODE_ENV === "production"): SecurityHeader[] {
  const scriptSources = ["'self'", "'unsafe-inline'"];

  if (!isProduction) {
    scriptSources.push("'unsafe-eval'");
  }

  const csp = compactPolicy(`
    default-src 'self';
    script-src ${scriptSources.join(" ")};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://*.supabase.co;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    media-src 'self' blob: https://*.supabase.co;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isProduction ? "upgrade-insecure-requests;" : ""}
  `);

  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];

  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}
