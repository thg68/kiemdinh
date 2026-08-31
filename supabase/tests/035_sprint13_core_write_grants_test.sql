begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values
  ('13000000-0000-0000-0000-000000000101', 'Sprint 13 Tenant A', 'SPRINT13-A', 'mam_non', array['mam_non']::public.cap_hoc[]),
  ('13000000-0000-0000-0000-000000000102', 'Sprint 13 Tenant B', 'SPRINT13-B', 'mam_non', array['mam_non']::public.cap_hoc[]);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values
  ('13000000-0000-0000-0000-000000000111', '13000000-0000-0000-0000-000000000101', '2096-2097', '2096-08-01', '2097-07-31', 'dang_hoat_dong'),
  ('13000000-0000-0000-0000-000000000112', '13000000-0000-0000-0000-000000000102', '2096-2097', '2096-08-01', '2097-07-31', 'dang_hoat_dong');

create temporary table sprint13_actor(
  actor_code text primary key,
  auth_id uuid not null,
  user_id uuid not null,
  co_so_id uuid not null,
  role_code text not null
);

insert into sprint13_actor(actor_code, auth_id, user_id, co_so_id, role_code)
values
  ('PRINCIPAL_A', '13000000-0000-0000-0000-000000000201', '13000000-0000-0000-0000-000000000301', '13000000-0000-0000-0000-000000000101', 'PRINCIPAL'),
  ('SECRETARY_A', '13000000-0000-0000-0000-000000000202', '13000000-0000-0000-0000-000000000302', '13000000-0000-0000-0000-000000000101', 'SECRETARY'),
  ('TEACHER_A', '13000000-0000-0000-0000-000000000203', '13000000-0000-0000-0000-000000000303', '13000000-0000-0000-0000-000000000101', 'TEACHER');

insert into auth.users(id, email, aud, role, created_at, updated_at)
select auth_id, lower(actor_code) || '@sprint13.test', 'authenticated', 'authenticated', now(), now()
from sprint13_actor
on conflict (id) do nothing;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
select user_id, auth_id, co_so_id, actor_code, lower(actor_code) || '@sprint13.test'
from sprint13_actor;

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select actor.user_id, role.id, actor.co_so_id
from sprint13_actor actor
join public.vai_tro role on role.ma = actor.role_code;

insert into public.hoi_dong_tu_danh_gia(id, co_so_id, nam_hoc_id, ten)
values (
  '13000000-0000-0000-0000-000000000499',
  '13000000-0000-0000-0000-000000000102',
  '13000000-0000-0000-0000-000000000112',
  'Hoi dong Tenant B'
);

create function pg_temp.exec_as(p_auth_id uuid, p_sql text)
returns bigint
language plpgsql
as $$
declare
  v_row_count bigint;
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  execute p_sql;
  get diagnostics v_row_count = row_count;
  execute 'reset role';
  return v_row_count;
exception when others then
  execute 'reset role';
  raise;
end;
$$;

select ok(
  has_table_privilege('authenticated', 'public.ke_hoach_cai_tien', 'INSERT')
    and has_table_privilege('authenticated', 'public.ke_hoach_cai_tien', 'UPDATE')
    and has_table_privilege('authenticated', 'public.ke_hoach_cai_tien', 'DELETE'),
  'Table grants cho phep CRUD ke hoach; RLS quyet dinh tung dong'
);
select ok(
  has_table_privilege('authenticated', 'public.hoi_dong_tu_danh_gia', 'INSERT')
    and has_table_privilege('authenticated', 'public.hoi_dong_tu_danh_gia', 'UPDATE')
    and has_table_privilege('authenticated', 'public.hoi_dong_tu_danh_gia', 'DELETE'),
  'Table grants cho phep CRUD hoi dong; RLS quyet dinh tung dong'
);
select ok(
  has_table_privilege('authenticated', 'public.thanh_vien_hoi_dong', 'INSERT')
    and has_table_privilege('authenticated', 'public.thanh_vien_hoi_dong', 'UPDATE')
    and has_table_privilege('authenticated', 'public.thanh_vien_hoi_dong', 'DELETE'),
  'Table grants cho phep CRUD thanh vien hoi dong; RLS quyet dinh tung dong'
);
select ok(
  has_table_privilege('authenticated', 'public.van_ban_lien_quan', 'INSERT')
    and has_table_privilege('authenticated', 'public.van_ban_lien_quan', 'UPDATE')
    and has_table_privilege('authenticated', 'public.van_ban_lien_quan', 'DELETE'),
  'Table grants cho phep CRUD van ban lien quan; RLS quyet dinh tung dong'
);
select is(
  (
    select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'anon'
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
      and table_name in (
        'ke_hoach_cai_tien',
        'hoi_dong_tu_danh_gia',
        'thanh_vien_hoi_dong',
        'van_ban_lien_quan'
      )
  ),
  0::bigint,
  'Anon khong co table grant ghi tren bon bang nghiep vu'
);

