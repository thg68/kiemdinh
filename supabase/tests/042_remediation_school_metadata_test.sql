begin;
\ir _bootstrap.pgtap
create extension if not exists pgtap;
select plan(10);

select ok(public.fn_cap_hoc_hop_loai_hinh('mam_non', array['mam_non']::public.cap_hoc[]), 'Mam non chi dung cap mam non');
select ok(public.fn_cap_hoc_hop_loai_hinh('pho_thong', array['tieu_hoc', 'thcs']::public.cap_hoc[]), 'Pho thong co the co nhieu cap pho thong');
select ok(public.fn_cap_hoc_hop_loai_hinh('gdtx', array['gdtx']::public.cap_hoc[]), 'GDTX chi dung cap GDTX');
select ok(not public.fn_cap_hoc_hop_loai_hinh('mam_non', '{}'::public.cap_hoc[]), 'Khong chap nhan danh sach cap rong');
select ok(not public.fn_cap_hoc_hop_loai_hinh('pho_thong', array['mam_non']::public.cap_hoc[]), 'Khong tron cap mam non vao pho thong');
select ok(not public.fn_cap_hoc_hop_loai_hinh('gdtx', array['gdtx', 'thpt']::public.cap_hoc[]), 'Khong tron cap THPT vao GDTX');

select throws_ok(
  $$insert into public.co_so_giao_duc(ten, loai_hinh, cap_hoc) values ('', 'mam_non', array['mam_non']::public.cap_hoc[])$$,
  '23514', null, 'DB chan ten don vi rong'
);

select throws_ok(
  $$insert into public.co_so_giao_duc(ten, loai_hinh, cap_hoc) values ('Don vi sai cap', 'mam_non', array['thcs']::public.cap_hoc[])$$,
  '23514', null, 'DB chan cap hoc khong phu hop loai hinh'
);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values ('00000000-0000-0000-0000-000000042001', 'Don vi hop le', 'pho_thong', array['tieu_hoc', 'thcs']::public.cap_hoc[]);

select lives_ok(
  $$insert into public.nam_hoc(co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
    values ('00000000-0000-0000-0000-000000042001', '2099-2100', '2099-08-01', '2100-06-30', 'chuan_bi')$$,
  'DB chap nhan metadata nam hoc hop le'
);

select throws_ok(
  $$insert into public.nam_hoc(co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
    values ('00000000-0000-0000-0000-000000042001', '2099', '2099-08-01', '2100-06-30', 'chuan_bi')$$,
  '23514', null, 'DB chan ten nam hoc sai dinh dang'
);

select * from finish();
rollback;
