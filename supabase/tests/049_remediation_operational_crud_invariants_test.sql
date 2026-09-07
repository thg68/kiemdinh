begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values ('49000000-0000-0000-0000-000000000001', 'Truong test R-017', 'mam_non', array['mam_non']::public.cap_hoc[]);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values ('49000000-0000-0000-0000-000000000002', '49000000-0000-0000-0000-000000000001', '2095-2096', '2095-08-01', '2096-07-31', 'dang_hoat_dong');

insert into auth.users(id, email, aud, role, created_at, updated_at) values
  ('49000000-0000-0000-0000-000000000011', 'principal-049@example.test', 'authenticated', 'authenticated', now(), now()),
  ('49000000-0000-0000-0000-000000000012', 'viewer-049@example.test', 'authenticated', 'authenticated', now(), now()),
  ('49000000-0000-0000-0000-000000000013', 'teacher-inactive-049@example.test', 'authenticated', 'authenticated', now(), now()),
  ('49000000-0000-0000-0000-000000000014', 'teacher-active-049@example.test', 'authenticated', 'authenticated', now(), now());

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email, trang_thai) values
  ('49000000-0000-0000-0000-000000000021', '49000000-0000-0000-0000-000000000011', '49000000-0000-0000-0000-000000000001', 'Hieu truong 049', 'principal-049@example.test', 'active'),
  ('49000000-0000-0000-0000-000000000022', '49000000-0000-0000-0000-000000000012', '49000000-0000-0000-0000-000000000001', 'Khach 049', 'viewer-049@example.test', 'active'),
  ('49000000-0000-0000-0000-000000000023', '49000000-0000-0000-0000-000000000013', '49000000-0000-0000-0000-000000000001', 'Giao vien nghi 049', 'teacher-inactive-049@example.test', 'inactive'),
  ('49000000-0000-0000-0000-000000000024', '49000000-0000-0000-0000-000000000014', '49000000-0000-0000-0000-000000000001', 'Giao vien 049', 'teacher-active-049@example.test', 'active');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select actor.user_id, role.id, '49000000-0000-0000-0000-000000000001'
from (values
  ('49000000-0000-0000-0000-000000000021'::uuid, 'PRINCIPAL'),
  ('49000000-0000-0000-0000-000000000022'::uuid, 'VIEWER'),
  ('49000000-0000-0000-0000-000000000023'::uuid, 'TEACHER'),
  ('49000000-0000-0000-0000-000000000024'::uuid, 'TEACHER')
) actor(user_id, role_code)
join public.vai_tro role on role.ma = actor.role_code;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '49000000-0000-0000-0000-000000000011', true);

select has_column('public', 'ke_hoach_cai_tien', 'archived_at', 'Ke hoach co trang thai luu tru');
select has_column('public', 'van_ban_lien_quan', 'archived_at', 'Van ban co trang thai luu tru');

select throws_ok(
  $$insert into public.van_ban_lien_quan(co_so_id, nam_hoc_id, ten, duong_dan)
    values ('49000000-0000-0000-0000-000000000001', '49000000-0000-0000-0000-000000000002', 'URL sai', 'javascript:alert(1)')$$,
  '23514', null, 'DB chan URL khong phai HTTP hoac HTTPS'
);

select throws_ok(
  $$insert into public.van_ban_lien_quan(co_so_id, nam_hoc_id, ten, ngay_hieu_luc, ngay_het_hieu_luc)
    values ('49000000-0000-0000-0000-000000000001', '49000000-0000-0000-0000-000000000002', 'Ngay sai', '2095-09-01', '2095-08-01')$$,
  '23514', null, 'DB chan ngay het hieu luc truoc ngay hieu luc'
);

insert into public.van_ban_lien_quan(id, co_so_id, nam_hoc_id, ten, duong_dan)
values ('49000000-0000-0000-0000-000000000031', '49000000-0000-0000-0000-000000000001', '49000000-0000-0000-0000-000000000002', 'Van ban hop le', 'https://example.test/document');

select lives_ok(
  $$update public.van_ban_lien_quan set archived_at = now() where id = '49000000-0000-0000-0000-000000000031'$$,
  'Van ban hop le co the duoc luu tru'
);
select is(
  (select archived_by from public.van_ban_lien_quan where id = '49000000-0000-0000-0000-000000000031'),
  '49000000-0000-0000-0000-000000000021'::uuid,
  'Nguoi luu tru duoc lay tu phien dang nhap'
);
select ok(
  exists (select 1 from public.nhat_ky_truy_cap where hanh_dong = 'RELATED_DOCUMENT_ARCHIVED' and doi_tuong_id = '49000000-0000-0000-0000-000000000031'),
  'Luu tru tao nhat ky mutation khong can log doc'
);

select throws_ok(
  $$select public.fn_phan_cong_tieu_chi_cho_nguoi_dung('49000000-0000-0000-0000-000000000002', 'mam_non', '49000000-0000-0000-0000-000000000022', array[]::uuid[], 'phu_trach_nhap_lieu')$$,
  '22023', 'Chỉ được phân công tài khoản đang hoạt động có vai trò Ủy viên/Tổ trưởng hoặc Giáo viên.',
  'Khong duoc phan cong tai khoan chi doc'
);
select throws_ok(
  $$select public.fn_phan_cong_tieu_chi_cho_nguoi_dung('49000000-0000-0000-0000-000000000002', 'mam_non', '49000000-0000-0000-0000-000000000023', array[]::uuid[], 'phu_trach_nhap_lieu')$$,
  '22023', 'Chỉ được phân công tài khoản đang hoạt động có vai trò Ủy viên/Tổ trưởng hoặc Giáo viên.',
  'Khong duoc phan cong giao vien da ngung hoat dong'
);
select lives_ok(
  $$select public.fn_phan_cong_tieu_chi_cho_nguoi_dung('49000000-0000-0000-0000-000000000002', 'mam_non', '49000000-0000-0000-0000-000000000024', array[]::uuid[], 'phu_trach_nhap_lieu')$$,
  'Giao vien dang hoat dong co the nhan phan cong'
);

select * from finish();
rollback;