select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$insert into public.ke_hoach_cai_tien(id, co_so_id, nam_hoc_id, noi_dung)
      values ('13000000-0000-0000-0000-000000000401', '13000000-0000-0000-0000-000000000101',
        '13000000-0000-0000-0000-000000000111', 'Ke hoach Sprint 13')$sql$
  ),
  1::bigint,
  'Hieu truong tao duoc ke hoach trong don vi'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$update public.ke_hoach_cai_tien set muc_do_thuc_hien = 'dang_thuc_hien'
      where id = '13000000-0000-0000-0000-000000000401'$sql$
  ),
  1::bigint,
  'Hieu truong cap nhat duoc ke hoach trong don vi'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000203',
    $sql$update public.ke_hoach_cai_tien set muc_do_thuc_hien = 'hoan_thanh'
      where id = '13000000-0000-0000-0000-000000000401'$sql$
  ),
  0::bigint,
  'Giao vien khong cap nhat duoc ke hoach'
);
select throws_ok(
  $test$select pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$insert into public.ke_hoach_cai_tien(id, co_so_id, nam_hoc_id)
      values ('13000000-0000-0000-0000-000000000402', '13000000-0000-0000-0000-000000000102',
        '13000000-0000-0000-0000-000000000112')$sql$
  )$test$,
  '42501',
  null,
  'Hieu truong Tenant A khong tao ke hoach cho Tenant B'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$delete from public.ke_hoach_cai_tien where id = '13000000-0000-0000-0000-000000000401'$sql$
  ),
  1::bigint,
  'Hieu truong xoa duoc ke hoach trong don vi'
);

select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$insert into public.hoi_dong_tu_danh_gia(id, co_so_id, nam_hoc_id, ten)
      values ('13000000-0000-0000-0000-000000000403', '13000000-0000-0000-0000-000000000101',
        '13000000-0000-0000-0000-000000000111', 'Hoi dong Sprint 13')$sql$
  ),
  1::bigint,
  'Hieu truong tao duoc hoi dong trong don vi'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$update public.hoi_dong_tu_danh_gia set so_quyet_dinh = 'QD-S13'
      where id = '13000000-0000-0000-0000-000000000403'$sql$
  ),
  1::bigint,
  'Hieu truong cap nhat duoc hoi dong trong don vi'
);
select throws_ok(
  $test$select pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000203',
    $sql$insert into public.hoi_dong_tu_danh_gia(id, co_so_id, nam_hoc_id, ten)
      values ('13000000-0000-0000-0000-000000000404', '13000000-0000-0000-0000-000000000101',
        '13000000-0000-0000-0000-000000000111', 'Giao vien khong duoc tao')$sql$
  )$test$,
  '42501',
  null,
  'Giao vien khong tao duoc hoi dong'
);

select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$insert into public.thanh_vien_hoi_dong(id, hoi_dong_id, nguoi_dung_id, vai_tro_hoi_dong)
      values ('13000000-0000-0000-0000-000000000405', '13000000-0000-0000-0000-000000000403',
        '13000000-0000-0000-0000-000000000303', 'uy_vien')$sql$
  ),
  1::bigint,
  'Hieu truong them duoc thanh vien hoi dong trong don vi'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$update public.thanh_vien_hoi_dong set thu_tu = 2
      where id = '13000000-0000-0000-0000-000000000405'$sql$
  ),
  1::bigint,
  'Hieu truong cap nhat duoc thanh vien hoi dong trong don vi'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000203',
    $sql$delete from public.thanh_vien_hoi_dong where id = '13000000-0000-0000-0000-000000000405'$sql$
  ),
  0::bigint,
  'Giao vien khong xoa duoc thanh vien hoi dong'
);
select throws_ok(
  $test$select pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$insert into public.thanh_vien_hoi_dong(id, hoi_dong_id, nguoi_dung_id, vai_tro_hoi_dong)
      values ('13000000-0000-0000-0000-000000000406', '13000000-0000-0000-0000-000000000499',
        '13000000-0000-0000-0000-000000000303', 'uy_vien')$sql$
  )$test$,
  '42501',
  null,
  'Hieu truong Tenant A khong them thanh vien vao hoi dong Tenant B'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$delete from public.thanh_vien_hoi_dong where id = '13000000-0000-0000-0000-000000000405'$sql$
  ),
  1::bigint,
  'Hieu truong xoa duoc thanh vien hoi dong trong don vi'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$delete from public.hoi_dong_tu_danh_gia where id = '13000000-0000-0000-0000-000000000403'$sql$
  ),
  1::bigint,
  'Hieu truong xoa duoc hoi dong trong don vi'
);

select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000202',
    $sql$insert into public.van_ban_lien_quan(id, co_so_id, nam_hoc_id, ten)
      values ('13000000-0000-0000-0000-000000000407', '13000000-0000-0000-0000-000000000101',
        '13000000-0000-0000-0000-000000000111', 'Van ban Sprint 13')$sql$
  ),
  1::bigint,
  'Thu ky tao duoc van ban lien quan trong don vi'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000202',
    $sql$update public.van_ban_lien_quan set so_hieu = 'VB-S13'
      where id = '13000000-0000-0000-0000-000000000407'$sql$
  ),
  1::bigint,
  'Thu ky cap nhat duoc van ban lien quan trong don vi'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000203',
    $sql$update public.van_ban_lien_quan set so_hieu = 'KHONG-DUOC-PHEP'
      where id = '13000000-0000-0000-0000-000000000407'$sql$
  ),
  0::bigint,
  'Giao vien khong cap nhat duoc van ban lien quan'
);
select throws_ok(
  $test$select pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000201',
    $sql$insert into public.van_ban_lien_quan(id, co_so_id, nam_hoc_id, ten)
      values ('13000000-0000-0000-0000-000000000408', '13000000-0000-0000-0000-000000000102',
        '13000000-0000-0000-0000-000000000112', 'Khong duoc ghi cheo tenant')$sql$
  )$test$,
  '42501',
  null,
  'Hieu truong Tenant A khong tao van ban cho Tenant B'
);
select is(
  pg_temp.exec_as(
    '13000000-0000-0000-0000-000000000202',
    $sql$delete from public.van_ban_lien_quan where id = '13000000-0000-0000-0000-000000000407'$sql$
  ),
  1::bigint,
  'Thu ky xoa duoc van ban lien quan trong don vi'
);

select * from finish();
rollback;
