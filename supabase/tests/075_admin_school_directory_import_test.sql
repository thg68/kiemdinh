begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select ok(
  has_function_privilege('authenticated', 'public.fn_admin_nhap_danh_muc_co_so(jsonb)', 'execute')
  and not has_function_privilege('anon', 'public.fn_admin_nhap_danh_muc_co_so(jsonb)', 'execute'),
  'Only authenticated sessions can reach the import RPC'
);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc, tinh_thanh)
values ('75000000-0000-0000-0000-000000000101', 'Admin fixture 075', 'ADMIN-075',
  'mam_non', array['mam_non']::public.cap_hoc[], 'Quảng Ninh');

insert into auth.users(id, email, aud, role, email_confirmed_at, created_at, updated_at)
values
  ('75000000-0000-0000-0000-000000000201', 'admin-075@test.local', 'authenticated', 'authenticated', now(), now(), now()),
  ('75000000-0000-0000-0000-000000000202', 'teacher-075@test.local', 'authenticated', 'authenticated', now(), now(), now());

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values
  ('75000000-0000-0000-0000-000000000301', '75000000-0000-0000-0000-000000000201', '75000000-0000-0000-0000-000000000101', 'Admin 075', 'admin-075@test.local'),
  ('75000000-0000-0000-0000-000000000302', '75000000-0000-0000-0000-000000000202', '75000000-0000-0000-0000-000000000101', 'Teacher 075', 'teacher-075@test.local');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select fixture.user_id, role.id, '75000000-0000-0000-0000-000000000101'::uuid
from (values
  ('75000000-0000-0000-0000-000000000301'::uuid, 'SYSTEM_ADMIN'::text),
  ('75000000-0000-0000-0000-000000000302'::uuid, 'TEACHER'::text)
) fixture(user_id, role_code)
join public.vai_tro role on role.ma = fixture.role_code;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '75000000-0000-0000-0000-000000000202', true);

select throws_ok(
  $$ select public.fn_admin_nhap_danh_muc_co_so('[{"ma_truong":"075-DENIED","ten":"Denied","tinh_thanh":"Hà Nội","loai_hinh":"mam_non","cap_hoc":["mam_non"]}]'::jsonb) $$,
  '42501', 'Tai khoan khong co quyen quan tri he thong.',
  'Non-admin cannot import schools'
);

set local role postgres;
select set_config('request.jwt.claim.sub', '75000000-0000-0000-0000-000000000201', true);
set local role authenticated;

select is(
  public.fn_admin_nhap_danh_muc_co_so('[{"ma_truong":"075-NEW","ten":"Imported school","tinh_thanh":"Hà Nội","phuong_xa":"Ba Đình","loai_hinh":"pho_thong","cap_hoc":["tieu_hoc","thcs"],"cong_lap":true}]'::jsonb) ->> 'created',
  '1', 'Admin imports one new school'
);

select is(
  public.fn_admin_nhap_danh_muc_co_so('[{"ma_truong":"075-new","ten":"Must not overwrite","tinh_thanh":"Hà Nội","loai_hinh":"pho_thong","cap_hoc":["tieu_hoc"]}]'::jsonb) ->> 'skipped',
  '1', 'Reimport skips an existing code case-insensitively'
);

select throws_ok(
  $$ select public.fn_admin_nhap_danh_muc_co_so('[{"ma_truong":"075-ROLLBACK","ten":"Rollback school","tinh_thanh":"Hà Nội","loai_hinh":"mam_non","cap_hoc":["mam_non"]},{"ma_truong":"075-BAD","ten":"Bad school","tinh_thanh":"Invalid province","loai_hinh":"mam_non","cap_hoc":["mam_non"]}]'::jsonb) $$,
  '22023', 'Tỉnh/thành không có trong danh mục hiện hành.',
  'Invalid row cancels the whole batch'
);

set local role postgres;

select ok(
  exists (
    select 1 from public.co_so_giao_duc school
    where school.ma_truong = '075-NEW' and school.ten = 'Imported school'
      and school.tinh_thanh = 'Hà Nội' and school.trang_thai = 'inactive'
      and not school.cho_phep_tu_dang_ky and school.nguon_danh_muc = 'excel_quan_tri'
  ),
  'Imported school is inactive and unavailable for self registration'
);

select ok(
  not exists (select 1 from public.co_so_giao_duc where ma_truong = '075-ROLLBACK')
  and not exists (
    select 1 from public.nam_hoc year
    join public.co_so_giao_duc school on school.id = year.co_so_id
    where school.ma_truong = '075-NEW'
  ),
  'No partial import or school year is created'
);

select is(
  (select count(*) from public.nhat_ky_truy_cap where hanh_dong = 'ADMIN_SCHOOL_DIRECTORY_IMPORTED'
    and nguoi_dung_id = '75000000-0000-0000-0000-000000000301'),
  1::bigint,
  'Successful batch has one audit event; duplicate-only batch does not'
);

select * from finish();
rollback;
