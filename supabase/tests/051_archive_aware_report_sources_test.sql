begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(4);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values (
  '50000000-0000-0000-0000-000000000001',
  'Truong test archive report',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values (
  '50000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000001',
  '2096-2097',
  '2096-08-01',
  '2097-07-31',
  'dang_hoat_dong'
);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '50000000-0000-0000-0000-000000000011',
  'principal-051@example.test',
  'authenticated',
  'authenticated',
  now(),
  now()
);

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email, trang_thai)
values (
  '50000000-0000-0000-0000-000000000021',
  '50000000-0000-0000-0000-000000000011',
  '50000000-0000-0000-0000-000000000001',
  'Hieu truong 051',
  'principal-051@example.test',
  'active'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '50000000-0000-0000-0000-000000000021',
  role.id,
  '50000000-0000-0000-0000-000000000001'
from public.vai_tro role
where role.ma = 'PRINCIPAL';

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000011', true);

insert into public.ke_hoach_cai_tien(id, co_so_id, nam_hoc_id, noi_dung)
values (
  '50000000-0000-0000-0000-000000000031',
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  'Ke hoach se luu tru'
);

update public.ke_hoach_cai_tien
set archived_at = now()
where id = '50000000-0000-0000-0000-000000000031';

select ok(
  public.fn_kiem_tra_san_sang_bao_cao(
    '50000000-0000-0000-0000-000000000002',
    'mam_non',
    'mau_2_ke_hoach_cai_tien'
  ) -> 'other_blockers' @> '["Chua co dong ke hoach cai tien."]'::jsonb,
  'Ke hoach da luu tru khong lam Mau 2 san sang'
);

select is(
  public.fn_kiem_tra_san_sang_bao_cao(
    '50000000-0000-0000-0000-000000000002',
    'mam_non',
    'mau_2_ke_hoach_cai_tien'
  ) ->> 'ready',
  'false',
  'Readiness bi khoa khi chi con ke hoach da luu tru'
);

set local role postgres;

select is(
  jsonb_array_length(public.fn_report_source_manifest_for_tenant(
    '50000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    'mam_non',
    'mau_2_ke_hoach_cai_tien'
  ) -> 'ke_hoach_cai_tien'),
  0,
  'Manifest khong chua ke hoach da luu tru'
);

update public.ke_hoach_cai_tien
set archived_at = null
where id = '50000000-0000-0000-0000-000000000031';

select is(
  jsonb_array_length(public.fn_report_source_manifest_for_tenant(
    '50000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    'mam_non',
    'mau_2_ke_hoach_cai_tien'
  ) -> 'ke_hoach_cai_tien'),
  1,
  'Manifest chua lai ke hoach sau khi khoi phuc'
);

select * from finish();
rollback;
