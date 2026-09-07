begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
select plan(11);

select ok(
  not pg_catalog.has_table_privilege('authenticated', 'public.minh_chung', 'INSERT'),
  'Authenticated khong chen truc tiep metadata minh chung'
);
select ok(
  not pg_catalog.has_table_privilege('authenticated', 'public.minh_chung', 'UPDATE'),
  'Authenticated khong cap nhat truc tiep metadata minh chung'
);
select ok(
  not pg_catalog.has_table_privilege('authenticated', 'public.minh_chung', 'DELETE'),
  'Authenticated khong xoa truc tiep metadata minh chung'
);
select ok(
  not pg_catalog.has_table_privilege('authenticated', 'public.bao_cao', 'INSERT'),
  'Authenticated khong chen truc tiep snapshot bao cao'
);
select ok(
  not pg_catalog.has_table_privilege('authenticated', 'public.bao_cao', 'UPDATE'),
  'Authenticated khong cap nhat truc tiep snapshot bao cao'
);
select ok(
  not pg_catalog.has_table_privilege('authenticated', 'public.bao_cao', 'DELETE'),
  'Authenticated khong xoa truc tiep snapshot bao cao'
);
select ok(
  not pg_catalog.has_table_privilege('anon', 'public.minh_chung', 'INSERT,UPDATE,DELETE'),
  'Anon khong ghi metadata minh chung'
);
select ok(
  not pg_catalog.has_table_privilege('anon', 'public.bao_cao', 'INSERT,UPDATE,DELETE'),
  'Anon khong ghi snapshot bao cao'
);

select is(
  (
    select count(*)
    from information_schema.role_table_grants table_grant
    where table_grant.table_schema = 'public'
      and table_grant.grantee = 'authenticated'
      and table_grant.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
      and table_grant.table_name not in (
        'hoi_dong_tu_danh_gia',
        'ke_hoach_cai_tien',
        'nhan_xet_tieu_chuan',
        'noi_dung_mau_2',
        'thanh_vien_hoi_dong',
        'van_ban_lien_quan'
      )
  ),
  0::bigint,
  'Authenticated chi ghi truc tiep cac bang CRUD trong whitelist'
);

select is(
  (
    select count(*)
    from information_schema.role_table_grants table_grant
    where table_grant.table_schema = 'public'
      and table_grant.grantee = 'anon'
      and table_grant.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  ),
  0::bigint,
  'Anon khong co table grant ghi trong schema public'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_default_acl default_acl
    join pg_catalog.pg_roles owner_role on owner_role.oid = default_acl.defaclrole
    join pg_catalog.pg_namespace namespace on namespace.oid = default_acl.defaclnamespace
    cross join lateral pg_catalog.aclexplode(default_acl.defaclacl) acl
    join pg_catalog.pg_roles grantee_role on grantee_role.oid = acl.grantee
    where owner_role.rolname = 'postgres'
      and namespace.nspname = 'public'
      and default_acl.defaclobjtype = 'r'
      and grantee_role.rolname in ('anon', 'authenticated')
      and acl.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'MAINTAIN')
  ),
  0::bigint,
  'Bang tao moi khong tu dong cap quyen ghi cho app roles'
);

select * from finish();
rollback;
