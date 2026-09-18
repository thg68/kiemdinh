begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select ok(
  has_function_privilege('authenticated', 'public.fn_ho_so_cua_toi()', 'execute')
  and has_function_privilege('authenticated', 'public.fn_cap_nhat_ho_so_cua_toi(text,text,date)', 'execute')
  and not has_function_privilege('anon', 'public.fn_ho_so_cua_toi()', 'execute')
  and not has_function_privilege('anon', 'public.fn_cap_nhat_ho_so_cua_toi(text,text,date)', 'execute'),
  'Only signed-in users can call the profile functions'
);

select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'nguoi_dung' and column_name = 'ngay_sinh'
  ),
  'Birth date is absent from the shared user table'
);

select ok(
  has_table_privilege('authenticated', 'public.nguoi_dung_ho_so_rieng', 'SELECT')
  and not has_table_privilege('authenticated', 'public.nguoi_dung_ho_so_rieng', 'INSERT')
  and not has_table_privilege('authenticated', 'public.nguoi_dung_ho_so_rieng', 'UPDATE'),
  'Direct private-profile edits are disabled; updates go through the owner-only function'
);

insert into public.co_so_giao_duc (
  id, ten, ma_truong, loai_hinh, cap_hoc, trang_thai, tinh_thanh
) values (
  '74000000-0000-0000-0000-000000000101',
  'Truong ho so 074',
  'PROFILE-074',
  'mam_non',
  array['mam_non']::public.cap_hoc[],
  'active',
  'Quảng Ninh'
);

insert into auth.users (id, email, aud, role, email_confirmed_at, created_at, updated_at)
values
  ('74000000-0000-0000-0000-000000000201', 'profile-074-a@test.local', 'authenticated', 'authenticated', now(), now(), now()),
  ('74000000-0000-0000-0000-000000000202', 'profile-074-b@test.local', 'authenticated', 'authenticated', now(), now(), now());

insert into public.nguoi_dung (id, auth_user_id, co_so_id, ho_ten, email, trang_thai)
values
  ('74000000-0000-0000-0000-000000000301', '74000000-0000-0000-0000-000000000201', '74000000-0000-0000-0000-000000000101', 'Nguoi dung A', 'profile-074-a@test.local', 'active'),
  ('74000000-0000-0000-0000-000000000302', '74000000-0000-0000-0000-000000000202', '74000000-0000-0000-0000-000000000101', 'Nguoi dung B', 'profile-074-b@test.local', 'active');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '74000000-0000-0000-0000-000000000201', true);

select lives_ok(
  $$ select public.fn_cap_nhat_ho_so_cua_toi('  Ten moi A  ', ' 0123456789 ', date '1990-05-02') $$,
  'A signed-in user can update their own allowed fields'
);

select is(
  (select ho_ten::text from public.nguoi_dung where id = '74000000-0000-0000-0000-000000000301'),
  'Ten moi A',
  'The profile name is trimmed and saved'
);

select is(
  (select dien_thoai::text from public.nguoi_dung where id = '74000000-0000-0000-0000-000000000301'),
  '0123456789',
  'The profile phone is trimmed and saved'
);

select is(
  (select ngay_sinh::text from public.fn_ho_so_cua_toi()),
  '1990-05-02',
  'The owner can read their birth date'
);

select is(
  (select count(*) from public.nhat_ky_truy_cap
   where hanh_dong = 'USER_PROFILE_UPDATED'
     and doi_tuong_id = '74000000-0000-0000-0000-000000000301'),
  0::bigint,
  'A user without audit permission cannot read the profile audit event'
);

set local role postgres;
select ok(
  exists (
    select 1 from public.nhat_ky_truy_cap
    where hanh_dong = 'USER_PROFILE_UPDATED'
      and doi_tuong_id = '74000000-0000-0000-0000-000000000301'
      and du_lieu_cu is null
      and du_lieu_moi is null
  ),
  'The audit event contains no profile values'
);

select set_config('request.jwt.claim.sub', '74000000-0000-0000-0000-000000000202', true);
set local role authenticated;

select lives_ok(
  $$ select public.fn_cap_nhat_ho_so_cua_toi('Ten moi B', null, date '1988-06-03') $$,
  'The second user can update their own profile'
);

select is(
  (select count(*)::integer from public.nguoi_dung_ho_so_rieng),
  1,
  'A user can only see their own private row, even in the same school'
);

select throws_ok(
  $$ select public.fn_cap_nhat_ho_so_cua_toi('X', null, null) $$,
  '22023',
  'Họ tên cần có từ 2 đến 255 ký tự.',
  'The function rejects invalid names'
);

select * from finish();
rollback;
