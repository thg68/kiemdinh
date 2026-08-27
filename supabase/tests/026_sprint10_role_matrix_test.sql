begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values
  ('10000000-0000-0000-0000-000000000101', 'Sprint 10 Tenant A', 'SPRINT10-A', 'mam_non', array['mam_non']::cap_hoc[]),
  ('10000000-0000-0000-0000-000000000102', 'Sprint 10 Tenant B', 'SPRINT10-B', 'mam_non', array['mam_non']::cap_hoc[]);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values
  ('10000000-0000-0000-0000-000000000111', '10000000-0000-0000-0000-000000000101', '2095-2096', '2095-08-01', '2096-07-31', 'dang_hoat_dong'),
  ('10000000-0000-0000-0000-000000000112', '10000000-0000-0000-0000-000000000102', '2095-2096', '2095-08-01', '2096-07-31', 'dang_hoat_dong');

create temporary table sprint10_actor(
  role_code text primary key,
  auth_id uuid not null,
  user_id uuid not null
);

insert into sprint10_actor(role_code, auth_id, user_id)
select
  role_code,
  ('10000000-0000-0000-0000-' || lpad(row_number() over (order by ordinal)::text, 12, '0'))::uuid,
  ('10000000-0000-0000-0001-' || lpad(row_number() over (order by ordinal)::text, 12, '0'))::uuid
from unnest(array[
  'SYSTEM_ADMIN',
  'PRINCIPAL',
  'SELF_ASSESSMENT_CHAIR',
  'SECRETARY',
  'MEMBER',
  'TEACHER',
  'VIEWER'
]) with ordinality as roles(role_code, ordinal);

insert into auth.users(id, email, aud, role, created_at, updated_at)
select auth_id, lower(role_code) || '@sprint10.test', 'authenticated', 'authenticated', now(), now()
from sprint10_actor
on conflict (id) do nothing;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
select user_id, auth_id, '10000000-0000-0000-0000-000000000101', role_code, lower(role_code) || '@sprint10.test'
from sprint10_actor;

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select actor.user_id, role.id, '10000000-0000-0000-0000-000000000101'
from sprint10_actor actor
join public.vai_tro role on role.ma = actor.role_code;

create temporary table sprint10_expected_permission(
  role_code text not null,
  permission_code text not null,
  allowed boolean not null,
  primary key (role_code, permission_code)
);

insert into sprint10_expected_permission(role_code, permission_code, allowed)
select role_code, permission_code,
  case role_code
    when 'PRINCIPAL' then true
    when 'SELF_ASSESSMENT_CHAIR' then true
    when 'SECRETARY' then permission_code in (
      'evidence.read', 'evidence.create', 'evidence.verify',
      'assessment.read', 'assessment.write',
      'report.read', 'report.export', 'assignment.read'
    )
    when 'MEMBER' then permission_code in (
      'evidence.read', 'evidence.create',
      'assessment.read', 'assessment.write', 'assignment.read'
    )
    when 'TEACHER' then permission_code in ('evidence.read', 'evidence.create')
    when 'VIEWER' then permission_code = 'report.read'
    else false
  end
from unnest(array[
  'SYSTEM_ADMIN', 'PRINCIPAL', 'SELF_ASSESSMENT_CHAIR', 'SECRETARY',
  'MEMBER', 'TEACHER', 'VIEWER'
]) as role_code
cross join unnest(array[
  'evidence.read', 'evidence.create', 'evidence.verify',
  'assessment.read', 'assessment.write', 'assessment.approve',
  'report.read', 'report.export', 'report.approve',
  'assignment.read', 'assignment.write', 'audit.read'
]) as permission_code;

create function pg_temp.has_permission_as(
  p_auth_id uuid,
  p_permission text,
  p_co_so_id uuid
)
returns boolean
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  return public.fn_has_permission(p_permission, p_co_so_id);
end;
$$;

select is(
  pg_temp.has_permission_as(actor.auth_id, expected.permission_code, '10000000-0000-0000-0000-000000000101'),
  expected.allowed,
  format('%s x %s x tenant minh', expected.role_code, expected.permission_code)
)
from sprint10_expected_permission expected
join sprint10_actor actor using (role_code)
order by expected.role_code, expected.permission_code;

select is(
  pg_temp.has_permission_as(actor.auth_id, 'evidence.read', '10000000-0000-0000-0000-000000000102'),
  false,
  format('%s khong mang quyen evidence.read sang tenant khac', actor.role_code)
)
from sprint10_actor actor
order by actor.role_code;

insert into public.minh_chung(id, co_so_id, nam_hoc_id, ma, ten, storage_path, nguoi_tai_len)
values (
  '10000000-0000-0000-0000-000000000301',
  '10000000-0000-0000-0000-000000000102',
  '10000000-0000-0000-0000-000000000112',
  'MC.1.1.95',
  'Known UUID Tenant B',
  '10000000-0000-0000-0000-000000000102/10000000-0000-0000-0000-000000000112/known.pdf',
  (select user_id from sprint10_actor where role_code = 'PRINCIPAL')
);

insert into public.bao_cao(id, co_so_id, nam_hoc_id, loai_bao_cao, version, trang_thai, nguoi_tao)
values (
  '10000000-0000-0000-0000-000000000401',
  '10000000-0000-0000-0000-000000000102',
  '10000000-0000-0000-0000-000000000112',
  'mau_1_tu_danh_gia',
  1,
  'nhap',
  (select user_id from sprint10_actor where role_code = 'PRINCIPAL')
);

insert into public.nhat_ky_truy_cap(co_so_id, nguoi_dung_id, hanh_dong, doi_tuong)
values (
  '10000000-0000-0000-0000-000000000102',
  (select user_id from sprint10_actor where role_code = 'PRINCIPAL'),
  'SPRINT10_TENANT_B',
  'security_test'
);

create function pg_temp.visible_rows_as(p_auth_id uuid, p_query text)
returns bigint
language plpgsql
as $$
declare
  v_count bigint;
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  execute p_query into v_count;
  execute 'reset role';
  return v_count;
exception when others then
  execute 'reset role';
  raise;
end;
$$;

select is(
  pg_temp.visible_rows_as(actor.auth_id, 'select count(*) from public.minh_chung where id = ''10000000-0000-0000-0000-000000000301'''),
  0::bigint,
  format('%s khong doc minh chung tenant B bang UUID biet truoc', actor.role_code)
)
from sprint10_actor actor;

select is(
  pg_temp.visible_rows_as(actor.auth_id, 'select count(*) from public.bao_cao where id = ''10000000-0000-0000-0000-000000000401'''),
  0::bigint,
  format('%s khong doc bao cao tenant B qua REST/RLS', actor.role_code)
)
from sprint10_actor actor;

select is(
  pg_temp.visible_rows_as(actor.auth_id, 'select count(*) from public.nhat_ky_truy_cap where co_so_id = ''10000000-0000-0000-0000-000000000102'''),
  0::bigint,
  format('%s khong doc audit tenant B', actor.role_code)
)
from sprint10_actor actor;

select * from finish();
rollback;
