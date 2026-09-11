"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { schoolLevelLabels, schoolTypeLabels } from "@/components/admin/admin-format";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { toUserMessage } from "@/lib/errors/user-message";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SchoolRow = {
  id: string;
  ma_truong: string | null;
  ten: string;
  loai_hinh: string;
  cap_hoc: string[];
  trang_thai: "active" | "inactive";
  tinh_thanh: string | null;
  phuong_xa: string | null;
  dia_chi: string | null;
  cho_phep_tu_dang_ky: boolean;
  nam_hoc_dang_hoat_dong: string | null;
  so_nguoi_dung: number;
  so_minh_chung: number;
  total_count: number;
};

export function AdminSchools() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = useState<SchoolRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "warning">("warning");
  const [pendingSchool, setPendingSchool] = useState<SchoolRow | null>(null);
  const deferredKeyword = useDeferredValue(keyword.trim());

  const loadSchools = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("fn_admin_danh_sach_co_so", {
      p_limit: DEFAULT_PAGE_SIZE,
      p_loai_hinh: schoolType || null,
      p_offset: (page - 1) * DEFAULT_PAGE_SIZE,
      p_trang_thai: status || null,
      p_tu_khoa: deferredKeyword || null,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không tải được danh sách cơ sở giáo dục."));
      setLoading(false);
      return;
    }

    const nextRows = (data ?? []) as SchoolRow[];
    setRows(nextRows);
    setTotal(nextRows[0]?.total_count ?? 0);
    setLoading(false);
  }, [deferredKeyword, page, schoolType, status, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSchools(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSchools]);

  async function updateStatus() {
    if (!pendingSchool) return;

    const nextStatus = pendingSchool.trang_thai === "active" ? "inactive" : "active";
    setWorking(true);

    const { error } = await supabase.rpc("fn_admin_cap_nhat_trang_thai_co_so", {
      p_co_so_id: pendingSchool.id,
      p_trang_thai: nextStatus,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không cập nhật được trạng thái cơ sở giáo dục."));
      setWorking(false);
      setPendingSchool(null);
      return;
    }

    const successMessage =
      nextStatus === "active"
        ? `Đã kích hoạt ${pendingSchool.ten}.`
        : `Đã tạm ngừng ${pendingSchool.ten}.`;
    setWorking(false);
    setPendingSchool(null);
    await loadSchools();
    setMessageTone("success");
    setMessage(successMessage);
  }

  return (
    <div className="grid gap-5">
      {message ? <Alert tone={messageTone}>{message}</Alert> : null}

      <section className="admin-toolbar" aria-label="Bộ lọc cơ sở giáo dục">
        <label>
          Tìm theo trường, mã hoặc phường xã
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
          Trạng thái
          <select
            className="form-control"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            <option value="">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm ngừng</option>
          </select>
        </label>
        <label>
          Loại hình
          <select
            className="form-control"
            value={schoolType}
            onChange={(event) => {
              setPage(1);
              setSchoolType(event.target.value);
            }}
          >
            <option value="">Tất cả</option>
            <option value="mam_non">Mầm non</option>
            <option value="pho_thong">Phổ thông</option>
            <option value="gdtx">Giáo dục thường xuyên</option>
          </select>
        </label>
      </section>

      {loading ? (
        <LoadingState label="Đang tải danh sách cơ sở giáo dục…" />
      ) : (
        <section className="admin-table-shell">
          <div className="admin-table-header">
            <div>
              <h2>Danh sách cơ sở giáo dục</h2>
              <p>{total.toLocaleString("vi-VN")} cơ sở phù hợp với bộ lọc</p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Không tìm thấy cơ sở phù hợp"
                description="Hãy thay đổi từ khóa hoặc bộ lọc để xem lại danh sách."
              />
            </div>
          ) : (
            <div className="admin-table-scroll" data-lenis-prevent>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Cơ sở giáo dục</th>
                    <th scope="col">Phạm vi</th>
                    <th scope="col">Năm học</th>
                    <th scope="col">Quy mô dữ liệu</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((school) => (
                    <tr key={school.id}>
                      <td>
                        <p className="admin-cell-title">{school.ten}</p>
                        <p className="admin-cell-meta">
                          {school.ma_truong || "Chưa có mã trường"}
                          {school.phuong_xa ? ` · ${school.phuong_xa}` : ""}
                        </p>
                      </td>
                      <td>
                        <p>{schoolTypeLabels[school.loai_hinh] ?? school.loai_hinh}</p>
                        <p className="admin-cell-meta">
                          {school.cap_hoc.map((level) => schoolLevelLabels[level] ?? level).join(", ") || "Chưa xác định cấp học"}
                        </p>
                      </td>
                      <td>{school.nam_hoc_dang_hoat_dong || "Chưa có năm học hoạt động"}</td>
                      <td>
                        <p>{school.so_nguoi_dung.toLocaleString("vi-VN")} người tham gia</p>
                        <p className="admin-cell-meta">{school.so_minh_chung.toLocaleString("vi-VN")} minh chứng</p>
                      </td>
                      <td>
                        <StatusBadge tone={school.trang_thai === "active" ? "success" : "default"}>
                          {school.trang_thai === "active" ? "Đang hoạt động" : "Tạm ngừng"}
                        </StatusBadge>
                        {school.cho_phep_tu_dang_ky ? (
                          <p className="admin-cell-meta">Cho phép tự đăng ký</p>
                        ) : null}
                      </td>
                      <td>
                        <button
                          className="button-secondary min-h-9 px-4 py-2 text-xs"
                          type="button"
                          onClick={() => setPendingSchool(school)}
                        >
                          {school.trang_thai === "active" ? "Tạm ngừng" : "Kích hoạt"}
                        </button>
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
        confirmLabel={pendingSchool?.trang_thai === "active" ? "Tạm ngừng" : "Kích hoạt"}
        description={
          pendingSchool
            ? pendingSchool.trang_thai === "active"
              ? `Người dùng tại ${pendingSchool.ten} sẽ không còn được xem đây là một cơ sở đang hoạt động.`
              : `${pendingSchool.ten} sẽ trở lại danh sách cơ sở đang hoạt động.`
            : ""
        }
        isOpen={Boolean(pendingSchool)}
        isWorking={working}
        title={pendingSchool?.trang_thai === "active" ? "Tạm ngừng cơ sở giáo dục?" : "Kích hoạt cơ sở giáo dục?"}
        tone="warning"
        onCancel={() => setPendingSchool(null)}
        onConfirm={() => void updateStatus()}
      />
    </div>
  );
}
