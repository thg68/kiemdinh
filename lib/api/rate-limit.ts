import { ApiError, databaseApiError } from "./errors";

export const RATE_LIMIT_ACTIONS = [
  "report_export",
  "evidence_zip",
  "evidence_signed_url",
] as const;

export type RateLimitAction = (typeof RATE_LIMIT_ACTIONS)[number];

type RateLimitRow = {
  con_lai: number;
  duoc_phep: boolean;
  thu_lai_sau_giay: number;
};

export type RateLimitClient = {
  rpc(
    name: "fn_kiem_tra_gioi_han_api",
    args: { p_hanh_dong: RateLimitAction },
  ): PromiseLike<{ data: unknown; error: unknown }>;
};

function isRateLimitRow(value: unknown): value is RateLimitRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<RateLimitRow>;
  return (
    typeof row.duoc_phep === "boolean" &&
    typeof row.con_lai === "number" &&
    typeof row.thu_lai_sau_giay === "number"
  );
}

export async function enforceRateLimit(
  client: RateLimitClient,
  action: RateLimitAction,
) {
  const { data, error } = await client.rpc("fn_kiem_tra_gioi_han_api", {
    p_hanh_dong: action,
  });

  if (error) {
    const mappedError = databaseApiError(
      error,
      "Không thể kiểm tra giới hạn thao tác. Vui lòng thử lại.",
    );

    if (mappedError.status !== 500) {
      throw mappedError;
    }

    throw new ApiError(
      500,
      "RATE_LIMIT_CHECK_FAILED",
      "Không thể kiểm tra giới hạn thao tác. Vui lòng thử lại.",
    );
  }

  const candidate = Array.isArray(data) ? data[0] : data;
  if (!isRateLimitRow(candidate)) {
    throw new ApiError(
      500,
      "RATE_LIMIT_CHECK_FAILED",
      "Không nhận được kết quả kiểm tra giới hạn hợp lệ.",
    );
  }

  const retryAfterSeconds = Math.max(1, Math.ceil(candidate.thu_lai_sau_giay));
  const result = {
    allowed: candidate.duoc_phep,
    remaining: Math.max(0, candidate.con_lai),
    retryAfterSeconds,
  };

  if (!result.allowed) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
      undefined,
      { "Retry-After": String(retryAfterSeconds) },
    );
  }

  return result;
}
