begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(16);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000a101', 'principal-a@security.test', 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-00000000b101', 'principal-b@security.test', 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-00000000a102', 'teacher-a@security.test', 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-00000000a103', 'system-a@security.test', 'authenticated', 'authenticated', now(), now())
on conflict (id) do nothing;

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values
  ('00000000-0000-0000-0000-00000000a001', 'Security Tenant A', 'SECURITY-A', 'mam_non', array['mam_non']::cap_hoc[]),
  ('00000000-0000-0000-0000-00000000b001', 'Security Tenant B', 'SECURITY-B', 'mam_non', array['mam_non']::cap_hoc[]);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values
  ('00000000-0000-0000-0000-00000000a011', '00000000-0000-0000-0000-00000000a001', '2097-2098', '2097-08-01', '2098-07-31', 'dang_hoat_dong'),
  ('00000000-0000-0000-0000-00000000b011', '00000000-0000-0000-0000-00000000b001', '2097-2098', '2097-08-01', '2098-07-31', 'dang_hoat_dong');

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values
  ('00000000-0000-0000-0000-00000000a201', '00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-00000000a001', 'Principal A', 'principal-a@security.test'),
  ('00000000-0000-0000-0000-00000000b201', '00000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-00000000b001', 'Principal B', 'principal-b@security.test'),
  ('00000000-0000-0000-0000-00000000a202', '00000000-0000-0000-0000-00000000a102', '00000000-0000-0000-0000-00000000a001', 'Teacher A', 'teacher-a@security.test'),
  ('00000000-0000-0000-0000-00000000a203', '00000000-0000-0000-0000-00000000a103', '00000000-0000-0000-0000-00000000a001', 'System A', 'system-a@security.test');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select assignment.nguoi_dung_id, vt.id, assignment.co_so_id
from (
  values
    ('00000000-0000-0000-0000-00000000a201'::uuid, 'PRINCIPAL', '00000000-0000-0000-0000-00000000a001'::uuid),
    ('00000000-0000-0000-0000-00000000b201'::uuid, 'PRINCIPAL', '00000000-0000-0000-0000-00000000b001'::uuid),
    ('00000000-0000-0000-0000-00000000a202'::uuid, 'TEACHER', '00000000-0000-0000-0000-00000000a001'::uuid),
    ('00000000-0000-0000-0000-00000000a203'::uuid, 'SYSTEM_ADMIN', '00000000-0000-0000-0000-00000000a001'::uuid)
) as assignment(nguoi_dung_id, role_code, co_so_id)
join public.vai_tro vt on vt.ma = assignment.role_code;

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, storage_path, nguoi_tai_len
)
values
  (
    '00000000-0000-0000-0000-00000000a301',
    '00000000-0000-0000-0000-00000000a001',
    '00000000-0000-0000-0000-00000000a011',
    'MC.1.1.98',
    'Evidence A',
    '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-00000000a011/evidence-a.pdf',
    '00000000-0000-0000-0000-00000000a201'
  ),
  (
    '00000000-0000-0000-0000-00000000b301',
    '00000000-0000-0000-0000-00000000b001',
    '00000000-0000-0000-0000-00000000b011',
    'MC.1.1.99',
    'Evidence B',
    '00000000-0000-0000-0000-00000000b001/00000000-0000-0000-0000-00000000b011/evidence-b.pdf',
    '00000000-0000-0000-0000-00000000b201'
  );

insert into storage.objects(bucket_id, name)
values (
  'evidence',
  '00000000-0000-0000-0000-00000000b001/00000000-0000-0000-0000-00000000b011/evidence-b.pdf'
);

insert into public.bao_cao(
  id, co_so_id, nam_hoc_id, loai_bao_cao, version, trang_thai, nguoi_tao
)
values (
  '00000000-0000-0000-0000-00000000b401',
  '00000000-0000-0000-0000-00000000b001',
  '00000000-0000-0000-0000-00000000b011',
  'mau_1_tu_danh_gia',
  1,
  'nhap',
  '00000000-0000-0000-0000-00000000b201'
);

insert into public.nhat_ky_truy_cap(
  co_so_id, nguoi_dung_id, hanh_dong, doi_tuong
)
values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000a201', 'FIXTURE_A', 'security_test'),
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000b201', 'FIXTURE_B', 'security_test');

select is(
  (
    select count(*)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  0::bigint,
  'PUBLIC/anon khong duoc goi SECURITY DEFINER'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not coalesce(p.proconfig, '{}'::text[]) @> array['search_path=pg_catalog, public']
  ),
  0::bigint,
  'Moi SECURITY DEFINER co search_path an toan'
);

