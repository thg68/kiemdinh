import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function createRequestSupabaseClient(authorization: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Chưa cấu hình Supabase.");
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
  const supabase = createRequestSupabaseClient(authorization);

  const { data: evidence, error: evidenceError } = await supabase
    .from("minh_chung")
    .select("id, co_so_id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (evidenceError || !evidence) {
    return NextResponse.json(
      { error: evidenceError?.message ?? "Không tìm thấy minh chứng." },
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
    return NextResponse.json(
      { error: signedUrlError?.message ?? "Không tạo được liên kết tạm thời." },
      { status: 403 },
    );
  }

  await supabase.rpc("fn_log_audit", {
    p_hanh_dong: "EVIDENCE_FILE_SIGNED_URL_CREATED",
    p_doi_tuong: "minh_chung",
    p_doi_tuong_id: evidence.id,
    p_du_lieu_cu: null,
    p_du_lieu_moi: { expires_in: 600 },
  });

  return NextResponse.json({ signedUrl: signedUrlData.signedUrl });
}
