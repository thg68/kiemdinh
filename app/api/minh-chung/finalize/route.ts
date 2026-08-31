import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  evidenceMimeTypeForFileName,
  validateEvidenceFileName,
} from "@/lib/evidence";
import { inspectEvidenceBlob } from "@/lib/evidence-inspection";
import { toUserMessage } from "@/lib/errors/user-message";
import { logServerError } from "@/lib/observability/logger";

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
    throw new Error("Supabase environment is not configured.");
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

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateBody(body: FinalizeEvidenceBody) {
  const namHocId = optionalString(body.namHocId);
  const tieuChiGocId = optionalString(body.tieuChiGocId);
  const ten = optionalString(body.ten);
  const storagePath = optionalString(body.storagePath);
  const tenTepGoc = optionalString(body.tenTepGoc);
  const duongDan = optionalString(body.duongDan);
  const ngayBanHanh = optionalString(body.ngayBanHanh);
  const ngayHetGiaTri = optionalString(body.ngayHetGiaTri);
  const tieuChiIds = Array.isArray(body.tieuChiIds)
    ? [...new Set(body.tieuChiIds.filter((value): value is string => typeof value === "string" && value.length > 0))]
    : [];

  if (!namHocId || !tieuChiGocId || tieuChiIds.length === 0 || !tieuChiIds.includes(tieuChiGocId)) {
    throw new Error("Hãy chọn năm học, tiêu chí gốc và ít nhất một tiêu chí.");
  }

  if (!ten || ten.length > 255 || /[\u0000-\u001f\u007f]/.test(ten)) {
    throw new Error("Tên minh chứng phải có từ 1 đến 255 ký tự hợp lệ.");
  }

  if (Boolean(storagePath) === Boolean(duongDan)) {
    throw new Error("Chỉ chọn một nguồn: tệp minh chứng hoặc liên kết điện tử.");
  }

  if (storagePath) {
    const fileNameError = validateEvidenceFileName(tenTepGoc);

    if (fileNameError) {
      throw new Error(fileNameError);
    }
  } else {
    let url: URL;

    try {
      url = new URL(duongDan);
    } catch {
      throw new Error("Liên kết điện tử không hợp lệ.");
    }

    if (!["http:", "https:"].includes(url.protocol) || duongDan.length > 2048) {
      throw new Error("Liên kết điện tử phải dùng giao thức HTTP hoặc HTTPS.");
    }
  }

  if (ngayBanHanh && !isValidIsoDate(ngayBanHanh)) {
    throw new Error("Ngày ban hành không hợp lệ.");
  }

  if (ngayHetGiaTri && !isValidIsoDate(ngayHetGiaTri)) {
    throw new Error("Ngày hết giá trị không hợp lệ.");
  }

  if (ngayBanHanh && ngayHetGiaTri && ngayHetGiaTri < ngayBanHanh) {
    throw new Error("Ngày hết giá trị không được trước ngày ban hành.");
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
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập để hoàn tất tệp minh chứng." },
      { status: 401 },
    );
  }

  try {
    const supabase = createRequestSupabaseClient(authorization);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." },
        { status: 401 },
      );
    }

    let rawBody: FinalizeEvidenceBody;

    try {
      rawBody = (await request.json()) as FinalizeEvidenceBody;
    } catch {
      return NextResponse.json(
        { error: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 },
      );
    }

    let body: ReturnType<typeof validateBody>;

    try {
      body = validateBody(rawBody);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Dữ liệu minh chứng không hợp lệ." },
        { status: 400 },
      );
    }

    let verifiedFile: Awaited<ReturnType<typeof inspectEvidenceBlob>> | null = null;

    if (body.storagePath) {
      const { data: storedBlob, error: downloadError } = await supabase.storage
        .from("evidence")
        .download(body.storagePath);

      if (downloadError || !storedBlob) {
        logServerError("evidence_finalize_download_rejected", downloadError, {
          operation: "finalize_evidence",
          route: request.nextUrl.pathname,
          status: 400,
        });
        return NextResponse.json(
          { error: "Không tìm thấy tệp vừa tải lên hoặc bạn không có quyền truy cập." },
          { status: 400 },
        );
      }

      try {
        verifiedFile = await inspectEvidenceBlob(body.storagePath, storedBlob);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Nội dung tệp không hợp lệ." },
          { status: 400 },
        );
      }

      if (
        evidenceMimeTypeForFileName(body.tenTepGoc) !== verifiedFile.mimeType
      ) {
        return NextResponse.json(
          { error: "Định dạng tên tệp gốc không khớp với nội dung đã tải lên." },
          { status: 400 },
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
        route: request.nextUrl.pathname,
        status: 400,
      });
      return NextResponse.json(
        { error: toUserMessage(createError, "Không thể hoàn tất minh chứng.") },
        { status: 400 },
      );
    }

    return NextResponse.json({ id: evidenceId }, { status: 201 });
  } catch (error) {
    logServerError("evidence_finalize_failed", error, {
      operation: "finalize_evidence",
      route: request.nextUrl.pathname,
      status: 500,
    });
    return NextResponse.json(
      { error: "Không thể hoàn tất minh chứng lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
