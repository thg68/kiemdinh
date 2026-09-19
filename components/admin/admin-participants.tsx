"use client";

import { Building2, Crown, Settings, UserRound, X } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
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

type ParticipantStatus = "active" | "inactive" | "invited" | "locked" | "pending_verification" | "pending_profile";

type ParticipantRow = {
  auth_user_id: string;
  nguoi_dung_id: string | null;
  ho_ten: string;
  email: string | null;
  email_da_xac_thuc: boolean;
  email_xac_thuc_luc: string | null;
  trang_thai: ParticipantStatus;
  co_so_id: string | null;
  co_so_ten: string | null;
  vai_tro_mas: string[];
  vai_tro_tens: string[];
  created_at: string;
  total_count: number;
};

type EditableParticipantRow = ParticipantRow & {
  nguoi_dung_id: string;
  co_so_id: string;
  co_so_ten: string;
};

type ParticipantSettingsDraft = {
  isPrincipal: boolean;
  schoolId: string;
  status: "active" | "inactive" | "locked";
};

const statusLabels: Record<ParticipantStatus, string> = {
  active: "Đang hoạt động",
  inactive: "Tạm ngừng",
  invited: "Đang chờ tham gia",
  locked: "Đã khóa",
  pending_verification: "Chờ xác thực email",
  pending_profile: "Chờ hoàn tất hồ sơ",
};

function statusTone(status: ParticipantStatus) {
  if (status === "active") return "success" as const;
  if (status === "locked") return "danger" as const;
  if (status === "invited" || status.startsWith("pending_")) return "warning" as const;
  return "default" as const;
}

function isEditableParticipant(row: ParticipantRow): row is EditableParticipantRow {
  return Boolean(row.nguoi_dung_id && row.co_so_id && row.co_so_ten);
}

