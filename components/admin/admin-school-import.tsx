"use client";

import { useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ImportStatus = "new" | "duplicate" | "error";

type ImportRow = {
  row: number;
  ma_truong: string;
  ten: string;
  tinh_thanh: string;
  loai_hinh: string;
  cap_hoc: string[];
  status: ImportStatus;
  message: string | null;
};

type Preview = {
  rows: ImportRow[];
  summary: { total: number; new: number; duplicate: number; error: number };
  digest: string;
};

type ImportResult = { summary: { created: number; skipped: number } };

const statusLabels: Record<ImportStatus, string> = {
  new: "Tạo mới",
  duplicate: "Bỏ qua mã đã có",
  error: "Cần sửa",
};

const endpoint = "/api/quan-tri/co-so/import";

function messageFromResponse(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

export function AdminSchoolImport({ onImported }: { onImported: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [working, setWorking] = useState<"template" | "preview" | "commit" | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "warning">("warning");
  const [statusFilter, setStatusFilter] = useState<ImportStatus | "all">("all");
  const [page, setPage] = useState(1);

  const visibleRows = preview?.rows.filter((row) => statusFilter === "all" || row.status === statusFilter) ?? [];
  const pageRows = visibleRows.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);

  async function authHeaders() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại rồi thử tiếp.");
    }
    return { Authorization: `Bearer ${data.session.access_token}` };
  }

  async function downloadTemplate() {
    if (working) return;
    setWorking("template");
    setMessage("");
    try {
      const response = await fetch(endpoint, { headers: await authHeaders(), cache: "no-store" });
      if (!response.ok) {
        throw new Error(messageFromResponse(await response.json(), "Không tải được file mẫu."));
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Mau-nhap-danh-muc-truong.xlsx";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "Không tải được file mẫu.");
    } finally {
      setWorking(null);
    }
  }

  async function submit(action: "preview" | "commit") {
    if (!file || working || (action === "commit" && !preview)) return;
    setWorking(action);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("action", action);
      if (action === "commit" && preview) body.set("digest", preview.digest);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: await authHeaders(),
        body,
      });
      const payload = await response.json() as Preview | ImportResult | { error: string };
      if (!response.ok) {
        throw new Error(messageFromResponse(payload, "Không xử lý được file Excel."));
      }
      if (action === "preview") {
        const next = payload as Preview;
        if (!Array.isArray(next.rows) || !next.summary || !next.digest) {
          throw new Error("Kết quả xem trước không hợp lệ.");
        }
        setPreview(next);
        setPage(1);
        setStatusFilter("all");
        setMessageTone(next.summary.error ? "warning" : "success");
        setMessage(next.summary.error
          ? `Có ${next.summary.error} dòng cần sửa. Hãy xem cột ghi chú và tải lại file sau khi sửa.`
          : "File hợp lệ. Kiểm tra danh sách trước khi xác nhận nhập.");
      } else {
        const result = payload as ImportResult;
        if (!result.summary) throw new Error("Không nhận được kết quả nhập danh mục.");
        setPreview(null);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await onImported();
        setMessageTone("success");
        setMessage(`Đã tạo ${result.summary.created} trường. Bỏ qua ${result.summary.skipped} mã đã có. Trường mới cần được rà soát và kích hoạt trước khi sử dụng.`);
      }
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "Không xử lý được file Excel.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <section className="admin-table-shell" aria-labelledby="school-import-title">
      <div className="admin-table-header">
        <div>
          <h2 id="school-import-title">Nhập danh mục trường từ Excel</h2>
          <p>Tải file mẫu, xem trước từng dòng rồi xác nhận nhập. Mã trường đã có sẽ được bỏ qua.</p>
        </div>
        <button className="button-secondary" disabled={Boolean(working)} type="button" onClick={() => void downloadTemplate()}>
          {working === "template" ? "Đang tải…" : "Tải file mẫu"}
        </button>
      </div>

      <div className="grid gap-4 border-t border-[var(--color-border)] p-5">
        <label className="text-sm font-medium">
          File Excel (.xlsx)
          <input
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="form-control mt-2"
            disabled={Boolean(working)}
            ref={fileInputRef}
            type="file"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setMessage("");
              setPage(1);
            }}
          />
        </label>
        <p className="muted text-sm">Tối đa 2.000 trường và 5 MB mỗi file. Trường mới chưa có năm học, ở trạng thái tạm ngừng và chưa cho phép tự đăng ký.</p>
        <div className="flex flex-wrap gap-3">
          <button className="button-secondary" disabled={!file || Boolean(working)} type="button" onClick={() => void submit("preview")}>
            {working === "preview" ? "Đang kiểm tra…" : "Xem trước"}
          </button>
          <button
            className="button-primary"
            disabled={!preview || preview.summary.error > 0 || preview.summary.new === 0 || Boolean(working)}
            type="button"
            onClick={() => void submit("commit")}
          >
            {working === "commit" ? "Đang nhập…" : "Xác nhận nhập"}
          </button>
        </div>
        {message ? <Alert tone={messageTone}>{message}</Alert> : null}
      </div>

      {preview ? (
        <div className="border-t border-[var(--color-border)]">
          <div className="flex flex-wrap items-end justify-between gap-4 p-5">
            <div>
              <h3 className="font-semibold">Kết quả xem trước</h3>
              <p className="muted mt-1 text-sm">
                {preview.summary.total} dòng · {preview.summary.new} tạo mới · {preview.summary.duplicate} đã có · {preview.summary.error} lỗi
              </p>
            </div>
            <label className="text-sm font-medium">
              Lọc dòng
              <select
                className="form-control mt-2"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as ImportStatus | "all");
                  setPage(1);
                }}
              >
                <option value="all">Tất cả</option>
                <option value="error">Cần sửa</option>
                <option value="duplicate">Mã đã có</option>
                <option value="new">Tạo mới</option>
              </select>
            </label>
          </div>
          {visibleRows.length ? (
            <div className="admin-table-scroll" data-lenis-prevent>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Dòng</th>
                    <th scope="col">Mã trường</th>
                    <th scope="col">Tên trường</th>
                    <th scope="col">Tỉnh/thành phố</th>
                    <th scope="col">Kết quả</th>
                    <th scope="col">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.row}>
                      <td>{row.row}</td>
                      <td>{row.ma_truong || "—"}</td>
                      <td>{row.ten || "—"}</td>
                      <td>{row.tinh_thanh || "—"}</td>
                      <td>{statusLabels[row.status]}</td>
                      <td>{row.message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted px-5 pb-5 text-sm">Không có dòng nào trong bộ lọc này.</p>}
          <Pagination page={page} total={visibleRows.length} onPageChange={setPage} />
        </div>
      ) : null}
    </section>
  );
}
