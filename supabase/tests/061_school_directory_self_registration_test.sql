begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(19);

select ok(
  has_function_privilege('anon', 'public.fn_danh_sach_truong_dang_ky(text, integer, text)', 'execute'),
  'Khach chua dang nhap co the doc danh muc truong an toan'
);

select ok(
  not has_function_privilege('anon', 'public.fn_tu_dang_ky_vao_co_so(uuid)', 'execute'),
  'Khach chua dang nhap khong the tu tham gia truong'
);

select ok(
  not has_table_privilege('anon', 'public.co_so_giao_duc', 'select'),
  'Khong mo quyen doc truc tiep bang co so giao duc cho khach'
);

set local role anon;
select is(
  (select count(*) from public.fn_danh_sach_truong_dang_ky(null, 50, 'Quảng Ninh')),
  50::bigint,
  'Tim truong Quang Ninh theo tinh voi gioi han phan trang'
);

set local role postgres;
select is(
  (
    select count(distinct school.ma_truong)
    from public.co_so_giao_duc school
    where school.cho_phep_tu_dang_ky
      and school.tinh_thanh = 'Quảng Ninh'
  ),
  347::bigint,
  'Moi truong co mot ma MOET duy nhat'
);

select is(
  (
    select count(*)
    from public.co_so_giao_duc school
    where school.cho_phep_tu_dang_ky
      and school.tinh_thanh = 'Quảng Ninh'
      and school.loai_hinh = 'mam_non'
  ),
  118::bigint,
  'Co dung 118 co so mam non'
);

select is(
  (
    select count(*)
    from public.co_so_giao_duc school
    where school.cho_phep_tu_dang_ky
      and school.tinh_thanh = 'Quảng Ninh'
      and school.loai_hinh = 'pho_thong'
  ),
  228::bigint,
  'Co dung 228 co so pho thong'
);

select is(
  (
    select count(*)
    from public.nam_hoc school_year
    join public.co_so_giao_duc school on school.id = school_year.co_so_id
    where school.cho_phep_tu_dang_ky
      and school.tinh_thanh = 'Quảng Ninh'
      and school_year.ten = '2026-2027'
      and school_year.bo_tieu_chuan_id is not null
  ),
  347::bigint,
  'Moi truong co nam hoc 2026-2027 va bo tieu chuan phu hop'
);

insert into public.co_so_giao_duc(
  id, ten, ma_truong, loai_hinh, cap_hoc, trang_thai, tinh_thanh, cho_phep_tu_dang_ky
) values (
  '61000000-0000-0000-0000-000000000101',
  'Truong ngoai tinh 061',
  'HN-TEST-061',
  'mam_non',
  array['mam_non']::public.cap_hoc[],
  'active',
  'Hà Nội',
  true
);

set local role anon;
select is(
  (select count(*) from public.fn_danh_sach_truong_dang_ky('HN-TEST-061', 20, 'Hà Nội')),
  1::bigint,
  'Khach tim duoc truong ngoai Quang Ninh theo tinh'
);
select is(
  (select count(school.id) from public.co_so_giao_duc school where school.tinh_thanh = 'Hà Nội'),
  1::bigint,
  'RLS cho doc truong ngoai Quang Ninh duoc phep tu dang ky'
);
set local role postgres;

create temporary table test_061_schools as
select school.id, row_number() over (order by school.ma_truong) as rn
from public.co_so_giao_duc school
where school.cho_phep_tu_dang_ky
  and school.tinh_thanh = 'Quảng Ninh'
order by school.ma_truong
limit 2;
grant select on table test_061_schools to authenticated;

insert into auth.users(
  id, email, aud, role, email_confirmed_at, raw_user_meta_data, created_at, updated_at
)
values
  (
    '61000000-0000-0000-0000-000000000201',
    'teacher-self-register@test.local',
    'authenticated',
    'authenticated',
    now(),
    jsonb_build_object('ho_ten', 'Giao vien tu dang ky'),
    now(),
    now()
  ),
  (
    '61000000-0000-0000-0000-000000000202',
    'unconfirmed-self-register@test.local',
    'authenticated',
    'authenticated',
    null,
    jsonb_build_object('ho_ten', 'Tai khoan chua xac nhan'),
    now(),
    now()
  ),
  (
    '61000000-0000-0000-0000-000000000203',
    'teacher-other-province@test.local',
    'authenticated',
    'authenticated',
    now(),
    jsonb_build_object('ho_ten', 'Giao vien Ha Noi'),
    now(),
    now()
  );

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000201', true);

select lives_ok(
  format(
    'select public.fn_tu_dang_ky_vao_co_so(%L)',
    (select id from test_061_schools where rn = 1)
  ),
  'Tai khoan da xac nhan email co the tu tham gia truong'
);

select is(
  (
    select app_user.co_so_id
    from public.nguoi_dung app_user
    where app_user.auth_user_id = '61000000-0000-0000-0000-000000000201'
  ),
  (select id from test_061_schools where rn = 1),
  'Ho so duoc gan dung truong da chon'
);

select is(
  (
    select count(*)
    from public.nguoi_dung_vai_tro user_role
    join public.nguoi_dung app_user on app_user.id = user_role.nguoi_dung_id
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where app_user.auth_user_id = '61000000-0000-0000-0000-000000000201'
      and role.ma = 'TEACHER'
  ),
  1::bigint,
  'Tu dang ky chi cap vai tro Giao vien'
);

select is(
  (
    select count(*)
    from public.nguoi_dung_vai_tro user_role
    join public.nguoi_dung app_user on app_user.id = user_role.nguoi_dung_id
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where app_user.auth_user_id = '61000000-0000-0000-0000-000000000201'
      and role.ma <> 'TEACHER'
  ),
  0::bigint,
  'Tu dang ky khong cap vai tro quan ly'
);

select lives_ok(
  format(
    'select public.fn_tu_dang_ky_vao_co_so(%L)',
    (select id from test_061_schools where rn = 1)
  ),
  'Goi lai voi cung truong la idempotent'
);

select throws_ok(
  format(
    'select public.fn_tu_dang_ky_vao_co_so(%L)',
    (select id from test_061_schools where rn = 2)
  ),
  '23505',
  'Tai khoan da thuoc mot don vi khac.',
  'Nguoi dung khong the tu chuyen sang truong khac'
);

select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000202', true);
select throws_ok(
  format(
    'select public.fn_tu_dang_ky_vao_co_so(%L)',
    (select id from test_061_schools where rn = 1)
  ),
  '42501',
  'Ban can xac nhan email truoc khi tham gia truong.',
  'Email chua xac nhan khong the tham gia truong'
);

select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000203', true);
select lives_ok(
  $$ select public.fn_tu_dang_ky_vao_co_so('61000000-0000-0000-0000-000000000101') $$,
  'Tai khoan da xac nhan co the tham gia truong ngoai Quang Ninh'
);
select is(
  (
    select app_user.co_so_id
    from public.nguoi_dung app_user
    where app_user.auth_user_id = '61000000-0000-0000-0000-000000000203'
  ),
  '61000000-0000-0000-0000-000000000101'::uuid,
  'Ho so cua giao vien ngoai Quang Ninh gan dung truong'
);

select * from finish();
rollback;
