begin;

create or replace function public.fn_guard_approved_report_snapshot()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' and old.trang_thai = 'da_phe_duyet' then
    raise exception using
      errcode = '42501',
      message = 'Snapshot bao cao da phe duyet la bat bien va khong duoc xoa.';
  end if;

  if tg_op = 'UPDATE' and old.trang_thai = 'da_phe_duyet' then
    raise exception using
      errcode = '42501',
      message = 'Snapshot bao cao da phe duyet la bat bien va khong duoc ghi de.';
  end if;

  if tg_op = 'UPDATE'
    and old.trang_thai = 'cho_duyet'
    and new.trang_thai = 'cho_duyet'
    and old.storage_path is not null
    and old.source_digest ~ '^[0-9a-f]{64}$'
    and old.sha256 ~ '^[0-9a-f]{64}$'
  then
    raise exception using
      errcode = '42501',
      message = 'Ban bao cao da gui duyet khong the ghi de.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.fn_guard_approved_report_snapshot() from public, anon, authenticated;

commit;
