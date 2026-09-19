begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select ok(
  has_function_privilege(
    'authenticated',
    'public.fn_admin_danh_sach_tai_khoan(text,uuid,text,text,boolean,integer,integer)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.fn_admin_danh_sach_tai_khoan(text,uuid,text,text,boolean,integer,integer)',
    'execute'
  ),
  'Only authenticated sessions can reach the guarded account directory function'
);

insert into public.co_so_giao_duc(
  id, ten, ma_truong, loai_hinh, cap_hoc, trang_thai, tinh_thanh
) values (
  '76000000-0000-0000-0000-000000000101',
  'Truong tai khoan 076',
  'ACCOUNT-076',
  'mam_non',
  array['mam_non']::public.cap_hoc[],
  'active',
  'Hà Nội'
);

insert into auth.users(
  id, email, aud, role, email_confirmed_at, raw_user_meta_data, created_at, updated_at
) values
  (
    '76000000-0000-0000-0000-000000000201', 'admin-076@test.local',
    'authenticated', 'authenticated', now(), '{}'::jsonb, now(), now()
  ),
  (
    '76000000-0000-0000-0000-000000000202', 'canonical-076@test.local',
    'authenticated', 'authenticated', now(), '{}'::jsonb, now(), now()
  ),
  (
    '76000000-0000-0000-0000-000000000203', 'pending-076@test.local',
    'authenticated', 'authenticated', null,
    jsonb_build_object('ho_ten', 'Tai khoan cho 076', 'co_so_id', '76000000-0000-0000-0000-000000000101'),
    now(), now()
  ),
  (
    '76000000-0000-0000-0000-000000000204', 'profileless-076@test.local',
    'authenticated', 'authenticated', now(),
    jsonb_build_object('co_so_id', '76000000-0000-0000-0000-000000000101'),
    now(), now()
  ),
  (
    '76000000-0000-0000-0000-000000000205', 'ordinary-076@test.local',
    'authenticated', 'authenticated', now(), '{}'::jsonb, now(), now()
  );

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values
  (
    '76000000-0000-0000-0000-000000000301',
    '76000000-0000-0000-0000-000000000201',
    '76000000-0000-0000-0000-000000000101',
    'Admin 076',
    'admin-076@test.local'
  ),
  (
    '76000000-0000-0000-0000-000000000302',
    '76000000-0000-0000-0000-000000000202',
    '76000000-0000-0000-0000-000000000101',
    'Nguoi dung 076',
    'email-cu-076@test.local'
  ),
  (
    '76000000-0000-0000-0000-000000000305',
    '76000000-0000-0000-0000-000000000205',
    '76000000-0000-0000-0000-000000000101',
    'Thuong 076',
    'ordinary-076@test.local'
  );

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '76000000-0000-0000-0000-000000000301', role.id, '76000000-0000-0000-0000-000000000101'
from public.vai_tro role where role.ma = 'SYSTEM_ADMIN';

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '76000000-0000-0000-0000-000000000205', true);

select throws_ok(
  $$ select * from public.fn_admin_danh_sach_tai_khoan(null, null, null, null, null, 25, 0) $$,
  '42501',
  'Tai khoan khong co quyen quan tri he thong.',
  'A regular account cannot enumerate Auth accounts'
);

select set_config('request.jwt.claim.sub', '76000000-0000-0000-0000-000000000201', true);

select is(
  (
    select account.email
    from public.fn_admin_danh_sach_tai_khoan('canonical-076@test.local', null, null, null, null, 25, 0) account
  ),
  'canonical-076@test.local'::text,
  'The directory displays the canonical Supabase Auth email'
);

select is(
  (
    select account.trang_thai
    from public.fn_admin_danh_sach_tai_khoan('pending-076@test.local', null, null, null, false, 25, 0) account
  ),
  'pending_verification'::text,
  'An unconfirmed Auth-only account is visible as pending verification'
);

select is(
  (
    select account.trang_thai
    from public.fn_admin_danh_sach_tai_khoan('profileless-076@test.local', null, null, null, true, 25, 0) account
  ),
  'pending_profile'::text,
  'A confirmed account without an application profile is visible as pending profile'
);

select is(
  (
    select account.co_so_ten
    from public.fn_admin_danh_sach_tai_khoan(
      'pending-076@test.local', '76000000-0000-0000-0000-000000000101', null, null, null, 25, 0
    ) account
  ),
  'Truong tai khoan 076'::text,
  'The school filter also covers the pending school in signup metadata'
);

select * from finish();
rollback;
