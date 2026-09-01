import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  evidenceMimeTypeForFileName,
  validateEvidenceFileName,
} from "@/lib/evidence";
import {
  apiErrorResponse,
  apiErrors,
  databaseApiError,
} from "@/lib/api/errors";
import { isoDateSchema, uuidSchema } from "@/lib/api/validation";
import { inspectEvidenceBlob } from "@/lib/evidence-inspection";
import {
  logOperationalAlert,
  logServerError,
} from "@/lib/observability/logger";
import { getRequestContext } from "@/lib/observability/request-context";

type FinalizeEvidenceBody = {
  namHocId?: unknown;
  tieuChiIds?: unknown;
  tieuChiGocId?: unknown;
  ten?: unknown;
  storagePath?: unknown;
  tenTepGoc?: unknown;
  duongDan?: unknown;
  ngayBanHanh?: unknown;
  ngayHetGiaTri?: unknown;
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

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validateBody(body: FinalizeEvidenceBody) {
  const namHocId = uuidSchema.parse(body.namHocId, "namHocId");
  const tieuChiGocId = uuidSchema.parse(body.tieuChiGocId, "tieuChiGocId");
  const ten = optionalString(body.ten);
  const storagePath = optionalString(body.storagePath);
  const tenTepGoc = optionalString(body.tenTepGoc);
  const duongDan = optionalString(body.duongDan);
  const rawNgayBanHanh = optionalString(body.ngayBanHanh);
  const rawNgayHetGiaTri = optionalString(body.ngayHetGiaTri);
  const ngayBanHanh = rawNgayBanHanh
    ? isoDateSchema.parse(rawNgayBanHanh, "ngayBanHanh")
    : "";
  const ngayHetGiaTri = rawNgayHetGiaTri
    ? isoDateSchema.parse(rawNgayHetGiaTri, "ngayHetGiaTri")
    : "";
  const tieuChiIds = Array.isArray(body.tieuChiIds)
    ? [
        ...new Set(
          body.tieuChiIds.map((value, index) =>
            uuidSchema.parse(value, `tieuChiIds.${index}`),
          ),
        ),
      ]
    : [];

  if (tieuChiIds.length === 0 || !tieuChiIds.includes(tieuChiGocId)) {
    throw apiErrors.unprocessable(
      "Hãy chọn tiêu chí gốc trong ít nhất một tiêu chí được gắn.",
    );
  }

  if (!ten || ten.length > 255 || /[\u0000-\u001f\u007f]/.test(ten)) {
    throw apiErrors.unprocessable(
      "Tên minh chứng phải có từ 1 đến 255 ký tự hợp lệ.",
    );
  }

  if (Boolean(storagePath) === Boolean(duongDan)) {
    throw apiErrors.unprocessable(
      "Chỉ chọn một nguồn: tệp minh chứng hoặc liên kết điện tử.",
    );
  }

  if (storagePath) {
    const fileNameError = validateEvidenceFileName(tenTepGoc);

    if (fileNameError) {
      throw apiErrors.unprocessable(fileNameError);
    }
  } else {
    let url: URL;

    try {
      url = new URL(duongDan);
    } catch {
      throw apiErrors.unprocessable("Liên kết điện tử không hợp lệ.");
    }

    if (!["http:", "https:"].includes(url.protocol) || duongDan.length > 2048) {
      throw apiErrors.unprocessable(
        "Liên kết điện tử phải dùng giao thức HTTP hoặc HTTPS.",
      );
    }
  }

  if (ngayBanHanh && ngayHetGiaTri && ngayHetGiaTri < ngayBanHanh) {
    throw apiErrors.unprocessable(
      "Ngày hết giá trị không được trước ngày ban hành.",
    );
  }

  return {
    duongDan,
    namHocId,
    ngayBanHanh,
    ngayHetGiaTri,
    storagePath,
    ten,
    tenTepGoc,
    tieuChiGocId,
    tieuChiIds,
  };
}

export async function POST(request: NextRequest) {
  const requestContext = getRequestContext(request);
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return apiErrorResponse(
      apiErrors.unauthorized("Bạn cần đăng nhập để hoàn tất tệp minh chứng."),
    );
  }

  try {
    const supabase = createRequestSupabaseClient(authorization);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return apiErrorResponse(
        apiErrors.unauthorized("Phiên đăng nhập không hợp lệ hoặc đã hết hạn."),
      );
    }

    let rawBody: FinalizeEvidenceBody;

    try {
      rawBody = (await request.json()) as FinalizeEvidenceBody;
    } catch {
      return apiErrorResponse(
        apiErrors.badRequest("Nội dung JSON gửi lên không hợp lệ."),
      );
    }

    let body: ReturnType<typeof validateBody>;

    try {
      body = validateBody(rawBody);
    } catch (error) {
      return apiErrorResponse(error, "Dữ liệu minh chứng không hợp lệ.");
    }

    let verifiedFile: Awaited<ReturnType<typeof inspectEvidenceBlob>> | null = null;

    if (body.storagePath) {
      const { data: storedBlob, error: downloadError } = await supabase.storage
        .from("evidence")
        .download(body.storagePath);

      if (downloadError || !storedBlob) {
        logOperationalAlert(
          "STORAGE_FAILURE",
          "evidence_finalize_storage_download_failed",
          downloadError,
          {
            operation: "finalize_evidence",
            ...requestContext,
            status: 404,
          },
        );
        return apiErrorResponse(
          apiErrors.notFound(
            "Không tìm thấy tệp vừa tải lên hoặc tệp không còn khả dụng.",
          ),
        );
      }

      try {
        verifiedFile = await inspectEvidenceBlob(body.storagePath, storedBlob);
      } catch (error) {
        return apiErrorResponse(
          apiErrors.unprocessable(
            error instanceof Error
              ? error.message
              : "Nội dung tệp không hợp lệ.",
          ),
        );
      }

      if (
        evidenceMimeTypeForFileName(body.tenTepGoc) !== verifiedFile.mimeType
      ) {
        return apiErrorResponse(
          apiErrors.unprocessable(
            "Định dạng tên tệp gốc không khớp với nội dung đã tải lên.",
          ),
        );
      }
    }

    const { data: evidenceId, error: createError } = await supabase.rpc(
      "fn_tao_minh_chung",
      {
        p_duong_dan: body.duongDan || null,
        p_hash_tep: verifiedFile?.sha256 ?? null,
        p_kich_thuoc: verifiedFile?.size ?? null,
        p_loai_tep: verifiedFile?.mimeType ?? (body.duongDan ? "text/html" : null),
        p_nam_hoc_id: body.namHocId,
        p_ngay_ban_hanh: body.ngayBanHanh || null,
        p_ngay_het_gia_tri: body.ngayHetGiaTri || null,
        p_storage_path: body.storagePath || null,
        p_ten: body.ten,
        p_tieu_chi_goc_id: body.tieuChiGocId,
        p_tieu_chi_ids: body.tieuChiIds,
      },
    );

    if (createError || !evidenceId) {
      logServerError("evidence_finalize_rpc_rejected", createError, {
        operation: "finalize_evidence",
        ...requestContext,
        status: 400,
      });
      return apiErrorResponse(
        createError
          ? databaseApiError(createError, "Không thể hoàn tất minh chứng.")
          : apiErrors.internal("Hệ thống chưa trả về mã minh chứng."),
      );
    }

    return NextResponse.json({ id: evidenceId }, { status: 201 });
  } catch (error) {
    logServerError("evidence_finalize_failed", error, {
      operation: "finalize_evidence",
      ...requestContext,
      status: 500,
    });
    return apiErrorResponse(
      error,
      "Không thể hoàn tất minh chứng lúc này. Vui lòng thử lại.",
    );
  }
}
