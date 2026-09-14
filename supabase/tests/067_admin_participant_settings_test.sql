begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select ok(
  has_function_privilege(
    'authenticated',
    'public.fn_admin_cap_nhat_nguoi_tham_gia(uuid,uuid,text,boolean)',
    'execute'
  ) and not has_function_privilege(
    'anon',
    'public.fn_admin_cap_nhat_nguoi_tham_gia(uuid,uuid,text,boolean)',
    'execute'
  ),
  'Chi phien dang nhap co the goi cong cai dat nguoi tham gia'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.tu_danh_gia_minh_chung'::regclass
      and conname = 'fk_tdg_minh_chung_created_by'
  ) and not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.tu_danh_gia_minh_chung'::regclass
      and conname = 'fk_tdg_minh_chung_created_by_scope'
  ),
  'Lich su nguoi gan minh chung khong chan viec chuyen truong'
);

insert into public.co_so_giao_duc(
  id, ten, ma_truong, loai_hinh, cap_hoc, trang_thai, tinh_thanh
) values
  (
    '70000000-0000-0000-0000-000000000101',
    'Truong cu 070',
    'ADMIN-070-OLD',
    'mam_non',
    array['mam_non']::public.cap_hoc[],
    'active',
    'Quảng Ninh'
  ),
  (
    '70000000-0000-0000-0000-000000000102',
    'Truong moi 070',
    'ADMIN-070-NEW',
    'mam_non',
    array['mam_non']::public.cap_hoc[],
    'active',
    'Quảng Ninh'
  ),
  (
    '70000000-0000-0000-0000-000000000103',
    'Truong tam ngung 070',
    'ADMIN-070-OFF',
    'mam_non',
    array['mam_non']::public.cap_hoc[],
    'inactive',
    'Quảng Ninh'
  );

insert into auth.users(id, email, aud, role, email_confirmed_at, created_at, updated_at)
values
  (
    '70000000-0000-0000-0000-000000000201',
    'admin-070@test.local',
    'authenticated',
    'authenticated',
    now(), now(), now()
  ),
  (
    '70000000-0000-0000-0000-000000000202',
    'participant-070@test.local',
    'authenticated',
    'authenticated',
    now(), now(), now()
  ),
  (
    '70000000-0000-0000-0000-000000000203',
    'principal-070@test.local',
    'authenticated',
    'authenticated',
    now(), now(), now()
  );

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email, trang_thai)
values
  (
    '70000000-0000-0000-0000-000000000301',
    '70000000-0000-0000-0000-000000000201',
    '70000000-0000-0000-0000-000000000101',
    'Quan tri 070',
    'admin-070@test.local',
    'active'
  ),
  (
    '70000000-0000-0000-0000-000000000302',
    '70000000-0000-0000-0000-000000000202',
    '70000000-0000-0000-0000-000000000101',
    'Nguoi chuyen truong 070',
    'participant-070@test.local',
    'active'
  ),
  (
    '70000000-0000-0000-0000-000000000303',
    '70000000-0000-0000-0000-000000000203',
    '70000000-0000-0000-0000-000000000102',
    'Hieu truong cu 070',
    'principal-070@test.local',
    'active'
  );

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select fixture.nguoi_dung_id, role.id, fixture.co_so_id
from (
  values
    ('70000000-0000-0000-0000-000000000301'::uuid, 'SYSTEM_ADMIN'::text, '70000000-0000-0000-0000-000000000101'::uuid),
    ('70000000-0000-0000-0000-000000000302'::uuid, 'TEACHER'::text, '70000000-0000-0000-0000-000000000101'::uuid),
    ('70000000-0000-0000-0000-000000000302'::uuid, 'SECRETARY'::text, '70000000-0000-0000-0000-000000000101'::uuid),
    ('70000000-0000-0000-0000-000000000302'::uuid, 'PRINCIPAL'::text, '70000000-0000-0000-0000-000000000101'::uuid),
    ('70000000-0000-0000-0000-000000000303'::uuid, 'PRINCIPAL'::text, '70000000-0000-0000-0000-000000000102'::uuid)
) fixture(nguoi_dung_id, role_code, co_so_id)
join public.vai_tro role on role.ma = fixture.role_code;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000202', true);

