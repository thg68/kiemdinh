begin;

alter table public.co_so_giao_duc
  add column if not exists tinh_thanh varchar(100),
  add column if not exists phuong_xa varchar(150),
  add column if not exists loai_hinh_dao_tao varchar(100),
  add column if not exists loai_hinh_truong varchar(100),
  add column if not exists nguon_danh_muc varchar(50),
  add column if not exists cho_phep_tu_dang_ky boolean not null default false;

alter table public.co_so_giao_duc
  drop constraint if exists chk_co_so_tu_dang_ky_co_ma;
alter table public.co_so_giao_duc
  add constraint chk_co_so_tu_dang_ky_co_ma
  check (
    not cho_phep_tu_dang_ky
    or (
      nullif(pg_catalog.btrim(coalesce(ma_truong, '')), '') is not null
      and nullif(pg_catalog.btrim(coalesce(tinh_thanh, '')), '') is not null
    )
  );

create index if not exists idx_co_so_danh_muc_dang_ky
  on public.co_so_giao_duc(tinh_thanh, trang_thai, ten)
  where cho_phep_tu_dang_ky;

create or replace function public.fn_danh_sach_truong_dang_ky(
  p_tu_khoa text default null,
  p_limit integer default 500
)
returns table (
  id uuid,
  ma_truong text,
  ten text,
  loai_hinh public.loai_hinh_co_so,
  cap_hoc public.cap_hoc[],
  cong_lap boolean,
  dia_chi text,
  phuong_xa text,
  loai_hinh_dao_tao text,
  loai_hinh_truong text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tu_khoa text := nullif(pg_catalog.btrim(coalesce(p_tu_khoa, '')), '');
begin
  if p_limit < 1 or p_limit > 500 then
    raise exception using errcode = '22023', message = 'Gioi han danh sach truong phai tu 1 den 500.';
  end if;

  return query
  select
    school.id,
    school.ma_truong::text,
    school.ten::text,
    school.loai_hinh,
    school.cap_hoc,
    school.cong_lap,
    school.dia_chi,
    school.phuong_xa::text,
    school.loai_hinh_dao_tao::text,
    school.loai_hinh_truong::text
  from public.co_so_giao_duc school
  where school.cho_phep_tu_dang_ky
    and school.trang_thai = 'active'
    and school.tinh_thanh = 'Quảng Ninh'
    and (
      v_tu_khoa is null
      or school.ten ilike '%' || v_tu_khoa || '%'
      or school.ma_truong ilike '%' || v_tu_khoa || '%'
      or school.phuong_xa ilike '%' || v_tu_khoa || '%'
    )
  order by school.phuong_xa nulls last, school.ten, school.ma_truong
  limit p_limit;
end;
$$;

create or replace function public.fn_tu_dang_ky_vao_co_so(p_co_so_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_email text;
  v_ho_ten text;
  v_nguoi_dung public.nguoi_dung%rowtype;
  v_vai_tro_id uuid;
begin
  if v_auth_user_id is null then
    raise exception using errcode = '42501', message = 'Ban can dang nhap de tham gia truong.';
  end if;

  select
    lower(pg_catalog.btrim(auth_user.email)),
    nullif(pg_catalog.btrim(auth_user.raw_user_meta_data ->> 'ho_ten'), '')
  into v_email, v_ho_ten
  from auth.users auth_user
  where auth_user.id = v_auth_user_id
    and auth_user.email_confirmed_at is not null
  for update;

  if v_email is null then
    raise exception using errcode = '42501', message = 'Ban can xac nhan email truoc khi tham gia truong.';
  end if;

  if not exists (
    select 1
    from public.co_so_giao_duc school
    where school.id = p_co_so_id
      and school.cho_phep_tu_dang_ky
      and school.trang_thai = 'active'
      and school.tinh_thanh = 'Quảng Ninh'
  ) then
    raise exception using errcode = 'P0002', message = 'Khong tim thay truong trong danh muc dang ky.';
  end if;

  select * into v_nguoi_dung
  from public.nguoi_dung app_user
  where app_user.auth_user_id = v_auth_user_id
  for update;

  if v_nguoi_dung.id is not null then
    if v_nguoi_dung.co_so_id <> p_co_so_id then
      raise exception using errcode = '23505', message = 'Tai khoan da thuoc mot don vi khac.';
    end if;

    return v_nguoi_dung.co_so_id;
  end if;

  if v_ho_ten is null then
    raise exception using errcode = '22023', message = 'Ho va ten khong duoc de trong.';
  end if;

  insert into public.nguoi_dung(auth_user_id, co_so_id, ho_ten, email, trang_thai)
  values (v_auth_user_id, p_co_so_id, v_ho_ten, v_email, 'active')
  returning * into v_nguoi_dung;

  select role.id into v_vai_tro_id
  from public.vai_tro role
  where role.ma = 'TEACHER';

  if v_vai_tro_id is null then
    raise exception using errcode = 'P0001', message = 'He thong chua cau hinh vai tro Giao vien.';
  end if;

  insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id, created_by)
  values (v_nguoi_dung.id, v_vai_tro_id, p_co_so_id, v_nguoi_dung.id);

  return p_co_so_id;
end;
$$;

revoke all on function public.fn_danh_sach_truong_dang_ky(text, integer) from public;
grant execute on function public.fn_danh_sach_truong_dang_ky(text, integer) to anon, authenticated;

revoke all on function public.fn_tu_dang_ky_vao_co_so(uuid) from public, anon;
grant execute on function public.fn_tu_dang_ky_vao_co_so(uuid) to authenticated;

commit;
