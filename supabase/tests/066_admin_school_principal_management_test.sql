begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select ok(
  has_function_privilege(
    'authenticated',
    'public.fn_admin_tao_co_so_va_nam_hoc(text,text,public.loai_hinh_co_so,public.cap_hoc[],character varying,date,date,text)',
    'execute'
  ) and not has_function_privilege(
    'anon',
    'public.fn_admin_tao_co_so_va_nam_hoc(text,text,public.loai_hinh_co_so,public.cap_hoc[],character varying,date,date,text)',
    'execute'
  ),
  'Chi phien dang nhap co the di toi cong tao truong cua admin'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.fn_admin_gan_hieu_truong(uuid,uuid)',
    'execute'
  ) and not has_function_privilege(
    'anon',
    'public.fn_admin_gan_hieu_truong(uuid,uuid)',
    'execute'
  ),
  'Chi phien dang nhap co the di toi cong gan Hieu truong cua admin'
);

insert into public.co_so_giao_duc(
  id, ten, ma_truong, loai_hinh, cap_hoc, trang_thai, tinh_thanh
) values
  (
    '69000000-0000-0000-0000-000000000101',
    'Truong quan tri 069',
    'ADMIN-069-A',
    'mam_non',
    array['mam_non']::public.cap_hoc[],
    'active',
    'Quảng Ninh'
  ),
  (
    '69000000-0000-0000-0000-000000000102',
    'Truong nhan quyen 069',
    'ADMIN-069-B',
    'mam_non',
    array['mam_non']::public.cap_hoc[],
    'active',
    'Quảng Ninh'
  );

insert into auth.users(id, email, aud, role, email_confirmed_at, created_at, updated_at)
values
  (
    '69000000-0000-0000-0000-000000000201',
    'admin-069@test.local',
    'authenticated',
    'authenticated',
    now(), now(), now()
  ),
  (
    '69000000-0000-0000-0000-000000000202',
    'teacher-069@test.local',
    'authenticated',
    'authenticated',
    now(), now(), now()
  ),
  (
    '69000000-0000-0000-0000-000000000203',
    'principal-old-069@test.local',
    'authenticated',
    'authenticated',
    now(), now(), now()
  );

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email, trang_thai)
values
  (
    '69000000-0000-0000-0000-000000000301',
    '69000000-0000-0000-0000-000000000201',
    '69000000-0000-0000-0000-000000000101',
    'Quan tri 069',
    'admin-069@test.local',
    'active'
  ),
  (
    '69000000-0000-0000-0000-000000000302',
    '69000000-0000-0000-0000-000000000202',
    '69000000-0000-0000-0000-000000000102',
    'Giao vien 069',
    'teacher-069@test.local',
    'active'
  ),
  (
    '69000000-0000-0000-0000-000000000303',
    '69000000-0000-0000-0000-000000000203',
    '69000000-0000-0000-0000-000000000102',
    'Hieu truong cu 069',
    'principal-old-069@test.local',
    'active'
  );

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select fixture.nguoi_dung_id, role.id, fixture.co_so_id
from (
  values
    (
      '69000000-0000-0000-0000-000000000301'::uuid,
      'SYSTEM_ADMIN'::text,
      '69000000-0000-0000-0000-000000000101'::uuid
    ),
    (
      '69000000-0000-0000-0000-000000000302'::uuid,
      'TEACHER'::text,
      '69000000-0000-0000-0000-000000000102'::uuid
    ),
    (
      '69000000-0000-0000-0000-000000000303'::uuid,
      'PRINCIPAL'::text,
      '69000000-0000-0000-0000-000000000102'::uuid
    )
) fixture(nguoi_dung_id, role_code, co_so_id)
join public.vai_tro role on role.ma = fixture.role_code;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '69000000-0000-0000-0000-000000000202', true);

select throws_ok(
  $$ select * from public.fn_admin_tao_co_so_va_nam_hoc(
    'Truong khong du quyen', 'ADMIN-069-DENIED', 'mam_non',
    array['mam_non']::public.cap_hoc[], '2096-2097', '2096-09-01', '2097-05-31', 'Quảng Ninh'
  ) $$,
  '42501',
  'Tai khoan khong co quyen quan tri he thong.',
  'Nguoi dung thuong khong the tao truong'
);

select throws_ok(
  $$ select public.fn_admin_gan_hieu_truong(
    '69000000-0000-0000-0000-000000000302',
    '69000000-0000-0000-0000-000000000102'
  ) $$,
  '42501',
  'Tai khoan khong co quyen quan tri he thong.',
  'Nguoi dung thuong khong the gan Hieu truong'
);

set local role postgres;
select set_config('request.jwt.claim.sub', '69000000-0000-0000-0000-000000000201', true);
set local role authenticated;

