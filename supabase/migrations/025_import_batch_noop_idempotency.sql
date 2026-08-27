-- Cung hash chi tra lai batch cu, khong cap nhat updated_at cua batch da commit.
create or replace function public.fn_tao_dot_import(
  p_nam_hoc_id uuid,
  p_ten_tep_goc text,
  p_hash_tep varchar,
  p_storage_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_user_id uuid := public.fn_current_nguoi_dung_id();
  v_id uuid;
begin
  if v_co_so_id is null or v_user_id is null or not public.fn_has_permission('import.manage', v_co_so_id) then
    raise exception 'Ban khong co quyen import du lieu nam hoc.';
  end if;

  if not exists (select 1 from public.nam_hoc where id = p_nam_hoc_id and co_so_id = v_co_so_id) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  if p_hash_tep !~ '^[0-9a-f]{64}$' then
    raise exception 'Hash tep import khong hop le.';
  end if;

  if p_storage_path is not null and p_storage_path not like v_co_so_id::text || '/' || p_nam_hoc_id::text || '/%' then
    raise exception 'Duong dan tep import khong thuoc don vi va nam hoc hien tai.';
  end if;

  insert into public.dot_import(co_so_id, nam_hoc_id, ten_tep_goc, hash_tep, storage_path, nguoi_tao)
  values (v_co_so_id, p_nam_hoc_id, p_ten_tep_goc, p_hash_tep, p_storage_path, v_user_id)
  on conflict (co_so_id, nam_hoc_id, hash_tep) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.dot_import
    where co_so_id = v_co_so_id and nam_hoc_id = p_nam_hoc_id and hash_tep = p_hash_tep;
  end if;

  return v_id;
end;
$$;

revoke all on function public.fn_tao_dot_import(uuid, text, varchar, text) from public, anon;
grant execute on function public.fn_tao_dot_import(uuid, text, varchar, text) to authenticated;
