begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select ok(
  has_function_privilege(
    'authenticated',
    'public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(uuid,uuid,text,boolean)',
    'execute'
  ) and not has_function_privilege(
    'anon',
    'public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(uuid,uuid,text,boolean)',
    'execute'
  ),
  'Chi phien dang nhap co the goi cong cau hinh tai khoan da xac thuc'
);

insert into public.co_so_giao_duc(
  id, ten, ma_truong, loai_hinh, cap_hoc, trang_thai, tinh_thanh
) values (
  '77000000-0000-0000-0000-000000000101',
  'Truong tai khoan 077',
  'ACCOUNT-077',
  'mam_non',
  array['mam_non']::public.cap_hoc[],
  'active',
  'Hà Nội'
);

insert into auth.users(
  id, email, aud, role, email_confirmed_at, raw_user_meta_data, created_at, updated_at
) values
  (
    '77000000-0000-0000-0000-000000000201', 'admin-077@test.local',
    'authenticated', 'authenticated', now(), '{}'::jsonb, now(), now()
  ),
  (
    '77000000-0000-0000-0000-000000000202', 'verified-077@test.local',
    'authenticated', 'authenticated', now(), jsonb_build_object('ho_ten', 'Nguoi da xac thuc 077'), now(), now()
  ),
  (
    '77000000-0000-0000-0000-000000000203', 'unverified-077@test.local',
    'authenticated', 'authenticated', null, jsonb_build_object('ho_ten', 'Nguoi chua xac thuc 077'), now(), now()
  ),
  (
    '77000000-0000-0000-0000-000000000204', 'ordinary-077@test.local',
    'authenticated', 'authenticated', now(), '{}'::jsonb, now(), now()
  );

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values
  (
    '77000000-0000-0000-0000-000000000301',
    '77000000-0000-0000-0000-000000000201',
    '77000000-0000-0000-0000-000000000101',
    'Admin 077',
    'admin-077@test.local'
  ),
  (
    '77000000-0000-0000-0000-000000000304',
    '77000000-0000-0000-0000-000000000204',
    '77000000-0000-0000-0000-000000000101',
    'Thuong 077',
    'ordinary-077@test.local'
  );

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '77000000-0000-0000-0000-000000000301', role.id, '77000000-0000-0000-0000-000000000101'
from public.vai_tro role where role.ma = 'SYSTEM_ADMIN';

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '77000000-0000-0000-0000-000000000204', true);

select throws_ok(
  $$ select public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(
    '77000000-0000-0000-0000-000000000202',
    '77000000-0000-0000-0000-000000000101',
    'active',
    false
  ) $$,
  '42501',
  'Tai khoan khong co quyen quan tri he thong.',
  'Nguoi dung thuong khong the tao ho so cho tai khoan khac'
);

select set_config('request.jwt.claim.sub', '77000000-0000-0000-0000-000000000201', true);

select throws_ok(
  $$ select public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(
    '77000000-0000-0000-0000-000000000203',
    '77000000-0000-0000-0000-000000000101',
    'active',
    false
  ) $$,
  '42501',
  'Tài khoản phải xác thực email trước khi được cài đặt.',
  'Admin khong the cau hinh tai khoan chua xac thuc email'
);

select lives_ok(
  $$ select public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(
    '77000000-0000-0000-0000-000000000202',
    '77000000-0000-0000-0000-000000000101',
    'active',
    false
  ) $$,
  'Admin tao ho so cho tai khoan da xac thuc email'
);

select is(
  (
    select concat_ws('|', app_user.ho_ten, app_user.email, app_user.trang_thai::text)
    from public.nguoi_dung app_user
    where app_user.auth_user_id = '77000000-0000-0000-0000-000000000202'
  ),
  'Nguoi da xac thuc 077|verified-077@test.local|active',
  'Ho so moi dung ten, email Auth va trang thai da chon'
);

select ok(
  exists (
    select 1
    from public.nguoi_dung app_user
    join public.nguoi_dung_vai_tro user_role on user_role.nguoi_dung_id = app_user.id
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where app_user.auth_user_id = '77000000-0000-0000-0000-000000000202'
      and user_role.co_so_id = '77000000-0000-0000-0000-000000000101'
      and role.ma = 'TEACHER'
  ),
  'Ho so moi duoc cap vai tro Giao vien'
);

select lives_ok(
  $$ select public.fn_admin_cau_hinh_tai_khoan_da_xac_thuc(
    '77000000-0000-0000-0000-000000000202',
    '77000000-0000-0000-0000-000000000101',
    'locked',
    false
  ) $$,
  'Goi lai cong cau hinh se cap nhat ho so hien co'
);

select is(
  (
    select count(*)
    from public.nguoi_dung app_user
    where app_user.auth_user_id = '77000000-0000-0000-0000-000000000202'
  ),
  1::bigint,
  'Goi lai khong tao trung ho so'
);

select * from finish();
rollback;
