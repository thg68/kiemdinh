begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(11);

select ok(has_table_privilege('authenticated', 'public.bao_cao', 'SELECT'), 'Authenticated can read reports before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.nhan_xet_tieu_chuan', 'SELECT'), 'Authenticated can read standard notes before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.nhan_xet_tieu_chuan', 'INSERT'), 'Authenticated can create standard notes before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.nhan_xet_tieu_chuan', 'UPDATE'), 'Authenticated can update standard notes before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.tu_danh_gia', 'SELECT'), 'Report export can read assessments before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.minh_chung_tieu_chi', 'SELECT'), 'Report export can read evidence links before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.ke_hoach_cai_tien', 'SELECT'), 'Report export can read improvement plans before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.hoi_dong_tu_danh_gia', 'SELECT'), 'Report export can read council data before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.thanh_vien_hoi_dong', 'SELECT'), 'Report export can read council members before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.noi_dung_mau_2', 'SELECT'), 'Report export can read Template 2 content before RLS filtering');

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values ('30000000-0000-0000-0000-000000000001'::uuid, 'Tenant 30', 'T30', 'mam_non', array['mam_non']::cap_hoc[]);

insert into auth.users(id, email, aud, role, email_confirmed_at, created_at, updated_at)
values ('30000000-0000-0000-0000-000000000101'::uuid, 'principal30@test.local', 'authenticated', 'authenticated', now(), now(), now());

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '30000000-0000-0000-0000-000000000201'::uuid,
  '30000000-0000-0000-0000-000000000101'::uuid,
  '30000000-0000-0000-0000-000000000001'::uuid,
  'Principal 30',
  'principal30@test.local'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '30000000-0000-0000-0000-000000000201'::uuid,
  id,
  '30000000-0000-0000-0000-000000000001'::uuid
from public.vai_tro
where ma = 'PRINCIPAL';

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values (
  '30000000-0000-0000-0000-000000000301'::uuid,
  '30000000-0000-0000-0000-000000000001'::uuid,
  '2030-2031',
  '2030-09-01',
  '2031-05-31',
  'dang_hoat_dong'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.fn_kiem_tra_san_sang_bao_cao(
    '30000000-0000-0000-0000-000000000301'::uuid,
    'mam_non',
    'mau_1_tu_danh_gia'
  )$$,
  'Principal can calculate report readiness even when report data is incomplete'
);

select * from finish();
rollback;
