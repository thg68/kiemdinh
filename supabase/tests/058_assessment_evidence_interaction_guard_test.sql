begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(4);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '58000000-0000-0000-0000-000000000101',
  'Assessment interaction test school',
  'ASSESSMENT-INTERACTION-TEST',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  '58000000-0000-0000-0000-000000000111',
  '58000000-0000-0000-0000-000000000101',
  '2098-2099', '2098-08-01', '2099-07-31', 'dang_hoat_dong', standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
  and standard_set.trang_thai = 'dang_ap_dung'
order by standard_set.version desc
limit 1;

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '58000000-0000-0000-0000-000000000201',
  'principal@assessment-interaction.test',
  'authenticated', 'authenticated', now(), now()
);

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '58000000-0000-0000-0000-000000000301',
  '58000000-0000-0000-0000-000000000201',
  '58000000-0000-0000-0000-000000000101',
  'Hieu truong test thao tac',
  'principal@assessment-interaction.test'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '58000000-0000-0000-0000-000000000301', role.id,
  '58000000-0000-0000-0000-000000000101'
from public.vai_tro role
where role.ma = 'PRINCIPAL';

create temporary table test_058_scope as
select criterion.id as tieu_chi_id
from public.v_tieu_chi_nam_hoc criterion
where criterion.nam_hoc_id = '58000000-0000-0000-0000-000000000111'
  and criterion.ma = '1.1';
grant select on table test_058_scope to authenticated;

insert into public.tu_danh_gia(
  id, co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc,
  mo_ta_muc_1, dat_muc_1, muc_dat, nguoi_nhap, trang_thai, la_du_lieu_demo
)
select
  '58000000-0000-0000-0000-000000000401',
  '58000000-0000-0000-0000-000000000101',
  '58000000-0000-0000-0000-000000000111',
  scope.tieu_chi_id, 'mam_non', '[DEMO] Ban ghi thu', false, 0,
  '58000000-0000-0000-0000-000000000301', 'cho_duyet', true
from test_058_scope scope;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '58000000-0000-0000-0000-000000000201', true);

select throws_ok(
  format(
    'select public.fn_cap_nhat_trang_thai_tu_danh_gia(%L, %L, %L, %L, %L)',
    '58000000-0000-0000-0000-000000000111'::uuid,
    'mam_non'::public.cap_hoc,
    (select tieu_chi_id from test_058_scope),
    'da_duyet'::public.trang_thai_tu_danh_gia,
    (select revision from public.tu_danh_gia where id = '58000000-0000-0000-0000-000000000401')
  ),
  '23514',
  'Khong the chot muc khi ban tu danh gia hoac minh chung con la du lieu thu.',
  'Du lieu thu khong the duoc chot muc'
);

select lives_ok(
  format(
    'select public.fn_cap_nhat_trang_thai_tu_danh_gia(%L, %L, %L, %L, %L)',
    '58000000-0000-0000-0000-000000000111'::uuid,
    'mam_non'::public.cap_hoc,
    (select tieu_chi_id from test_058_scope),
    'dang_ra_soat'::public.trang_thai_tu_danh_gia,
    (select revision from public.tu_danh_gia where id = '58000000-0000-0000-0000-000000000401')
  ),
  'Van co the tra du lieu thu ve ra soat'
);

select is(
  (select trang_thai::text from public.tu_danh_gia where id = '58000000-0000-0000-0000-000000000401'),
  'dang_ra_soat',
  'Trang thai duoc mo lai de sua du lieu'
);

set local role postgres;
update public.tu_danh_gia
set mo_ta_muc_1 = 'Noi dung thuc te da duoc ra soat'
where id = '58000000-0000-0000-0000-000000000401';

select is(
  (select la_du_lieu_demo from public.tu_danh_gia where id = '58000000-0000-0000-0000-000000000401'),
  false,
  'Co du lieu thu duoc go sau khi noi dung tu danh gia da thay bang du lieu that'
);

select * from finish();
rollback;
