begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(3);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '56000000-0000-0000-0000-000000000001',
  'Truong kiem tra readiness du lieu that',
  'READINESS-REAL-056',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  '56000000-0000-0000-0000-000000000011',
  '56000000-0000-0000-0000-000000000001',
  '2096-2097',
  '2096-08-01',
  '2097-05-31',
  'dang_hoat_dong',
  standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
  and standard_set.trang_thai = 'dang_ap_dung'
order by standard_set.version desc
limit 1;

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '56000000-0000-0000-0000-000000000021',
  'principal-readiness-056@example.test',
  'authenticated',
  'authenticated',
  now(),
  now()
);

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '56000000-0000-0000-0000-000000000031',
  '56000000-0000-0000-0000-000000000021',
  '56000000-0000-0000-0000-000000000001',
  'Hieu truong kiem tra readiness',
  'principal-readiness-056@example.test'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '56000000-0000-0000-0000-000000000031',
  role.id,
  '56000000-0000-0000-0000-000000000001'
from public.vai_tro role
where role.ma = 'PRINCIPAL';

insert into public.tu_danh_gia(
  id, co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc,
  mo_ta_muc_1, muc_dat, nguoi_nhap, la_du_lieu_demo
)
select
  '56000000-0000-0000-0000-000000000041',
  criterion.co_so_id,
  criterion.nam_hoc_id,
  criterion.id,
  'mam_non',
  '[DEMO] Mo ta khong duoc tinh vao bao cao that',
  0,
  '56000000-0000-0000-0000-000000000031',
  true
from public.v_tieu_chi_nam_hoc criterion
where criterion.co_so_id = '56000000-0000-0000-0000-000000000001'
  and criterion.nam_hoc_id = '56000000-0000-0000-0000-000000000011'
  and criterion.ma = '1.1';

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, trang_thai_xac_minh,
  nguoi_tai_len, nguoi_xac_minh, ngay_xac_minh, la_du_lieu_demo
)
values (
  '56000000-0000-0000-0000-000000000051',
  '56000000-0000-0000-0000-000000000001',
  '56000000-0000-0000-0000-000000000011',
  'MC.DEMO.056',
  '[DEMO] Minh chung khong duoc tinh vao readiness',
  'da_xac_minh',
  '56000000-0000-0000-0000-000000000031',
  '56000000-0000-0000-0000-000000000031',
  now(),
  true
);

insert into public.minh_chung_tieu_chi(
  minh_chung_id, tieu_chi_id, la_tieu_chi_goc, created_by
)
select
  '56000000-0000-0000-0000-000000000051',
  criterion.id,
  true,
  '56000000-0000-0000-0000-000000000031'
from public.v_tieu_chi_nam_hoc criterion
where criterion.co_so_id = '56000000-0000-0000-0000-000000000001'
  and criterion.nam_hoc_id = '56000000-0000-0000-0000-000000000011'
  and criterion.ma = '1.1';

insert into public.tu_danh_gia_minh_chung(
  co_so_id, nam_hoc_id, tu_danh_gia_id, minh_chung_id, created_by
)
values (
  '56000000-0000-0000-0000-000000000001',
  '56000000-0000-0000-0000-000000000011',
  '56000000-0000-0000-0000-000000000041',
  '56000000-0000-0000-0000-000000000051',
  '56000000-0000-0000-0000-000000000031'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '56000000-0000-0000-0000-000000000021',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  public.fn_minh_chung_hop_le_cho_tieu_chi_cap(
    '56000000-0000-0000-0000-000000000001',
    '56000000-0000-0000-0000-000000000011',
    'mam_non',
    (
      select criterion.id
      from public.v_tieu_chi_nam_hoc criterion
      where criterion.co_so_id = '56000000-0000-0000-0000-000000000001'
        and criterion.nam_hoc_id = '56000000-0000-0000-0000-000000000011'
        and criterion.ma = '1.1'
    )
  ),
  false,
  'Minh chung demo khong duoc xem la minh chung hop le cua tieu chi'
);

select is(
  jsonb_array_length(
    public.fn_kiem_tra_san_sang_bao_cao(
      '56000000-0000-0000-0000-000000000011',
      'mam_non',
      'mau_1_tu_danh_gia'
    ) -> 'missing_criteria'
  ),
  15,
  'Ban tu danh gia demo khong lam giam danh sach tieu chi con thieu'
);

select is(
  jsonb_array_length(
    public.fn_kiem_tra_san_sang_bao_cao(
      '56000000-0000-0000-0000-000000000011',
      'mam_non',
      'mau_1_tu_danh_gia'
    ) -> 'missing_evidence'
  ),
  15,
  'Minh chung demo khong lam giam danh sach minh chung con thieu'
);

select * from finish();
rollback;
