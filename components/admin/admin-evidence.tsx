"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { formatDate, formatDateTime, formatFileSize } from "@/components/admin/admin-format";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { toUserMessage } from "@/lib/errors/user-message";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SchoolEvidenceSummary = {
  co_so_id: string;
  ma_truong: string | null;
  co_so_ten: string;
  trang_thai_co_so: string;
  tong_minh_chung: number;
  cho_xac_minh: number;
  da_xac_minh: number;
  can_kiem_tra: number;
  het_han: number;
  cap_nhat_gan_nhat: string | null;
  total_count: number;
};

type EvidenceRow = {
  id: string;
  co_so_id: string;
  co_so_ten: string;
  nam_hoc_ten: string;
  ma: string;
  loai_tep: string | null;
  kich_thuoc: number | null;
  ngay_ban_hanh: string | null;
  ngay_het_gia_tri: string | null;
  trang_thai_xac_minh: string;
  nguoi_tai_len_ten: string | null;
  co_tep: boolean;
  co_lien_ket: boolean;
  het_han: boolean;
  thieu_tham_chieu: boolean;
  can_kiem_tra_ky_thuat: boolean;
  ghi_chu_ky_thuat: string | null;
  ky_thuat_cap_nhat_luc: string | null;
  created_at: string;
  total_count: number;
};

