begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(15);

create temporary table tap_checkpoints (
  checkpoint text not null,
  failed integer not null
) on commit drop;

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '00000000-0000-0000-0000-000000008001',
  'Versioning School',
  'VERSIONING-SCHOOL',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.bo_tieu_chuan(
  id, ma_van_ban, ten, ngay_hieu_luc, loai_hinh, version, trang_thai
)
values (
  '00000000-0000-0000-0000-000000008100',
  '57/2026/TT-BGDĐT',
  'TT57 Mam non V2 test',
  '2098-07-01',
  'mam_non',
  2,
  'dang_ap_dung'
);

insert into public.tieu_chuan(id, bo_id, so_thu_tu, ten)
select
  ('00000000-0000-0000-0000-' || lpad((8100 + old_standard.so_thu_tu)::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-000000008100',
  old_standard.so_thu_tu,
  old_standard.ten || ' V2'
from public.tieu_chuan old_standard
join public.bo_tieu_chuan old_set on old_set.id = old_standard.bo_id
where old_set.loai_hinh = 'mam_non'
  and old_set.version = 1;

insert into public.tieu_chi(
  id, tieu_chuan_id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, thu_tu
)
select
  gen_random_uuid(),
  new_standard.id,
  old_criterion.ma,
  case
    when old_criterion.ma = '1.1' then 'Ten tieu chi 1.1 cua V2'
    else old_criterion.ten || ' V2'
  end,
  old_criterion.la_bat_buoc,
  old_criterion.loai_hinh_ap_dung,
  old_criterion.thu_tu
from public.tieu_chi old_criterion
join public.tieu_chuan old_standard on old_standard.id = old_criterion.tieu_chuan_id
join public.bo_tieu_chuan old_set on old_set.id = old_standard.bo_id
join public.tieu_chuan new_standard
  on new_standard.bo_id = '00000000-0000-0000-0000-000000008100'
  and new_standard.so_thu_tu = old_standard.so_thu_tu
where old_set.loai_hinh = 'mam_non'
  and old_set.version = 1;

insert into public.muc_tieu_chi(tieu_chi_id, muc, noi_dung_yeu_cau)
select
  new_criterion.id,
  old_level.muc,
  old_level.noi_dung_yeu_cau || ' V2'
from public.muc_tieu_chi old_level
join public.tieu_chi old_criterion on old_criterion.id = old_level.tieu_chi_id
join public.tieu_chuan old_standard on old_standard.id = old_criterion.tieu_chuan_id
join public.bo_tieu_chuan old_set on old_set.id = old_standard.bo_id
join public.tieu_chuan new_standard
  on new_standard.bo_id = '00000000-0000-0000-0000-000000008100'
  and new_standard.so_thu_tu = old_standard.so_thu_tu
join public.tieu_chi new_criterion
  on new_criterion.tieu_chuan_id = new_standard.id
  and new_criterion.ma = old_criterion.ma
where old_set.loai_hinh = 'mam_non'
  and old_set.version = 1;

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  '00000000-0000-0000-0000-000000008201',
  '00000000-0000-0000-0000-000000008001',
  '2097-2098',
  '2097-08-01',
  '2098-06-30',
  'luu_tru',
  old_set.id
from public.bo_tieu_chuan old_set
where old_set.loai_hinh = 'mam_non'
  and old_set.version = 1;

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
values (
  '00000000-0000-0000-0000-000000008202',
  '00000000-0000-0000-0000-000000008001',
  '2098-2099',
  '2098-08-01',
  '2099-06-30',
  'dang_hoat_dong',
  '00000000-0000-0000-0000-000000008100'
);

select is(
  (
    select count(*)
    from public.v_tieu_chi_nam_hoc
    where nam_hoc_id = '00000000-0000-0000-0000-000000008201'
  ),
  15::bigint,
  'Y1 doc du 15 tieu chi cua V1'
);

select is(
  (
    select bo_version
    from public.v_tieu_chi_nam_hoc
    where nam_hoc_id = '00000000-0000-0000-0000-000000008201'
    limit 1
  ),
  1,
  'Y1 van gan V1 sau khi V2 ton tai'
);

select isnt(
  (
    select ten
    from public.v_tieu_chi_nam_hoc
    where nam_hoc_id = '00000000-0000-0000-0000-000000008201'
      and ma = '1.1'
  ),
  'Ten tieu chi 1.1 cua V2',
  'Tai tao Y1 khong dung noi dung V2'
);

select is(
  (
    select ten
    from public.v_tieu_chi_nam_hoc
    where nam_hoc_id = '00000000-0000-0000-0000-000000008202'
      and ma = '1.1'
  ),
  'Ten tieu chi 1.1 cua V2',
  'Y2 doc dung noi dung V2'
);

select throws_ok(
  $$
    insert into public.tu_danh_gia(
      co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc
    )
    select
      '00000000-0000-0000-0000-000000008001',
      '00000000-0000-0000-0000-000000008202',
      old_criterion.id,
      'mam_non'
    from public.tieu_chi old_criterion
    join public.tieu_chuan old_standard on old_standard.id = old_criterion.tieu_chuan_id
    join public.bo_tieu_chuan old_set on old_set.id = old_standard.bo_id
    where old_set.loai_hinh = 'mam_non'
      and old_set.version = 1
      and old_criterion.ma = '2.1'
  $$,
  'P0001',
  'Tieu chi khong thuoc phien ban bo tieu chuan cua nam hoc.',
  'DB chan tieu chi V1 trong tu danh gia Y2'
);

insert into tap_checkpoints values ('01-05 version binding', num_failed());

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, trang_thai_xac_minh, ngay_het_gia_tri
)
values
  ('00000000-0000-0000-0000-000000008301', '00000000-0000-0000-0000-000000008001', '00000000-0000-0000-0000-000000008202', 'MC.1.1.91', 'Cho xac minh', 'cho_xac_minh', '2099-12-31'),
  ('00000000-0000-0000-0000-000000008302', '00000000-0000-0000-0000-000000008001', '00000000-0000-0000-0000-000000008202', 'MC.1.2.91', 'Tu choi', 'tu_choi', '2099-12-31'),
  ('00000000-0000-0000-0000-000000008303', '00000000-0000-0000-0000-000000008001', '00000000-0000-0000-0000-000000008202', 'MC.1.3.91', 'Het han', 'da_xac_minh', '2020-01-01'),
  ('00000000-0000-0000-0000-000000008304', '00000000-0000-0000-0000-000000008001', '00000000-0000-0000-0000-000000008202', 'MC.1.4.91', 'Hop le', 'da_xac_minh', '2099-12-31'),
  ('00000000-0000-0000-0000-000000008305', '00000000-0000-0000-0000-000000008001', '00000000-0000-0000-0000-000000008201', 'MC.2.1.91', 'Nam cu', 'da_xac_minh', '2099-12-31');

insert into public.minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, la_tieu_chi_goc)
select evidence_id, criterion.id, true
from (
  values
    ('00000000-0000-0000-0000-000000008301'::uuid, '1.1'),
    ('00000000-0000-0000-0000-000000008302'::uuid, '1.2'),
    ('00000000-0000-0000-0000-000000008303'::uuid, '1.3'),
    ('00000000-0000-0000-0000-000000008304'::uuid, '1.4')
) input(evidence_id, criterion_code)
join public.tieu_chuan standard on standard.bo_id = '00000000-0000-0000-0000-000000008100'
join public.tieu_chi criterion
  on criterion.tieu_chuan_id = standard.id
  and criterion.ma = input.criterion_code;

