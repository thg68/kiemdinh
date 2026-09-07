begin;

-- Snapshot đã phê duyệt là một đơn vị bất biến gồm cả bản ghi nghiệp vụ và
-- object Storage. Kiểm tra này chạy với quyền chủ hàm để không phụ thuộc vào
-- tập bản ghi bao_cao mà RLS đang cho người gọi nhìn thấy.
create or replace function public.fn_can_update_report_file(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.fn_current_co_so_id() is not null
    and split_part(p_storage_path, '/', 1) = public.fn_current_co_so_id()::text
    and public.fn_has_permission(
      'report.export',
      public.fn_current_co_so_id()
    )
    and not exists (
      select 1
      from public.bao_cao report
      where report.storage_path = p_storage_path
        and public.fn_is_approved_report_status(report.trang_thai)
    )
$$;

create or replace function public.fn_can_delete_report_file(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.fn_current_co_so_id() is not null
    and split_part(p_storage_path, '/', 1) = public.fn_current_co_so_id()::text
    and public.fn_has_role(
      'PRINCIPAL',
      public.fn_current_co_so_id()
    )
    and not exists (
      select 1
      from public.bao_cao report
      where report.storage_path = p_storage_path
        and public.fn_is_approved_report_status(report.trang_thai)
    )
$$;

revoke all on function public.fn_can_update_report_file(text)
from public, anon;
grant execute on function public.fn_can_update_report_file(text)
to authenticated;

revoke all on function public.fn_can_delete_report_file(text)
from public, anon;
grant execute on function public.fn_can_delete_report_file(text)
to authenticated;

do $$
begin
  if exists (
    select 1
    from information_schema.schemata
    where schema_name = 'storage'
  ) then
    drop policy if exists "reports_storage_update" on storage.objects;
    create policy "reports_storage_update" on storage.objects
    for update to authenticated
    using (
      bucket_id = 'reports'
      and public.fn_can_update_report_file(name)
    )
    with check (
      bucket_id = 'reports'
      and public.fn_can_update_report_file(name)
    );

    drop policy if exists "reports_storage_delete" on storage.objects;
    create policy "reports_storage_delete" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'reports'
      and public.fn_can_delete_report_file(name)
    );
  end if;
end;
$$;

commit;