select lives_ok(
  $$ select * from public.fn_admin_tao_co_so_va_nam_hoc(
    'Truong moi 069', 'ADMIN-069-NEW', 'mam_non',
    array['mam_non']::public.cap_hoc[], '2096-2097', '2096-09-01', '2097-05-31', 'Quảng Ninh'
  ) $$,
  'Quan tri he thong tao truong ma khong can thong tin Hieu truong'
);

select ok(
  exists (
    select 1
    from public.co_so_giao_duc school
    where school.ma_truong = 'ADMIN-069-NEW'
      and school.tinh_thanh = 'Quảng Ninh'
      and school.cho_phep_tu_dang_ky
  ),
  'Truong moi san sang cho nguoi dung tu chon khi dang ky'
);

select lives_ok(
  $$ select * from public.fn_admin_tao_co_so_va_nam_hoc(
    'Truong Ha Noi 069', 'ADMIN-069-HN', 'mam_non',
    array['mam_non']::public.cap_hoc[], '2096-2097', '2096-09-01', '2097-05-31', 'Hà Nội'
  ) $$,
  'Quan tri tao duoc truong ngoai Quang Ninh'
);

select ok(
  exists (
    select 1 from public.fn_danh_sach_truong_dang_ky('ADMIN-069-HN', 20, 'Hà Nội') school
    where school.ma_truong = 'ADMIN-069-HN'
  ),
  'Danh muc dang ky tim duoc truong theo tinh ngoai Quang Ninh'
);

select ok(
  exists (
    select 1 from public.fn_admin_danh_sach_co_so(null, null, null, 25, 0, 'Hà Nội') school
    where school.ma_truong = 'ADMIN-069-HN'
  ),
  'Quan tri loc duoc co so theo tinh'
);

select lives_ok(
  $$ select public.fn_admin_cap_nhat_dia_phuong_co_so(
    (select school.id from public.co_so_giao_duc school where school.ma_truong = 'ADMIN-069-HN'),
    'Quảng Ninh', 'Phường Hạ Long'
  ) $$,
  'Quan tri sua duoc tinh va phuong xa'
);

select ok(
  exists (
    select 1 from public.co_so_giao_duc school
    where school.ma_truong = 'ADMIN-069-HN'
      and school.tinh_thanh = 'Quảng Ninh'
      and school.phuong_xa = 'Phường Hạ Long'
  ),
  'Dia phuong moi duoc luu tren co so'
);

select is(
  (
    select count(*)
    from public.loi_moi_thanh_vien invitation
    join public.co_so_giao_duc school on school.id = invitation.co_so_id
    where school.ma_truong = 'ADMIN-069-NEW'
  ),
  0::bigint,
  'Tao truong khong con sinh loi moi Hieu truong'
);

select is(
  (
    select count(*)
    from public.nam_hoc school_year
    join public.co_so_giao_duc school on school.id = school_year.co_so_id
    where school.ma_truong = 'ADMIN-069-NEW'
      and school_year.ten = '2096-2097'
      and school_year.trang_thai = 'dang_hoat_dong'
  ),
  1::bigint,
  'Truong moi co nam hoc ban dau dang hoat dong'
);

select lives_ok(
  $$ select public.fn_admin_gan_hieu_truong(
    '69000000-0000-0000-0000-000000000302',
    '69000000-0000-0000-0000-000000000102'
  ) $$,
  'Quan tri gan nguoi dung cua truong lam Hieu truong'
);

select ok(
  exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = '69000000-0000-0000-0000-000000000302'
      and user_role.co_so_id = '69000000-0000-0000-0000-000000000102'
      and role.ma = 'PRINCIPAL'
  ),
  'Nguoi duoc chon co quyen Hieu truong trong DB'
);

select ok(
  not exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = '69000000-0000-0000-0000-000000000303'
      and user_role.co_so_id = '69000000-0000-0000-0000-000000000102'
      and role.ma = 'PRINCIPAL'
  ),
  'Quyen Hieu truong cu duoc thu hoi trong cung giao dich'
);

select ok(
  exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = '69000000-0000-0000-0000-000000000302'
      and role.ma = 'TEACHER'
  ),
  'Vai tro nghiep vu khac cua nguoi dung duoc giu nguyen'
);

select throws_ok(
  $$ select public.fn_admin_gan_hieu_truong(
    '69000000-0000-0000-0000-000000000301',
    '69000000-0000-0000-0000-000000000102'
  ) $$,
  '23514',
  'Người dùng không thuộc cơ sở giáo dục đã chọn.',
  'Khong the gan nguoi dung cua truong khac'
);

set local role postgres;

select ok(
  exists (
    select 1
    from public.nhat_ky_truy_cap audit
    where audit.hanh_dong = 'ADMIN_PRINCIPAL_ASSIGNED'
      and audit.doi_tuong_id = '69000000-0000-0000-0000-000000000302'
  ),
  'Thao tac gan Hieu truong duoc ghi nhat ky'
);

select * from finish();
rollback;
