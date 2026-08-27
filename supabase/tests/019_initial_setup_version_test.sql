begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(5);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000019001',
  'initial-setup@version.test',
  'authenticated',
  'authenticated',
  now(),
  now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000019001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    select *
    from public.fn_khoi_tao_co_so_va_nam_hoc(
      'UAT Initial Setup School',
      'UAT-INITIAL-019',
      'mam_non',
      array['mam_non']::public.cap_hoc[],
      '2026-2027',
      '2026-08-01',
      '2027-05-31',
      'UAT Principal'
    )
  $$,
  'Tao don vi va nam hoc ban dau thanh cong sau khi khoa phien ban'
);

select is(
  (
    select count(*)
    from public.nam_hoc nh
    join public.bo_tieu_chuan btc on btc.id = nh.bo_tieu_chuan_id
    where nh.ten = '2026-2027'
      and btc.loai_hinh = 'mam_non'
      and btc.trang_thai = 'dang_ap_dung'
  ),
  1::bigint,
  'Nam hoc ban dau khoa bo tieu chuan dang ap dung dung loai hinh'
);

select is(
  (
    select count(*)
    from public.v_tieu_chi_nam_hoc vtc
    join public.nam_hoc nh on nh.id = vtc.nam_hoc_id
    where nh.ten = '2026-2027'
  ),
  15::bigint,
  'Nam hoc ban dau doc du 15 tieu chi tu phien ban da khoa'
);

select is(
  (
    select count(*)
    from public.nguoi_dung nd
    join public.nguoi_dung_vai_tro ndvt on ndvt.nguoi_dung_id = nd.id
    join public.vai_tro vt on vt.id = ndvt.vai_tro_id
    where nd.auth_user_id = '00000000-0000-0000-0000-000000019001'
      and vt.ma = 'PRINCIPAL'
  ),
  1::bigint,
  'Nguoi thiet lap ban dau nhan vai tro Hieu truong'
);

select throws_ok(
  $$
    select *
    from public.fn_khoi_tao_co_so_va_nam_hoc(
      'Second School',
      'UAT-SECOND-019',
      'mam_non',
      array['mam_non']::public.cap_hoc[],
      '2027-2028',
      '2027-08-01',
      '2028-05-31',
      'UAT Principal'
    )
  $$,
  'P0001',
  'Tai khoan nay da thuoc mot co so giao duc.',
  'Mot tai khoan khong duoc tu tao them don vi thu hai'
);

select * from finish();
rollback;