insert into public.minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, la_tieu_chi_goc)
select
  '00000000-0000-0000-0000-000000008305',
  old_criterion.id,
  true
from public.tieu_chi old_criterion
join public.tieu_chuan old_standard on old_standard.id = old_criterion.tieu_chuan_id
join public.bo_tieu_chuan old_set on old_set.id = old_standard.bo_id
where old_set.loai_hinh = 'mam_non'
  and old_set.version = 1
  and old_criterion.ma = '2.1';

select is(
  (select count(*) from public.v_minh_chung_hop_le_danh_gia where nam_hoc_id = '00000000-0000-0000-0000-000000008202'),
  1::bigint,
  'View chi tra minh chung da xac minh con hieu luc'
);

select ok(
  not public.fn_minh_chung_hop_le_cho_tieu_chi(
    '00000000-0000-0000-0000-000000008001',
    '00000000-0000-0000-0000-000000008202',
    (select id from public.v_tieu_chi_nam_hoc where nam_hoc_id = '00000000-0000-0000-0000-000000008202' and ma = '1.1')
  ),
  'Minh chung cho xac minh khong duoc tinh'
);

select ok(
  not public.fn_minh_chung_hop_le_cho_tieu_chi(
    '00000000-0000-0000-0000-000000008001',
    '00000000-0000-0000-0000-000000008202',
    (select id from public.v_tieu_chi_nam_hoc where nam_hoc_id = '00000000-0000-0000-0000-000000008202' and ma = '1.2')
  ),
  'Minh chung bi tu choi khong duoc tinh'
);