select ok(
  not pg_catalog.has_function_privilege(
    'authenticated',
    'public.fn_log_audit(character varying, character varying, uuid, jsonb, jsonb)',
    'EXECUTE'
  ),
  'Authenticated khong goi duoc ham audit noi bo'
);

select ok(
  not pg_catalog.has_function_privilege(
    'authenticated',
    'public.fn_sinh_ma_minh_chung(uuid, uuid)',
    'EXECUTE'
  ),
  'Client khong goi truc tiep ham sinh ma minh chung'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$
    insert into public.nhat_ky_truy_cap(
      co_so_id, nguoi_dung_id, hanh_dong, doi_tuong
    ) values (
      '00000000-0000-0000-0000-00000000a001',
      '00000000-0000-0000-0000-00000000a201',
      'FORGED',
      'security_test'
    )
  $$,
  '42501',
  null,
  'Nguoi dung khong chen truc tiep audit log'
);

select is(
  (select count(*) from public.nhat_ky_truy_cap where co_so_id = '00000000-0000-0000-0000-00000000b001'),
  0::bigint,
  'Tenant A khong doc audit Tenant B'
);

select lives_ok(
  $$select public.fn_log_user_access('EVIDENCE_LIST_READ', null, '{"source":"security-test"}'::jsonb)$$,
  'RPC truy cap cu van hop le nhung khong ghi nhat ky'
);

select throws_ok(
  $$select public.fn_log_user_access('FORGED_ACTION', null, '{}'::jsonb)$$,
  'P0001',
  'Hanh dong nhat ky khong duoc phep.',
  'RPC audit tu choi action ngoai allowlist'
);

select is(
  (select count(*) from storage.objects where name like '00000000-0000-0000-0000-00000000b001/%'),
  0::bigint,
  'Tenant A khong doc object Tenant B'
);

select throws_ok(
  $$
    insert into public.minh_chung(
      co_so_id, nam_hoc_id, ma, ten, storage_path, nguoi_tai_len
    ) values (
      '00000000-0000-0000-0000-00000000a001',
      '00000000-0000-0000-0000-00000000a011',
      'MC.1.1.97',
      'Path substitution',
      '00000000-0000-0000-0000-00000000b001/00000000-0000-0000-0000-00000000b011/evidence-b.pdf',
      '00000000-0000-0000-0000-00000000a201'
    )
  $$,
  '23514',
  null,
  'Tenant A khong gan metadata vao path Tenant B'
);

reset role;

select is(
  (
    select count(*)
    from public.nhat_ky_truy_cap
    where hanh_dong = 'EVIDENCE_LIST_READ'
      and co_so_id = '00000000-0000-0000-0000-00000000a001'
      and nguoi_dung_id = '00000000-0000-0000-0000-00000000a201'
  ),
  0::bigint,
  'RPC truy cap khong luu hanh dong doc'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a102', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.nhat_ky_truy_cap),
  0::bigint,
  'User khong co audit.read khong doc duoc audit tenant minh'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a103', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

update public.bao_cao
set trang_thai = 'da_phe_duyet'
where id = '00000000-0000-0000-0000-00000000b401';

reset role;

select is(
  (
    select trang_thai::text
    from public.bao_cao
    where id = '00000000-0000-0000-0000-00000000b401'
  ),
  'nhap',
  'SYSTEM_ADMIN khong sua bao cao Tenant B'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a103', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.bao_cao where co_so_id = '00000000-0000-0000-0000-00000000b001'),
  0::bigint,
  'SYSTEM_ADMIN khong doc bao cao Tenant B'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$select public.fn_sinh_ma_minh_chung((select id from public.tieu_chi limit 1), '00000000-0000-0000-0000-00000000b001')$$,
  '42501',
  null,
  'Tenant A khong sinh ma minh chung cho Tenant B'
);

select lives_ok(
  $$
    insert into public.minh_chung(
      co_so_id, nam_hoc_id, ma, ten, storage_path, nguoi_tai_len
    ) values (
      '00000000-0000-0000-0000-00000000a001',
      '00000000-0000-0000-0000-00000000a011',
      'MC.1.1.96',
      'Valid own path',
      '00000000-0000-0000-0000-00000000a001/00000000-0000-0000-0000-00000000a011/valid.pdf',
      '00000000-0000-0000-0000-00000000a201'
    )
  $$,
  'Tenant hop le van tao metadata trong path cua minh'
);

reset role;

select * from finish();
rollback;
