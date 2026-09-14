begin;

-- Tạo cơ sở và năm học ban đầu độc lập với việc chỉ định Hiệu trưởng.
create or replace function public.fn_admin_tao_co_so_va_nam_hoc(
  p_ten_co_so text,
  p_ma_truong text,
  p_loai_hinh public.loai_hinh_co_so,
  p_cap_hoc public.cap_hoc[],
  p_nam_hoc_ten varchar,
  p_ngay_bat_dau date,
  p_ngay_ket_thuc date
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
begin
  if nullif(pg_catalog.btrim(coalesce(p_ten_co_so, '')), '') is null then
    raise exception using errcode = '22023', message = 'Tên cơ sở giáo dục không được để trống.';
  end if;

  if v_ma_truong is null then
    raise exception using errcode = '22023', message = 'Mã trường không được để trống.';
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
    'Quảng Ninh',
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
    jsonb_build_object('nam_hoc_id', v_nam_hoc_id, 'ma_truong', v_ma_truong)
  );

  return query select v_co_so_id, v_nam_hoc_id;
end;
$$;

-- Một trường có một Hiệu trưởng đang được chỉ định. Khi gán người mới, quyền
-- PRINCIPAL cũ được thu hồi trong cùng giao dịch; các vai trò khác được giữ nguyên.
create or replace function public.fn_admin_gan_hieu_truong(
  p_nguoi_dung_id uuid,
  p_co_so_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_principal_role_id uuid;
  v_school_name text;
  v_target public.nguoi_dung%rowtype;
  v_previous_principal_ids uuid[];
begin
  if p_nguoi_dung_id is null or p_co_so_id is null then
    raise exception using errcode = '22023', message = 'Người dùng và cơ sở giáo dục không được để trống.';
  end if;

  select school.ten
  into v_school_name
  from public.co_so_giao_duc school
  where school.id = p_co_so_id
  for update;

  if v_school_name is null then
    raise exception using errcode = 'P0002', message = 'Không tìm thấy cơ sở giáo dục.';
  end if;

  select app_user.*
  into v_target
  from public.nguoi_dung app_user
  where app_user.id = p_nguoi_dung_id
  for update;

  if v_target.id is null then
    raise exception using errcode = 'P0002', message = 'Không tìm thấy người dùng.';
  end if;

  if v_target.co_so_id <> p_co_so_id then
    raise exception using errcode = '23514', message = 'Người dùng không thuộc cơ sở giáo dục đã chọn.';
  end if;

  if v_target.trang_thai <> 'active' then
    raise exception using errcode = '23514', message = 'Chỉ có thể cấp quyền Hiệu trưởng cho tài khoản đang hoạt động.';
  end if;

  select role.id
  into v_principal_role_id
  from public.vai_tro role
  where role.ma = 'PRINCIPAL';

  if v_principal_role_id is null then
    raise exception using errcode = 'P0001', message = 'Hệ thống chưa cấu hình vai trò Hiệu trưởng.';
  end if;

  select coalesce(array_agg(user_role.nguoi_dung_id order by user_role.nguoi_dung_id), '{}'::uuid[])
  into v_previous_principal_ids
  from public.nguoi_dung_vai_tro user_role
  where user_role.co_so_id = p_co_so_id
    and user_role.vai_tro_id = v_principal_role_id
    and user_role.nguoi_dung_id <> p_nguoi_dung_id;

  delete from public.nguoi_dung_vai_tro user_role
  where user_role.co_so_id = p_co_so_id
    and user_role.vai_tro_id = v_principal_role_id
    and user_role.nguoi_dung_id <> p_nguoi_dung_id;

  insert into public.nguoi_dung_vai_tro(
    nguoi_dung_id,
    vai_tro_id,
    co_so_id,
    valid_from,
    valid_until,
    created_by
  ) values (
    p_nguoi_dung_id,
    v_principal_role_id,
    p_co_so_id,
    null,
    null,
    v_actor_id
  )
  on conflict (nguoi_dung_id, vai_tro_id, co_so_id) do update
  set valid_from = null,
      valid_until = null,
      created_by = excluded.created_by;

  insert into public.nhat_ky_truy_cap(
    co_so_id,
    nguoi_dung_id,
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    du_lieu_cu,
    du_lieu_moi
  ) values (
    p_co_so_id,
    v_actor_id,
    'ADMIN_PRINCIPAL_ASSIGNED',
    'nguoi_dung',
    p_nguoi_dung_id,
    jsonb_build_object('nguoi_dung_ids', v_previous_principal_ids),
    jsonb_build_object('nguoi_dung_id', p_nguoi_dung_id, 'co_so_id', p_co_so_id)
  );
end;
$$;

revoke all on function public.fn_admin_tao_co_so_va_nam_hoc(
  text, text, public.loai_hinh_co_so, public.cap_hoc[], character varying, date, date
) from public, anon, authenticated;
grant execute on function public.fn_admin_tao_co_so_va_nam_hoc(
  text, text, public.loai_hinh_co_so, public.cap_hoc[], character varying, date, date
) to authenticated;

revoke all on function public.fn_admin_gan_hieu_truong(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.fn_admin_gan_hieu_truong(uuid, uuid)
to authenticated;

comment on function public.fn_admin_tao_co_so_va_nam_hoc(
  text, text, public.loai_hinh_co_so, public.cap_hoc[], character varying, date, date
) is 'Quản trị hệ thống tạo trường và năm học ban đầu, không tạo lời mời hoặc gán Hiệu trưởng.';

comment on function public.fn_admin_gan_hieu_truong(uuid, uuid) is
  'Quản trị hệ thống gán một người dùng đang hoạt động làm Hiệu trưởng của chính trường người đó.';

commit;
