"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/components/admin/admin-format";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { auditActionLabel, auditObjectLabel } from "@/lib/audit/catalog";
import { toUserMessage } from "@/lib/errors/user-message";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type HealthStatus = "ok" | "degraded";

type HealthResponse = {
  status: HealthStatus;
  requestId: string;
  checks: Record<string, "ok" | "unavailable">;
  timestamp: string;
};

type OperationRow = {
  id: string;
  thoi_diem: string;
  hanh_dong: string;
  doi_tuong: string;
  doi_tuong_id: string | null;
  nguoi_thuc_hien: string;
  co_so_ten: string | null;
  total_count: number;
};

const checkLabels: Record<string, string> = {
  application: "Ứng dụng",
  database: "Cơ sở dữ liệu",
  storage: "Kho tệp",
  supabaseAuth: "Đăng nhập",
};

export function AdminOperations() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [rows, setRows] = useState<OperationRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadOperations = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const [healthResult, auditResult] = await Promise.allSettled([
      fetch("/api/health", { cache: "no-store" }).then(async (response) => {
        const payload = await response.json() as HealthResponse;
        return payload;
      }),
      supabase.rpc("fn_admin_nhat_ky", {
        p_limit: DEFAULT_PAGE_SIZE,
        p_offset: (page - 1) * DEFAULT_PAGE_SIZE,
      }),
    ]);

    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value);
    } else {
      setHealth(null);
    }

    if (auditResult.status === "rejected" || auditResult.value.error) {
      const error = auditResult.status === "rejected" ? auditResult.reason : auditResult.value.error;
      setMessage(toUserMessage(error, "Không tải được nhật ký vận hành hệ thống."));
      setRows([]);
      setTotal(0);
    } else {
      const nextRows = (auditResult.value.data ?? []) as OperationRow[];
      setRows(nextRows);
      setTotal(nextRows[0]?.total_count ?? 0);
    }

    setLoading(false);
  }, [page, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOperations(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOperations]);

  if (loading) {
    return <LoadingState label="Đang kiểm tra trạng thái vận hành…" />;
  }

  return (
    <div className="grid gap-5">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      <section className="admin-table-shell">
        <div className="admin-table-header">
          <div>
            <h2>Sức khỏe dịch vụ</h2>
            <p>{health ? `Kiểm tra lúc ${formatDateTime(health.timestamp)}` : "Không nhận được phản hồi từ endpoint sức khỏe"}</p>
          </div>
          <button className="button-secondary min-h-9 px-4 py-2 text-xs" type="button" onClick={() => void loadOperations()}>
            Kiểm tra lại
          </button>
        </div>
        {health ? (
          <dl className="admin-health-grid">
            {Object.entries(health.checks).map(([name, value]) => (
              <div className="admin-health-item" key={name}>
                <dt>{checkLabels[name] ?? name}</dt>
                <dd>
                  <StatusBadge tone={value === "ok" ? "success" : "danger"}>
                    {value === "ok" ? "Hoạt động" : "Không khả dụng"}
                  </StatusBadge>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="p-5">
            <Alert tone="danger">Không kiểm tra được trạng thái dịch vụ. Hãy xem log hạ tầng bằng request ID nếu lỗi tiếp diễn.</Alert>
          </div>
        )}
      </section>

      <section className="admin-table-shell">
        <div className="admin-table-header">
          <div>
            <h2>Nhật ký quản trị</h2>
            <p>Chỉ hiển thị ai, khi nào và loại thao tác; không trả payload dữ liệu nghiệp vụ</p>
          </div>
          <StatusBadge>{total.toLocaleString("vi-VN")} thao tác</StatusBadge>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Chưa có thao tác quản trị"
              description="Các thay đổi trạng thái cơ sở, tài khoản và cờ kỹ thuật sẽ xuất hiện tại đây."
            />
          </div>
        ) : (
          <div className="admin-table-scroll" data-lenis-prevent>
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Thời điểm</th>
                  <th scope="col">Người thực hiện</th>
                  <th scope="col">Thao tác</th>
                  <th scope="col">Nhóm dữ liệu</th>
                  <th scope="col">Cơ sở giáo dục</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTime(row.thoi_diem)}</td>
                    <td className="admin-cell-title">{row.nguoi_thuc_hien}</td>
                    <td><OperationActionBadge row={row} /></td>
                    <td>{auditObjectLabel(row.doi_tuong)}</td>
                    <td>{row.co_so_ten || "Toàn hệ thống"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination disabled={loading} page={page} total={total} onPageChange={setPage} />
      </section>
    </div>
  );
}

function OperationActionBadge({ row }: { row: OperationRow }) {
  return (
    <StatusBadge tone={row.hanh_dong.includes("STATUS") ? "warning" : "info"}>
      {auditActionLabel(row.hanh_dong)}
    </StatusBadge>
  );
}
