-- Sprint 7: khoa tenant cho Storage, bao ve audit log va thu hep SECURITY DEFINER.

alter table public.minh_chung
  drop constraint if exists ck_minh_chung_storage_path_tenant_year;

alter table public.minh_chung
  add constraint ck_minh_chung_storage_path_tenant_year
  check (
    storage_path is null
    or (
      storage_path like co_so_id::text || '/' || nam_hoc_id::text || '/%'
      and storage_path !~ '(^|/)\.{1,2}(/|$)'
      and position('//' in storage_path) = 0
    )
  );

create or replace function public.fn_sinh_ma_minh_chung(
  p_tieu_chi_id uuid,
  p_co_so_id uuid
)
returns varchar
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_hien_tai uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_ma_tieu_chi varchar(10);
  v_so integer;
begin
  if auth.uid() is null or v_nguoi_dung_id is null or v_co_so_hien_tai is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if p_co_so_id is distinct from v_co_so_hien_tai then
    raise exception 'Khong duoc sinh ma minh chung cho co so giao duc khac.';
  end if;

  if not public.fn_has_permission('evidence.create', v_co_so_hien_tai) then
    raise exception 'Ban khong co quyen tao minh chung.';
  end if;

  select ma into v_ma_tieu_chi
  from public.tieu_chi
  where id = p_tieu_chi_id;

  if v_ma_tieu_chi is null then
    raise exception 'Khong tim thay tieu chi %', p_tieu_chi_id;
  end if;

  insert into public.bo_dem_ma_minh_chung(co_so_id, tieu_chi_id, so_tiep_theo)
  values (v_co_so_hien_tai, p_tieu_chi_id, 2)
  on conflict (co_so_id, tieu_chi_id)
  do update
    set so_tiep_theo = public.bo_dem_ma_minh_chung.so_tiep_theo + 1,
        updated_at = now()
  returning so_tiep_theo - 1 into v_so;

  return 'MC.' || v_ma_tieu_chi || '.' || lpad(v_so::text, 2, '0');
end;
$$;

