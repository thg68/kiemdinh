begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(6);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values (
  '48000000-0000-0000-0000-000000000001',
  'Truong kiem thu quyen hoi dong',
  'mam_non', array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values (
  '48000000-0000-0000-0000-000000000002',
  '48000000-0000-0000-0000-000000000001',
  '2096-2097', '2096-08-01', '2097-07-31', 'dang_hoat_dong'
);

insert into auth.users(id, email, aud, role, created_at, updated_at) values
  ('48000000-0000-0000-0000-000000000011', 'principal-048@example.test', 'authenticated', 'authenticated', now(), now()),
  ('48000000-0000-0000-0000-000000000012', 'secretary-048@example.test', 'authenticated', 'authenticated', now(), now());

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email) values
  ('48000000-0000-0000-0000-000000000021', '48000000-0000-0000-0000-000000000011', '48000000-0000-0000-0000-000000000001', 'Hieu truong 048', 'principal-048@example.test'),
  ('48000000-0000-0000-0000-000000000022', '48000000-0000-0000-0000-000000000012', '48000000-0000-0000-0000-000000000001', 'Thu ky 048', 'secretary-048@example.test');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select actor.user_id, role.id, '48000000-0000-0000-0000-000000000001'
from (values
  ('48000000-0000-0000-0000-000000000021'::uuid, 'PRINCIPAL'),
  ('48000000-0000-0000-0000-000000000022'::uuid, 'SECRETARY')
) actor(user_id, role_code)
join public.vai_tro role on role.ma = actor.role_code;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '48000000-0000-0000-0000-000000000012', true);

select ok(public.fn_has_permission('council.read'), 'Thu ky duoc doc thong tin hoi dong');
select isnt(public.fn_has_permission('council.manage'), true, 'Thu ky khong duoc quan ly thanh vien hoi dong');
select throws_ok(
  $$insert into public.hoi_dong_tu_danh_gia(co_so_id, nam_hoc_id, ten)
    values ('48000000-0000-0000-0000-000000000001', '48000000-0000-0000-0000-000000000002', 'Hoi dong do Thu ky tao')$$,
  '42501', null,
  'RLS chan Thu ky tao hoi dong'
);

select set_config('request.jwt.claim.sub', '48000000-0000-0000-0000-000000000011', true);
select ok(public.fn_has_permission('council.manage'), 'Hieu truong co quyen quan ly hoi dong');
select lives_ok(
  $$insert into public.hoi_dong_tu_danh_gia(co_so_id, nam_hoc_id, ten)
    values ('48000000-0000-0000-0000-000000000001', '48000000-0000-0000-0000-000000000002', 'Hoi dong hop le')$$,
  'Hieu truong tao duoc hoi dong'
);

set local role postgres;
select throws_ok(
  $$insert into public.bao_cao(
      co_so_id, nam_hoc_id, cap_hoc, loai_bao_cao, trang_thai
    ) values (
      '48000000-0000-0000-0000-000000000001',
      '48000000-0000-0000-0000-000000000002',
      'mam_non', 'goi_minh_chung', 'da_phe_duyet'
    )$$,
  '23514',
  'Artifact xuat bo tro khong tham gia quy trinh phe duyet bao cao.',
  'DB chan dua ZIP vao kho bao cao da phe duyet'
);

select * from finish();
rollback;
