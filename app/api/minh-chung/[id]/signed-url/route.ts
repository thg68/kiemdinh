import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/observability/logger";

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
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập để xem tệp minh chứng." },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const supabase = createRequestSupabaseClient(authorization);
    const { data: evidence, error: evidenceError } = await supabase
      .from("minh_chung")
      .select("id, co_so_id, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (evidenceError || !evidence) {
      logServerError("evidence_lookup_rejected", evidenceError, {
        operation: "create_signed_url",
        route: request.nextUrl.pathname,
        resourceId: id,
        status: 404,
      });
      return NextResponse.json(
        { error: "Không tìm thấy minh chứng hoặc bạn không có quyền xem." },
        { status: 404 },
      );
    }

    if (!evidence.storage_path) {
      return NextResponse.json(
        { error: "Minh chứng này không có tệp lưu trữ." },
        { status: 400 },
      );
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("evidence")
      .createSignedUrl(evidence.storage_path, 600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      logServerError("evidence_signed_url_rejected", signedUrlError, {
        operation: "create_signed_url",
        route: request.nextUrl.pathname,
        resourceId: id,
        status: 403,
      });
      return NextResponse.json(
        { error: "Không thể mở tệp minh chứng. Hãy kiểm tra quyền truy cập rồi thử lại." },
        { status: 403 },
      );
    }

    const { error: auditError } = await supabase.rpc("fn_log_user_access", {
      p_hanh_dong: "EVIDENCE_FILE_SIGNED_URL_CREATED",
      p_doi_tuong_id: evidence.id,
      p_du_lieu_moi: { expires_in: 600 },
    });

    if (auditError) {
      logServerError("evidence_audit_failed", auditError, {
        operation: "create_signed_url",
        route: request.nextUrl.pathname,
        resourceId: id,
        status: 500,
      });
      return NextResponse.json(
        { error: "Không ghi nhận được lượt truy cập tệp. Vui lòng thử lại." },
        { status: 500 },
      );
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl });
  } catch (error) {
    logServerError("evidence_signed_url_failed", error, {
      operation: "create_signed_url",
      route: request.nextUrl.pathname,
      resourceId: id,
      status: 500,
    });
    return NextResponse.json(
      { error: "Không thể mở tệp minh chứng lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