create or replace function public.fn_log_audit(
  p_hanh_dong varchar,
  p_doi_tuong varchar,
  p_doi_tuong_id uuid,
  p_du_lieu_cu jsonb default null,
  p_du_lieu_moi jsonb default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
begin
  if auth.uid() is null or v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Khong the ghi nhat ky khi chua xac dinh nguoi dung va don vi.';
  end if;

  if nullif(trim(p_hanh_dong), '') is null or nullif(trim(p_doi_tuong), '') is null then
    raise exception 'Hanh dong va doi tuong nhat ky la bat buoc.';
  end if;

  insert into public.nhat_ky_truy_cap(
    co_so_id,
    nguoi_dung_id,
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    du_lieu_cu,
    du_lieu_moi
  )
  values (
    v_co_so_id,
    v_nguoi_dung_id,
    left(trim(p_hanh_dong), 100),
    left(trim(p_doi_tuong), 100),
    p_doi_tuong_id,
    p_du_lieu_cu,
    p_du_lieu_moi
  );
end;
$$;

create or replace function public.fn_log_user_access(
  p_hanh_dong varchar,
  p_doi_tuong_id uuid default null,
  p_du_lieu_moi jsonb default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_doi_tuong varchar(100);
begin
  if auth.uid() is null or v_co_so_id is null or public.fn_current_nguoi_dung_id() is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if p_du_lieu_moi is not null and octet_length(p_du_lieu_moi::text) > 8192 then
    raise exception 'Du lieu nhat ky vuot qua gioi han cho phep.';
  end if;

  case p_hanh_dong
    when 'EVIDENCE_LIST_READ' then
      if not public.fn_has_permission('evidence.read', v_co_so_id) then
        raise exception 'Ban khong co quyen xem minh chung.';
      end if;
      v_doi_tuong := 'minh_chung';
    when 'EVIDENCE_HEALTH_READ' then
      if not public.fn_has_permission('evidence.read', v_co_so_id) then
        raise exception 'Ban khong co quyen xem minh chung.';
      end if;
      v_doi_tuong := 'minh_chung';
    when 'EVIDENCE_DETAIL_READ', 'EVIDENCE_FILE_SIGNED_URL_CREATED' then
      if p_doi_tuong_id is null or not public.fn_can_read_minh_chung(p_doi_tuong_id) then
        raise exception 'Ban khong co quyen xem minh chung nay.';
      end if;
      v_doi_tuong := 'minh_chung';
    when 'REPORT_EXPORTED' then
      if p_doi_tuong_id is null
        or not public.fn_has_permission('report.export', v_co_so_id)
        or not exists (
          select 1
          from public.nam_hoc nh
          where nh.id = p_doi_tuong_id
            and nh.co_so_id = v_co_so_id
        )
      then
        raise exception 'Ban khong co quyen xuat bao cao cho nam hoc nay.';
      end if;
      v_doi_tuong := 'bao_cao';
    else
      raise exception 'Hanh dong nhat ky khong duoc phep.';
  end case;

  perform public.fn_log_audit(
    p_hanh_dong,
    v_doi_tuong,
    p_doi_tuong_id,
    null,
    coalesce(p_du_lieu_moi, '{}'::jsonb)
  );
end;
$$;

drop policy if exists "nhat_ky_read_same_tenant" on public.nhat_ky_truy_cap;
drop policy if exists "nhat_ky_insert_same_tenant" on public.nhat_ky_truy_cap;
drop policy if exists "nhat_ky_select_by_permission" on public.nhat_ky_truy_cap;

create policy "nhat_ky_select_by_permission" on public.nhat_ky_truy_cap
for select to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('audit.read', co_so_id)
);

revoke all on table public.nhat_ky_truy_cap from anon, authenticated;
grant select on table public.nhat_ky_truy_cap to authenticated;

drop policy if exists "bao_cao_insert_system_admin" on public.bao_cao;
drop policy if exists "bao_cao_update_system_admin" on public.bao_cao;
drop policy if exists "bao_cao_delete_system_admin" on public.bao_cao;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    drop policy if exists "evidence_storage_select" on storage.objects;
    drop policy if exists "evidence_storage_insert" on storage.objects;
    drop policy if exists "evidence_storage_update" on storage.objects;

    create policy "evidence_storage_select" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'evidence'
      and cardinality(storage.foldername(name)) >= 2
      and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
      and exists (
        select 1
        from public.nam_hoc nh
        where nh.id::text = (storage.foldername(name))[2]
          and nh.co_so_id = public.fn_current_co_so_id()
      )
      and exists (
        select 1
        from public.minh_chung mc
        where mc.storage_path = storage.objects.name
          and mc.co_so_id = public.fn_current_co_so_id()
          and mc.nam_hoc_id::text = (storage.foldername(name))[2]
          and public.fn_can_read_minh_chung(mc.id)
      )
    );

    create policy "evidence_storage_insert" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'evidence'
      and cardinality(storage.foldername(name)) = 2
      and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
      and exists (
        select 1
        from public.nam_hoc nh
        where nh.id::text = (storage.foldername(name))[2]
          and nh.co_so_id = public.fn_current_co_so_id()
      )
      and public.fn_has_permission('evidence.create', public.fn_current_co_so_id())
    );

    create policy "evidence_storage_update" on storage.objects
    for update to authenticated
    using (
      bucket_id = 'evidence'
      and exists (
        select 1
        from public.minh_chung mc
        where mc.storage_path = storage.objects.name
          and public.fn_can_write_minh_chung(mc.id, 'evidence.update')
      )
    )
    with check (
      bucket_id = 'evidence'
      and cardinality(storage.foldername(name)) = 2
      and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
      and exists (
        select 1
        from public.nam_hoc nh
        where nh.id::text = (storage.foldername(name))[2]
          and nh.co_so_id = public.fn_current_co_so_id()
      )
      and exists (
        select 1
        from public.minh_chung mc
        where mc.storage_path = storage.objects.name
          and public.fn_can_write_minh_chung(mc.id, 'evidence.update')
      )
    );
  end if;
end;
$$;

do $$
declare
  v_function record;
  v_signature text;
begin
  for v_function in
    select p.oid, p.proname, p.prorettype
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    v_signature := pg_catalog.format(
      '%I.%I(%s)',
      'public',
      v_function.proname,
      pg_catalog.pg_get_function_identity_arguments(v_function.oid)
    );

    execute pg_catalog.format('revoke all on function %s from public', v_signature);
    execute pg_catalog.format('revoke all on function %s from anon', v_signature);
    execute pg_catalog.format(
      'alter function %s set search_path = pg_catalog, public',
      v_signature
    );

    if v_function.prorettype <> 'pg_catalog.trigger'::regtype
      and v_function.proname not in ('fn_log_audit', 'fn_sinh_ma_minh_chung')
    then
      execute pg_catalog.format('grant execute on function %s to authenticated', v_signature);
    end if;
  end loop;
end;
$$;

revoke all on function public.fn_log_audit(varchar, varchar, uuid, jsonb, jsonb)
from public, anon, authenticated;

revoke all on function public.fn_sinh_ma_minh_chung(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.fn_log_user_access(varchar, uuid, jsonb)
to authenticated;
