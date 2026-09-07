begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.hoi_dong_tu_danh_gia'::regclass
      and conname = 'uq_hoi_dong_co_so_nam_hoc'
      and contype = 'u'
  ),
  'Moi don vi chi co mot hoi dong trong mot nam hoc'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.ke_hoach_cai_tien'::regclass
      and conname = 'fk_ke_hoach_phu_trach_cung_co_so'
      and contype = 'f'
  ),
  'Ke hoach rang buoc nguoi phu trach thuoc cung don vi'
);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values
  ('17000000-0000-0000-0000-000000000101', 'Sprint 17 Tenant A', 'SPRINT17-A', 'mam_non', array['mam_non']::public.cap_hoc[]),
  ('17000000-0000-0000-0000-000000000102', 'Sprint 17 Tenant B', 'SPRINT17-B', 'mam_non', array['mam_non']::public.cap_hoc[]);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values
  ('17000000-0000-0000-0000-000000000111', '17000000-0000-0000-0000-000000000101', '2097-2098', '2097-08-01', '2098-07-31', 'chuan_bi'),
  ('17000000-0000-0000-0000-000000000112', '17000000-0000-0000-0000-000000000102', '2097-2098', '2097-08-01', '2098-07-31', 'chuan_bi');

insert into auth.users(id, email, aud, role, created_at, updated_at)
values
  ('17000000-0000-0000-0000-000000000201', 'user-a@sprint17.test', 'authenticated', 'authenticated', now(), now()),
  ('17000000-0000-0000-0000-000000000202', 'user-b@sprint17.test', 'authenticated', 'authenticated', now(), now())
on conflict (id) do nothing;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values
  ('17000000-0000-0000-0000-000000000301', '17000000-0000-0000-0000-000000000201', '17000000-0000-0000-0000-000000000101', 'User Tenant A', 'user-a@sprint17.test'),
  ('17000000-0000-0000-0000-000000000302', '17000000-0000-0000-0000-000000000202', '17000000-0000-0000-0000-000000000102', 'User Tenant B', 'user-b@sprint17.test');

insert into public.hoi_dong_tu_danh_gia(id, co_so_id, nam_hoc_id, ten)
values (
  '17000000-0000-0000-0000-000000000401',
  '17000000-0000-0000-0000-000000000101',
  '17000000-0000-0000-0000-000000000111',
  'Hoi dong Sprint 17'
);

select throws_ok(
  $$ insert into public.hoi_dong_tu_danh_gia(id, co_so_id, nam_hoc_id, ten)
     values (
       '17000000-0000-0000-0000-000000000402',
       '17000000-0000-0000-0000-000000000101',
       '17000000-0000-0000-0000-000000000111',
       'Hoi dong trung'
     ) $$,
  '23505',
  null,
  'Khong tao duoc hoi dong thu hai trong cung don vi va nam hoc'
);

-- Trigger audit mutation cần actor thuộc đúng đơn vị, kể cả khi fixture chạy bằng owner.
select set_config('request.jwt.claim.sub', '17000000-0000-0000-0000-000000000201', true);

insert into public.ke_hoach_cai_tien(
  id, co_so_id, nam_hoc_id, phu_trach_id, noi_dung
)
values (
  '17000000-0000-0000-0000-000000000411',
  '17000000-0000-0000-0000-000000000101',
  '17000000-0000-0000-0000-000000000111',
  '17000000-0000-0000-0000-000000000301',
  'Ke hoach dung don vi'
);

select throws_ok(
  $$ insert into public.ke_hoach_cai_tien(
       id, co_so_id, nam_hoc_id, phu_trach_id, noi_dung
     ) values (
       '17000000-0000-0000-0000-000000000412',
       '17000000-0000-0000-0000-000000000101',
       '17000000-0000-0000-0000-000000000111',
       '17000000-0000-0000-0000-000000000302',
       'Ke hoach sai don vi'
     ) $$,
  '23503',
  null,
  'Khong gan nguoi phu trach cua don vi khac'
);

select ok(
  not has_table_privilege('anon', 'public.hoi_dong_tu_danh_gia', 'TRUNCATE')
    and not has_table_privilege('anon', 'public.hoi_dong_tu_danh_gia', 'TRIGGER')
    and not has_table_privilege('anon', 'public.hoi_dong_tu_danh_gia', 'REFERENCES')
    and not has_table_privilege('authenticated', 'public.hoi_dong_tu_danh_gia', 'TRUNCATE')
    and not has_table_privilege('authenticated', 'public.hoi_dong_tu_danh_gia', 'TRIGGER')
    and not has_table_privilege('authenticated', 'public.hoi_dong_tu_danh_gia', 'REFERENCES'),
  'Thu hoi quyen DDL thua tren bang nghiep vu'
);

select is(
  (
    select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
  ),
  0::bigint,
 'Anon va authenticated khong con quyen TRUNCATE TRIGGER REFERENCES trong public'
);

create table public.sprint17_default_privilege_probe(id bigint);

select ok(
  not has_table_privilege('anon', 'public.sprint17_default_privilege_probe', 'TRUNCATE')
    and not has_table_privilege('anon', 'public.sprint17_default_privilege_probe', 'TRIGGER')
    and not has_table_privilege('anon', 'public.sprint17_default_privilege_probe', 'REFERENCES')
    and not has_table_privilege('authenticated', 'public.sprint17_default_privilege_probe', 'TRUNCATE')
    and not has_table_privilege('authenticated', 'public.sprint17_default_privilege_probe', 'TRIGGER')
    and not has_table_privilege('authenticated', 'public.sprint17_default_privilege_probe', 'REFERENCES'),
  'Quan he tao sau migration cung khong nhan quyen DDL thua'
);

select * from finish();
rollback;
