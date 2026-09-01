import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiError,
  apiErrorResponse,
  apiErrors,
  databaseApiError,
} from "@/lib/api/errors";
import {
  logOperationalAlert,
  logServerError,
} from "@/lib/observability/logger";
import { getRequestContext } from "@/lib/observability/request-context";

type OrphanStorageObject = {
  storage_path: string;
  nam_hoc_id: string;
  created_at: string;
  kich_thuoc: number | null;
  loai_tep: string | null;
};

function createRequestSupabaseClient(authorization: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw apiErrors.internal("Cấu hình kết nối Supabase chưa sẵn sàng.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
}

function parseMinimumAge(request: NextRequest) {
  const rawValue = request.nextUrl.searchParams.get("olderThanMinutes") ?? "60";
  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 15 || value > 10080) {
    return null;
  }

  return value;
}

async function loadOrphans(request: NextRequest) {
  const requestContext = getRequestContext(request);
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return {
      response: apiErrorResponse(
        apiErrors.unauthorized("Bạn cần đăng nhập để kiểm tra tệp tải lỗi."),
      ),
    };
  }

  const minimumAge = parseMinimumAge(request);

  if (minimumAge === null) {
    return {
      response: apiErrorResponse(
        apiErrors.unprocessable("Thời gian chờ phải từ 15 phút đến 7 ngày."),
      ),
    };
  }

  const supabase = createRequestSupabaseClient(authorization);
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      response: apiErrorResponse(
        apiErrors.unauthorized("Phiên đăng nhập không hợp lệ hoặc đã hết hạn."),
      ),
    };
  }

  const { data, error } = await supabase.rpc(
    "fn_liet_ke_object_minh_chung_mo_coi",
    { p_toi_thieu_phut: minimumAge },
  );

  if (error) {
    logServerError("evidence_orphan_list_rejected", error, {
      operation: "list_orphan_evidence_objects",
      ...requestContext,
      status: 403,
    });
    return {
      response: apiErrorResponse(
        databaseApiError(
          error,
          "Không thể kiểm tra tệp tải lỗi lúc này.",
        ),
      ),
    };
  }

  return {
    items: (data ?? []) as OrphanStorageObject[],
    response: null,
    supabase,
  };
}

export async function GET(request: NextRequest) {
  const requestContext = getRequestContext(request);

  try {
    const result = await loadOrphans(request);

    if (result.response) {
      return result.response;
    }

    return NextResponse.json({ items: result.items });
  } catch (error) {
    logServerError("evidence_orphan_list_failed", error, {
      operation: "list_orphan_evidence_objects",
      ...requestContext,
      status: 500,
    });
    return apiErrorResponse(
      error,
      "Không thể kiểm tra tệp tải lỗi lúc này.",
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestContext = getRequestContext(request);

  try {
    const result = await loadOrphans(request);

    if (result.response) {
      return result.response;
    }

    const items = result.items ?? [];
    const supabase = result.supabase;

    if (!supabase || items.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    let deleted = 0;

    for (let index = 0; index < items.length; index += 20) {
      const storagePaths = items
        .slice(index, index + 20)
        .map((item) => item.storage_path);
      const { error: removeError } = await supabase.storage
        .from("evidence")
        .remove(storagePaths);

      if (removeError) {
        logOperationalAlert(
          "STORAGE_FAILURE",
          "evidence_orphan_storage_cleanup_failed",
          removeError,
          {
            operation: "cleanup_orphan_evidence_objects",
            ...requestContext,
            status: 500,
          },
        );
        return apiErrorResponse(
          new ApiError(
            500,
            "INTERNAL_ERROR",
            "Không thể xóa hết tệp tải lỗi. Hãy thử lại sau.",
            { deleted },
          ),
        );
      }

      const { error: auditError } = await supabase.rpc(
        "fn_ghi_nhat_ky_don_storage_mo_coi",
        { p_storage_paths: storagePaths },
      );

      if (auditError) {
        logServerError("evidence_orphan_cleanup_audit_failed", auditError, {
          operation: "cleanup_orphan_evidence_objects",
          ...requestContext,
          status: 500,
        });
        return apiErrorResponse(
          new ApiError(
            500,
            "INTERNAL_ERROR",
            "Tệp đã được xóa nhưng chưa ghi được nhật ký. Hãy báo quản trị hệ thống.",
            { deleted: deleted + storagePaths.length },
          ),
        );
      }

      deleted += storagePaths.length;
    }

    return NextResponse.json({ deleted });
  } catch (error) {
    logServerError("evidence_orphan_cleanup_unexpected", error, {
      operation: "cleanup_orphan_evidence_objects",
      ...requestContext,
      status: 500,
    });
    return apiErrorResponse(
      error,
      "Không thể dọn tệp tải lỗi lúc này.",
    );
  }
}
