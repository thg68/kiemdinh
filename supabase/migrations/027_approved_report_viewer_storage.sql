-- Only expose approved report snapshots to read-only viewers.
create or replace function public.fn_can_read_report_file(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.fn_current_co_so_id() is not null
    and split_part(p_storage_path, '/', 1) = public.fn_current_co_so_id()::text
    and (
      public.fn_is_management_role(public.fn_current_co_so_id())
      or public.fn_has_role('SYSTEM_ADMIN')
      or (
        public.fn_has_role('VIEWER', public.fn_current_co_so_id())
        and public.fn_has_permission('report.read', public.fn_current_co_so_id())
        and exists (
          select 1
          from public.bao_cao report
          where report.co_so_id = public.fn_current_co_so_id()
            and report.storage_path = p_storage_path
            and public.fn_is_approved_report_status(report.trang_thai)
        )
      )
    )
$$;

revoke all on function public.fn_can_read_report_file(text) from public, anon;
grant execute on function public.fn_can_read_report_file(text) to authenticated;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    drop policy if exists "reports_storage_select" on storage.objects;
    create policy "reports_storage_select" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'reports'
      and public.fn_can_read_report_file(name)
    );
  end if;
end;
$$;
