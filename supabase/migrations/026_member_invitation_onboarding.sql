begin;

create table public.loi_moi_thanh_vien (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references public.co_so_giao_duc(id) on delete cascade,
  email varchar(255) not null,
  ho_ten varchar(255),
  vai_tro_id uuid not null references public.vai_tro(id) on delete restrict,
  trang_thai varchar(30) not null default 'cho_phan_hoi'
    check (trang_thai in ('cho_phan_hoi', 'da_chap_nhan', 'da_tu_choi', 'da_het_han', 'da_huy')),
  nguoi_moi_id uuid not null references public.nguoi_dung(id) on delete restrict,
  auth_user_nhan_id uuid references auth.users(id) on delete set null,
  het_han_luc timestamptz not null default (now() + interval '14 days'),
  phan_hoi_luc timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(trim(email)))
);

create unique index uq_loi_moi_thanh_vien_dang_cho
on public.loi_moi_thanh_vien(co_so_id, lower(email), vai_tro_id)
where trang_thai = 'cho_phan_hoi';

create index idx_loi_moi_thanh_vien_email
on public.loi_moi_thanh_vien(lower(email), trang_thai, het_han_luc);

create trigger trg_loi_moi_thanh_vien_updated_at
before update on public.loi_moi_thanh_vien
for each row execute function public.fn_set_updated_at();

alter table public.loi_moi_thanh_vien enable row level security;

