-- Bao cao da phe duyet phai tro den object that va co du metadata de kiem tra lai.
create or replace function public.fn_guard_report_snapshot_metadata()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.trang_thai = 'da_phe_duyet' then
    if nullif(new.storage_path, '') is null
      or nullif(new.ten_tep_goc, '') is null
      or nullif(new.mime_type, '') is null
      or coalesce(new.kich_thuoc, 0) <= 0
      or new.sha256 !~ '^[0-9a-f]{64}$'
    then
      raise exception 'Snapshot phe duyet thieu tep hoac metadata kiem tra toan ven.';
    end if;

    if not exists (
      select 1 from storage.objects object
      where object.bucket_id = 'reports' and object.name = new.storage_path
    ) then
      raise exception 'Khong tim thay tep snapshot trong kho reports.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_report_snapshot_metadata on public.bao_cao;
create trigger trg_guard_report_snapshot_metadata
before insert or update on public.bao_cao
for each row execute function public.fn_guard_report_snapshot_metadata();

revoke all on function public.fn_guard_report_snapshot_metadata() from public, anon, authenticated;
