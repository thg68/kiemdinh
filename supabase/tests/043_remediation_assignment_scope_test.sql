begin;
\ir _bootstrap.pgtap
create extension if not exists pgtap;
select plan(5);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values ('00000000-0000-0000-0000-000000043001', 'Truong hai cap', 'pho_thong', array['tieu_hoc','thcs']::public.cap_hoc[]);
insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, bo_tieu_chuan_id)
select '00000000-0000-0000-0000-000000043002', '00000000-0000-0000-0000-000000043001',
  '2099-2100', '2099-08-01', '2100-06-30', standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'pho_thong'
order by standard_set.version desc
limit 1;
insert into auth.users(id, email) values ('00000000-0000-0000-0000-000000043003', 'assigned-043@example.test');
insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten)
values ('00000000-0000-0000-0000-000000043003', '00000000-0000-0000-0000-000000043003', '00000000-0000-0000-0000-000000043001', 'Nguoi duoc phan cong');
insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '00000000-0000-0000-0000-000000043003', role.id, '00000000-0000-0000-0000-000000043001'
from public.vai_tro role where role.ma = 'TEACHER';

select throws_ok(
  $$insert into public.phan_cong_tieu_chi(co_so_id, nam_hoc_id, nguoi_dung_id, tieu_chi_id)
    select '00000000-0000-0000-0000-000000043001', '00000000-0000-0000-0000-000000043002',
      '00000000-0000-0000-0000-000000043003', id from public.v_tieu_chi_nam_hoc
      where nam_hoc_id = '00000000-0000-0000-0000-000000043002' limit 1$$,
  '23514', 'Phân công mới phải xác định cấp học.', 'Phan cong moi bat buoc co cap hoc'
);

select throws_ok(
  $$insert into public.phan_cong_tieu_chi(co_so_id, nam_hoc_id, cap_hoc, nguoi_dung_id, tieu_chi_id)
    select '00000000-0000-0000-0000-000000043001', '00000000-0000-0000-0000-000000043002', 'thpt',
      '00000000-0000-0000-0000-000000043003', id from public.v_tieu_chi_nam_hoc
      where nam_hoc_id = '00000000-0000-0000-0000-000000043002' limit 1$$,
  '23514', 'Cấp học phân công không thuộc đơn vị.', 'DB chan cap khong thuoc don vi'
);

insert into public.phan_cong_tieu_chi(co_so_id, nam_hoc_id, cap_hoc, nguoi_dung_id, tieu_chi_id)
select '00000000-0000-0000-0000-000000043001', '00000000-0000-0000-0000-000000043002', 'tieu_hoc',
  '00000000-0000-0000-0000-000000043003', id from public.v_tieu_chi_nam_hoc
  where nam_hoc_id = '00000000-0000-0000-0000-000000043002' limit 1;
insert into public.phan_cong_tieu_chi(co_so_id, nam_hoc_id, cap_hoc, nguoi_dung_id, tieu_chi_id)
select '00000000-0000-0000-0000-000000043001', '00000000-0000-0000-0000-000000043002', 'thcs',
  '00000000-0000-0000-0000-000000043003', id from public.v_tieu_chi_nam_hoc
  where nam_hoc_id = '00000000-0000-0000-0000-000000043002' limit 1;

select is((select count(*) from public.phan_cong_tieu_chi where co_so_id = '00000000-0000-0000-0000-000000043001'), 2::bigint, 'Cung tieu chi co the phan cong rieng cho hai cap');
select is((select count(*) from public.v_phan_cong_can_ra_soat where co_so_id = '00000000-0000-0000-0000-000000043001'), 0::bigint, 'Phan cong moi khong nam trong hang doi ra soat');
select has_index('public', 'phan_cong_tieu_chi', 'uq_phan_cong_nam_nguoi_tieu_chi_cap', 'Co unique index theo cap hoc');

select * from finish();
rollback;