select throws_ok(
  $$ select public.fn_admin_cap_nhat_nguoi_tham_gia(
    '70000000-0000-0000-0000-000000000302',
    '70000000-0000-0000-0000-000000000102',
    'active',
    true
  ) $$,
  '42501',
  'Tai khoan khong co quyen quan tri he thong.',
  'Nguoi dung thuong khong the thay doi cai dat nguoi tham gia'
);

set local role postgres;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000201', true);
set local role authenticated;

select lives_ok(
  $$ select public.fn_admin_cap_nhat_nguoi_tham_gia(
    '70000000-0000-0000-0000-000000000302',
    '70000000-0000-0000-0000-000000000102',
    'active',
    true
  ) $$,
  'Admin chuyen truong va dat Hieu truong trong mot giao dich'
);

select is(
  (select co_so_id from public.nguoi_dung where id = '70000000-0000-0000-0000-000000000302'),
  '70000000-0000-0000-0000-000000000102'::uuid,
  'Ho so nguoi dung duoc chuyen sang truong moi'
);

select ok(
  exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = '70000000-0000-0000-0000-000000000302'
      and user_role.co_so_id = '70000000-0000-0000-0000-000000000102'
      and role.ma = 'TEACHER'
  ),
  'Vai tro giao vien duoc giu khi chuyen truong'
);

select ok(
  not exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = '70000000-0000-0000-0000-000000000302'
      and role.ma = 'SECRETARY'
  ),
  'Vai tro Hoi dong cua truong cu khong bi mang sang truong moi'
);

select ok(
  exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = '70000000-0000-0000-0000-000000000302'
      and user_role.co_so_id = '70000000-0000-0000-0000-000000000102'
      and role.ma = 'PRINCIPAL'
  ),
  'Nguoi duoc chon co quyen Hieu truong tai truong moi'
);

select ok(
  not exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = '70000000-0000-0000-0000-000000000303'
      and role.ma = 'PRINCIPAL'
  ),
  'Hieu truong cu cua truong dich duoc thay the'
);

select throws_ok(
  $$ select public.fn_admin_cap_nhat_nguoi_tham_gia(
    '70000000-0000-0000-0000-000000000302',
    '70000000-0000-0000-0000-000000000103',
    'active',
    false
  ) $$,
  'P0002',
  'Không tìm thấy cơ sở giáo dục đang hoạt động.',
  'Khong chuyen nguoi dung vao truong tam ngung'
);

select throws_ok(
  $$ select public.fn_admin_cap_nhat_nguoi_tham_gia(
    '70000000-0000-0000-0000-000000000302',
    '70000000-0000-0000-0000-000000000102',
    'locked',
    true
  ) $$,
  '23514',
  'Hiệu trưởng phải là tài khoản đang hoạt động.',
  'Khong the khoa tai khoan trong khi van dat lam Hieu truong'
);

select lives_ok(
  $$ select public.fn_admin_cap_nhat_nguoi_tham_gia(
    '70000000-0000-0000-0000-000000000302',
    '70000000-0000-0000-0000-000000000102',
    'inactive',
    false
  ) $$,
  'Admin co the tam ngung va bo quyen Hieu truong'
);

select is(
  (select trang_thai::text from public.nguoi_dung where id = '70000000-0000-0000-0000-000000000302'),
  'inactive',
  'Trang thai nguoi dung duoc cap nhat trong DB'
);

select ok(
  not exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = '70000000-0000-0000-0000-000000000302'
      and role.ma = 'PRINCIPAL'
  ),
  'Quyen Hieu truong duoc go khi bo lua chon'
);

set local role postgres;

select ok(
  exists (
    select 1
    from public.nhat_ky_truy_cap audit
    where audit.hanh_dong = 'ADMIN_PARTICIPANT_SETTINGS_UPDATED'
      and audit.doi_tuong_id = '70000000-0000-0000-0000-000000000302'
  ),
  'Moi thay doi cai dat nguoi dung duoc ghi nhat ky'
);

select * from finish();
rollback;