select ok(
  not public.fn_minh_chung_hop_le_cho_tieu_chi(
    '00000000-0000-0000-0000-000000008001',
    '00000000-0000-0000-0000-000000008202',
    (select id from public.v_tieu_chi_nam_hoc where nam_hoc_id = '00000000-0000-0000-0000-000000008202' and ma = '1.3')
  ),
  'Minh chung het han khong duoc tinh'
);

select ok(
  public.fn_minh_chung_hop_le_cho_tieu_chi(
    '00000000-0000-0000-0000-000000008001',
    '00000000-0000-0000-0000-000000008202',
    (select id from public.v_tieu_chi_nam_hoc where nam_hoc_id = '00000000-0000-0000-0000-000000008202' and ma = '1.4')
  ),
  'Minh chung da xac minh con hieu luc duoc tinh'
);

insert into tap_checkpoints values ('06-10 evidence policy', num_failed());

select throws_ok(
  $$
    insert into public.tu_danh_gia(
      co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc,
      mo_ta_muc_1, dat_muc_1, muc_dat
    )
    select
      '00000000-0000-0000-0000-000000008001',
      '00000000-0000-0000-0000-000000008202',
      id,
      'mam_non',
      'Mo ta co minh chung chua xac minh',
      true,
      1
    from public.v_tieu_chi_nam_hoc
    where nam_hoc_id = '00000000-0000-0000-0000-000000008202'
      and ma = '1.1'
  $$,
  'P0001',
  'Chi minh chung da xac minh, con hieu luc va dung phien ban moi duoc dung de danh dau dat.',
  'DB chan danh dau dat bang minh chung chua xac minh'
);

insert into tap_checkpoints values ('11 unverified assessment', num_failed());

insert into public.tu_danh_gia(
  co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc,
  mo_ta_muc_1, dat_muc_1, muc_dat
)
select
  '00000000-0000-0000-0000-000000008001',
  '00000000-0000-0000-0000-000000008202',
  id,
  'mam_non',
  'Mo ta co minh chung hop le',
  true,
  1
from public.v_tieu_chi_nam_hoc
where nam_hoc_id = '00000000-0000-0000-0000-000000008202'
  and ma = '1.4';

select pass('DB chap nhan danh dau dat bang minh chung hop le');

insert into tap_checkpoints values ('12 verified assessment', num_failed());

select throws_ok(
  $$
    insert into public.minh_chung_tieu_chi(minh_chung_id, tieu_chi_id)
    select
      '00000000-0000-0000-0000-000000008305',
      id
    from public.v_tieu_chi_nam_hoc
    where nam_hoc_id = '00000000-0000-0000-0000-000000008202'
      and ma = '2.1'
  $$,
  'P0001',
  'Khong duoc gan minh chung vao tieu chi khac phien ban nam hoc.',
  'Minh chung nam cu khong tu dong duoc gan vao phien ban nam moi'
);

insert into tap_checkpoints values ('13 inherited evidence', num_failed());

select throws_ok(
  $$
    update public.nam_hoc
    set bo_tieu_chuan_id = (
      select id from public.bo_tieu_chuan where loai_hinh = 'mam_non' and version = 1
    )
    where id = '00000000-0000-0000-0000-000000008202'
  $$,
  'P0001',
  'Khong duoc doi phien ban bo tieu chuan sau khi nam hoc da co du lieu nghiep vu.',
  'Khong doi phien ban nam hoc sau khi da co du lieu'
);

insert into tap_checkpoints values ('14 immutable binding', num_failed());

select is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'nam_hoc'
      and column_name = 'bo_tieu_chuan_id'
      and is_nullable = 'NO'
  ),
  1::bigint,
  'bo_tieu_chuan_id la bat buoc sau backfill'
);

select * from finish();
insert into tap_checkpoints values ('11-15 database enforcement', num_failed());
select * from tap_checkpoints order by checkpoint;
rollback;
