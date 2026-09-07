begin;

alter table public.bao_cao
  add column if not exists source_manifest jsonb,
  add column if not exists source_digest varchar(64);

alter table public.bao_cao
  drop constraint if exists ck_bao_cao_source_digest;
alter table public.bao_cao
  add constraint ck_bao_cao_source_digest
  check (source_digest is null or source_digest ~ '^[0-9a-f]{64}$');

-- Manifest chi gom cac bang nguon tao ra noi dung file. Mang luon duoc sap xep de
-- cung mot trang thai nghiep vu tao ra cung mot digest tren moi moi truong.
create or replace function public.fn_report_source_manifest_for_tenant(
  p_co_so_id uuid,
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_loai_bao_cao public.loai_bao_cao
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'schema_version', 1,
    'co_so_id', p_co_so_id,
    'nam_hoc_id', p_nam_hoc_id,
    'cap_hoc', p_cap_hoc,
    'loai_bao_cao', p_loai_bao_cao,
    'bo_tieu_chuan', coalesce((
      select jsonb_build_object(
        'id', standard_set.id,
        'ma_van_ban', standard_set.ma_van_ban,
        'loai_hinh', standard_set.loai_hinh,
        'version', standard_set.version,
        'updated_at', standard_set.updated_at
      )
      from public.nam_hoc school_year
      join public.bo_tieu_chuan standard_set on standard_set.id = school_year.bo_tieu_chuan_id
      where school_year.id = p_nam_hoc_id and school_year.co_so_id = p_co_so_id
    ), '{}'::jsonb),
    'tu_danh_gia', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', assessment.id,
        'tieu_chi_id', assessment.tieu_chi_id,
        'revision', assessment.revision,
        'muc_dat', assessment.muc_dat,
        'mo_ta_muc_1', assessment.mo_ta_muc_1,
        'mo_ta_muc_2', assessment.mo_ta_muc_2,
        'trang_thai', assessment.trang_thai,
        'updated_at', assessment.updated_at
      ) order by criterion.ma, assessment.id)
      from public.tu_danh_gia assessment
      join public.tieu_chi criterion on criterion.id = assessment.tieu_chi_id
      where assessment.co_so_id = p_co_so_id
        and assessment.nam_hoc_id = p_nam_hoc_id
        and assessment.cap_hoc = p_cap_hoc
        and not assessment.la_du_lieu_demo
    ), '[]'::jsonb),
    'minh_chung', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', evidence.id,
        'ma', evidence.ma,
        'ten', evidence.ten,
        'storage_path', evidence.storage_path,
        'duong_dan', evidence.duong_dan,
        'hash_tep', evidence.hash_tep,
        'ngay_ban_hanh', evidence.ngay_ban_hanh,
        'ngay_het_gia_tri', evidence.ngay_het_gia_tri,
        'trang_thai_xac_minh', evidence.trang_thai_xac_minh,
        'updated_at', evidence.updated_at
      ) order by evidence.ma, evidence.id)
      from public.minh_chung evidence
      where evidence.co_so_id = p_co_so_id
        and evidence.nam_hoc_id = p_nam_hoc_id
        and evidence.deleted_at is null
        and not evidence.la_du_lieu_demo
    ), '[]'::jsonb),
    'lien_ket_tu_danh_gia_minh_chung', coalesce((
      select jsonb_agg(jsonb_build_object(
        'tu_danh_gia_id', link.tu_danh_gia_id,
        'minh_chung_id', link.minh_chung_id,
        'updated_at', link.updated_at
      ) order by link.tu_danh_gia_id, link.minh_chung_id)
      from public.tu_danh_gia_minh_chung link
      join public.tu_danh_gia assessment on assessment.id = link.tu_danh_gia_id
      where link.co_so_id = p_co_so_id
        and link.nam_hoc_id = p_nam_hoc_id
        and assessment.cap_hoc = p_cap_hoc
        and not assessment.la_du_lieu_demo
    ), '[]'::jsonb),
    'nhan_xet_tieu_chuan', coalesce((
      select jsonb_agg(to_jsonb(note) - 'co_so_id' - 'nam_hoc_id' order by note.tieu_chuan_id, note.id)
      from public.nhan_xet_tieu_chuan note
      where note.co_so_id = p_co_so_id
        and note.nam_hoc_id = p_nam_hoc_id
        and note.cap_hoc = p_cap_hoc
        and not note.la_du_lieu_demo
    ), '[]'::jsonb),
    'hoi_dong', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', council.id,
        'ten', council.ten,
        'so_quyet_dinh', council.so_quyet_dinh,
        'ngay_quyet_dinh', council.ngay_quyet_dinh,
        'trang_thai', council.trang_thai,
        'updated_at', council.updated_at
      ) order by council.id)
      from public.hoi_dong_tu_danh_gia council
      where council.co_so_id = p_co_so_id and council.nam_hoc_id = p_nam_hoc_id
    ), '[]'::jsonb),
    'thanh_vien_hoi_dong', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', member.id,
        'hoi_dong_id', member.hoi_dong_id,
        'nguoi_dung_id', member.nguoi_dung_id,
        'chuc_vu', member.chuc_vu,
        'vai_tro_hoi_dong', member.vai_tro_hoi_dong,
        'thu_tu', member.thu_tu,
        'created_at', member.created_at
      ) order by member.hoi_dong_id, member.thu_tu, member.id)
      from public.thanh_vien_hoi_dong member
      where member.co_so_id = p_co_so_id and member.nam_hoc_id = p_nam_hoc_id
    ), '[]'::jsonb),
    'ke_hoach_cai_tien', coalesce((
      select jsonb_agg(to_jsonb(plan) - 'co_so_id' - 'nam_hoc_id' order by plan.created_at, plan.id)
      from public.ke_hoach_cai_tien plan
      where plan.co_so_id = p_co_so_id
        and plan.nam_hoc_id = p_nam_hoc_id
        and not plan.la_du_lieu_demo
    ), '[]'::jsonb),
    'noi_dung_mau_2', coalesce((
      select to_jsonb(section) - 'co_so_id' - 'nam_hoc_id'
      from public.noi_dung_mau_2 section
      where section.co_so_id = p_co_so_id
        and section.nam_hoc_id = p_nam_hoc_id
        and section.cap_hoc = p_cap_hoc
    ), '{}'::jsonb)
  )
