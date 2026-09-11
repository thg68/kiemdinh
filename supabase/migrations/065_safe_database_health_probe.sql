begin;

create or replace function public.fn_health_database()
returns table (status text)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select 'ok'::text
$$;

revoke all on function public.fn_health_database()
from public, anon, authenticated;
grant execute on function public.fn_health_database()
to anon, authenticated;

comment on function public.fn_health_database() is
  'Readiness probe khong tra du lieu nghiep vu va khong phu thuoc RLS cua bang ung dung.';

commit;
