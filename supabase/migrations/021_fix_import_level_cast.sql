-- Sua than ham da duoc cai tren staging truoc khi 020 duoc lint.
-- Ban cai moi da co ep kieu dung trong 020; migration nay la no-op trong truong hop do.
do $$
declare
  v_function_sql text;
  v_fixed_sql text;
begin
  select pg_catalog.pg_get_functiondef(p.oid)
  into v_function_sql
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'fn_commit_dot_import'
    and pg_catalog.pg_get_function_identity_arguments(p.oid) = 'p_dot_import_id uuid';

  if v_function_sql is null then
    raise exception 'Khong tim thay fn_commit_dot_import de sua ep kieu.';
  end if;

  v_fixed_sql := pg_catalog.replace(
    v_function_sql,
    'coalesce(nullif(v_row.du_lieu ->> ''muc_dat'', '''')::smallint, 0)',
    'coalesce(nullif(v_row.du_lieu ->> ''muc_dat'', '''')::smallint, 0::smallint)'
  );

  if v_fixed_sql is distinct from v_function_sql then
    execute v_fixed_sql;
  elsif pg_catalog.strpos(v_function_sql, '0::smallint') = 0 then
    raise exception 'Than fn_commit_dot_import khong co mau ep kieu du kien.';
  end if;
end;
$$;