export function AdminParticipants() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [settingsSchoolSearch, setSettingsSchoolSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [emailVerified, setEmailVerified] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "warning">("warning");
  const [settingsRow, setSettingsRow] = useState<EditableParticipantRow | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<ParticipantSettingsDraft | null>(null);
  const [pendingSettings, setPendingSettings] = useState<{
    draft: ParticipantSettingsDraft;
    row: EditableParticipantRow;
  } | null>(null);
  const deferredKeyword = useDeferredValue(keyword.trim());
  const deferredSchoolSearch = useDeferredValue((settingsRow ? settingsSchoolSearch : schoolSearch).trim());

  useEffect(() => {
    let activeRequest = true;
    const timer = window.setTimeout(() => {
      void supabase.rpc("fn_admin_tuy_chon_co_so", {
        p_limit: 100,
        p_tu_khoa: deferredSchoolSearch || null,
      }).then(({ data }) => {
        if (!activeRequest || !data) return;
        setSchools((current) => {
          const byId = new Map(current.map((school) => [school.id, school]));
          for (const school of data as SchoolOption[]) byId.set(school.id, school);
          return [...byId.values()];
        });
      });
    }, 250);

    return () => {
      activeRequest = false;
      window.clearTimeout(timer);
    };
  }, [deferredSchoolSearch, supabase]);

  const filteredSchools = useMemo(() => {
    const query = schoolSearch.trim().toLocaleLowerCase("vi");
    const matching = query
      ? schools.filter((school) => `${school.ten} ${school.ma_truong ?? ""}`.toLocaleLowerCase("vi").includes(query))
      : schools;
    const selected = schools.find((school) => school.id === schoolId);
    return selected && !matching.some((school) => school.id === selected.id)
      ? [selected, ...matching]
      : matching;
  }, [schoolId, schoolSearch, schools]);

  const loadParticipants = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("fn_admin_danh_sach_tai_khoan", {
      p_co_so_id: schoolId || null,
      p_email_da_xac_thuc: emailVerified === "" ? null : emailVerified === "true",
      p_limit: DEFAULT_PAGE_SIZE,
      p_offset: (page - 1) * DEFAULT_PAGE_SIZE,
      p_trang_thai: status || null,
      p_tu_khoa: deferredKeyword || null,
      p_vai_tro: role || null,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không tải được danh sách tài khoản."));
      setLoading(false);
      return;
    }

    const nextRows = (data ?? []) as ParticipantRow[];
    setRows(nextRows);
    setTotal(nextRows[0]?.total_count ?? 0);
    setLoading(false);
  }, [deferredKeyword, emailVerified, page, role, schoolId, status, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadParticipants(), 0);
    return () => window.clearTimeout(timer);
  }, [loadParticipants]);

  function openSettings(row: ParticipantRow) {
    if (!isEditableParticipant(row)) return;
    setSettingsRow(row);
    setSettingsSchoolSearch("");
    setSchools((current) => current.some((school) => school.id === row.co_so_id)
      ? current
      : [...current, { id: row.co_so_id, ma_truong: null, ten: row.co_so_ten }]);
    setSettingsDraft({
      isPrincipal: row.vai_tro_mas.includes("PRINCIPAL"),
      schoolId: row.co_so_id,
      status: row.trang_thai === "active" || row.trang_thai === "inactive" || row.trang_thai === "locked"
        ? row.trang_thai
        : "inactive",
    });
  }

  async function saveSettings() {
    if (!pendingSettings) return;

    setWorking(true);
    const { error } = await supabase.rpc("fn_admin_cap_nhat_nguoi_tham_gia", {
      p_co_so_id: pendingSettings.draft.schoolId,
      p_la_hieu_truong: pendingSettings.draft.isPrincipal,
      p_nguoi_dung_id: pendingSettings.row.nguoi_dung_id,
      p_trang_thai: pendingSettings.draft.status,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không lưu được cài đặt người dùng."));
      setWorking(false);
      setPendingSettings(null);
      return;
    }

    const successMessage = `Đã cập nhật cài đặt của ${pendingSettings.row.ho_ten}.`;
    setWorking(false);
    setPendingSettings(null);
    setSettingsRow(null);
    setSettingsDraft(null);
    await loadParticipants();
    setMessageTone("success");
    setMessage(successMessage);
  }

  return (
    <div className="grid gap-5">
      {message ? <Alert tone={messageTone}>{message}</Alert> : null}

      <p className="admin-privacy-note">
        Quản trị hệ thống có thể chuyển trường, cấp quyền Hiệu trưởng và kiểm soát trạng thái tài khoản. Các vai trò nghiệp vụ còn lại do Hiệu trưởng quản lý tại trường.
      </p>

      <section className="admin-toolbar admin-participants-toolbar" aria-label="Bộ lọc tài khoản">
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
          <input
            aria-label="Tìm cơ sở giáo dục để lọc tài khoản"
            className="form-control mt-2"
            placeholder="Tìm tên hoặc mã trường"
            value={schoolSearch}
            onChange={(event) => {
              setPage(1);
              setSchoolId("");
              setSchoolSearch(event.target.value);
            }}
          />
          <select
            className="form-control mt-2"
            value={schoolId}
            onChange={(event) => {
              setPage(1);
              setSchoolId(event.target.value);
            }}
          >
            <option value="">Tất cả cơ sở</option>
            {filteredSchools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.ten}{school.ma_truong ? ` · ${school.ma_truong}` : ""}
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
            <option value="pending_verification">Chờ xác thực email</option>
            <option value="pending_profile">Chờ hoàn tất hồ sơ</option>
          </select>
        </label>
        <label>
          Xác thực email
          <select
            className="form-control"
            value={emailVerified}
            onChange={(event) => {
              setPage(1);
              setEmailVerified(event.target.value);
            }}
          >
            <option value="">Tất cả</option>
            <option value="true">Đã xác thực</option>
            <option value="false">Chưa xác thực</option>
          </select>
        </label>
      </section>

      {loading ? (
        <LoadingState label="Đang tải danh sách tài khoản…" />
      ) : (
        <section className="admin-table-shell">
          <div className="admin-table-header">
            <div>
              <h2>Danh sách tài khoản</h2>
              <p>Gồm cả tài khoản chưa xác thực hoặc chưa hoàn tất hồ sơ</p>
            </div>
            <StatusBadge>{total.toLocaleString("vi-VN")} tài khoản</StatusBadge>
          </div>

          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Không có tài khoản phù hợp"
                description="Hãy thay đổi từ khóa hoặc bộ lọc để xem lại danh sách."
              />
            </div>
          ) : (
            <div className="admin-table-scroll" data-lenis-prevent>
              <table className="admin-table admin-account-table">
                <thead>
                  <tr>
                    <th scope="col">Họ tên</th>
                    <th scope="col">Email đăng ký</th>
                    <th scope="col">Cơ sở giáo dục</th>
                    <th scope="col">Vai trò</th>
                    <th scope="col">Xác thực email</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Ngày đăng ký</th>
                    <th scope="col"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.auth_user_id}>
                      <td>
                        {isEditableParticipant(row) ? (
                          <button
                            className="admin-participant-name-button"
                            type="button"
                            onClick={() => openSettings(row)}
                          >
                            {row.ho_ten}
                          </button>
                        ) : row.ho_ten}
                      </td>
                      <td className="break-all">{row.email || "Chưa có email"}</td>
                      <td>{row.co_so_ten || <span className="admin-cell-meta">Chưa chọn trường</span>}</td>
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
                        <StatusBadge tone={row.email_da_xac_thuc ? "success" : "warning"}>
                          {row.email_da_xac_thuc ? "Đã xác thực" : "Chưa xác thực"}
                        </StatusBadge>
                        {row.email_xac_thuc_luc ? (
                          <p className="admin-cell-meta mt-1">{formatDate(row.email_xac_thuc_luc)}</p>
                        ) : null}
                      </td>
                      <td>
                        <StatusBadge tone={statusTone(row.trang_thai)}>
                          {statusLabels[row.trang_thai]}
                        </StatusBadge>
                      </td>
                      <td>{formatDate(row.created_at)}</td>
                      <td>
                        {isEditableParticipant(row) ? (
                          <button
                            aria-label={`Cài đặt ${row.ho_ten}`}
                            className="admin-row-action-button button-secondary min-h-9 gap-2 px-4 py-2 text-xs"
                            type="button"
                            onClick={() => openSettings(row)}
                          >
                            <Settings aria-hidden="true" className="h-4 w-4" />
                            Cài đặt
                          </button>
                        ) : <span className="admin-cell-meta">Chưa thể cài đặt</span>}
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

      <ParticipantSettingsDialog
        draft={settingsDraft}
        row={settingsRow}
        schools={schools}
        schoolSearch={settingsSchoolSearch}
        onChange={setSettingsDraft}
        onSchoolSearch={setSettingsSchoolSearch}
        onClose={() => {
          setSettingsRow(null);
          setSettingsDraft(null);
        }}
        onSave={() => {
          if (settingsRow && settingsDraft) {
            setPendingSettings({ draft: settingsDraft, row: settingsRow });
          }
        }}
      />

      <ConfirmDialog
        confirmLabel="Lưu thay đổi"
        description={
          pendingSettings
            ? <SettingsConfirmation schools={schools} settings={pendingSettings} />
            : ""
        }
        isOpen={Boolean(pendingSettings)}
        isWorking={working}
        title="Lưu cài đặt người dùng?"
        tone="warning"
        onCancel={() => setPendingSettings(null)}
        onConfirm={() => void saveSettings()}
      />
    </div>
  );
}

function ParticipantSettingsDialog({
  draft,
  onChange,
  onClose,
  onSave,
  onSchoolSearch,
  row,
  schoolSearch,
  schools,
}: {
  draft: ParticipantSettingsDraft | null;
  onChange: (draft: ParticipantSettingsDraft) => void;
  onClose: () => void;
  onSave: () => void;
  onSchoolSearch: (value: string) => void;
  row: EditableParticipantRow | null;
  schoolSearch: string;
  schools: SchoolOption[];
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!row || !draft) return;

    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), input:not([disabled])',
      )];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draft, onClose, row]);

  if (!row || !draft) return null;

  const initialStatus: ParticipantSettingsDraft["status"] =
    row.trang_thai === "active" || row.trang_thai === "inactive" || row.trang_thai === "locked"
      ? row.trang_thai
      : "inactive";
  const wasPrincipal = row.vai_tro_mas.includes("PRINCIPAL");
  const schoolChanged = draft.schoolId !== row.co_so_id;
  const changed = schoolChanged || draft.status !== initialStatus || draft.isPrincipal !== wasPrincipal;
  const isSystemAdmin = row.vai_tro_mas.includes("SYSTEM_ADMIN");
  const selectedSchool = schools.find((school) => school.id === draft.schoolId);
  const normalizedSchoolSearch = schoolSearch.trim().toLocaleLowerCase("vi");
  const matchingSchools = normalizedSchoolSearch
    ? schools.filter((school) => `${school.ten} ${school.ma_truong ?? ""}`.toLocaleLowerCase("vi").includes(normalizedSchoolSearch))
    : schools;
  const schoolOptions = selectedSchool && !matchingSchools.some((school) => school.id === selectedSchool.id)
    ? [selectedSchool, ...matchingSchools]
    : matchingSchools;

  return (
    <div className="admin-user-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="admin-user-dialog"
        ref={dialogRef}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="admin-user-dialog-header">
          <div className="flex min-w-0 items-center gap-3">
            <span className="admin-user-dialog-icon" aria-hidden="true">
              <Settings className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id={titleId}>Cài đặt người dùng</h2>
              <p>Quản lý trường, quyền Hiệu trưởng và trạng thái tài khoản.</p>
            </div>
          </div>
          <button
            aria-label="Đóng cài đặt người dùng"
            className="admin-user-dialog-close"
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="admin-user-dialog-profile">
          <span className="admin-user-dialog-avatar" aria-hidden="true">
            <UserRound className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="admin-cell-title">{row.ho_ten}</p>
            <p className="admin-cell-meta">{row.email || "Chưa có email"}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <StatusBadge tone={row.email_da_xac_thuc ? "success" : "warning"}>
              {row.email_da_xac_thuc ? "Email đã xác thực" : "Email chưa xác thực"}
            </StatusBadge>
            <StatusBadge tone={statusTone(row.trang_thai)}>{statusLabels[row.trang_thai]}</StatusBadge>
          </div>
        </div>

        <div className="admin-user-dialog-body">
          <section className="admin-user-setting-section">
            <div className="admin-user-setting-heading">
              <Building2 aria-hidden="true" className="h-5 w-5" />
              <div>
                <h3>Cơ sở giáo dục</h3>
                <p>Người dùng chỉ làm việc với dữ liệu của trường được chọn.</p>
              </div>
            </div>
            <label className="admin-user-field">
              Trường đang tham gia
              <input
                aria-label="Tìm trường để chuyển tài khoản"
                className="form-control mt-2"
                placeholder="Tìm tên hoặc mã trường"
                value={schoolSearch}
                onChange={(event) => onSchoolSearch(event.target.value)}
              />
              <select
                className="form-control mt-2"
                value={draft.schoolId}
                onChange={(event) => {
                  const nextSchoolId = event.target.value;
                  onChange({
                    ...draft,
                    isPrincipal: nextSchoolId === row.co_so_id ? wasPrincipal : false,
                    schoolId: nextSchoolId,
                  });
                }}
              >
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.ten}{school.ma_truong ? ` · ${school.ma_truong}` : ""}
                  </option>
                ))}
              </select>
            </label>
            {schoolChanged ? (
              <p className="admin-user-setting-notice">
                Khi chuyển sang {selectedSchool?.ten || "trường mới"}, các phân công và vai trò Hội đồng tại {row.co_so_ten} sẽ được gỡ. Lịch sử tài liệu vẫn được giữ nguyên.
              </p>
            ) : null}
          </section>

          <section className="admin-user-setting-section">
            <div className="admin-user-setting-heading">
              <Crown aria-hidden="true" className="h-5 w-5" />
              <div>
                <h3>Quyền Hiệu trưởng</h3>
                <p>Mỗi trường chỉ có một tài khoản giữ quyền Hiệu trưởng.</p>
              </div>
            </div>
            <label className={`admin-user-principal-option${draft.isPrincipal ? " is-selected" : ""}`}>
              <input
                checked={draft.isPrincipal}
                disabled={draft.status !== "active"}
                type="checkbox"
                onChange={(event) => onChange({ ...draft, isPrincipal: event.target.checked })}
              />
              <span>
                <strong>Đặt làm Hiệu trưởng</strong>
                <small>Nếu trường đã có Hiệu trưởng, quyền sẽ được chuyển sang người này.</small>
              </span>
            </label>
            {draft.status !== "active" ? (
              <p className="admin-cell-meta">Hãy kích hoạt tài khoản trước khi cấp quyền Hiệu trưởng.</p>
            ) : null}
          </section>

          <section className="admin-user-setting-section">
            <div className="admin-user-setting-heading">
              <UserRound aria-hidden="true" className="h-5 w-5" />
              <div>
                <h3>Tài khoản</h3>
                <p>Kiểm soát khả năng đăng nhập và làm việc trên hệ thống.</p>
              </div>
            </div>
            <label className="admin-user-field">
              Trạng thái
              <select
                className="form-control"
                disabled={isSystemAdmin}
                value={draft.status}
                onChange={(event) => {
                  const nextStatus = event.target.value as ParticipantSettingsDraft["status"];
                  onChange({
                    ...draft,
                    isPrincipal: nextStatus === "active" ? draft.isPrincipal : false,
                    status: nextStatus,
                  });
                }}
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ngừng</option>
                <option value="locked">Đã khóa</option>
              </select>
            </label>
            {isSystemAdmin ? (
              <p className="admin-cell-meta">Trạng thái của Quản trị hệ thống được bảo vệ.</p>
            ) : null}
          </section>

          <section className="admin-user-current-roles" aria-label="Vai trò hiện tại">
            <p>Vai trò hiện tại</p>
            <div className="flex flex-wrap gap-1.5">
              {row.vai_tro_mas.map((code, index) => (
                <StatusBadge key={code} tone={code === "SYSTEM_ADMIN" ? "info" : "default"}>
                  {row.vai_tro_tens[index] || roleLabels[code] || code}
                </StatusBadge>
              ))}
            </div>
          </section>
        </div>

        <footer className="admin-user-dialog-footer">
          <button className="button-secondary" type="button" onClick={onClose}>Hủy</button>
          {changed ? (
            <button className="button-primary" type="button" onClick={onSave}>Lưu thay đổi</button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

function SettingsConfirmation({
  schools,
  settings,
}: {
  schools: SchoolOption[];
  settings: { draft: ParticipantSettingsDraft; row: EditableParticipantRow };
}) {
  const { draft, row } = settings;
  const school = schools.find((item) => item.id === draft.schoolId);
  const schoolChanged = draft.schoolId !== row.co_so_id;
  const principalChanged = draft.isPrincipal !== row.vai_tro_mas.includes("PRINCIPAL");
  const initialStatus: ParticipantSettingsDraft["status"] =
    row.trang_thai === "active" || row.trang_thai === "inactive" || row.trang_thai === "locked"
      ? row.trang_thai
      : "inactive";

  return (
    <div className="grid gap-2">
      <p>Các thay đổi sau sẽ được áp dụng cho {row.ho_ten}:</p>
      <ul className="list-disc space-y-1 pl-5">
        {schoolChanged ? <li>Chuyển từ {row.co_so_ten} sang {school?.ten || "trường đã chọn"}.</li> : null}
        {principalChanged ? (
          <li>{draft.isPrincipal ? "Cấp quyền Hiệu trưởng." : "Gỡ quyền Hiệu trưởng."}</li>
        ) : null}
        {draft.status !== initialStatus ? <li>Đổi trạng thái thành “{statusLabels[draft.status]}”.</li> : null}
      </ul>
    </div>
  );
}
