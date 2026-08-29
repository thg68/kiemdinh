begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(3);

select is(
  (
    select count(distinct p.tablename)
    from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and 'authenticated' = any(p.roles)
      and p.cmd in ('SELECT', 'ALL')
      and not has_table_privilege(
        'authenticated',
        format('%I.%I', p.schemaname, p.tablename),
        'SELECT'
      )
  ),
  0::bigint,
  'Moi bang co RLS SELECT policy deu co SELECT grant'
);

select is(
  (
    select count(*)
    from public.vai_tro vt
    join public.vai_tro_quyen vtq on vtq.vai_tro_id = vt.id
    join public.quyen q on q.id = vtq.quyen_id
    where vt.ma = 'VIEWER'
      and q.ma = 'assessment.read'
  ),
  0::bigint,
  'Khach chi doc khong co quyen xem du lieu tu danh gia noi bo'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  0::bigint,
  'Moi bang public deu bat RLS'
);

select * from finish();
rollback;
