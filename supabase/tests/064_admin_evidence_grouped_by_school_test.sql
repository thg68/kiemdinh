begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(5);

select ok(
  has_function_privilege(
    'authenticated',
    'public.fn_admin_tong_hop_minh_chung_theo_co_so(text, integer, integer)',
    'execute'
  ) and not has_function_privilege(
    'anon',
    'public.fn_admin_tong_hop_minh_chung_theo_co_so(text, integer, integer)',
    'execute'
  ),
  'Chi phien da dang nhap co the di toi cong tong hop kho minh chung'
);

insert into public.co_so_giao_duc(
  id, ten, ma_truong, loai_hinh, cap_hoc, trang_thai, tinh_thanh
)
values
  (
    '66000000-0000-0000-0000-000000000101',
    'Kho Minh Chung Truong A',
    'KHO-MC-A',
    'mam_non',
    array['mam_non']::public.cap_hoc[],
    'active',
    'Quang Ninh'
  ),
  (
    '66000000-0000-0000-0000-000000000102',
    'Kho Minh Chung Truong B',
    'KHO-MC-B',
    'mam_non',
    array['mam_non']::public.cap_hoc[],
    'active',
    'Quang Ninh'
  );

insert into auth.users(id, email, aud, role, email_confirmed_at, created_at, updated_at)
values (
  '66000000-0000-0000-0000-000000000201',
  'admin-evidence-school@test.local',
  'authenticated',
  'authenticated',
  now(),
  now(),
  now()
);

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '66000000-0000-0000-0000-000000000301',
  '66000000-0000-0000-0000-000000000201',
  '66000000-0000-0000-0000-000000000101',
  'Admin Evidence School',
  'admin-evidence-school@test.local'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '66000000-0000-0000-0000-000000000301',
  role.id,
  '66000000-0000-0000-0000-000000000101'
from public.vai_tro role
where role.ma = 'SYSTEM_ADMIN';

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  fixture.id,
  fixture.co_so_id,
  '2097-2098',
  '2097-08-01',
  '2098-07-31',
  'dang_hoat_dong',
  standard_set.id
from (
  values
    ('66000000-0000-0000-0000-000000000401'::uuid, '66000000-0000-0000-0000-000000000101'::uuid),
    ('66000000-0000-0000-0000-000000000402'::uuid, '66000000-0000-0000-0000-000000000102'::uuid)
) fixture(id, co_so_id)
cross join lateral (
  select standard.id
  from public.bo_tieu_chuan standard
  where standard.loai_hinh = 'mam_non'
  order by standard.version desc
  limit 1
) standard_set;

insert into public.minh_chung(
  id,
  co_so_id,
  nam_hoc_id,
  ma,
  ten,
  ngay_het_gia_tri,
  trang_thai_xac_minh,
  can_kiem_tra_ky_thuat
)
values
  (
    '66000000-0000-0000-0000-000000000501',
    '66000000-0000-0000-0000-000000000101',
    '66000000-0000-0000-0000-000000000401',
    'MC.GROUP.A.01',
    'Noi dung khong duoc tong hop tra ve',
    current_date - 1,
    'da_xac_minh',
    false
  ),
  (
    '66000000-0000-0000-0000-000000000502',
    '66000000-0000-0000-0000-000000000101',
    '66000000-0000-0000-0000-000000000401',
    'MC.GROUP.A.02',
    'Noi dung khong duoc tong hop tra ve',
    null,
    'cho_xac_minh',
    true
  ),
  (
    '66000000-0000-0000-0000-000000000503',
    '66000000-0000-0000-0000-000000000102',
    '66000000-0000-0000-0000-000000000402',
    'MC.GROUP.B.01',
    'Noi dung khong duoc tong hop tra ve',
    null,
    'da_xac_minh',
    false
  );

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '66000000-0000-0000-0000-000000000201', true);

select is(
  (
    select summary.tong_minh_chung
    from public.fn_admin_tong_hop_minh_chung_theo_co_so('KHO-MC-A', 25, 0) summary
    where summary.co_so_id = '66000000-0000-0000-0000-000000000101'
  ),
  2::bigint,
  'Tong hop dem rieng minh chung cua tung co so'
);

select is(
  (
    select summary.cho_xac_minh
    from public.fn_admin_tong_hop_minh_chung_theo_co_so('KHO-MC-A', 25, 0) summary
  ),
  1::bigint,
  'Tong hop dem dung minh chung cho xac minh'
);

select is(
  (
    select summary.can_kiem_tra
    from public.fn_admin_tong_hop_minh_chung_theo_co_so('KHO-MC-A', 25, 0) summary
  ),
  2::bigint,
  'Can kiem tra gom co thu cong, het han va thieu tham chieu'
);

select ok(
  not exists (
    select 1
    from public.fn_admin_tong_hop_minh_chung_theo_co_so(null, 25, 0) summary
    cross join lateral jsonb_object_keys(to_jsonb(summary)) field_name
    where field_name in ('ten', 'duong_dan', 'storage_path', 'hash_tep', 'ghi_chu')
  ),
  'Tong hop theo truong khong tra noi dung hoac tham chieu tep'
);

select * from finish();
rollback;
