begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(2);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values (
  '60000000-0000-0000-0000-000000000001',
  'Truong kiem thu snapshot cho duyet',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id)
select
  '60000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000001',
  '2100-2101', '2100-08-01', '2101-07-31', 'dang_hoat_dong', standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
order by standard_set.version desc
limit 1;

insert into public.bao_cao(
  id, co_so_id, nam_hoc_id, cap_hoc, loai_bao_cao, version, trang_thai,
  storage_path, ten_tep_goc, mime_type, kich_thuoc, sha256, source_digest
) values (
  '60000000-0000-0000-0000-000000000003',
  '60000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000002',
  'mam_non', 'mau_1_tu_danh_gia', 1, 'cho_duyet',
  '60000000-0000-0000-0000-000000000001/60000000-0000-0000-0000-000000000002/mau_1/snapshot.docx',
  'snapshot.docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  100, repeat('a', 64), repeat('b', 64)
);

select throws_ok(
  $$update public.bao_cao
    set ten_tep_goc = 'ghi-de.docx'
    where id = '60000000-0000-0000-0000-000000000003'$$,
  '42501',
  'Ban bao cao da gui duyet khong the ghi de.',
  'Khong ghi de snapshot dang cho duyet'
);

select lives_ok(
  $$update public.bao_cao
    set trang_thai = 'tra_lai', ly_do_tra_lai = 'Can bo sung noi dung bao cao.'
    where id = '60000000-0000-0000-0000-000000000003'$$,
  'Van cho phep chuyen snapshot cho duyet sang trang thai khac'
);

select * from finish();
rollback;
