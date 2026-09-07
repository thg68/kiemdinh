begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(4);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '33000000-0000-0000-0000-000000000101',
  'secretary33@test.local',
  'authenticated',
  'authenticated',
  now(),
  now()
);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '33000000-0000-0000-0000-000000000001',
  'Tenant 33',
  'T33',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  '33000000-0000-0000-0000-000000000011',
  '33000000-0000-0000-0000-000000000001',
  '2096-2097',
  '2096-08-01',
  '2097-07-31',
  'dang_hoat_dong',
  btc.id
from public.bo_tieu_chuan btc
where btc.loai_hinh = 'mam_non'
  and btc.trang_thai = 'dang_ap_dung'
order by btc.version desc
limit 1;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '33000000-0000-0000-0000-000000000201',
  '33000000-0000-0000-0000-000000000101',
  '33000000-0000-0000-0000-000000000001',
  'Secretary 33',
  'secretary33@test.local'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '33000000-0000-0000-0000-000000000201',
  vt.id,
  '33000000-0000-0000-0000-000000000001'
from public.vai_tro vt
where vt.ma = 'SECRETARY';

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, storage_path, nguoi_tai_len
)
values
  (
    '33000000-0000-0000-0000-000000000301',
    '33000000-0000-0000-0000-000000000001',
    '33000000-0000-0000-0000-000000000011',
    'MC.1.1.93',
    'Evidence 33 A',
    '33000000-0000-0000-0000-000000000001/33000000-0000-0000-0000-000000000011/a.pdf',
    '33000000-0000-0000-0000-000000000201'
  ),
  (
    '33000000-0000-0000-0000-000000000302',
    '33000000-0000-0000-0000-000000000001',
    '33000000-0000-0000-0000-000000000011',
    'MC.1.2.93',
    'Evidence 33 B',
    '33000000-0000-0000-0000-000000000001/33000000-0000-0000-0000-000000000011/b.pdf',
    '33000000-0000-0000-0000-000000000201'
  );

insert into public.minh_chung_tieu_chi(
  minh_chung_id, tieu_chi_id, la_tieu_chi_goc
)
select
  evidence.id,
  criterion.id,
  true
from (
  values
    ('33000000-0000-0000-0000-000000000301'::uuid, '1.1'::text),
    ('33000000-0000-0000-0000-000000000302'::uuid, '1.2'::text)
) as evidence(id, criterion_code)
join public.nam_hoc nh
  on nh.id = '33000000-0000-0000-0000-000000000011'
join public.tieu_chuan standard
  on standard.bo_id = nh.bo_tieu_chuan_id
join public.tieu_chi criterion
  on criterion.tieu_chuan_id = standard.id
  and criterion.ma = evidence.criterion_code;

insert into storage.objects(bucket_id, name)
values
  (
    'evidence',
    '33000000-0000-0000-0000-000000000001/33000000-0000-0000-0000-000000000011/a.pdf'
  ),
  (
    'evidence',
    '33000000-0000-0000-0000-000000000001/33000000-0000-0000-0000-000000000011/b.pdf'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '33000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  public.fn_has_permission(
    'evidence.verify',
    '33000000-0000-0000-0000-000000000001'
  ),
  true,
  'Thu ky co quyen xac minh minh chung'
);

select is(
  (
    select count(*)
    from public.minh_chung
    where co_so_id = '33000000-0000-0000-0000-000000000001'
  ),
  2::bigint,
  'Nguoi xac minh doc duoc toan bo minh chung trong don vi'
);

select is(
  (
    select count(*)
    from public.minh_chung_tieu_chi
    where minh_chung_id in (
      '33000000-0000-0000-0000-000000000301',
      '33000000-0000-0000-0000-000000000302'
    )
  ),
  2::bigint,
  'Nguoi xac minh doc duoc toan bo lien ket tieu chi'
);

select is(
  (
    select count(*)
    from storage.objects
    where bucket_id = 'evidence'
      and name like '33000000-0000-0000-0000-000000000001/%'
  ),
  2::bigint,
  'Nguoi xac minh doc duoc tep dinh kem qua Storage RLS'
);

select * from finish();
rollback;
