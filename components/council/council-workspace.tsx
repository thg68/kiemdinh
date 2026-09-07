"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAppContext } from "@/components/shared/use-app-context";
import { useScopedRequest } from "@/components/shared/use-scoped-request";

type User = {
  id: string;
  ho_ten: string | null;
  email: string | null;
};

type Council = {
  id: string;
  nam_hoc_id: string;
  ten: string;
  so_quyet_dinh: string | null;
  ngay_quyet_dinh: string | null;
  trang_thai: string;
};

type CouncilMember = {
  id: string;
  chuc_vu: string | null;
  vai_tro_hoi_dong: string;
  thu_tu: number;
  nguoi_dung?: User | User[] | null;
};

const councilRoleLabels: Record<string, string> = {
  chu_tich: "Chủ tịch",
  thu_ky: "Thư ký",
  uy_vien: "Ủy viên",
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function CouncilWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [council, setCouncil] = useState<Council | null>(null);
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [ten, setTen] = useState("");
  const [soQuyetDinh, setSoQuyetDinh] = useState("");
  const [ngayQuyetDinh, setNgayQuyetDinh] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState("uy_vien");
  const [memberTitle, setMemberTitle] = useState("");
  const [memberOrder, setMemberOrder] = useState("1");
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const effectiveYearId = selectedYearId || activeYear?.id || "";
  const selectedYearName = years.find((year) => year.id === effectiveYearId)?.ten ?? "";
  const councilRequest = useScopedRequest(`${profile?.co_so_id ?? ""}:${effectiveYearId}`);

  const loadCouncil = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setLoadingData(true);
    setMessage("");
    setCouncil(null);
    setMembers([]);
    setTen(`Hội đồng tự đánh giá năm học ${selectedYearName}`);
    setSoQuyetDinh("");
    setNgayQuyetDinh("");
    const request = councilRequest.begin("council");

    const [{ data: userData, error: userError }, { data: councilData, error: councilError }] =
      await Promise.all([
        supabase
          .from("nguoi_dung")
          .select("id, ho_ten, email")
          .eq("co_so_id", profile.co_so_id)
          .eq("trang_thai", "active")
          .order("ho_ten", { ascending: true }),
        supabase
          .from("hoi_dong_tu_danh_gia")
          .select("id, nam_hoc_id, ten, so_quyet_dinh, ngay_quyet_dinh, trang_thai")
          .eq("co_so_id", profile.co_so_id)
          .eq("nam_hoc_id", effectiveYearId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (!councilRequest.isCurrent(request)) return;

    if (userError || councilError) {
      setMessage(toUserMessage(userError ?? councilError, "Không tải được dữ liệu hội đồng. Vui lòng thử lại."));
      setLoadingData(false);
      return;
    }

    const loadedCouncil = councilData as Council | null;
    setUsers((userData ?? []) as User[]);
    setCouncil(loadedCouncil);
    setTen(loadedCouncil?.ten ?? `Hội đồng tự đánh giá năm học ${selectedYearName}`);
    setSoQuyetDinh(loadedCouncil?.so_quyet_dinh ?? "");
    setNgayQuyetDinh(loadedCouncil?.ngay_quyet_dinh ?? "");

    if (loadedCouncil) {
      const { data: memberData, error: memberError } = await supabase
        .from("thanh_vien_hoi_dong")
        .select("id, chuc_vu, vai_tro_hoi_dong, thu_tu, nguoi_dung:nguoi_dung_id(id, ho_ten, email)")
        .eq("hoi_dong_id", loadedCouncil.id)
        .order("thu_tu", { ascending: true });

      if (!councilRequest.isCurrent(request)) return;

      if (memberError) {
        setMessage(toUserMessage(memberError, "Không tải được thành viên hội đồng. Vui lòng thử lại."));
        setLoadingData(false);
        return;
      }

      setMembers((memberData ?? []) as unknown as CouncilMember[]);
    } else {
      setMembers([]);
    }

    setLoadingData(false);
  }, [councilRequest, effectiveYearId, profile, selectedYearName, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCouncil();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCouncil]);

  async function saveCouncil() {
    if (!supabase || !profile || !effectiveYearId) {
      setMessage("Chưa đủ dữ liệu để lưu hội đồng.");
      return null;
    }

    setSaving(true);
    setMessage("");

    if (council?.nam_hoc_id === effectiveYearId) {
      const { error } = await supabase
        .from("hoi_dong_tu_danh_gia")
        .update({
          ten,
          so_quyet_dinh: soQuyetDinh || null,
          ngay_quyet_dinh: ngayQuyetDinh || null,
        })
        .eq("id", council.id);

      setSaving(false);

      if (error) {
        setMessage(toUserMessage(error));
        return null;
      }

      setMessage("Đã lưu thông tin hội đồng.");
      await loadCouncil();
      return council.id;
    }

    const { data, error } = await supabase
      .from("hoi_dong_tu_danh_gia")
      .insert({
        co_so_id: profile.co_so_id,
        nam_hoc_id: effectiveYearId,
        ten,
        so_quyet_dinh: soQuyetDinh || null,
        ngay_quyet_dinh: ngayQuyetDinh || null,
      })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      setMessage(toUserMessage(error));
      return null;
    }

    setMessage("Đã tạo hội đồng tự đánh giá.");
    await loadCouncil();
    return data.id as string;
  }

  async function handleCouncilSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveCouncil();
  }

  async function handleMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Chưa cấu hình Supabase.");
      return;
    }

    const councilId = council?.id ?? (await saveCouncil());

    if (!councilId || !memberUserId) {
      setMessage("Hãy chọn người dùng cần thêm vào hội đồng.");
      return;
    }

    const { error } = await supabase.from("thanh_vien_hoi_dong").insert({
      hoi_dong_id: councilId,
      nguoi_dung_id: memberUserId,
      co_so_id: profile?.co_so_id,
      nam_hoc_id: effectiveYearId,
      chuc_vu: memberTitle,
      vai_tro_hoi_dong: memberRole,
      thu_tu: Number(memberOrder) || 1,
    });

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setMemberUserId("");
    setMemberTitle("");
    setMemberRole("uy_vien");
    setMemberOrder(String(members.length + 2));
    setMessage("Đã thêm thành viên hội đồng.");
    await loadCouncil();
  }

  async function removeMember(memberId: string) {
    if (!supabase) {
      setMessage("Chưa cấu hình Supabase.");
      return;
    }

    const { error } = await supabase.from("thanh_vien_hoi_dong").delete().eq("id", memberId);

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setMessage("Đã bỏ thành viên khỏi hội đồng.");
    await loadCouncil();
  }

  if (loading || loadingData) {
    return <LoadingState label="Đang tải hội đồng tự đánh giá…" />;
  }

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có năm học để lập hội đồng"
        description="Hãy thiết lập đơn vị và năm học trước khi nhập danh sách hội đồng tự đánh giá."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone={message.startsWith("Đã") ? "success" : "warning"}>{message}</Alert> : null}

      <section className="surface-card grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-end">
        <label className="text-sm font-medium">
          Năm học
          <select
            className="form-control mt-2"
            value={effectiveYearId}
            onChange={(event) => setSelectedYearId(event.target.value)}
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.ten} {year.trang_thai === "dang_hoat_dong" ? "(đang hoạt động)" : ""}
              </option>
            ))}
          </select>
        </label>
        <Link className="button-secondary" href="/bao-cao">
          Xem Mẫu 1
        </Link>
      </section>

      <form className="surface-card grid gap-4 p-5" onSubmit={handleCouncilSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Thông tin hội đồng</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Dữ liệu này được dùng ở bìa trong và phần chữ ký của Mẫu 1.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="text-sm font-medium lg:col-span-3">
            Tên hội đồng
            <input className="form-control mt-2" required value={ten} onChange={(event) => setTen(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Số quyết định
            <input className="form-control mt-2" value={soQuyetDinh} onChange={(event) => setSoQuyetDinh(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Ngày quyết định
            <input className="form-control mt-2" type="date" value={ngayQuyetDinh} onChange={(event) => setNgayQuyetDinh(event.target.value)} />
          </label>
          <div className="flex items-end">
            <button className="button-primary w-full" disabled={saving}>
              {saving ? "Đang lưu…" : council ? "Lưu hội đồng" : "Tạo hội đồng"}
            </button>
          </div>
        </div>
      </form>

      <form className="surface-card grid gap-4 p-5" onSubmit={handleMemberSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Thêm thành viên</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Chỉ chọn người dùng đã thuộc đơn vị. Vai trò ở đây là vai trò trong hội đồng, không thay thế phân quyền hệ thống.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="text-sm font-medium">
            Người dùng
            <select className="form-control mt-2" value={memberUserId} onChange={(event) => setMemberUserId(event.target.value)} required>
              <option value="">Chọn thành viên</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.ho_ten ?? user.email ?? "Người dùng"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Vai trò hội đồng
            <select className="form-control mt-2" value={memberRole} onChange={(event) => setMemberRole(event.target.value)}>
              {Object.entries(councilRoleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Chức vụ
            <input className="form-control mt-2" value={memberTitle} onChange={(event) => setMemberTitle(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Thứ tự
            <input className="form-control mt-2" min="1" type="number" value={memberOrder} onChange={(event) => setMemberOrder(event.target.value)} />
          </label>
        </div>
        <button className="button-primary">Thêm thành viên</button>
      </form>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Danh sách hội đồng</h2>
        </div>
        {members.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Chưa có thành viên hội đồng"
              description="Hãy thêm Chủ tịch, Thư ký và các Ủy viên để Mẫu 1 có đủ thông tin ký xác nhận."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {members.map((member) => {
              const user = first(member.nguoi_dung);

              return (
                <article className="grid gap-3 px-5 py-4 md:grid-cols-[80px_1fr_auto] md:items-center" key={member.id}>
                  <span className="font-semibold tabular-nums text-[var(--color-ink-navy)]">{member.thu_tu}</span>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--color-ink-navy)]">{user?.ho_ten ?? user?.email ?? "Người dùng"}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">{member.chuc_vu || "Chưa nhập chức vụ"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{councilRoleLabels[member.vai_tro_hoi_dong] ?? member.vai_tro_hoi_dong}</Badge>
                    <button className="button-secondary" type="button" onClick={() => removeMember(member.id)}>
                      Bỏ khỏi hội đồng
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
