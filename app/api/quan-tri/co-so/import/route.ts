import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, apiErrors, databaseApiError } from "@/lib/api/errors";
import { getRequestContext, isSameOriginRequest, withRequestId } from "@/lib/observability/request-context";
import {
  SCHOOL_IMPORT_MAX_BYTES,
  SchoolImportFileError,
  buildSchoolImportTemplate,
  classifySchoolImportRows,
  parseSchoolImportWorkbook,
  schoolImportRecords,
  schoolImportSummary,
} from "@/lib/schools/import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportInfo = {
  provinces: string[];
  existingCodes: string[];
};

function requestClient(authorization: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw apiErrors.internal("Cấu hình kết nối Supabase chưa sẵn sàng.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
}

async function authorizedClient(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw apiErrors.unauthorized();
  const supabase = requestClient(authorization);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw apiErrors.unauthorized("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  return supabase;
}

async function importInfo(
  supabase: Awaited<ReturnType<typeof authorizedClient>>,
  schoolCodes: string[],
): Promise<ImportInfo> {
  const { data, error } = await supabase.rpc("fn_admin_thong_tin_nhap_danh_muc", {
    p_ma_truong: schoolCodes,
  });
  if (error) throw databaseApiError(error, "Không kiểm tra được danh mục trường.");
  if (!data || typeof data !== "object") throw apiErrors.internal("Không đọc được danh mục tỉnh/thành.");
  const info = data as unknown as ImportInfo;
  if (!Array.isArray(info.provinces) || !Array.isArray(info.existingCodes)) {
    throw apiErrors.internal("Không đọc được danh mục tỉnh/thành.");
  }
  return info;
}

function errorResponse(error: unknown, requestId: string) {
  const normalized = error instanceof SchoolImportFileError
    ? apiErrors.unprocessable(error.message)
    : error;
  return withRequestId(apiErrorResponse(normalized, "Không xử lý được tệp Excel."), requestId);
}

export async function GET(request: NextRequest) {
  const { requestId } = getRequestContext(request);
  try {
    const supabase = await authorizedClient(request);
    await importInfo(supabase, []);
    const bytes = await buildSchoolImportTemplate();
    const response = new Response(new Uint8Array(bytes).buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename*=UTF-8''Mau-nhap-danh-muc-truong.xlsx",
        "Cache-Control": "no-store",
      },
    });
    return withRequestId(response, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const { requestId } = getRequestContext(request);
  try {
    if (!isSameOriginRequest(request)) throw apiErrors.forbidden();
    const supabase = await authorizedClient(request);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > SCHOOL_IMPORT_MAX_BYTES + 64 * 1024) {
      throw apiErrors.unprocessable("Tệp Excel vượt quá giới hạn 5 MB.");
    }
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw apiErrors.badRequest("Biểu mẫu tải lên không hợp lệ.");
    }
    const action = form.get("action");
    const file = form.get("file");
    if (action !== "preview" && action !== "commit") {
      throw apiErrors.badRequest("Thao tác nhập không hợp lệ.");
    }
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
      throw apiErrors.unprocessable("Hãy chọn tệp Excel định dạng .xlsx.");
    }
    if (file.size === 0 || file.size > SCHOOL_IMPORT_MAX_BYTES) {
      throw apiErrors.unprocessable("Tệp Excel phải có dung lượng từ 1 byte đến 5 MB.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (action === "commit" && form.get("digest") !== digest) {
      throw apiErrors.conflict("Tệp đã thay đổi sau khi xem trước. Hãy xem trước lại.");
    }
    const parsed = await parseSchoolImportWorkbook(bytes);
    const info = await importInfo(supabase, parsed.map((row) => row.ma_truong));
    const rows = classifySchoolImportRows(parsed, info.provinces, info.existingCodes);
    const summary = schoolImportSummary(rows);

    if (action === "preview") {
      return withRequestId(NextResponse.json({ rows, summary, digest }), requestId);
    }
    if (summary.error > 0) {
      throw apiErrors.unprocessable(
        `Tệp có ${summary.error} dòng lỗi. Hãy sửa tệp và xem trước lại.`,
        { rows: rows.filter((row) => row.status === "error") },
      );
    }
    const { data, error } = await supabase.rpc("fn_admin_nhap_danh_muc_co_so", {
      p_rows: schoolImportRecords(rows),
    });
    if (error) throw databaseApiError(error, "Không nhập được danh mục trường.");
    if (!data || typeof data !== "object") throw apiErrors.internal("Không nhận được kết quả nhập danh mục.");
    const result = data as { created?: unknown; skipped?: unknown };
    if (typeof result.created !== "number" || typeof result.skipped !== "number") {
      throw apiErrors.internal("Kết quả nhập danh mục không hợp lệ.");
    }
    return withRequestId(NextResponse.json({ summary: { created: result.created, skipped: result.skipped } }), requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
