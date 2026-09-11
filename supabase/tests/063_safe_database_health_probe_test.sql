begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(3);

select ok(
  has_function_privilege('anon', 'public.fn_health_database()', 'execute'),
  'Anon co the goi readiness probe an toan'
);

set local role anon;
select is(
  (select status from public.fn_health_database()),
  'ok',
  'Readiness probe xac nhan database phan hoi'
);

select is(
  pg_get_function_result('public.fn_health_database()'::regprocedure),
  'TABLE(status text)',
  'Readiness probe chi tra mot truong trang thai'
);

select * from finish();
rollback;
