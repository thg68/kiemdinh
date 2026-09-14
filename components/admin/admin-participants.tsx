"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { formatDate, roleLabels } from "@/components/admin/admin-format";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { toUserMessage } from "@/lib/errors/user-message";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SchoolOption = {
  id: string;
  ma_truong: string | null;
  ten: string;
};

type ParticipantStatus = "active" | "inactive" | "invited" | "locked";

type ParticipantRow = {
  id: string;
  ho_ten: string;
  email: string | null;
  trang_thai: ParticipantStatus;
  co_so_id: string;
  co_so_ten: string;
  vai_tro_mas: string[];
  vai_tro_tens: string[];
  created_at: string;
  total_count: number;
};

const statusLabels: Record<ParticipantStatus, string> = {
  active: "Đang hoạt động",
  inactive: "Tạm ngừng",
  invited: "Đang chờ tham gia",
  locked: "Đã khóa",
};

function statusTone(status: ParticipantStatus) {
  if (status === "active") return "success" as const;
  if (status === "locked") return "danger" as const;
  if (status === "invited") return "warning" as const;
  return "default" as const;
}

export function AdminParticipants() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "warning">("warning");
  const [pendingUpdate, setPendingUpdate] = useState<{
    row: ParticipantRow;
    status: Exclude<ParticipantStatus, "invited">;
  } | null>(null);
  const [pendingPrincipal, setPendingPrincipal] = useState<ParticipantRow | null>(null);
  const deferredKeyword = useDeferredValue(keyword.trim());

  useEffect(() => {
    let activeRequest = true;

    async function loadSchoolOptions() {
      const { data } = await supabase.rpc("fn_admin_tuy_chon_co_so", {
        p_limit: 500,
        p_tu_khoa: null,
      });
      if (activeRequest) setSchools((data ?? []) as SchoolOption[]);
    }

    void loadSchoolOptions();
    return () => {
      activeRequest = false;
    };
  }, [supabase]);

  const loadParticipants = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("fn_admin_danh_sach_nguoi_tham_gia", {
      p_co_so_id: schoolId || null,
      p_limit: DEFAULT_PAGE_SIZE,
      p_offset: (page - 1) * DEFAULT_PAGE_SIZE,
      p_trang_thai: status || null,
      p_tu_khoa: deferredKeyword || null,
      p_vai_tro: role || null,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không tải được danh sách người tham gia."));
      setLoading(false);
      return;
    }

    const nextRows = (data ?? []) as ParticipantRow[];
    setRows(nextRows);
    setTotal(nextRows[0]?.total_count ?? 0);
    setLoading(false);
  }, [deferredKeyword, page, role, schoolId, status, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadParticipants(), 0);
    return () => window.clearTimeout(timer);
  }, [loadParticipants]);

  async function updateStatus() {
    if (!pendingUpdate) return;

    setWorking(true);
    const { error } = await supabase.rpc("fn_admin_cap_nhat_trang_thai_nguoi_dung", {
      p_nguoi_dung_id: pendingUpdate.row.id,
      p_trang_thai: pendingUpdate.status,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không cập nhật được trạng thái tài khoản."));
      setWorking(false);
      setPendingUpdate(null);
      return;
    }

    const successMessage = `Đã chuyển ${pendingUpdate.row.ho_ten} sang trạng thái “${statusLabels[pendingUpdate.status]}”.`;
    setWorking(false);
    setPendingUpdate(null);
    await loadParticipants();
    setMessageTone("success");
    setMessage(successMessage);
  }

  async function assignPrincipal() {
    if (!pendingPrincipal) return;

    setWorking(true);
    const { error } = await supabase.rpc("fn_admin_gan_hieu_truong", {
      p_co_so_id: pendingPrincipal.co_so_id,
      p_nguoi_dung_id: pendingPrincipal.id,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không cấp được quyền Hiệu trưởng."));
      setWorking(false);
      setPendingPrincipal(null);
      return;
    }

    const successMessage = `Đã cấp quyền Hiệu trưởng của ${pendingPrincipal.co_so_ten} cho ${pendingPrincipal.ho_ten}.`;
    setWorking(false);
    setPendingPrincipal(null);
    await loadParticipants();
    setMessageTone("success");
    setMessage(successMessage);
  }

  return (
    <div className="grid gap-5">
      {message ? <Alert tone={messageTone}>{message}</Alert> : null}

      <p className="admin-privacy-note">
        Quản trị hệ thống cấp quyền Hiệu trưởng và kiểm soát trạng thái tài khoản. Các vai trò nghiệp vụ còn lại do Hiệu trưởng quản lý tại trường.
      </p>

      <section className="admin-toolbar" aria-label="Bộ lọc người tham gia">
        <label>
          Tìm tên, email hoặc trường
          <input
            className="form-control"
            placeholder="Nhập từ khóa"
            value={keyword}
            onChange={(event) => {
              setPage(1);
              setKeyword(event.target.value);
            }}
          />
        </label>
        <label>
          Cơ sở giáo dục
          <select
            className="form-control"
            value={schoolId}
            onChange={(event) => {
              setPage(1);
              setSchoolId(event.target.value);
            }}
          >
            <option value="">Tất cả cơ sở</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.ten}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vai trò
          <select
            className="form-control"
            value={role}
            onChange={(event) => {
              setPage(1);
              setRole(event.target.value);
            }}
          >
            <option value="">Tất cả vai trò</option>
            {Object.entries(roleLabels).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select
            className="form-control"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm ngừng</option>
            <option value="locked">Đã khóa</option>
            <option value="invited">Đang chờ tham gia</option>
          </select>
        </label>
      </section>

      {loading ? (
        <LoadingState label="Đang tải danh sách người tham gia…" />
      ) : (
        <section className="admin-table-shell">
          <div className="admin-table-header">
            <div>
              <h2>Danh sách người tham gia</h2>
              <p>Sắp xếp theo vai trò có mức trách nhiệm cao nhất</p>
            </div>
            <StatusBadge>{total.toLocaleString("vi-VN")} tài khoản</StatusBadge>
          </div>

          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Không có người tham gia phù hợp"
                description="Hãy thay đổi từ khóa hoặc bộ lọc để xem lại danh sách."
              />
            </div>
          ) : (
            <div className="admin-table-scroll" data-lenis-prevent>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Thành viên</th>
                    <th scope="col">Cơ sở giáo dục</th>
                    <th scope="col">Vai trò</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Ngày tham gia</th>
                    <th scope="col"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <p className="admin-cell-title">{row.ho_ten}</p>
                        <p className="admin-cell-meta">{row.email || "Chưa có email"}</p>
                      </td>
                      <td>{row.co_so_ten}</td>
                      <td>
                        <div className="flex max-w-sm flex-wrap gap-1.5">
                          {row.vai_tro_mas.length > 0 ? row.vai_tro_mas.map((code, index) => (
                            <StatusBadge key={code} tone={code === "SYSTEM_ADMIN" ? "info" : "default"}>
                              {row.vai_tro_tens[index] || roleLabels[code] || code}
                            </StatusBadge>
                          )) : <span className="admin-cell-meta">Chưa có vai trò</span>}
                        </div>
                      </td>
                      <td>
                        <StatusBadge tone={statusTone(row.trang_thai)}>
                          {statusLabels[row.trang_thai]}
                        </StatusBadge>
                      </td>
                      <td>{formatDate(row.created_at)}</td>
                      <td>
                        <div className="grid min-w-48 gap-2">
                          {row.vai_tro_mas.includes("PRINCIPAL") ? (
                            <StatusBadge tone="info">Hiệu trưởng hiện tại</StatusBadge>
                          ) : row.trang_thai === "active" ? (
                            <button
                              className="button-secondary min-h-9 px-4 py-2 text-xs"
                              type="button"
                              onClick={() => setPendingPrincipal(row)}
                            >
                              Đặt làm Hiệu trưởng
                            </button>
                          ) : (
                            <span className="admin-cell-meta">Kích hoạt tài khoản trước khi cấp quyền</span>
                          )}

                          {row.vai_tro_mas.includes("SYSTEM_ADMIN") ? (
                            <span className="admin-cell-meta">Trạng thái tài khoản được bảo vệ</span>
                          ) : (
                            <ParticipantStatusControl
                              key={`${row.id}-${row.trang_thai}`}
                              row={row}
                              onRequest={(nextStatus) => setPendingUpdate({ row, status: nextStatus })}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination disabled={loading} page={page} total={total} onPageChange={setPage} />
        </section>
      )}

      <ConfirmDialog
        confirmLabel="Lưu trạng thái"
        description={
          pendingUpdate
            ? `Tài khoản ${pendingUpdate.row.ho_ten} sẽ chuyển sang trạng thái “${statusLabels[pendingUpdate.status]}”.`
            : ""
        }
        isOpen={Boolean(pendingUpdate)}
        isWorking={working}
        title="Cập nhật trạng thái tài khoản?"
        tone={pendingUpdate?.status === "locked" ? "danger" : "warning"}
        onCancel={() => setPendingUpdate(null)}
        onConfirm={() => void updateStatus()}
      />

      <ConfirmDialog
        confirmLabel="Cấp quyền"
        description={
          pendingPrincipal
            ? `${pendingPrincipal.ho_ten} sẽ trở thành Hiệu trưởng của ${pendingPrincipal.co_so_ten}. Nếu trường đã có Hiệu trưởng, quyền đó sẽ được chuyển sang tài khoản này.`
            : ""
        }
        isOpen={Boolean(pendingPrincipal)}
        isWorking={working}
        title="Cấp quyền Hiệu trưởng?"
        tone="warning"
        onCancel={() => setPendingPrincipal(null)}
        onConfirm={() => void assignPrincipal()}
      />
    </div>
  );
}

function ParticipantStatusControl({
  onRequest,
  row,
}: {
  onRequest: (status: Exclude<ParticipantStatus, "invited">) => void;
  row: ParticipantRow;
}) {
  const initialStatus = row.trang_thai === "invited" ? "inactive" : row.trang_thai;
  const [value, setValue] = useState<Exclude<ParticipantStatus, "invited">>(initialStatus);

  const changed = value !== row.trang_thai;

  return (
    <div className="admin-inline-action">
      <select
        aria-label={`Trạng thái của ${row.ho_ten}`}
        className="form-control"
        value={value}
        onChange={(event) => setValue(event.target.value as Exclude<ParticipantStatus, "invited">)}
      >
        <option value="active">Đang hoạt động</option>
        <option value="inactive">Tạm ngừng</option>
        <option value="locked">Đã khóa</option>
      </select>
      {changed ? (
        <button className="button-primary" type="button" onClick={() => onRequest(value)}>
          Lưu
        </button>
      ) : null}
    </div>
  );
}
