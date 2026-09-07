begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(7);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '00000000-0000-0000-0000-00000000c101',
  'principal-c@audit.test',
  'authenticated',
  'authenticated',
  now(),
  now()
);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '00000000-0000-0000-0000-00000000c001',
  'Audit Tenant C',
  'AUDIT-C',
  'mam_non',
  array['mam_non']::cap_hoc[]
);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values (
  '00000000-0000-0000-0000-00000000c011',
  '00000000-0000-0000-0000-00000000c001',
  '2098-2099',
  '2098-08-01',
  '2099-07-31',
  'dang_hoat_dong'
);

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '00000000-0000-0000-0000-00000000c201',
  '00000000-0000-0000-0000-00000000c101',
  '00000000-0000-0000-0000-00000000c001',
  'Principal C',
  'principal-c@audit.test'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '00000000-0000-0000-0000-00000000c201',
  id,
  '00000000-0000-0000-0000-00000000c001'
from public.vai_tro
where ma = 'PRINCIPAL';

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, storage_path, nguoi_tai_len
)
values (
  '00000000-0000-0000-0000-00000000c301',
  '00000000-0000-0000-0000-00000000c001',
  '00000000-0000-0000-0000-00000000c011',
  'MC.1.1.96',
  'Evidence C',
  '00000000-0000-0000-0000-00000000c001/00000000-0000-0000-0000-00000000c011/evidence-c.pdf',
  '00000000-0000-0000-0000-00000000c201'
);

-- Ban ghi cu duoc giu lai trong CSDL nhung khong hien tren trang Nhat ky.
insert into public.nhat_ky_truy_cap(
  co_so_id, nguoi_dung_id, hanh_dong, doi_tuong
)
values (
  '00000000-0000-0000-0000-00000000c001',
  '00000000-0000-0000-0000-00000000c201',
  'EVIDENCE_LIST_READ',
  'minh_chung'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.fn_log_user_access('EVIDENCE_LIST_READ', null, '{"source":"audit-test"}'::jsonb)$$,
  'Client cu van co the goi RPC doc ma khong bi loi'
);

select is(
  (
    select count(*)
    from public.nhat_ky_truy_cap
    where hanh_dong = 'EVIDENCE_LIST_READ'
  ),
  0::bigint,
  'Nhat ky khong hien hanh dong doc, ke ca lich su cu'
);

select lives_ok(
  $$select public.fn_xac_minh_minh_chung(
    '00000000-0000-0000-0000-00000000c301',
    'da_xac_minh'
  )$$,
  'Xac minh minh chung van hoat dong'
);

select throws_ok(
  $$select public.fn_log_user_access('FORGED_ACTION', null, '{}'::jsonb)$$,
  'P0001',
  'Hanh dong nhat ky khong duoc phep.',
  'RPC van tu choi hanh dong gia mao'
);

set local role postgres;

select is(
  (
    select count(*)
    from public.nhat_ky_truy_cap
    where co_so_id = '00000000-0000-0000-0000-00000000c001'
      and hanh_dong = 'EVIDENCE_LIST_READ'
  ),
  1::bigint,
  'Hanh dong doc moi khong duoc luu vao CSDL'
);

select is(
  (
    select count(*)
    from public.nhat_ky_truy_cap
    where co_so_id = '00000000-0000-0000-0000-00000000c001'
      and hanh_dong = 'EVIDENCE_STATUS_UPDATED'
      and doi_tuong_id = '00000000-0000-0000-0000-00000000c301'
  ),
  1::bigint,
  'Thao tac phe duyet minh chung van duoc ghi nhat ky'
);

select is(
  (
    select trang_thai_xac_minh::text
    from public.minh_chung
    where id = '00000000-0000-0000-0000-00000000c301'
  ),
  'da_xac_minh',
  'Trang thai minh chung duoc cap nhat dung'
);

select * from finish();
rollback;
