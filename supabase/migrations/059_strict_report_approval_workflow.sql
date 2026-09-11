begin;

alter table public.bao_cao
  add column if not exists nguoi_gui_duyet uuid references public.nguoi_dung(id),
  add column if not exists ngay_gui_duyet timestamptz,
  add column if not exists ly_do_tra_lai text;

alter table public.bao_cao
  drop constraint if exists ck_bao_cao_ly_do_tra_lai;
alter table public.bao_cao
  add constraint ck_bao_cao_ly_do_tra_lai
  check (ly_do_tra_lai is null or char_length(ly_do_tra_lai) between 5 and 1000);

create index if not exists idx_bao_cao_hang_doi_duyet
  on public.bao_cao(co_so_id, nam_hoc_id, ngay_gui_duyet, created_at)
  where trang_thai = 'cho_duyet';

drop function if exists public.fn_luu_trang_thai_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao, text, text, text, text,
  bigint, varchar, jsonb, uuid, varchar
);

create or replace function public.fn_luu_trang_thai_bao_cao(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_loai_bao_cao public.loai_bao_cao,
  p_trang_thai text,
  p_storage_path text default null,
  p_ten_tep_goc text default null,
  p_mime_type text default null,
  p_kich_thuoc bigint default null,
  p_sha256 varchar default null,
  p_export_metadata jsonb default '{}'::jsonb,
  p_bao_cao_id uuid default null,
  p_source_digest varchar default null,
  p_ly_do_tra_lai text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_report public.bao_cao%rowtype;
  v_version integer;
  v_readiness jsonb;
  v_manifest jsonb;
  v_current_digest varchar(64);
  v_storage_path text := nullif(pg_catalog.btrim(coalesce(p_storage_path, '')), '');
  v_return_reason text := nullif(pg_catalog.btrim(coalesce(p_ly_do_tra_lai, '')), '');
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception using errcode = '28000', message = 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not exists (
    select 1 from public.nam_hoc
    where id = p_nam_hoc_id and co_so_id = v_co_so_id
  ) then
    raise exception using errcode = 'P0002', message = 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  if p_cap_hoc is null then
    raise exception using errcode = '22023', message = 'Cap hoc cua bao cao khong hop le.';
  end if;

  if p_trang_thai not in ('nhap', 'cho_duyet', 'da_phe_duyet', 'tra_lai') then
    raise exception using errcode = '22023', message = 'Trang thai bao cao khong hop le.';
  end if;

  if v_storage_path is not null and v_storage_path not like v_co_so_id::text || '/%' then
    raise exception using errcode = '42501', message = 'Duong dan luu tru bao cao khong thuoc don vi hien tai.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_co_so_id::text || p_nam_hoc_id::text || p_loai_bao_cao::text || p_cap_hoc::text,
      9006
    )
  );

  if p_bao_cao_id is not null then
    select * into v_report
    from public.bao_cao report
    where report.id = p_bao_cao_id
      and report.co_so_id = v_co_so_id
      and report.nam_hoc_id = p_nam_hoc_id
      and report.loai_bao_cao = p_loai_bao_cao
      and report.cap_hoc = p_cap_hoc
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'Khong tim thay ban bao cao trong pham vi hien tai.';
    end if;

    if p_trang_thai = 'da_phe_duyet' and v_report.trang_thai = 'da_phe_duyet' then
      if p_source_digest is distinct from v_report.source_digest then
        raise exception using errcode = '40001', message = 'Du lieu nguon cua bao cao khong con trung khop.';
      end if;
      return v_report.id;
    end if;
  elsif p_trang_thai in ('da_phe_duyet', 'tra_lai') then
    raise exception using errcode = '22023', message = 'Thao tac duyet phai chi ro ban bao cao cho duyet.';
  else
    select * into v_report
    from public.bao_cao report
    where report.co_so_id = v_co_so_id
      and report.nam_hoc_id = p_nam_hoc_id
      and report.loai_bao_cao = p_loai_bao_cao
      and report.cap_hoc = p_cap_hoc
      and report.trang_thai <> 'da_phe_duyet'
    order by report.version desc
    limit 1
    for update;
  end if;

  if p_trang_thai = 'da_phe_duyet' then
    if v_report.trang_thai <> 'cho_duyet' then
      raise exception using errcode = '55000', message = 'Chi bao cao dang cho duyet moi duoc phe duyet.';
    end if;

    if not (
      public.fn_has_permission('report.approve', v_co_so_id)
      and (
        public.fn_has_role('PRINCIPAL', v_co_so_id)
        or public.fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id)
      )
    ) then
      raise exception using errcode = '42501', message = 'Chi Hieu truong hoac Chu tich hoi dong moi duoc phe duyet bao cao.';
    end if;

    if v_report.source_digest is null or p_source_digest is distinct from v_report.source_digest then
      raise exception using errcode = '40001', message = 'Ban bao cao chua duoc niem phong hoac digest khong trung khop.';
    end if;

    v_manifest := public.fn_report_source_manifest_for_tenant(
      v_co_so_id, p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao
    );
    v_current_digest := encode(extensions.digest(convert_to(v_manifest::text, 'UTF8'), 'sha256'), 'hex');

    if p_source_digest is distinct from v_current_digest then
      raise exception using errcode = '40001', message = 'Du lieu nguon da thay doi ke tu khi gui duyet. Hay tra lai bao cao.';
    end if;

    v_readiness := public.fn_kiem_tra_san_sang_bao_cao(p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao);
    if not coalesce((v_readiness ->> 'ready')::boolean, false) then
      raise exception using errcode = '23514', message = 'Bao cao chua san sang de phe duyet.', detail = v_readiness::text;
    end if;

    if v_storage_path is null
      or nullif(pg_catalog.btrim(coalesce(p_ten_tep_goc, '')), '') is null
      or nullif(pg_catalog.btrim(coalesce(p_mime_type, '')), '') is null
      or coalesce(p_kich_thuoc, 0) <= 0
      or p_sha256 !~ '^[0-9a-f]{64}$'
    then
      raise exception using errcode = '23502', message = 'Bao cao phe duyet phai co tep niem phong va metadata toan ven.';
    end if;

  elsif p_trang_thai = 'tra_lai' then
    if v_report.trang_thai <> 'cho_duyet' then
      raise exception using errcode = '55000', message = 'Chi bao cao dang cho duyet moi duoc tra lai.';
    end if;

    if not (
      public.fn_has_permission('report.approve', v_co_so_id)
      and (
        public.fn_has_role('PRINCIPAL', v_co_so_id)
        or public.fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id)
      )
    ) then
      raise exception using errcode = '42501', message = 'Ban khong co quyen tra lai bao cao.';
    end if;

    if v_return_reason is null or char_length(v_return_reason) < 5 then
      raise exception using errcode = '22023', message = 'Ly do tra lai phai co it nhat 5 ky tu.';
    end if;

  elsif p_trang_thai = 'cho_duyet' then
    if not public.fn_has_permission('report.export', v_co_so_id) then
      raise exception using errcode = '42501', message = 'Ban chua co quyen tao ban gui duyet.';
    end if;

    if v_report.id is not null and v_report.trang_thai not in ('nhap', 'tra_lai', 'cho_duyet') then
      raise exception using errcode = '55000', message = 'Trang thai hien tai khong cho phep gui duyet.';
    end if;

    if v_storage_path is null
      or nullif(pg_catalog.btrim(coalesce(p_ten_tep_goc, '')), '') is null
      or nullif(pg_catalog.btrim(coalesce(p_mime_type, '')), '') is null
      or coalesce(p_kich_thuoc, 0) <= 0
      or p_sha256 !~ '^[0-9a-f]{64}$'
      or p_source_digest !~ '^[0-9a-f]{64}$'
    then
      raise exception using errcode = '23502', message = 'Ban gui duyet phai co tep niem phong va metadata toan ven.';
    end if;

    if not exists (
      select 1 from storage.objects object
      where object.bucket_id = 'reports' and object.name = v_storage_path
    ) then
      raise exception using errcode = '23503', message = 'Khong tim thay tep gui duyet trong kho reports.';
    end if;

    v_manifest := public.fn_report_source_manifest_for_tenant(
      v_co_so_id, p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao
    );
    v_current_digest := encode(extensions.digest(convert_to(v_manifest::text, 'UTF8'), 'sha256'), 'hex');

    if p_source_digest is distinct from v_current_digest then
      raise exception using errcode = '40001', message = 'Du lieu nguon da thay doi trong luc tao ban gui duyet. Hay thu lai.';
    end if;

    v_readiness := public.fn_kiem_tra_san_sang_bao_cao(p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao);
    if not coalesce((v_readiness ->> 'ready')::boolean, false) then
      raise exception using errcode = '23514', message = 'Bao cao chua san sang de gui duyet.', detail = v_readiness::text;
    end if;

  else
    if not public.fn_has_permission('report.export', v_co_so_id) then
      raise exception using errcode = '42501', message = 'Ban chua co quyen tao ban nhap bao cao.';
    end if;

    if v_report.id is not null and v_report.trang_thai not in ('nhap', 'tra_lai') then
      raise exception using errcode = '55000', message = 'Khong the dua bao cao cho duyet ve ban nhap.';
    end if;
  end if;

  if v_report.id is null then
    select coalesce(max(report.version), 0) + 1 into v_version
    from public.bao_cao report
    where report.co_so_id = v_co_so_id
      and report.nam_hoc_id = p_nam_hoc_id
      and report.loai_bao_cao = p_loai_bao_cao;

    insert into public.bao_cao(
      co_so_id, nam_hoc_id, cap_hoc, loai_bao_cao, version, trang_thai,
      storage_path, ten_tep_goc, mime_type, kich_thuoc, sha256, export_metadata,
      source_manifest, source_digest, nguoi_tao,
      nguoi_gui_duyet, ngay_gui_duyet, ly_do_tra_lai,
      nguoi_phe_duyet, ngay_phe_duyet
    ) values (
      v_co_so_id, p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao, v_version, p_trang_thai,
      v_storage_path, p_ten_tep_goc, p_mime_type, p_kich_thuoc, p_sha256,
      coalesce(p_export_metadata, '{}'::jsonb), v_manifest, p_source_digest, v_nguoi_dung_id,
      case when p_trang_thai = 'cho_duyet' then v_nguoi_dung_id end,
      case when p_trang_thai = 'cho_duyet' then now() end,
      case when p_trang_thai = 'tra_lai' then v_return_reason end,
      case when p_trang_thai = 'da_phe_duyet' then v_nguoi_dung_id end,
      case when p_trang_thai = 'da_phe_duyet' then now() end
    ) returning * into v_report;
  else
    update public.bao_cao report
    set trang_thai = p_trang_thai,
        storage_path = coalesce(v_storage_path, report.storage_path),
        ten_tep_goc = coalesce(nullif(p_ten_tep_goc, ''), report.ten_tep_goc),
        mime_type = coalesce(nullif(p_mime_type, ''), report.mime_type),
        kich_thuoc = coalesce(p_kich_thuoc, report.kich_thuoc),
        sha256 = coalesce(nullif(p_sha256, ''), report.sha256),
        export_metadata = report.export_metadata || coalesce(p_export_metadata, '{}'::jsonb),
        source_manifest = case when p_trang_thai = 'cho_duyet' then v_manifest else report.source_manifest end,
        source_digest = case when p_trang_thai = 'cho_duyet' then p_source_digest else report.source_digest end,
        nguoi_gui_duyet = case when p_trang_thai = 'cho_duyet' then v_nguoi_dung_id else report.nguoi_gui_duyet end,
        ngay_gui_duyet = case when p_trang_thai = 'cho_duyet' then now() else report.ngay_gui_duyet end,
        ly_do_tra_lai = case
          when p_trang_thai = 'tra_lai' then v_return_reason
          when p_trang_thai in ('nhap', 'cho_duyet') then null
          else report.ly_do_tra_lai
        end,
        nguoi_phe_duyet = case when p_trang_thai = 'da_phe_duyet' then v_nguoi_dung_id end,
        ngay_phe_duyet = case when p_trang_thai = 'da_phe_duyet' then now() end,
        updated_at = now()
    where report.id = v_report.id
    returning * into v_report;
  end if;

  perform public.fn_log_audit(
    'REPORT_STATUS_UPDATED', 'bao_cao', v_report.id, null,
    jsonb_build_object(
      'nam_hoc_id', p_nam_hoc_id,
      'cap_hoc', p_cap_hoc,
      'loai_bao_cao', p_loai_bao_cao,
      'trang_thai', p_trang_thai,
      'version', v_report.version,
      'co_ly_do_tra_lai', v_return_reason is not null
    )
  );

  return v_report.id;
end;
$$;

revoke all on function public.fn_luu_trang_thai_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao, text, text, text, text,
  bigint, varchar, jsonb, uuid, varchar, text
) from public, anon;
grant execute on function public.fn_luu_trang_thai_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao, text, text, text, text,
  bigint, varchar, jsonb, uuid, varchar, text
) to authenticated;

create or replace function public.fn_can_delete_report_file(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.fn_current_co_so_id() is not null
    and split_part(p_storage_path, '/', 1) = public.fn_current_co_so_id()::text
    and not exists (
      select 1 from public.bao_cao report
      where report.storage_path = p_storage_path
        and public.fn_is_approved_report_status(report.trang_thai)
    )
    and (
      public.fn_has_role('PRINCIPAL', public.fn_current_co_so_id())
      or (
        public.fn_has_permission('report.export', public.fn_current_co_so_id())
        and not exists (
          select 1 from public.bao_cao report
          where report.storage_path = p_storage_path
        )
      )
    )
$$;

revoke all on function public.fn_can_delete_report_file(text) from public, anon;
grant execute on function public.fn_can_delete_report_file(text) to authenticated;

commit;
