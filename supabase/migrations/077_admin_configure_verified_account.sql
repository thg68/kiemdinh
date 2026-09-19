begin;

create or replace function public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(
  p_auth_user_id uuid,
  p_co_so_id uuid,
  p_trang_thai text,
  p_la_hieu_truong boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_email text;
  v_ho_ten text;
  v_nguoi_dung_id uuid;
  v_teacher_role_id uuid;
begin
  if p_auth_user_id is null or p_co_so_id is null or p_trang_thai is null
    or p_la_hieu_truong is null then
    raise exception using errcode = '22023', message = 'Thông tin cài đặt người dùng chưa đầy đủ.';
  end if;

  select
    lower(nullif(pg_catalog.btrim(auth_user.email::text), '')),
    nullif(pg_catalog.btrim(auth_user.raw_user_meta_data ->> 'ho_ten'), '')
  into v_email, v_ho_ten
  from auth.users auth_user
  where auth_user.id = p_auth_user_id
    and auth_user.email_confirmed_at is not null
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'Tài khoản phải xác thực email trước khi được cài đặt.';
  end if;

  if v_email is null or char_length(v_email) > 255 then
    raise exception using errcode = '22023', message = 'Email của tài khoản không hợp lệ.';
  end if;

  select app_user.id
  into v_nguoi_dung_id
  from public.nguoi_dung app_user
  where app_user.auth_user_id = p_auth_user_id
  for update;

  if v_nguoi_dung_id is not null then
    perform public.fn_admin_cap_nhat_nguoi_tham_gia(
      v_nguoi_dung_id,
      p_co_so_id,
      p_trang_thai,
      p_la_hieu_truong
    );
    return;
  end if;

  if not exists (
    select 1
    from public.co_so_giao_duc school
    where school.id = p_co_so_id
      and school.trang_thai = 'active'
  ) then
    raise exception using errcode = 'P0002', message = 'Không tìm thấy cơ sở giáo dục đang hoạt động.';
  end if;

  v_ho_ten := coalesce(
    v_ho_ten,
    nullif(pg_catalog.split_part(v_email, '@', 1), ''),
    'Tài khoản'
  );

  select role.id
  into v_teacher_role_id
  from public.vai_tro role
  where role.ma = 'TEACHER';

  if v_teacher_role_id is null then
    raise exception using errcode = 'P0001', message = 'Hệ thống chưa cấu hình vai trò Giáo viên.';
  end if;

  insert into public.nguoi_dung(
    auth_user_id,
    co_so_id,
    ho_ten,
    email,
    trang_thai
  ) values (
    p_auth_user_id,
    p_co_so_id,
    pg_catalog.left(v_ho_ten, 255),
    v_email,
    'active'
  )
  returning id into v_nguoi_dung_id;

  insert into public.nguoi_dung_vai_tro(
    nguoi_dung_id,
    vai_tro_id,
    co_so_id,
    valid_from,
    valid_until,
    created_by
  ) values (
    v_nguoi_dung_id,
    v_teacher_role_id,
    p_co_so_id,
    null,
    null,
    v_actor_id
  );

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
    'ADMIN_VERIFIED_ACCOUNT_PROFILE_CREATED',
    'nguoi_dung',
    v_nguoi_dung_id,
    null,
    jsonb_build_object(
      'auth_user_id', p_auth_user_id,
      'co_so_id', p_co_so_id,
      'email', v_email,
      'vai_tro_mac_dinh', 'TEACHER'
    )
  );

  perform public.fn_admin_cap_nhat_nguoi_tham_gia(
    v_nguoi_dung_id,
    p_co_so_id,
    p_trang_thai,
    p_la_hieu_truong
  );
end;
$$;

revoke all on function public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(uuid, uuid, text, boolean)
from public, anon, authenticated;
grant execute on function public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(uuid, uuid, text, boolean)
to authenticated;

comment on function public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(uuid, uuid, text, boolean) is
  'Quản trị hệ thống tạo hồ sơ cho tài khoản đã xác thực email, cấp vai trò Giáo viên và áp dụng cài đặt tài khoản trong một giao dịch.';

commit;
