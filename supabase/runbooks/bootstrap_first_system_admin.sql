-- Chạy một lần bằng psql với tài khoản chủ sở hữu CSDL, sau khi đã tạo tài khoản
-- Supabase Auth và xác nhận email. Không chạy qua Data API hoặc service_role.
-- Ví dụ:
-- psql "$DATABASE_URL" -v admin_email='admin@example.vn' \
--   -v school_code='MA_DON_VI_THAT' -v change_ticket='OPS-001' \
--   -v dry_run=false \
--   -f supabase/runbooks/bootstrap_first_system_admin.sql

\set ON_ERROR_STOP on

\if :{?admin_email}
\else
  \echo 'Thiếu biến admin_email.'
  \quit 3
\endif

\if :{?school_code}
\else
  \echo 'Thiếu biến school_code.'
  \quit 3
\endif

\if :{?change_ticket}
\else
  \echo 'Thiếu biến change_ticket.'
  \quit 3
\endif

\if :{?dry_run}
\else
  \set dry_run false
\endif

begin;

create function pg_temp.bootstrap_first_system_admin(
  p_email text,
  p_school_code text,
  p_change_ticket text
)
returns uuid
language plpgsql
set search_path = pg_catalog, public, auth
as $$
declare
  v_auth_user_id uuid;
  v_co_so_id uuid;
  v_nguoi_dung_id uuid;
  v_role_id uuid;
  v_full_name text;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('bootstrap-first-system-admin', 0)
  );

  if nullif(pg_catalog.btrim(p_change_ticket), '') is null then
    raise exception 'Mã phiếu thay đổi không được để trống.';
  end if;

  if exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where role.ma = 'SYSTEM_ADMIN'
  ) then
    raise exception 'Hệ thống đã có SYSTEM_ADMIN; không được chạy lại bootstrap.';
  end if;

  select auth_user.id,
         coalesce(nullif(pg_catalog.btrim(auth_user.raw_user_meta_data ->> 'ho_ten'), ''), 'Quản trị hệ thống')
  into v_auth_user_id, v_full_name
  from auth.users auth_user
  where pg_catalog.lower(auth_user.email) = pg_catalog.lower(pg_catalog.btrim(p_email))
    and auth_user.email_confirmed_at is not null;

  if v_auth_user_id is null then
    raise exception 'Không tìm thấy tài khoản Auth đã xác nhận email.';
  end if;

  select school.id into v_co_so_id
  from public.co_so_giao_duc school
  where school.ma_truong = pg_catalog.btrim(p_school_code)
    and school.trang_thai = 'active';

  if v_co_so_id is null then
    raise exception 'Không tìm thấy đơn vị đang hoạt động có mã đã cung cấp.';
  end if;

  select app_user.id into v_nguoi_dung_id
  from public.nguoi_dung app_user
  where app_user.auth_user_id = v_auth_user_id;

  if v_nguoi_dung_id is null then
    insert into public.nguoi_dung(
      auth_user_id, co_so_id, ho_ten, email, trang_thai
    ) values (
      v_auth_user_id,
      v_co_so_id,
      v_full_name,
      pg_catalog.lower(pg_catalog.btrim(p_email)),
      'active'
    )
    returning id into v_nguoi_dung_id;
  elsif not exists (
    select 1 from public.nguoi_dung app_user
    where app_user.id = v_nguoi_dung_id
      and app_user.co_so_id = v_co_so_id
      and app_user.trang_thai = 'active'
  ) then
    raise exception 'Hồ sơ ứng dụng đã thuộc đơn vị khác hoặc không hoạt động.';
  end if;

  select role.id into v_role_id
  from public.vai_tro role
  where role.ma = 'SYSTEM_ADMIN';

  if v_role_id is null then
    raise exception 'Migration vai trò SYSTEM_ADMIN chưa được áp dụng.';
  end if;

  insert into public.nguoi_dung_vai_tro(
    nguoi_dung_id, vai_tro_id, co_so_id
  ) values (
    v_nguoi_dung_id, v_role_id, v_co_so_id
  );

  insert into public.nhat_ky_truy_cap(
    co_so_id,
    nguoi_dung_id,
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    du_lieu_moi
  ) values (
    v_co_so_id,
    v_nguoi_dung_id,
    'SYSTEM_ADMIN_BOOTSTRAPPED',
    'nguoi_dung_vai_tro',
    v_nguoi_dung_id,
    pg_catalog.jsonb_build_object('change_ticket', pg_catalog.btrim(p_change_ticket))
  );

  return v_nguoi_dung_id;
end;
$$;

select pg_temp.bootstrap_first_system_admin(
  :'admin_email',
  :'school_code',
  :'change_ticket'
) as system_admin_user_id;

drop function pg_temp.bootstrap_first_system_admin(text, text, text);

\if :dry_run
  rollback;
  \echo 'DRY RUN: validation passed; all changes were rolled back.'
\else
  commit;

  select count(*) as system_admin_count
  from public.nguoi_dung_vai_tro user_role
  join public.vai_tro role on role.id = user_role.vai_tro_id
  where role.ma = 'SYSTEM_ADMIN';
\endif
