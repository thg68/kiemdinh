begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(4);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values (
  '47000000-0000-0000-0000-000000000001',
  'Truong kiem thu niem phong bao cao',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  '47000000-0000-0000-0000-000000000002',
  '47000000-0000-0000-0000-000000000001',
  '2097-2098', '2097-08-01', '2098-07-31', 'dang_hoat_dong', standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
order by standard_set.version desc
limit 1;

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '47000000-0000-0000-0000-000000000003',
  'principal-047@example.test',
  'authenticated', 'authenticated', now(), now()
);

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '47000000-0000-0000-0000-000000000004',
  '47000000-0000-0000-0000-000000000003',
  '47000000-0000-0000-0000-000000000001',
  'Hieu truong kiem thu niem phong',
  'principal-047@example.test'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '47000000-0000-0000-0000-000000000004', role.id,
  '47000000-0000-0000-0000-000000000001'
from public.vai_tro role
where role.ma = 'PRINCIPAL';

insert into public.tu_danh_gia(
  id, co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc,
  mo_ta_muc_1, dat_muc_1, muc_dat, nguoi_nhap
)
select
  '47000000-0000-0000-0000-000000000005',
  '47000000-0000-0000-0000-000000000001',
  '47000000-0000-0000-0000-000000000002',
  criterion.id, 'mam_non', 'Hien trang luc xuat file', false, 0,
  '47000000-0000-0000-0000-000000000004'
from public.v_tieu_chi_nam_hoc criterion
where criterion.nam_hoc_id = '47000000-0000-0000-0000-000000000002'
  and criterion.ma = '1.1';

set local role authenticated;
select set_config('request.jwt.claim.sub', '47000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  length(public.fn_lay_niem_phong_nguon_bao_cao(
    '47000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia'
  ) ->> 'digest'),
  64,
  'Digest nguon co dung 64 ky tu'
);

select is(
  public.fn_lay_niem_phong_nguon_bao_cao(
    '47000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia'
  ) ->> 'digest',
  public.fn_lay_niem_phong_nguon_bao_cao(
    '47000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia'
  ) ->> 'digest',
  'Nguon khong doi tao digest on dinh'
);

select lives_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    '47000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia',
    'cho_duyet', null, 'mau-1.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    100, repeat('a', 64), '{}'::jsonb, null,
    (public.fn_lay_niem_phong_nguon_bao_cao(
      '47000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia'
    ) ->> 'digest')
  )$$,
  'Luu niem phong nguon vao ban bao cao cho duyet'
);

set local role postgres;
update public.tu_danh_gia
set mo_ta_muc_1 = 'Hien trang da bi thay doi sau khi xuat'
where id = '47000000-0000-0000-0000-000000000005';

set local role authenticated;
select set_config('request.jwt.claim.sub', '47000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    '47000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia',
    'da_phe_duyet',
    '47000000-0000-0000-0000-000000000001/47000000-0000-0000-0000-000000000002/mau_1_tu_danh_gia/snapshots/mau-1.docx',
    'mau-1.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    100, repeat('a', 64), '{}'::jsonb,
    (select id from public.bao_cao where co_so_id = '47000000-0000-0000-0000-000000000001'),
    (select source_digest from public.bao_cao where co_so_id = '47000000-0000-0000-0000-000000000001')
  )$$,
  '40001',
  'Du lieu nguon da thay doi ke tu khi xuat file. Hay xuat lai bao cao.',
  'Tu choi phe duyet khi noi dung tu danh gia da thay doi'
);

select * from finish();
rollback;
