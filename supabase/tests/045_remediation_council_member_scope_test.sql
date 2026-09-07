begin;
\ir _bootstrap.pgtap
create extension if not exists pgtap;
select plan(5);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc) values
  ('00000000-0000-0000-0000-000000045001', 'Don vi A', 'mam_non', array['mam_non']::public.cap_hoc[]),
  ('00000000-0000-0000-0000-000000045002', 'Don vi B', 'mam_non', array['mam_non']::public.cap_hoc[]);
insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc) values
  ('00000000-0000-0000-0000-000000045011', '00000000-0000-0000-0000-000000045001', '2099-2100', '2099-08-01', '2100-06-30');
insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-000000045021', 'active-a-045@example.test'),
  ('00000000-0000-0000-0000-000000045022', 'locked-a-045@example.test'),
  ('00000000-0000-0000-0000-000000045023', 'active-b-045@example.test');
insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, trang_thai) values
  ('00000000-0000-0000-0000-000000045021', '00000000-0000-0000-0000-000000045021', '00000000-0000-0000-0000-000000045001', 'Nguoi A dang hoat dong', 'active'),
  ('00000000-0000-0000-0000-000000045022', '00000000-0000-0000-0000-000000045022', '00000000-0000-0000-0000-000000045001', 'Nguoi A bi khoa', 'locked'),
  ('00000000-0000-0000-0000-000000045023', '00000000-0000-0000-0000-000000045023', '00000000-0000-0000-0000-000000045002', 'Nguoi don vi B', 'active');
insert into public.hoi_dong_tu_danh_gia(id, co_so_id, nam_hoc_id, ten)
values ('00000000-0000-0000-0000-000000045031', '00000000-0000-0000-0000-000000045001', '00000000-0000-0000-0000-000000045011', 'Hoi dong A');

select lives_ok(
  $$insert into public.thanh_vien_hoi_dong(hoi_dong_id, nguoi_dung_id, co_so_id, nam_hoc_id, vai_tro_hoi_dong)
    values ('00000000-0000-0000-0000-000000045031', '00000000-0000-0000-0000-000000045021', '00000000-0000-0000-0000-000000045001', '00000000-0000-0000-0000-000000045011', 'chu_tich')$$,
  'Cho phep thanh vien active cung don vi'
);
select throws_ok(
  $$insert into public.thanh_vien_hoi_dong(hoi_dong_id, nguoi_dung_id, co_so_id, nam_hoc_id, vai_tro_hoi_dong)
    values ('00000000-0000-0000-0000-000000045031', '00000000-0000-0000-0000-000000045023', '00000000-0000-0000-0000-000000045001', '00000000-0000-0000-0000-000000045011', 'uy_vien')$$,
  '23514', 'Thanh vien phai dang hoat dong va thuoc cung don vi voi hoi dong.',
  'Chan nguoi dung khac don vi'
);
select throws_ok(
  $$insert into public.thanh_vien_hoi_dong(hoi_dong_id, nguoi_dung_id, co_so_id, nam_hoc_id, vai_tro_hoi_dong)
    values ('00000000-0000-0000-0000-000000045031', '00000000-0000-0000-0000-000000045022', '00000000-0000-0000-0000-000000045001', '00000000-0000-0000-0000-000000045011', 'uy_vien')$$,
  '23514', 'Thanh vien phai dang hoat dong va thuoc cung don vi voi hoi dong.',
  'Chan nguoi dung khong hoat dong'
);
select throws_ok(
  $$update public.thanh_vien_hoi_dong
    set nguoi_dung_id = '00000000-0000-0000-0000-000000045023'
    where hoi_dong_id = '00000000-0000-0000-0000-000000045031'$$,
  '23514', 'Thanh vien phai dang hoat dong va thuoc cung don vi voi hoi dong.',
  'Chan cap nhat thanh vien sang don vi khac'
);
select is(
  (select count(*) from public.v_thanh_vien_hoi_dong_can_ra_soat where hoi_dong_id = '00000000-0000-0000-0000-000000045031'),
  0::bigint,
  'Thanh vien hop le khong nam trong hang doi ra soat'
);

select * from finish();
rollback;
