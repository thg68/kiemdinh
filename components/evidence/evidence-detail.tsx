"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import {
  Evidence,
  EvidenceCriterionLink,
  formatEvidenceStatus,
} from "@/lib/evidence";

export function EvidenceDetail({ evidenceId }: { evidenceId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, []);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [links, setLinks] = useState<EvidenceCriterionLink[]>([]);
  const [message, setMessage] = useState("");

  const loadDetail = useCallback(async () => {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase trong .env.local.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("nguoi_dung")
      .select("id, co_so_id, ho_ten")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    const { data: evidenceData, error } = await supabase
      .from("minh_chung")
      .select("*")
      .eq("id", evidenceId)
      .maybeSingle();

    if (error || !evidenceData) {
      setMessage(error?.message ?? "Không tìm thấy minh chứng.");
      return;
    }

    setEvidence(evidenceData as Evidence);

    const { data: linkData } = await supabase
      .from("minh_chung_tieu_chi")
      .select(
        "minh_chung_id, tieu_chi_id, la_tieu_chi_goc, tieu_chi: tieu_chi_id(id, ma, ten, la_bat_buoc, tieu_chuan_id, tieu_chuan: tieu_chuan_id(so_thu_tu, ten))",
      )
      .eq("minh_chung_id", evidenceId);

    setLinks((linkData ?? []) as unknown as EvidenceCriterionLink[]);

    if (profileData) {
      await supabase.from("nhat_ky_truy_cap").insert({
        co_so_id: profileData.co_so_id,
        nguoi_dung_id: profileData.id,
        hanh_dong: "EVIDENCE_DETAIL_READ",
        doi_tuong: "minh_chung",
        doi_tuong_id: evidenceId,
      });
    }
  }, [evidenceId, router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDetail();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDetail]);

  async function openFile() {
    if (!supabase || !evidence?.storage_path) {
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    const response = await fetch(`/api/minh-chung/${evidence.id}/signed-url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = (await response.json()) as {
      signedUrl?: string;
      error?: string;
    };

    if (!response.ok || !payload.signedUrl) {
      setMessage(payload.error ?? "Không tạo được liên kết tạm thời.");
      return;
    }

    window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (!evidence) {
    return (
      <p className="text-sm text-[#52606d]">
        {message || "Đang tải minh chứng..."}
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Link
          className="border border-[#17324d] px-4 py-2 text-sm font-semibold text-[#17324d]"
          href="/minh-chung"
        >
          Quay lại kho
        </Link>
        {evidence.storage_path ? (
          <button
            className="bg-[#17324d] px-4 py-2 text-sm font-semibold text-white"
            onClick={openFile}
          >
            Xem tệp 10 phút
          </button>
        ) : null}
        {evidence.duong_dan ? (
          <a
            className="bg-[#17324d] px-4 py-2 text-sm font-semibold text-white"
            href={evidence.duong_dan}
            rel="noreferrer"
            target="_blank"
          >
            Mở liên kết
          </a>
        ) : null}
      </div>

      {message ? <Message text={message} /> : null}

      <section className="border border-[#d8d6c9] bg-white p-6">
        <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#6f5f36]">
          {evidence.ma}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#17324d]">
          {evidence.ten}
        </h1>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label="Trạng thái"
            value={formatEvidenceStatus(evidence.trang_thai_xac_minh)}
          />
          <Info label="Ngày ban hành" value={evidence.ngay_ban_hanh ?? "Chưa ghi"} />
          <Info
            label="Ngày hết giá trị"
            value={evidence.ngay_het_gia_tri ?? "Không ghi hạn"}
          />
          <Info label="SHA-256" value={evidence.hash_tep ?? "Không có"} />
        </dl>
      </section>

      <section className="border border-[#d8d6c9] bg-white">
        <div className="border-b border-[#d8d6c9] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#17324d]">
            Tiêu chí đang sử dụng minh chứng này
          </h2>
        </div>
        <div className="divide-y divide-[#e4e1d5]">
          {links.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#52606d]">
              Minh chứng này chưa được gắn với tiêu chí nào.
            </p>
          ) : (
            links.map((link) => (
              <div
                className="grid gap-2 px-5 py-4 sm:grid-cols-[140px_1fr]"
                key={link.tieu_chi_id}
              >
                <p className="font-semibold text-[#17324d]">
                  {link.tieu_chi?.ma}
                  {link.la_tieu_chi_goc ? " - gốc" : ""}
                </p>
                <p className="text-sm text-[#52606d]">{link.tieu_chi?.ten}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[#52606d]">{label}</dt>
      <dd className="mt-1 break-words font-medium text-[#17324d]">{value}</dd>
    </div>
  );
}

function Message({ text }: { text: string }) {
  return (
    <p className="border border-[#d8d6c9] bg-[#f7f7f2] px-3 py-2 text-sm text-[#52606d]">
      {text}
    </p>
  );
}