$$;

create or replace function public.fn_lay_niem_phong_nguon_bao_cao(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_loai_bao_cao public.loai_bao_cao
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_manifest jsonb;
begin
  if v_co_so_id is null or not public.fn_has_permission('report.export', v_co_so_id) then
    raise exception using errcode = '42501', message = 'Ban chua co quyen xuat bao cao.';
  end if;

  if not exists (
    select 1 from public.nam_hoc
    where id = p_nam_hoc_id and co_so_id = v_co_so_id
  ) then
    raise exception using errcode = 'P0002', message = 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  v_manifest := public.fn_report_source_manifest_for_tenant(
    v_co_so_id, p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao
  );

  return jsonb_build_object(
    'digest', encode(extensions.digest(convert_to(v_manifest::text, 'UTF8'), 'sha256'), 'hex'),
    'manifest', v_manifest
  );
end;
$$;

drop function if exists public.fn_luu_trang_thai_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao, text, text, text, text, bigint, varchar, jsonb
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
  p_source_digest varchar default null
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
  v_storage_path text := nullif(p_storage_path, '');
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception using errcode = '28000', message = 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not exists (select 1 from public.nam_hoc where id = p_nam_hoc_id and co_so_id = v_co_so_id) then
    raise exception using errcode = 'P0002', message = 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  if p_trang_thai not in ('nhap', 'cho_duyet', 'da_phe_duyet', 'tra_lai') then
    raise exception using errcode = '22023', message = 'Trang thai bao cao khong hop le.';
  end if;

  if v_storage_path is not null and v_storage_path not like v_co_so_id::text || '/%' then
    raise exception using errcode = '42501', message = 'Duong dan luu tru bao cao khong thuoc don vi hien tai.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_co_so_id::text || p_nam_hoc_id::text || p_loai_bao_cao::text || p_cap_hoc::text, 9006)
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

    -- Retry cua cung mot request phe duyet phai tra ve snapshot cu, khong tao version moi.
    if p_trang_thai = 'da_phe_duyet' and v_report.trang_thai = 'da_phe_duyet' then
      if p_source_digest is distinct from v_report.source_digest then
        raise exception using errcode = '40001', message = 'Du lieu nguon cua bao cao khong con trung khop.';
      end if;
      return v_report.id;
    end if;
  elsif p_trang_thai = 'da_phe_duyet' then
    raise exception using errcode = '22023', message = 'Phe duyet bao cao phai chi ro ban bao cao da duoc xuat.';
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
    if not (
      public.fn_has_permission('report.approve', v_co_so_id)
      and (public.fn_has_role('PRINCIPAL', v_co_so_id) or public.fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id))
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
      raise exception using errcode = '40001', message = 'Du lieu nguon da thay doi ke tu khi xuat file. Hay xuat lai bao cao.';
    end if;

    v_readiness := public.fn_kiem_tra_san_sang_bao_cao(p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao);
    if not coalesce((v_readiness ->> 'ready')::boolean, false) then
      raise exception using errcode = '23514', message = 'Bao cao chua san sang de phe duyet.', detail = v_readiness::text;
    end if;

    if v_storage_path is null or nullif(p_ten_tep_goc, '') is null then
      raise exception using errcode = '23502', message = 'Bao cao phe duyet phai co file snapshot va ten tep goc.';
    end if;

  elsif not public.fn_has_permission('report.export', v_co_so_id) then
    raise exception using errcode = '42501', message = 'Ban chua co quyen bien tap hoac xuat bao cao.';
  end if;

  if p_source_digest is not null and p_trang_thai <> 'da_phe_duyet' then
    v_manifest := public.fn_report_source_manifest_for_tenant(
      v_co_so_id, p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao
    );
    v_current_digest := encode(extensions.digest(convert_to(v_manifest::text, 'UTF8'), 'sha256'), 'hex');

    if p_source_digest is distinct from v_current_digest then
      raise exception using errcode = '40001', message = 'Du lieu nguon da thay doi ke tu khi xuat file. Hay xuat lai bao cao.';
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
      source_manifest, source_digest, nguoi_tao, nguoi_phe_duyet, ngay_phe_duyet
    ) values (
      v_co_so_id, p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao, v_version, p_trang_thai,
      v_storage_path, p_ten_tep_goc, p_mime_type, p_kich_thuoc, p_sha256,
      coalesce(p_export_metadata, '{}'::jsonb), v_manifest, p_source_digest, v_nguoi_dung_id,
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
        source_manifest = coalesce(v_manifest, report.source_manifest),
        source_digest = coalesce(p_source_digest, report.source_digest),
        nguoi_phe_duyet = case when p_trang_thai = 'da_phe_duyet' then v_nguoi_dung_id end,
        ngay_phe_duyet = case when p_trang_thai = 'da_phe_duyet' then now() end,
        updated_at = now()
    where report.id = v_report.id
    returning * into v_report;
  end if;

  perform public.fn_log_audit(
    'REPORT_STATUS_UPDATED', 'bao_cao', v_report.id, null,
    jsonb_build_object(
      'nam_hoc_id', p_nam_hoc_id, 'cap_hoc', p_cap_hoc,
      'loai_bao_cao', p_loai_bao_cao, 'trang_thai', p_trang_thai,
      'version', v_report.version, 'source_digest', v_report.source_digest
    )
  );

  return v_report.id;
end;
$$;

revoke all on function public.fn_report_source_manifest_for_tenant(uuid, uuid, public.cap_hoc, public.loai_bao_cao)
from public, anon, authenticated;
revoke all on function public.fn_lay_niem_phong_nguon_bao_cao(uuid, public.cap_hoc, public.loai_bao_cao)
from public, anon;
grant execute on function public.fn_lay_niem_phong_nguon_bao_cao(uuid, public.cap_hoc, public.loai_bao_cao)
to authenticated;
revoke all on function public.fn_luu_trang_thai_bao_cao(uuid, public.cap_hoc, public.loai_bao_cao, text, text, text, text, bigint, varchar, jsonb, uuid, varchar)
from public, anon;
grant execute on function public.fn_luu_trang_thai_bao_cao(uuid, public.cap_hoc, public.loai_bao_cao, text, text, text, text, bigint, varchar, jsonb, uuid, varchar)
to authenticated;

commit;
