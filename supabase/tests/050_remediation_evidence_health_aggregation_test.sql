begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(5);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values ('50000000-0000-0000-0000-000000000001', 'Truong test suc khoe', 'mam_non', array['mam_non']::public.cap_hoc[]);

insert into public.nam_hoc(id, co_so_id, bo_tieu_chuan_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
select '50000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', standard_set.id,
  '2094-2095', '2094-08-01', '2095-07-31', 'dang_hoat_dong'
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non' and standard_set.trang_thai = 'dang_ap_dung'
order by standard_set.version desc limit 1;

insert into auth.users(id, email, aud, role, created_at, updated_at) values
  ('50000000-0000-0000-0000-000000000011', 'principal-050@example.test', 'authenticated', 'authenticated', now(), now()),
  ('50000000-0000-0000-0000-000000000012', 'teacher-050@example.test', 'authenticated', 'authenticated', now(), now());
insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email) values
  ('50000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000001', 'Hieu truong 050', 'principal-050@example.test'),
  ('50000000-0000-0000-0000-000000000022', '50000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000001', 'Giao vien 050', 'teacher-050@example.test');
insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select actor.user_id, role.id, '50000000-0000-0000-0000-000000000001'
from (values
  ('50000000-0000-0000-0000-000000000021'::uuid, 'PRINCIPAL'),
  ('50000000-0000-0000-0000-000000000022'::uuid, 'TEACHER')
) actor(user_id, role_code)
join public.vai_tro role on role.ma = actor.role_code;

insert into public.minh_chung(id, co_so_id, nam_hoc_id, ma, ten, hash_tep, ngay_het_gia_tri, nguoi_tai_len) values
  ('50000000-0000-0000-0000-000000000031', '50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'MC.1.1.91', 'Minh chung het han', repeat('a', 64), current_date - 1, '50000000-0000-0000-0000-000000000021'),
  ('50000000-0000-0000-0000-000000000032', '50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'MC.1.1.92', 'Minh chung mo coi trung hash', repeat('a', 64), null, '50000000-0000-0000-0000-000000000021');

insert into public.minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, la_tieu_chi_goc, created_by)
select '50000000-0000-0000-0000-000000000031', criterion.id, true, '50000000-0000-0000-0000-000000000021'
from public.v_tieu_chi_nam_hoc criterion
where criterion.co_so_id = '50000000-0000-0000-0000-000000000001'
  and criterion.nam_hoc_id = '50000000-0000-0000-0000-000000000002'
  and criterion.ma = '1.1';

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000011', true);

select is(jsonb_array_length(public.fn_suc_khoe_minh_chung('50000000-0000-0000-0000-000000000002')->'expired'), 1, 'Tong hop dung minh chung het han');
select is(jsonb_array_length(public.fn_suc_khoe_minh_chung('50000000-0000-0000-0000-000000000002')->'orphans'), 1, 'Tong hop dung minh chung mo coi');
select is(jsonb_array_length(public.fn_suc_khoe_minh_chung('50000000-0000-0000-0000-000000000002')->'duplicate_groups'), 1, 'Tong hop dung nhom trung hash');
select is(jsonb_array_length(public.fn_suc_khoe_minh_chung('50000000-0000-0000-0000-000000000002')->'empty_criteria'), 14, 'Tong hop dung tieu chi chua co minh chung');

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000012', true);
select throws_ok(
  $$select public.fn_suc_khoe_minh_chung('50000000-0000-0000-0000-000000000002')$$,
  '42501', 'Bạn không có quyền xem tổng hợp sức khỏe minh chứng.',
  'Giao vien khong xem duoc metric toan don vi'
);

select * from finish();
rollback;