create policy "loi_moi_select_manager_or_recipient"
on public.loi_moi_thanh_vien
for select to authenticated
using (
  public.fn_can_manage_users(co_so_id)
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Client chi xem loi moi qua RLS; moi thay doi deu di qua RPC atomic.
grant select on table public.loi_moi_thanh_vien to authenticated;

create or replace function public.fn_la_quan_tri_he_thong()
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$ select public.fn_has_role('SYSTEM_ADMIN') $$;

create or replace function public.fn_danh_sach_loi_moi_cua_toi()
returns table (id uuid, co_so_id uuid, ten_co_so text, ten_vai_tro text, het_han_luc timestamptz)
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select lm.id, lm.co_so_id, cs.ten::text, vt.ten::text, lm.het_han_luc
  from public.loi_moi_thanh_vien lm
  join public.co_so_giao_duc cs on cs.id = lm.co_so_id
  join public.vai_tro vt on vt.id = lm.vai_tro_id
  join auth.users au on au.id = auth.uid()
  where lower(lm.email) = lower(au.email)
    and lm.trang_thai = 'cho_phan_hoi'
    and lm.het_han_luc > now()
  order by lm.created_at desc
$$;

create or replace function public.fn_moi_nguoi_dung_vao_co_so(p_email text, p_ho_ten text, p_vai_tro_ma text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_email text := lower(trim(p_email));
  v_vai_tro_id uuid;
  v_loi_moi_id uuid;
begin
  if v_co_so_id is null then raise exception 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.'; end if;
  if not public.fn_can_manage_users(v_co_so_id) then raise exception 'Bạn không có quyền mời thành viên vào đơn vị.'; end if;
  if position('@' in v_email) < 2 then raise exception 'Email người nhận chưa hợp lệ.'; end if;
  if not public.fn_allowed_assignable_role(p_vai_tro_ma) then raise exception 'Vai trò này không được gán từ màn hình đơn vị.'; end if;

  select vt.id into v_vai_tro_id from public.vai_tro vt where vt.ma = p_vai_tro_ma;
  if exists (select 1 from public.nguoi_dung nd where lower(nd.email) = v_email) then
    raise exception 'Tài khoản này đã thuộc một đơn vị. Hãy cập nhật vai trò trong danh sách thành viên.';
  end if;

  select lm.id into v_loi_moi_id
  from public.loi_moi_thanh_vien lm
  where lm.co_so_id = v_co_so_id and lower(lm.email) = v_email
    and lm.vai_tro_id = v_vai_tro_id and lm.trang_thai = 'cho_phan_hoi'
  for update;

  if v_loi_moi_id is null then
    insert into public.loi_moi_thanh_vien(co_so_id, email, ho_ten, vai_tro_id, nguoi_moi_id)
    values (v_co_so_id, v_email, nullif(trim(p_ho_ten), ''), v_vai_tro_id, public.fn_current_nguoi_dung_id())
    returning public.loi_moi_thanh_vien.id into v_loi_moi_id;
  else
    update public.loi_moi_thanh_vien
    set ho_ten = coalesce(nullif(trim(p_ho_ten), ''), ho_ten),
        het_han_luc = now() + interval '14 days',
        nguoi_moi_id = public.fn_current_nguoi_dung_id()
    where id = v_loi_moi_id;
  end if;

  perform public.fn_log_audit(
    'MEMBER_INVITED', 'loi_moi_thanh_vien', v_loi_moi_id, null,
    jsonb_build_object('email', v_email, 'vai_tro', p_vai_tro_ma)
  );
  return v_loi_moi_id;
end;
$$;

create or replace function public.fn_chap_nhan_loi_moi(p_loi_moi_id uuid)
returns uuid language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_email text;
  v_ho_ten_metadata text;
  v_nguoi_dung_id uuid;
  v_loi_moi public.loi_moi_thanh_vien%rowtype;
begin
  select lower(au.email), au.raw_user_meta_data ->> 'ho_ten'
  into v_email, v_ho_ten_metadata
  from auth.users au
  where au.id = v_auth_user_id and au.email_confirmed_at is not null;
  if v_email is null then raise exception 'Bạn cần đăng nhập bằng tài khoản đã xác nhận email.'; end if;

  select * into v_loi_moi from public.loi_moi_thanh_vien lm where lm.id = p_loi_moi_id for update;
  if v_loi_moi.id is null or v_loi_moi.trang_thai <> 'cho_phan_hoi' or v_loi_moi.het_han_luc <= now() then
    raise exception 'Lời mời không còn hiệu lực.';
  end if;
  if lower(v_loi_moi.email) <> v_email then raise exception 'Lời mời không dành cho tài khoản đang đăng nhập.'; end if;
  if exists (select 1 from public.nguoi_dung nd where nd.auth_user_id = v_auth_user_id) then
    raise exception 'Tài khoản này đã thuộc một cơ sở giáo dục.';
  end if;

  insert into public.nguoi_dung(auth_user_id, co_so_id, ho_ten, email, trang_thai)
  values (
    v_auth_user_id, v_loi_moi.co_so_id,
    coalesce(nullif(trim(v_loi_moi.ho_ten), ''), nullif(trim(v_ho_ten_metadata), ''), v_email),
    v_email, 'active'
  )
  returning public.nguoi_dung.id into v_nguoi_dung_id;

  insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id, created_by)
  values (v_nguoi_dung_id, v_loi_moi.vai_tro_id, v_loi_moi.co_so_id, v_loi_moi.nguoi_moi_id);

  update public.loi_moi_thanh_vien
  set trang_thai = 'da_chap_nhan', auth_user_nhan_id = v_auth_user_id, phan_hoi_luc = now()
  where id = p_loi_moi_id;

  perform public.fn_log_audit(
    'MEMBER_INVITATION_ACCEPTED', 'loi_moi_thanh_vien', p_loi_moi_id, null,
    jsonb_build_object('nguoi_dung_id', v_nguoi_dung_id)
  );
  return v_loi_moi.co_so_id;
end;
$$;

create or replace function public.fn_tu_choi_loi_moi(p_loi_moi_id uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_email text;
begin
  select lower(au.email) into v_email from auth.users au where au.id = auth.uid();
  update public.loi_moi_thanh_vien lm
  set trang_thai = 'da_tu_choi', auth_user_nhan_id = auth.uid(), phan_hoi_luc = now()
  where lm.id = p_loi_moi_id and lower(lm.email) = v_email
    and lm.trang_thai = 'cho_phan_hoi' and lm.het_han_luc > now();
  if not found then raise exception 'Lời mời không còn hiệu lực hoặc không dành cho tài khoản này.'; end if;
end;
$$;


create or replace function public.fn_quan_tri_tao_co_so_va_nam_hoc(
  p_ten_co_so text,
  p_ma_truong text,
  p_loai_hinh public.loai_hinh_co_so,
  p_cap_hoc public.cap_hoc[],
  p_nam_hoc_ten varchar,
  p_ngay_bat_dau date,
  p_ngay_ket_thuc date,
  p_email_hieu_truong text,
  p_ho_ten_hieu_truong text
)
returns table (co_so_id uuid, nam_hoc_id uuid, loi_moi_id uuid)
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_email text := lower(trim(p_email_hieu_truong));
  v_bo_tieu_chuan_id uuid;
  v_vai_tro_id uuid;
begin
  if not public.fn_has_role('SYSTEM_ADMIN') then
    raise exception 'Chỉ Quản trị hệ thống được tạo đơn vị mới.';
  end if;
  if p_ngay_ket_thuc <= p_ngay_bat_dau then
    raise exception 'Ngày kết thúc năm học phải sau ngày bắt đầu.';
  end if;
  if position('@' in v_email) < 2 then raise exception 'Email Hiệu trưởng chưa hợp lệ.'; end if;
  if exists (select 1 from public.nguoi_dung nd where lower(nd.email) = v_email) then
    raise exception 'Tài khoản Hiệu trưởng đã thuộc một đơn vị khác.';
  end if;

  select btc.id into v_bo_tieu_chuan_id
  from public.bo_tieu_chuan btc
  where btc.loai_hinh = p_loai_hinh
    and btc.trang_thai = 'dang_ap_dung'
    and (btc.ngay_hieu_luc is null or btc.ngay_hieu_luc <= p_ngay_ket_thuc)
  order by btc.ngay_hieu_luc desc nulls last, btc.version desc, btc.created_at desc
  limit 1;
  if v_bo_tieu_chuan_id is null then
    raise exception 'Không tìm thấy bộ tiêu chuẩn phù hợp cho năm học ban đầu.';
  end if;

  insert into public.co_so_giao_duc(ten, ma_truong, loai_hinh, cap_hoc)
  values (
    trim(p_ten_co_so), nullif(trim(p_ma_truong), ''), p_loai_hinh,
    coalesce(p_cap_hoc, '{}'::public.cap_hoc[])
  )
  returning id into co_so_id;

  insert into public.nam_hoc(
    co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
  )
  values (
    co_so_id, p_nam_hoc_ten, p_ngay_bat_dau, p_ngay_ket_thuc,
    'dang_hoat_dong', v_bo_tieu_chuan_id
  )
  returning id into nam_hoc_id;

  select vt.id into v_vai_tro_id from public.vai_tro vt where vt.ma = 'PRINCIPAL';

  insert into public.loi_moi_thanh_vien(co_so_id, email, ho_ten, vai_tro_id, nguoi_moi_id)
  values (
    co_so_id, v_email, nullif(trim(p_ho_ten_hieu_truong), ''),
    v_vai_tro_id, public.fn_current_nguoi_dung_id()
  )
  returning id into loi_moi_id;

  insert into public.nhat_ky_truy_cap(
    co_so_id, nguoi_dung_id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu_moi
  )
  values (
    co_so_id, public.fn_current_nguoi_dung_id(), 'SCHOOL_CREATED_BY_SYSTEM_ADMIN',
    'co_so_giao_duc', co_so_id,
    jsonb_build_object('email_hieu_truong', v_email, 'nam_hoc_id', nam_hoc_id)
  );
  return next;
end;
$$;

-- Tai khoan moi khong con duoc tu gan minh lam Hieu truong.
revoke execute on function public.fn_khoi_tao_co_so_va_nam_hoc(
  text, text, public.loai_hinh_co_so, public.cap_hoc[], varchar, date, date, text
) from authenticated;

revoke all on function public.fn_la_quan_tri_he_thong() from public, anon;
revoke all on function public.fn_danh_sach_loi_moi_cua_toi() from public, anon;
revoke all on function public.fn_moi_nguoi_dung_vao_co_so(text, text, text) from public, anon;
revoke all on function public.fn_chap_nhan_loi_moi(uuid) from public, anon;
revoke all on function public.fn_tu_choi_loi_moi(uuid) from public, anon;
revoke all on function public.fn_quan_tri_tao_co_so_va_nam_hoc(
  text, text, public.loai_hinh_co_so, public.cap_hoc[], varchar, date, date, text, text
) from public, anon;

grant execute on function public.fn_la_quan_tri_he_thong() to authenticated;
grant execute on function public.fn_danh_sach_loi_moi_cua_toi() to authenticated;
grant execute on function public.fn_moi_nguoi_dung_vao_co_so(text, text, text) to authenticated;
grant execute on function public.fn_chap_nhan_loi_moi(uuid) to authenticated;
grant execute on function public.fn_tu_choi_loi_moi(uuid) to authenticated;
grant execute on function public.fn_quan_tri_tao_co_so_va_nam_hoc(
  text, text, public.loai_hinh_co_so, public.cap_hoc[], varchar, date, date, text, text
) to authenticated;

commit;
