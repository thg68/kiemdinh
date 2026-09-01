"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { useAppContext } from "@/components/shared/use-app-context";

type AuditRow = {
  id: string;
  hanh_dong: string;
  doi_tuong: string;
  doi_tuong_id: string | null;
  thoi_diem: string;
  nguoi_dung?: {
    ho_ten: string | null;
    email: string | null;
  } | null;
};

const actionLabels: Record<string, string> = {
  EVIDENCE_LIST_READ: "Xem danh sách minh chứng",
  EVIDENCE_DETAIL_READ: "Xem chi tiết minh chứng",
  EVIDENCE_HEALTH_READ: "Kiểm tra sức khỏe minh chứng",
  EVIDENCE_FILE_SIGNED_URL_CREATED: "Tạo liên kết xem tệp minh chứng",
  REPORT_EXPORTED: "Xuất báo cáo",
  SELF_ASSESSMENT_STATUS_UPDATED: "Cập nhật trạng thái tự đánh giá",
  EVIDENCE_STATUS_UPDATED: "Cập nhật trạng thái minh chứng",
  USER_ROLE_UPDATED: "Cập nhật vai trò người dùng",
};

const objectLabels: Record<string, string> = {
  bao_cao: "Báo cáo",
  co_so_giao_duc: "Cơ sở giáo dục",
  hoi_dong_tu_danh_gia: "Hội đồng tự đánh giá",
  ke_hoach_cai_tien: "Kế hoạch cải tiến",
  minh_chung: "Minh chứng",
  nam_hoc: "Năm học",
  nguoi_dung: "Người dùng",
  phan_cong_tieu_chi: "Phân công tiêu chí",
  tieu_chi: "Tiêu chí",
  tu_danh_gia: "Tự đánh giá",
};

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function humanizeCode(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function actionLabel(action: string) {
  return actionLabels[action] ?? humanizeCode(action);
}

function objectLabel(objectName: string) {
  return objectLabels[objectName] ?? humanizeCode(objectName);
}

function actionTone(action: string) {
  if (action.includes("EXPORTED") || action.includes("SIGNED_URL")) {
    return "success" as const;
  }

  if (action.includes("UPDATED") || action.includes("STATUS")) {
    return "warning" as const;
  }

  return "default" as const;
}

function actorName(row: AuditRow) {
  return row.nguoi_dung?.ho_ten ?? row.nguoi_dung?.email ?? "Hệ thống";
}

export function AuditLogWorkspace() {
  const { loading, message, profile, setMessage, supabase } = useAppContext();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [objectFilter, setObjectFilter] = useState("all");
  const [loadingRows, setLoadingRows] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const deferredKeyword = useDeferredValue(keyword.trim());

  const loadRows = useCallback(async () => {
    if (!supabase || !profile) {
      return;
    }

    setLoadingRows(true);
    setMessage("");

    let query = supabase
      .from("nhat_ky_truy_cap")
      .select(
        "id, hanh_dong, doi_tuong, doi_tuong_id, thoi_diem, nguoi_dung:nguoi_dung_id(ho_ten, email)",
        { count: "exact" },
      )
      .eq("co_so_id", profile.co_so_id)
      .order("thoi_diem", { ascending: false });

    if (objectFilter !== "all") {
      query = query.eq("doi_tuong", objectFilter);
    }

    if (deferredKeyword) {
      const safeKeyword = deferredKeyword
        .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
        .trim();
      const normalizedKeyword = normalizeText(safeKeyword);
      const matchingActions = Object.entries(actionLabels)
        .filter(([code, label]) =>
          normalizeText(`${code} ${label}`).includes(normalizedKeyword),
        )
        .map(([code]) => code);
      const matchingObjects = Object.entries(objectLabels)
        .filter(([code, label]) =>
          normalizeText(`${code} ${label}`).includes(normalizedKeyword),
        )
        .map(([code]) => code);
      const { data: matchingUsers } = safeKeyword
        ? await supabase
            .from("nguoi_dung")
            .select("id")
            .eq("co_so_id", profile.co_so_id)
            .or(`ho_ten.ilike.%${safeKeyword}%,email.ilike.%${safeKeyword}%`)
        : { data: [] };
      const orFilters = [
        safeKeyword ? `hanh_dong.ilike.%${safeKeyword}%` : "",
        safeKeyword ? `doi_tuong.ilike.%${safeKeyword}%` : "",
        matchingActions.length > 0
          ? `hanh_dong.in.(${matchingActions.join(",")})`
          : "",
        matchingObjects.length > 0
          ? `doi_tuong.in.(${matchingObjects.join(",")})`
          : "",
        matchingUsers && matchingUsers.length > 0
          ? `nguoi_dung_id.in.(${matchingUsers.map((user) => user.id).join(",")})`
          : "",
      ].filter(Boolean);

      if (orFilters.length > 0) {
        query = query.or(orFilters.join(","));
      }
    }

    const { count, data, error } = await query.range(
      (page - 1) * DEFAULT_PAGE_SIZE,
      page * DEFAULT_PAGE_SIZE - 1,
    );

    if (error) {
      setMessage(toUserMessage(error));
      setLoadingRows(false);
      return;
    }

    setRows((data ?? []) as unknown as AuditRow[]);
    setTotal(count ?? 0);
    setLoadingRows(false);
  }, [deferredKeyword, objectFilter, page, profile, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const objects = Object.keys(objectLabels).sort();

  if (loading || loadingRows) {
    return <LoadingState label="Đang tải nhật ký thao tác…" />;
  }

  if (!profile) {
    return (
      <EmptyState
        title="Chưa có hồ sơ người dùng"
        description="Hãy thiết lập đơn vị trước khi xem nhật ký."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      <section className="surface-card grid gap-3 p-5 md:grid-cols-[1fr_220px]">
        <label className="text-sm font-medium">
          Tìm thao tác hoặc người thực hiện
          <input
            className="form-control mt-2"
            placeholder="Ví dụ: minh chứng, báo cáo, Nguyễn Văn A"
            value={keyword}
            onChange={(event) => {
              setPage(1);
              setKeyword(event.target.value);
            }}
          />
        </label>
        <label className="text-sm font-medium">
          Nhóm dữ liệu
          <select
            className="form-control mt-2"
            value={objectFilter}
            onChange={(event) => {
              setPage(1);
              setObjectFilter(event.target.value);
            }}
          >
            <option value="all">Tất cả</option>
            {objects.map((objectName) => (
              <option key={objectName} value={objectName}>
                {objectLabel(objectName)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Nhật ký gần đây</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Hệ thống chỉ hiển thị nhật ký trong phạm vi đơn vị theo phân quyền dữ liệu.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Không có dòng nhật ký phù hợp"
              description="Hãy đổi bộ lọc hoặc thực hiện một thao tác trong hệ thống để phát sinh nhật ký mới."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => (
              <article className="grid gap-4 px-5 py-4 transition hover:bg-[var(--color-lavender-mist)]/35 md:grid-cols-[1fr_auto]" key={row.id}>
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{objectLabel(row.doi_tuong)}</Badge>
                    <Badge tone={actionTone(row.hanh_dong)}>{actionLabel(row.hanh_dong)}</Badge>
                  </div>
                  <p className="text-sm leading-6 text-[var(--color-graphite)]">
                    <span className="font-semibold text-[var(--color-ink-navy)]">{actorName(row)}</span>
                    {" "}đã thực hiện thao tác này trong hệ thống.
                  </p>
                  {row.doi_tuong_id ? (
                    <p className="text-xs leading-5 text-[var(--color-graphite)]/60">
                      Mã tham chiếu: <span className="font-mono">{row.doi_tuong_id}</span>
                    </p>
                  ) : null}
                </div>
                <time className="text-sm text-[var(--color-graphite)]/70 md:text-right" dateTime={row.thoi_diem}>
                  {new Date(row.thoi_diem).toLocaleString("vi-VN")}
                </time>
              </article>
            ))}
          </div>
        )}
        <Pagination
          disabled={loadingRows}
          page={page}
          total={total}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}