export function AdminEvidence() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [schools, setSchools] = useState<SchoolEvidenceSummary[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolEvidenceSummary | null>(null);
  const [schoolKeyword, setSchoolKeyword] = useState("");
  const [schoolPage, setSchoolPage] = useState(1);
  const [schoolTotal, setSchoolTotal] = useState(0);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "warning">("warning");
  const [pendingRow, setPendingRow] = useState<EvidenceRow | null>(null);
  const deferredSchoolKeyword = useDeferredValue(schoolKeyword.trim());
  const deferredKeyword = useDeferredValue(keyword.trim());

  const loadSchools = useCallback(async () => {
    setSchoolsLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("fn_admin_tong_hop_minh_chung_theo_co_so", {
      p_limit: DEFAULT_PAGE_SIZE,
      p_offset: (schoolPage - 1) * DEFAULT_PAGE_SIZE,
      p_tu_khoa: deferredSchoolKeyword || null,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không tải được danh sách kho minh chứng theo trường."));
      setSchools([]);
      setSchoolTotal(0);
      setSchoolsLoading(false);
      return;
    }

    const nextSchools = (data ?? []) as SchoolEvidenceSummary[];
    setSchools(nextSchools);
    setSchoolTotal(nextSchools[0]?.total_count ?? 0);
    setSchoolsLoading(false);
  }, [deferredSchoolKeyword, schoolPage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSchools(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSchools]);

  const loadEvidence = useCallback(async () => {
    if (!selectedSchool) {
      setRows([]);
      setTotal(0);
      setEvidenceLoading(false);
      return;
    }

    setEvidenceLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("fn_admin_danh_sach_minh_chung", {
      p_co_so_id: selectedSchool.co_so_id,
      p_limit: DEFAULT_PAGE_SIZE,
      p_offset: (page - 1) * DEFAULT_PAGE_SIZE,
      p_trang_thai: status || null,
      p_tu_khoa: deferredKeyword || null,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không tải được metadata minh chứng của trường."));
      setRows([]);
      setTotal(0);
      setEvidenceLoading(false);
      return;
    }

    const nextRows = (data ?? []) as EvidenceRow[];
    setRows(nextRows);
    setTotal(nextRows[0]?.total_count ?? 0);
    setEvidenceLoading(false);
  }, [deferredKeyword, page, selectedSchool, status, supabase]);

  useEffect(() => {
    if (!selectedSchool) return;
    const timer = window.setTimeout(() => void loadEvidence(), 0);
    return () => window.clearTimeout(timer);
  }, [loadEvidence, selectedSchool]);

  function openSchool(school: SchoolEvidenceSummary) {
    setSelectedSchool(school);
    setKeyword("");
    setStatus("");
    setPage(1);
    setRows([]);
    setTotal(0);
    setMessage("");
  }

  function closeSchool() {
    setSelectedSchool(null);
    setKeyword("");
    setStatus("");
    setPage(1);
    setRows([]);
    setTotal(0);
    setMessage("");
  }

  async function updateTechnicalFlag() {
    if (!pendingRow) return;

    const nextFlag = !pendingRow.can_kiem_tra_ky_thuat;
    setWorking(true);
    const { error } = await supabase.rpc("fn_admin_danh_dau_minh_chung", {
      p_can_kiem_tra: nextFlag,
      p_ghi_chu: null,
      p_minh_chung_id: pendingRow.id,
    });

    if (error) {
      setMessageTone("warning");
      setMessage(toUserMessage(error, "Không cập nhật được cờ kiểm tra kỹ thuật."));
      setWorking(false);
      setPendingRow(null);
      return;
    }

    const successMessage = nextFlag
      ? `Đã đánh dấu ${pendingRow.ma} để kiểm tra kỹ thuật.`
      : `Đã bỏ đánh dấu kỹ thuật khỏi ${pendingRow.ma}.`;
    setWorking(false);
    setPendingRow(null);
    await Promise.all([loadEvidence(), loadSchools()]);
    setMessageTone("success");
    setMessage(successMessage);
  }

  return (
    <div className="grid gap-5">
      {message ? <Alert tone={messageTone}>{message}</Alert> : null}

      <p className="admin-privacy-note">
        Mỗi kho minh chứng thuộc một cơ sở giáo dục. Quản trị hệ thống chỉ xem metadata vận hành; nội dung, đường dẫn lưu trữ, hash tệp và liên kết tải xuống vẫn thuộc phạm vi nghiệp vụ của nhà trường.
      </p>

      {selectedSchool ? (
        <>
          <section className="admin-evidence-context" aria-label="Trường đang được quản trị">
            <div>
              <p className="admin-eyebrow">Kho minh chứng của cơ sở</p>
              <h2>{selectedSchool.co_so_ten}</h2>
              <p>
                {selectedSchool.ma_truong || "Chưa có mã trường"} · {selectedSchool.tong_minh_chung.toLocaleString("vi-VN")} minh chứng
              </p>
            </div>
            <button className="button-secondary" type="button" onClick={closeSchool}>
              Danh sách trường
            </button>
          </section>

          <section className="admin-toolbar admin-evidence-toolbar" aria-label="Bộ lọc kho minh chứng của trường">
            <label>
              Tìm mã, loại tệp hoặc năm học
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
                <option value="">Tất cả trạng thái</option>
                <option value="can_kiem_tra">Cần kiểm tra kỹ thuật</option>
                <option value="cho_xac_minh">Chờ xác minh</option>
                <option value="da_xac_minh">Đã xác minh</option>
                <option value="tu_choi">Từ chối</option>
                <option value="het_hieu_luc">Hết hiệu lực</option>
              </select>
            </label>
          </section>

          {evidenceLoading ? (
            <LoadingState label="Đang tải kho minh chứng của trường…" />
          ) : (
            <EvidenceTable rows={rows} total={total} onFlag={setPendingRow} schoolName={selectedSchool.co_so_ten} />
          )}

          <Pagination disabled={evidenceLoading} page={page} total={total} onPageChange={setPage} />
        </>
      ) : (
        <>
          <section className="admin-toolbar admin-school-evidence-search" aria-label="Tìm kho minh chứng theo trường">
            <label>
              Tìm tên hoặc mã trường
              <input
                className="form-control"
                placeholder="Nhập tên hoặc mã trường"
                value={schoolKeyword}
                onChange={(event) => {
                  setSchoolPage(1);
                  setSchoolKeyword(event.target.value);
                }}
              />
            </label>
          </section>

          {schoolsLoading ? (
            <LoadingState label="Đang tổng hợp kho minh chứng theo trường…" />
          ) : (
            <SchoolEvidenceTable schools={schools} total={schoolTotal} onOpen={openSchool} />
          )}

          <Pagination
            disabled={schoolsLoading}
            page={schoolPage}
            total={schoolTotal}
            onPageChange={setSchoolPage}
          />
        </>
      )}

      <ConfirmDialog
        confirmLabel={pendingRow?.can_kiem_tra_ky_thuat ? "Bỏ đánh dấu" : "Đánh dấu"}
        description={
          pendingRow
            ? pendingRow.can_kiem_tra_ky_thuat
              ? `Bỏ cờ kiểm tra thủ công khỏi ${pendingRow.ma}. Các cảnh báo tự động như hết hạn hoặc thiếu tham chiếu vẫn được giữ.`
              : `Đưa ${pendingRow.ma} vào hàng đợi để quản trị viên kỹ thuật tiếp tục rà soát metadata.`
            : ""
        }
        isOpen={Boolean(pendingRow)}
        isWorking={working}
        title={pendingRow?.can_kiem_tra_ky_thuat ? "Bỏ đánh dấu kỹ thuật?" : "Đánh dấu cần kiểm tra?"}
        tone="warning"
        onCancel={() => setPendingRow(null)}
        onConfirm={() => void updateTechnicalFlag()}
      />
    </div>
  );
}

function EvidenceTable({
  onFlag,
  rows,
  schoolName,
  total,
}: {
  onFlag: (row: EvidenceRow) => void;
  rows: EvidenceRow[];
  schoolName: string;
  total: number;
}) {
  return (
    <section className="admin-table-shell">
      <div className="admin-table-header">
        <div>
          <h2>Metadata trong kho</h2>
          <p>Chỉ hiển thị minh chứng của {schoolName}</p>
        </div>
        <StatusBadge>{total.toLocaleString("vi-VN")} minh chứng</StatusBadge>
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="Chưa có metadata phù hợp"
            description="Kho của trường này chưa có minh chứng hoặc không có kết quả phù hợp với bộ lọc."
          />
        </div>
      ) : (
        <div className="admin-table-scroll" data-lenis-prevent>
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Mã minh chứng</th>
                <th scope="col">Năm học</th>
                <th scope="col">Tệp hoặc liên kết</th>
                <th scope="col">Hiệu lực</th>
                <th scope="col">Xác minh</th>
                <th scope="col">Kỹ thuật</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="admin-cell-title">{row.ma}</p>
                    <p className="admin-cell-meta">Tạo {formatDateTime(row.created_at)}</p>
                  </td>
                  <td>{row.nam_hoc_ten}</td>
                  <td>
                    <p>{row.co_tep ? "Tệp đính kèm" : row.co_lien_ket ? "Liên kết điện tử" : "Thiếu tham chiếu"}</p>
                    <p className="admin-cell-meta">
                      {[row.loai_tep || "Chưa rõ loại", formatFileSize(row.kich_thuoc)].join(" · ")}
                    </p>
                  </td>
                  <td>
                    <p>Ban hành: {formatDate(row.ngay_ban_hanh)}</p>
                    <p className="admin-cell-meta">Hết giá trị: {row.ngay_het_gia_tri ? formatDate(row.ngay_het_gia_tri) : "Không ghi hạn"}</p>
                  </td>
                  <td>
                    <StatusBadge status={row.trang_thai_xac_minh} />
                    <p className="admin-cell-meta">Tải lên bởi {row.nguoi_tai_len_ten || "Chưa xác định"}</p>
                  </td>
                  <td><TechnicalState row={row} /></td>
                  <td>
                    <button
                      className="button-secondary min-h-9 px-4 py-2 text-xs"
                      type="button"
                      onClick={() => onFlag(row)}
                    >
                      {row.can_kiem_tra_ky_thuat ? "Bỏ đánh dấu" : "Cần kiểm tra"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SchoolEvidenceTable({
  onOpen,
  schools,
  total,
}: {
  onOpen: (school: SchoolEvidenceSummary) => void;
  schools: SchoolEvidenceSummary[];
  total: number;
}) {
  return (
    <section className="admin-table-shell">
      <div className="admin-table-header">
        <div>
          <h2>Kho minh chứng theo cơ sở</h2>
          <p>Mỗi trường có một kho riêng; các trường có minh chứng được xếp lên trước</p>
        </div>
        <StatusBadge>{total.toLocaleString("vi-VN")} cơ sở</StatusBadge>
      </div>

      {schools.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="Không tìm thấy cơ sở"
            description="Hãy thay đổi tên hoặc mã trường để tìm lại kho minh chứng."
          />
        </div>
      ) : (
        <div className="admin-table-scroll" data-lenis-prevent>
          <table className="admin-table admin-school-evidence-table">
            <thead>
              <tr>
                <th scope="col">Cơ sở giáo dục</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Tổng minh chứng</th>
                <th scope="col">Xác minh</th>
                <th scope="col">Kỹ thuật</th>
                <th scope="col">Cập nhật gần nhất</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.co_so_id}>
                  <td>
                    <p className="admin-cell-title">{school.co_so_ten}</p>
                    <p className="admin-cell-meta">{school.ma_truong || "Chưa có mã trường"}</p>
                  </td>
                  <td><StatusBadge status={school.trang_thai_co_so} /></td>
                  <td>
                    <p className="admin-school-evidence-total">{school.tong_minh_chung.toLocaleString("vi-VN")}</p>
                    <p className="admin-cell-meta">minh chứng</p>
                  </td>
                  <td>
                    <div className="admin-count-stack">
                      <StatusBadge tone={school.cho_xac_minh > 0 ? "warning" : "default"}>
                        {school.cho_xac_minh} chờ xác minh
                      </StatusBadge>
                      <StatusBadge tone={school.da_xac_minh > 0 ? "success" : "default"}>
                        {school.da_xac_minh} đã xác minh
                      </StatusBadge>
                    </div>
                  </td>
                  <td>
                    {school.can_kiem_tra > 0 ? (
                      <div className="admin-count-stack">
                        <StatusBadge tone="warning">{school.can_kiem_tra} cần kiểm tra</StatusBadge>
                        {school.het_han > 0 ? <StatusBadge tone="danger">{school.het_han} hết hạn</StatusBadge> : null}
                      </div>
                    ) : (
                      <StatusBadge tone="success">Bình thường</StatusBadge>
                    )}
                  </td>
                  <td>{school.cap_nhat_gan_nhat ? formatDateTime(school.cap_nhat_gan_nhat) : "Chưa có dữ liệu"}</td>
                  <td>
                    <button className="admin-row-action-button button-secondary min-h-9 px-4 py-2 text-xs" type="button" onClick={() => onOpen(school)}>
                      Mở kho
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TechnicalState({ row }: { row: EvidenceRow }) {
  if (row.can_kiem_tra_ky_thuat) {
    return (
      <>
        <StatusBadge tone="warning">Đã đánh dấu</StatusBadge>
        {row.ghi_chu_ky_thuat ? <p className="admin-cell-meta">{row.ghi_chu_ky_thuat}</p> : null}
        {row.ky_thuat_cap_nhat_luc ? <p className="admin-cell-meta">Cập nhật {formatDateTime(row.ky_thuat_cap_nhat_luc)}</p> : null}
      </>
    );
  }

  if (row.thieu_tham_chieu) {
    return <StatusBadge tone="danger">Thiếu tham chiếu</StatusBadge>;
  }

  if (row.het_han) {
    return <StatusBadge tone="warning">Đã hết hạn</StatusBadge>;
  }

  return <StatusBadge tone="success">Bình thường</StatusBadge>;
}
