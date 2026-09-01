import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiErrorResponse, apiErrors } from "@/lib/api/errors";
import { RateLimitClient, enforceRateLimit } from "@/lib/api/rate-limit";
import { SchemaValidationError, uuidSchema } from "@/lib/api/validation";
import {
  logOperationalAlert,
  logServerError,
} from "@/lib/observability/logger";
import { getRequestContext } from "@/lib/observability/request-context";

function createRequestSupabaseClient(authorization: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment is not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestContext = getRequestContext(request);
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return apiErrorResponse(
      apiErrors.unauthorized("Bạn cần đăng nhập để xem tệp minh chứng."),
    );
  }

  const { id: rawId } = await params;

  try {
    const id = uuidSchema.parse(rawId, "id");
    const supabase = createRequestSupabaseClient(authorization);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      throw apiErrors.unauthorized(
        "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
      );
    }

    await enforceRateLimit(
      supabase as unknown as RateLimitClient,
      "evidence_signed_url",
    );
    const { data: evidence, error: evidenceError } = await supabase
      .from("minh_chung")
      .select("id, co_so_id, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (evidenceError || !evidence) {
      throw apiErrors.notFound(
        "Không tìm thấy minh chứng hoặc bạn không có quyền xem.",
      );
    }

    if (!evidence.storage_path) {
      throw apiErrors.badRequest("Minh chứng này không có tệp lưu trữ.");
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("evidence")
      .createSignedUrl(evidence.storage_path, 600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      logOperationalAlert(
        "STORAGE_FAILURE",
        "evidence_signed_url_storage_failed",
        signedUrlError,
        {
          operation: "create_signed_url",
          resourceId: id,
          ...requestContext,
          status: 403,
        },
      );
      throw apiErrors.forbidden(
        "Không thể mở tệp minh chứng. Hãy kiểm tra quyền truy cập rồi thử lại.",
      );
    }

    const { error: auditError } = await supabase.rpc("fn_log_user_access", {
      p_hanh_dong: "EVIDENCE_FILE_SIGNED_URL_CREATED",
      p_doi_tuong_id: evidence.id,
      p_du_lieu_moi: { expires_in: 600 },
    });

    if (auditError) {
      throw new ApiError(
        500,
        "AUDIT_WRITE_FAILED",
        "Không ghi nhận được lượt truy cập tệp. Vui lòng thử lại.",
      );
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl });
  } catch (error) {
    const status = error instanceof ApiError
      ? error.status
      : error instanceof SchemaValidationError
        ? 422
        : 500;
    logServerError("evidence_signed_url_failed", error, {
      operation: "create_signed_url",
      resourceId: rawId,
      ...requestContext,
      status,
    });
    return apiErrorResponse(
      error,
      "Không thể mở tệp minh chứng lúc này. Vui lòng thử lại.",
    );
  }
}
