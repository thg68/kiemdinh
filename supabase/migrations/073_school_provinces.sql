begin;

-- Quyết định 19/2025/QĐ-TTg, hiệu lực 01/07/2025.
-- https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/19ttg.signed.pdf
create table if not exists public.danh_muc_tinh_thanh (
  ma char(2) primary key,
  ten text not null unique,
  constraint chk_danh_muc_tinh_thanh_ten check (pg_catalog.btrim(ten) <> '')
);
alter table public.danh_muc_tinh_thanh enable row level security;
revoke all on table public.danh_muc_tinh_thanh from public, anon, authenticated;
insert into public.danh_muc_tinh_thanh(ma, ten) values
  ('01', 'Hà Nội'),
  ('04', 'Cao Bằng'),
  ('08', 'Tuyên Quang'),
  ('11', 'Điện Biên'),
  ('12', 'Lai Châu'),
  ('14', 'Sơn La'),
  ('15', 'Lào Cai'),
  ('19', 'Thái Nguyên'),
  ('20', 'Lạng Sơn'),
  ('22', 'Quảng Ninh'),
  ('24', 'Bắc Ninh'),
  ('25', 'Phú Thọ'),
  ('31', 'Hải Phòng'),
  ('33', 'Hưng Yên'),
  ('37', 'Ninh Bình'),
  ('38', 'Thanh Hóa'),
  ('40', 'Nghệ An'),
  ('42', 'Hà Tĩnh'),
  ('44', 'Quảng Trị'),
  ('46', 'Huế'),
  ('48', 'Đà Nẵng'),
  ('51', 'Quảng Ngãi'),
  ('52', 'Gia Lai'),
  ('56', 'Khánh Hòa'),
  ('66', 'Đắk Lắk'),
  ('68', 'Lâm Đồng'),
  ('75', 'Đồng Nai'),
  ('79', 'Hồ Chí Minh'),
  ('80', 'Tây Ninh'),
  ('82', 'Đồng Tháp'),
  ('86', 'Vĩnh Long'),
  ('91', 'An Giang'),
  ('92', 'Cần Thơ'),
  ('96', 'Cà Mau')
on conflict (ma) do update set ten = excluded.ten;

-- Bản ghi cũ thiếu địa phương được giữ nguyên để quản trị rà soát.
-- Chỉ cơ sở có tỉnh/thành rõ ràng mới được hiển thị cho người tự đăng ký.
drop policy if exists co_so_registration_directory_select on public.co_so_giao_duc;
create policy co_so_registration_directory_select
on public.co_so_giao_duc
for select to anon, authenticated
using (cho_phep_tu_dang_ky and trang_thai = 'active' and tinh_thanh is not null);

