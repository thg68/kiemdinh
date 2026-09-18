"use client";

import { Plus, X } from "lucide-react";
import { Fragment, type FormEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { AdminSchoolImport } from "@/components/admin/admin-school-import";
import { schoolLevelLabels, schoolTypeLabels } from "@/components/admin/admin-format";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CAP_HOC_THEO_LOAI_HINH,
  type CapHocValue,
  type LoaiHinh,
  validateSchoolCreation,
} from "@/lib/domain/school-metadata";
import { toUserMessage } from "@/lib/errors/user-message";
import { provinces } from "@/lib/localities/provinces";
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

const schoolLevelOptions = [
  { label: "Mầm non", value: "mam_non" },
  { label: "Tiểu học", value: "tieu_hoc" },
  { label: "THCS", value: "thcs" },
  { label: "THPT", value: "thpt" },
  { label: "GDTX", value: "gdtx" },
] as const;

export function AdminSchools() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = useState<SchoolRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "warning">("warning");
  const [pendingSchool, setPendingSchool] = useState<SchoolRow | null>(null);
  const [tenCoSo, setTenCoSo] = useState("");
  const [maTruong, setMaTruong] = useState("");
  const [tinhThanh, setTinhThanh] = useState("");
  const [editingSchool, setEditingSchool] = useState<SchoolRow | null>(null);
  const [editProvince, setEditProvince] = useState("");
  const [editWard, setEditWard] = useState("");
  const [updatingLocality, setUpdatingLocality] = useState(false);
  const [registrationWorkingId, setRegistrationWorkingId] = useState<string | null>(null);
  const [loaiHinh, setLoaiHinh] = useState<LoaiHinh>("mam_non");
  const [capHoc, setCapHoc] = useState<CapHocValue[]>(["mam_non"]);
  const [tenNamHoc, setTenNamHoc] = useState("2026-2027");
  const [ngayBatDau, setNgayBatDau] = useState("2026-09-01");
  const [ngayKetThuc, setNgayKetThuc] = useState("2027-05-31");
  const deferredKeyword = useDeferredValue(keyword.trim());

  const loadSchools = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("fn_admin_danh_sach_co_so", {
      p_limit: DEFAULT_PAGE_SIZE,
      p_loai_hinh: schoolType || null,
      p_offset: (page - 1) * DEFAULT_PAGE_SIZE,
      p_tinh_thanh: provinceFilter || null,
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
  }, [deferredKeyword, page, provinceFilter, schoolType, status, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSchools(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSchools]);

  function changeSchoolType(value: LoaiHinh) {
    setLoaiHinh(value);
    setCapHoc([CAP_HOC_THEO_LOAI_HINH[value][0]]);
  }

  function toggleSchoolLevel(value: CapHocValue) {
    setCapHoc((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function createSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const validationMessage = validateSchoolCreation({
      capHoc,
      loaiHinh,
      maTruong,
      tinhThanh,
      ngayBatDau,
      ngayKetThuc,
      tenCoSo,
      tenNamHoc,
    });

    if (validationMessage) {
      setMessageTone("warning");
      setMessage(validationMessage);
      return;
    }

    setCreating(true);
    const { error } = await supabase.rpc("fn_admin_tao_co_so_va_nam_hoc", {
      p_cap_hoc: capHoc,
      p_loai_hinh: loaiHinh,
      p_ma_truong: maTruong.trim(),
      p_nam_hoc_ten: tenNamHoc,
      p_ngay_bat_dau: ngayBatDau,
      p_ngay_ket_thuc: ngayKetThuc,
      p_ten_co_so: tenCoSo.trim(),
      p_tinh_thanh: tinhThanh,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không tạo được cơ sở giáo dục."));
      setCreating(false);
      return;
    }

    const createdSchoolName = tenCoSo.trim();
    setTenCoSo("");
    setMaTruong("");
    setTinhThanh("");
    setLoaiHinh("mam_non");
    setCapHoc(["mam_non"]);
    setShowCreateForm(false);
    setCreating(false);
    await loadSchools();
    setMessageTone("success");
    setMessage(`Đã tạo ${createdSchoolName}. Bạn có thể cấp quyền Hiệu trưởng tại mục “Người tham gia”.`);
  }

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

  function openLocalityEditor(school: SchoolRow) {
    setEditingSchool(school);
    setEditProvince(school.tinh_thanh ?? "");
    setEditWard(school.phuong_xa ?? "");
    setMessage("");
  }

  async function updateLocality(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSchool || !editProvince) return;
    setUpdatingLocality(true);
    const { error } = await supabase.rpc("fn_admin_cap_nhat_dia_phuong_co_so", {
      p_co_so_id: editingSchool.id,
      p_tinh_thanh: editProvince,
      p_phuong_xa: editWard.trim() || null,
    });
    setUpdatingLocality(false);
    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không cập nhật được địa phương của cơ sở giáo dục."));
      return;
    }
    const schoolName = editingSchool.ten;
    setEditingSchool(null);
    await loadSchools();
    setMessageTone("success");
    setMessage(`Đã cập nhật địa phương cho ${schoolName}.`);
  }

  async function updateRegistration(school: SchoolRow) {
    setRegistrationWorkingId(school.id);
    const { error } = await supabase.rpc("fn_admin_cap_nhat_tu_dang_ky_co_so", {
      p_co_so_id: school.id,
      p_cho_phep_tu_dang_ky: !school.cho_phep_tu_dang_ky,
    });
    setRegistrationWorkingId(null);
    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không cập nhật được quyền tự đăng ký."));
      return;
    }
    await loadSchools();
    setMessageTone("success");
    setMessage(school.cho_phep_tu_dang_ky
      ? `Đã tắt tự đăng ký tại ${school.ten}.`
      : `Đã bật tự đăng ký tại ${school.ten}.`);
  }

  return (
    <div className="grid gap-5">
      {message ? <Alert tone={messageTone}>{message}</Alert> : null}

      <section className="admin-table-shell">
        <div className="admin-table-header">
          <div>
            <h2>Tạo cơ sở giáo dục</h2>
            <p>Khởi tạo hồ sơ trường và năm học đầu tiên.</p>
          </div>
          <button
            aria-expanded={showCreateForm}
            className={showCreateForm ? "button-secondary" : "button-primary"}
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
          >
            {showCreateForm ? <X aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
            {showCreateForm ? "Đóng" : "Thêm cơ sở"}
          </button>
        </div>

        {showCreateForm ? (
          <form className="grid gap-5 border-t border-[var(--color-border)] p-5" onSubmit={createSchool}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                Tên cơ sở giáo dục
                <input
                  autoComplete="organization"
                  className="form-control mt-2"
                  required
                  value={tenCoSo}
                  onChange={(event) => setTenCoSo(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Mã trường
                <input
                  className="form-control mt-2"
                  required
                  value={maTruong}
                  onChange={(event) => setMaTruong(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Tỉnh/thành phố
                <select
                  className="form-control mt-2"
                  required
                  value={tinhThanh}
                  onChange={(event) => setTinhThanh(event.target.value)}
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.name}>{province.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Loại hình
                <select
                  className="form-control mt-2"
                  value={loaiHinh}
                  onChange={(event) => changeSchoolType(event.target.value as LoaiHinh)}
                >
                  <option value="mam_non">Mầm non</option>
                  <option value="pho_thong">Phổ thông</option>
                  <option value="gdtx">Giáo dục thường xuyên</option>
                </select>
              </label>
            </div>

            <fieldset className="grid gap-2 text-sm font-medium">
              <legend>Cấp học</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {schoolLevelOptions
                  .filter((option) => CAP_HOC_THEO_LOAI_HINH[loaiHinh].includes(option.value))
                  .map((option) => (
                    <label className="flex min-h-12 items-center gap-2 border border-[var(--color-border)] px-3 py-2" key={option.value}>
                      <input
                        checked={capHoc.includes(option.value)}
                        type="checkbox"
                        onChange={() => toggleSchoolLevel(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm font-medium">
                Năm học
                <input
                  className="form-control mt-2"
                  placeholder="2026-2027"
                  required
                  value={tenNamHoc}
                  onChange={(event) => setTenNamHoc(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Ngày bắt đầu
                <input
                  className="form-control mt-2"
                  required
                  type="date"
                  value={ngayBatDau}
                  onChange={(event) => setNgayBatDau(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Ngày kết thúc
                <input
                  className="form-control mt-2"
                  required
                  type="date"
                  value={ngayKetThuc}
                  onChange={(event) => setNgayKetThuc(event.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="button-primary" disabled={creating} type="submit">
                {creating ? "Đang tạo…" : "Tạo cơ sở giáo dục"}
              </button>
              <button className="button-secondary" disabled={creating} type="button" onClick={() => setShowCreateForm(false)}>
                Hủy
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <AdminSchoolImport onImported={loadSchools} />

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
          Tỉnh/thành phố
          <select
            className="form-control"
            value={provinceFilter}
            onChange={(event) => {
              setPage(1);
              setProvinceFilter(event.target.value);
            }}
          >
            <option value="">Tất cả</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.name}>{province.name}</option>
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
                    <Fragment key={school.id}>
                    <tr>
                      <td>
                        <p className="admin-cell-title">{school.ten}</p>
                        <p className="admin-cell-meta">
                          {school.ma_truong || "Chưa có mã trường"}
                          {school.phuong_xa ? ` · ${school.phuong_xa}` : ""}
                        </p>
                        <p className="admin-cell-meta">{school.tinh_thanh || "Chưa khai báo tỉnh/thành phố"}</p>
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
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="button-secondary min-h-9 px-4 py-2 text-xs"
                            type="button"
                            onClick={() => openLocalityEditor(school)}
                          >Sửa địa phương</button>
                          <button
                            className="button-secondary min-h-9 px-4 py-2 text-xs"
                            disabled={registrationWorkingId === school.id}
                            type="button"
                            onClick={() => void updateRegistration(school)}
                          >
                            {registrationWorkingId === school.id
                              ? "Đang cập nhật…"
                              : school.cho_phep_tu_dang_ky ? "Tắt tự đăng ký" : "Bật tự đăng ký"}
                          </button>
                          <button
                            className="button-secondary min-h-9 px-4 py-2 text-xs"
                            type="button"
                            onClick={() => setPendingSchool(school)}
                          >
                            {school.trang_thai === "active" ? "Tạm ngừng" : "Kích hoạt"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingSchool?.id === school.id ? (
                      <tr>
                        <td colSpan={6}>
                          <form className="grid gap-4 bg-[var(--color-paper-warm)] p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end" onSubmit={updateLocality}>
                            <label className="text-sm font-medium">
                              Tỉnh/thành phố
                              <select className="form-control mt-2" required value={editProvince} onChange={(event) => setEditProvince(event.target.value)}>
                                <option value="">Chọn tỉnh/thành phố</option>
                                {provinces.map((province) => (
                                  <option key={province.code} value={province.name}>{province.name}</option>
                                ))}
                              </select>
                            </label>
                            <label className="text-sm font-medium">
                              Phường/xã
                              <input className="form-control mt-2" maxLength={150} value={editWard} onChange={(event) => setEditWard(event.target.value)} />
                            </label>
                            <div className="flex gap-2">
                              <button className="button-primary" disabled={updatingLocality} type="submit">{updatingLocality ? "Đang lưu…" : "Lưu"}</button>
                              <button className="button-secondary" disabled={updatingLocality} type="button" onClick={() => setEditingSchool(null)}>Hủy</button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : null}
                    </Fragment>
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
