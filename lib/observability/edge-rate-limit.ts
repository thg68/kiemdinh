import { getCloudflareContext } from "@opennextjs/cloudflare";

type RateLimitResult = {
  success: boolean;
};

type RateLimitBinding = {
  limit(options: { key: string }): Promise<RateLimitResult>;
};

export async function isOperationalAlertAllowed(key: string) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const limiter = (env as { OBSERVABILITY_RATE_LIMITER?: RateLimitBinding })
      .OBSERVABILITY_RATE_LIMITER;

    if (!limiter) {
      return process.env.NODE_ENV !== "production";
    }

    const result = await limiter.limit({ key });
    return result.success;
  } catch {
    // Production phải đóng khi binding lỗi để endpoint quan sát không thành nguồn spam.
    return process.env.NODE_ENV !== "production";
  }
}

export function unauthenticatedAlertKey(request: Pick<Request, "headers">) {
  const edgeAddress = request.headers.get("cf-connecting-ip") ?? "unknown";
  return `auth-failure:${edgeAddress}`;
}