drop function if exists public.fn_danh_sach_truong_dang_ky(text, integer);
create or replace function public.fn_danh_sach_truong_dang_ky(
  p_tu_khoa text default null,
  p_limit integer default 20,
  p_tinh_thanh text default null
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
  loai_hinh_truong text,
  tinh_thanh text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tu_khoa text := nullif(pg_catalog.btrim(coalesce(p_tu_khoa, '')), '');
  v_tinh_thanh text := nullif(pg_catalog.btrim(coalesce(p_tinh_thanh, '')), '');
begin
  if p_limit < 1 or p_limit > 50 then
    raise exception using errcode = '22023', message = 'Gioi han danh sach truong phai tu 1 den 50.';
  end if;

  if v_tu_khoa is not null and char_length(v_tu_khoa) > 100 then
    raise exception using errcode = '22023', message = 'Tu khoa khong duoc vuot qua 100 ky tu.';
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
    school.loai_hinh_truong::text,
    school.tinh_thanh::text
  from public.co_so_giao_duc school
  where school.cho_phep_tu_dang_ky
    and school.trang_thai = 'active'
    and school.tinh_thanh is not null
    and (v_tinh_thanh is null or school.tinh_thanh = v_tinh_thanh)
    and (
      v_tu_khoa is null
      or school.ten ilike '%' || v_tu_khoa || '%'
      or school.ma_truong ilike '%' || v_tu_khoa || '%'
      or school.phuong_xa ilike '%' || v_tu_khoa || '%'
    )
  order by school.tinh_thanh, school.phuong_xa nulls last, school.ten, school.ma_truong
  limit p_limit;
end;
$$;
alter function public.fn_danh_sach_truong_dang_ky(text, integer, text) security invoker;
revoke all on function public.fn_danh_sach_truong_dang_ky(text, integer, text) from public, anon, authenticated;
grant execute on function public.fn_danh_sach_truong_dang_ky(text, integer, text) to anon, authenticated;

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
      and school.tinh_thanh is not null
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
revoke all on function public.fn_tu_dang_ky_vao_co_so(uuid) from public, anon, authenticated;
grant execute on function public.fn_tu_dang_ky_vao_co_so(uuid) to authenticated;

drop function if exists public.fn_admin_danh_sach_co_so(text, text, text, integer, integer);
create or replace function public.fn_admin_danh_sach_co_so(
  p_tu_khoa text default null,
  p_trang_thai text default null,
  p_loai_hinh text default null,
  p_limit integer default 25,
  p_offset integer default 0,
  p_tinh_thanh text default null
)
returns table (
  id uuid,
  ma_truong text,
  ten text,
  loai_hinh text,
  cap_hoc text[],
  trang_thai text,
  tinh_thanh text,
  phuong_xa text,
  dia_chi text,
  cho_phep_tu_dang_ky boolean,
  nam_hoc_dang_hoat_dong text,
  so_nguoi_dung bigint,
  so_minh_chung bigint,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tu_khoa text := nullif(pg_catalog.btrim(coalesce(p_tu_khoa, '')), '');
  v_trang_thai text := nullif(pg_catalog.btrim(coalesce(p_trang_thai, '')), '');
  v_loai_hinh text := nullif(pg_catalog.btrim(coalesce(p_loai_hinh, '')), '');
  v_tinh_thanh text := nullif(pg_catalog.btrim(coalesce(p_tinh_thanh, '')), '');
begin
  perform public.fn_require_system_admin();

  if p_limit < 1 or p_limit > 100 or p_offset < 0 then
    raise exception using errcode = '22023', message = 'Phan trang khong hop le.';
  end if;

  if v_tu_khoa is not null and char_length(v_tu_khoa) > 100 then
    raise exception using errcode = '22023', message = 'Tu khoa khong duoc vuot qua 100 ky tu.';
  end if;

  if v_trang_thai is not null and v_trang_thai not in ('active', 'inactive') then
    raise exception using errcode = '22023', message = 'Trang thai co so khong hop le.';
  end if;

  if v_loai_hinh is not null and v_loai_hinh not in ('mam_non', 'pho_thong', 'gdtx') then
    raise exception using errcode = '22023', message = 'Loai hinh co so khong hop le.';
  end if;

  return query
  select
    school.id,
    school.ma_truong::text,
    school.ten::text,
    school.loai_hinh::text,
    school.cap_hoc::text[],
    school.trang_thai::text,
    school.tinh_thanh::text,
    school.phuong_xa::text,
    school.dia_chi,
    school.cho_phep_tu_dang_ky,
    active_year.ten::text,
    (select count(*) from public.nguoi_dung app_user where app_user.co_so_id = school.id)::bigint,
    (
      select count(*)
      from public.minh_chung evidence
      where evidence.co_so_id = school.id
        and evidence.deleted_at is null
    )::bigint,
    count(*) over ()::bigint
  from public.co_so_giao_duc school
  left join lateral (
    select school_year.ten
    from public.nam_hoc school_year
    where school_year.co_so_id = school.id
      and school_year.trang_thai = 'dang_hoat_dong'
    order by school_year.ngay_bat_dau desc, school_year.id
    limit 1
  ) active_year on true
  where (v_trang_thai is null or school.trang_thai::text = v_trang_thai)
    and (v_loai_hinh is null or school.loai_hinh::text = v_loai_hinh)
    and (v_tinh_thanh is null or school.tinh_thanh = v_tinh_thanh)
    and (
      v_tu_khoa is null
      or school.ten ilike '%' || v_tu_khoa || '%'
      or school.ma_truong ilike '%' || v_tu_khoa || '%'
      or school.phuong_xa ilike '%' || v_tu_khoa || '%'
    )
  order by
    case when school.trang_thai = 'active' then 0 else 1 end,
    school.ten,
    school.id
  limit p_limit
  offset p_offset;
end;
$$;
revoke all on function public.fn_admin_danh_sach_co_so(text, text, text, integer, integer, text) from public, anon, authenticated;
grant execute on function public.fn_admin_danh_sach_co_so(text, text, text, integer, integer, text) to authenticated;

drop function if exists public.fn_admin_tao_co_so_va_nam_hoc(text, text, public.loai_hinh_co_so, public.cap_hoc[], character varying, date, date);
create or replace function public.fn_admin_tao_co_so_va_nam_hoc(
  p_ten_co_so text,
  p_ma_truong text,
  p_loai_hinh public.loai_hinh_co_so,
  p_cap_hoc public.cap_hoc[],
  p_nam_hoc_ten varchar,
  p_ngay_bat_dau date,
  p_ngay_ket_thuc date,
  p_tinh_thanh text
)
returns table (co_so_id uuid, nam_hoc_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_bo_tieu_chuan_id uuid;
  v_co_so_id uuid;
  v_ma_truong text := nullif(pg_catalog.btrim(coalesce(p_ma_truong, '')), '');
  v_nam_hoc_id uuid;
  v_tinh_thanh text := nullif(pg_catalog.btrim(coalesce(p_tinh_thanh, '')), '');
begin
  if nullif(pg_catalog.btrim(coalesce(p_ten_co_so, '')), '') is null then
    raise exception using errcode = '22023', message = 'Tên cơ sở giáo dục không được để trống.';
  end if;

  if v_ma_truong is null then
    raise exception using errcode = '22023', message = 'Mã trường không được để trống.';
  end if;

  if not exists (select 1 from public.danh_muc_tinh_thanh province where province.ten = v_tinh_thanh) then
    raise exception using errcode = '22023', message = 'Tỉnh/thành phố không hợp lệ.';
  end if;

  if not public.fn_cap_hoc_hop_loai_hinh(p_loai_hinh, p_cap_hoc) then
    raise exception using errcode = '22023', message = 'Cấp học chưa phù hợp với loại hình đơn vị.';
  end if;

  if p_nam_hoc_ten !~ '^[0-9]{4}-[0-9]{4}$'
    or substring(p_nam_hoc_ten from 6 for 4)::integer
      <> substring(p_nam_hoc_ten from 1 for 4)::integer + 1 then
    raise exception using errcode = '22023', message = 'Năm học phải có dạng YYYY-YYYY và gồm hai năm liên tiếp.';
  end if;

  if p_ngay_ket_thuc <= p_ngay_bat_dau then
    raise exception using errcode = '22023', message = 'Ngày kết thúc năm học phải sau ngày bắt đầu.';
  end if;

  if exists (
    select 1
    from public.co_so_giao_duc school
    where pg_catalog.lower(school.ma_truong) = pg_catalog.lower(v_ma_truong)
  ) then
    raise exception using errcode = '23505', message = 'Mã trường đã tồn tại trong hệ thống.';
  end if;

  select standard_set.id
  into v_bo_tieu_chuan_id
  from public.bo_tieu_chuan standard_set
  where standard_set.loai_hinh = p_loai_hinh
    and standard_set.trang_thai = 'dang_ap_dung'
    and (standard_set.ngay_hieu_luc is null or standard_set.ngay_hieu_luc <= p_ngay_ket_thuc)
  order by
    standard_set.ngay_hieu_luc desc nulls last,
    standard_set.version desc,
    standard_set.created_at desc
  limit 1;

  if v_bo_tieu_chuan_id is null then
    raise exception using errcode = 'P0001', message = 'Không tìm thấy bộ tiêu chuẩn phù hợp cho năm học ban đầu.';
  end if;

  insert into public.co_so_giao_duc(
    ten,
    ma_truong,
    loai_hinh,
    cap_hoc,
    tinh_thanh,
    nguon_danh_muc,
    cho_phep_tu_dang_ky
  ) values (
    pg_catalog.btrim(p_ten_co_so),
    v_ma_truong,
    p_loai_hinh,
    p_cap_hoc,
    v_tinh_thanh,
    'quan_tri_he_thong',
    true
  )
  returning id into v_co_so_id;

  insert into public.nam_hoc(
    co_so_id,
    ten,
    ngay_bat_dau,
    ngay_ket_thuc,
    trang_thai,
    bo_tieu_chuan_id
  ) values (
    v_co_so_id,
    p_nam_hoc_ten,
    p_ngay_bat_dau,
    p_ngay_ket_thuc,
    'dang_hoat_dong',
    v_bo_tieu_chuan_id
  )
  returning id into v_nam_hoc_id;

  insert into public.nhat_ky_truy_cap(
    co_so_id,
    nguoi_dung_id,
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    du_lieu_moi
  ) values (
    v_co_so_id,
    v_actor_id,
    'ADMIN_SCHOOL_CREATED',
    'co_so_giao_duc',
    v_co_so_id,
    jsonb_build_object('nam_hoc_id', v_nam_hoc_id, 'ma_truong', v_ma_truong, 'tinh_thanh', v_tinh_thanh)
  );

  return query select v_co_so_id, v_nam_hoc_id;
end;
$$;
revoke all on function public.fn_admin_tao_co_so_va_nam_hoc(text, text, public.loai_hinh_co_so, public.cap_hoc[], character varying, date, date, text) from public, anon, authenticated;
grant execute on function public.fn_admin_tao_co_so_va_nam_hoc(text, text, public.loai_hinh_co_so, public.cap_hoc[], character varying, date, date, text) to authenticated;

create or replace function public.fn_admin_cap_nhat_dia_phuong_co_so(
  p_co_so_id uuid,
  p_tinh_thanh text,
  p_phuong_xa text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_school public.co_so_giao_duc%rowtype;
  v_tinh_thanh text := nullif(pg_catalog.btrim(coalesce(p_tinh_thanh, '')), '');
  v_phuong_xa text := nullif(pg_catalog.btrim(coalesce(p_phuong_xa, '')), '');
begin
  if p_co_so_id is null then
    raise exception using errcode = '22023', message = 'Cơ sở giáo dục không hợp lệ.';
  end if;

  if not exists (select 1 from public.danh_muc_tinh_thanh province where province.ten = v_tinh_thanh) then
    raise exception using errcode = '22023', message = 'Tỉnh/thành phố không hợp lệ.';
  end if;

  if v_phuong_xa is not null and char_length(v_phuong_xa) > 150 then
    raise exception using errcode = '22023', message = 'Phường/xã không được vượt quá 150 ký tự.';
  end if;

  select * into v_school
  from public.co_so_giao_duc school
  where school.id = p_co_so_id
  for update;

  if v_school.id is null then
    raise exception using errcode = 'P0002', message = 'Không tìm thấy cơ sở giáo dục.';
  end if;

  if v_school.tinh_thanh is not distinct from v_tinh_thanh
    and v_school.phuong_xa is not distinct from v_phuong_xa then
    return;
  end if;

  update public.co_so_giao_duc
  set tinh_thanh = v_tinh_thanh,
      phuong_xa = v_phuong_xa,
      updated_at = now()
  where id = p_co_so_id;

  insert into public.nhat_ky_truy_cap(
    co_so_id, nguoi_dung_id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu_cu, du_lieu_moi
  ) values (
    p_co_so_id,
    v_actor_id,
    'ADMIN_SCHOOL_LOCALITY_UPDATED',
    'co_so_giao_duc',
    p_co_so_id,
    jsonb_build_object('tinh_thanh', v_school.tinh_thanh, 'phuong_xa', v_school.phuong_xa),
    jsonb_build_object('tinh_thanh', v_tinh_thanh, 'phuong_xa', v_phuong_xa)
  );
end;
$$;

revoke all on function public.fn_admin_cap_nhat_dia_phuong_co_so(uuid, text, text) from public, anon, authenticated;
grant execute on function public.fn_admin_cap_nhat_dia_phuong_co_so(uuid, text, text) to authenticated;

create or replace function public.fn_admin_cap_nhat_tu_dang_ky_co_so(
  p_co_so_id uuid,
  p_cho_phep_tu_dang_ky boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_school public.co_so_giao_duc%rowtype;
begin
  if p_co_so_id is null or p_cho_phep_tu_dang_ky is null then
    raise exception using errcode = '22023', message = 'Thông tin tự đăng ký không hợp lệ.';
  end if;

  select * into v_school
  from public.co_so_giao_duc school
  where school.id = p_co_so_id
  for update;

  if v_school.id is null then
    raise exception using errcode = 'P0002', message = 'Không tìm thấy cơ sở giáo dục.';
  end if;

  if p_cho_phep_tu_dang_ky and (
    nullif(pg_catalog.btrim(coalesce(v_school.ma_truong, '')), '') is null
    or v_school.tinh_thanh is null
  ) then
    raise exception using errcode = '22023', message = 'Cần có mã trường và tỉnh/thành phố trước khi bật tự đăng ký.';
  end if;

  if v_school.cho_phep_tu_dang_ky = p_cho_phep_tu_dang_ky then
    return;
  end if;

  update public.co_so_giao_duc
  set cho_phep_tu_dang_ky = p_cho_phep_tu_dang_ky,
      updated_at = now()
  where id = p_co_so_id;

  insert into public.nhat_ky_truy_cap(
    co_so_id, nguoi_dung_id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu_cu, du_lieu_moi
  ) values (
    p_co_so_id,
    v_actor_id,
    'ADMIN_SCHOOL_REGISTRATION_UPDATED',
    'co_so_giao_duc',
    p_co_so_id,
    jsonb_build_object('cho_phep_tu_dang_ky', v_school.cho_phep_tu_dang_ky),
    jsonb_build_object('cho_phep_tu_dang_ky', p_cho_phep_tu_dang_ky)
  );
end;
$$;

revoke all on function public.fn_admin_cap_nhat_tu_dang_ky_co_so(uuid, boolean) from public, anon, authenticated;
grant execute on function public.fn_admin_cap_nhat_tu_dang_ky_co_so(uuid, boolean) to authenticated;

commit;

