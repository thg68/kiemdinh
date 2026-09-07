begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select ok(
  to_regclass('public.gioi_han_api') is not null,
  'Co bang bo dem rate limit dung chung'
);

select ok(
  (
    select c.relrowsecurity
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'gioi_han_api'
  ),
  'Bang rate limit bat RLS'
);

select ok(
  not has_table_privilege('authenticated', 'public.gioi_han_api', 'SELECT')
    and not has_table_privilege('authenticated', 'public.gioi_han_api', 'INSERT')
    and not has_table_privilege('authenticated', 'public.gioi_han_api', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.gioi_han_api', 'DELETE'),
  'Client khong truy cap truc tiep bo dem rate limit'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.fn_kiem_tra_gioi_han_api(text)',
    'EXECUTE'
  ),
  'Nguoi da dang nhap duoc goi ham rate limit'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.fn_kiem_tra_gioi_han_api(text)',
    'EXECUTE'
  ),
  'Nguoi an danh khong duoc goi ham rate limit'
);

select ok(
  (
    select count(*) = 7
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and indexname in (
        'idx_minh_chung_tenant_year_created_active',
        'idx_minh_chung_tenant_year_status_created_active',
        'idx_nhat_ky_tenant_object_time',
        'idx_ke_hoach_tenant_year_created',
        'idx_ke_hoach_tenant_year_status_updated',
        'idx_nguoi_dung_tenant_name',
        'idx_nguoi_dung_tenant_status_name'
      )
  ),
  'Co du index cho phan trang theo tenant, nam hoc, trang thai va thoi gian'
);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '16000000-0000-0000-0000-000000000101',
  'Sprint 16 API School',
  'SPRINT16-API',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '16000000-0000-0000-0000-000000000201',
  'user@sprint16.test',
  'authenticated',
  'authenticated',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.nguoi_dung(
  id, auth_user_id, co_so_id, ho_ten, email
)
values (
  '16000000-0000-0000-0000-000000000301',
  '16000000-0000-0000-0000-000000000201',
  '16000000-0000-0000-0000-000000000101',
  'User Sprint 16',
  'user@sprint16.test'
);

select set_config(
  'request.jwt.claim.sub',
  '16000000-0000-0000-0000-000000000201',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(
  (select duoc_phep from public.fn_kiem_tra_gioi_han_api('evidence_zip')),
  true,
  'Luot ZIP thu nhat duoc phep'
);

select is(
  (select duoc_phep from public.fn_kiem_tra_gioi_han_api('evidence_zip')),
  true,
  'Luot ZIP thu hai duoc phep'
);

select is(
  (select duoc_phep from public.fn_kiem_tra_gioi_han_api('evidence_zip')),
  false,
  'Luot ZIP thu ba bi chan trong cua so 10 phut'
);

select is(
  (select duoc_phep from public.fn_kiem_tra_gioi_han_api('report_export')),
  true,
  'Bo dem xuat bao cao doc lap voi bo dem ZIP'
);

select throws_ok(
  $$ select * from public.fn_kiem_tra_gioi_han_api('unknown_action') $$,
  '22023',
  'Hành động rate limit không hợp lệ.',
  'Khong chap nhan action do client tu dat'
);

set local role postgres;

select * from finish();
rollback;
