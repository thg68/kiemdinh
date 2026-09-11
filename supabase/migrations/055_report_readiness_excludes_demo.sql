begin;

create or replace function public.fn_minh_chung_hop_le_cho_tu_danh_gia(
  p_tu_danh_gia_id uuid,
  p_co_so_id uuid,
  p_nam_hoc_id uuid,
  p_tieu_chi_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.tu_danh_gia_minh_chung scoped_link
    join public.minh_chung evidence
      on evidence.id = scoped_link.minh_chung_id
      and evidence.co_so_id = scoped_link.co_so_id
      and evidence.nam_hoc_id = scoped_link.nam_hoc_id
    join public.nam_hoc school_year
      on school_year.id = evidence.nam_hoc_id
      and school_year.co_so_id = evidence.co_so_id
    join public.minh_chung_tieu_chi criterion_link
      on criterion_link.minh_chung_id = evidence.id
      and criterion_link.tieu_chi_id = p_tieu_chi_id
    where scoped_link.tu_danh_gia_id = p_tu_danh_gia_id
      and scoped_link.co_so_id = p_co_so_id
      and scoped_link.nam_hoc_id = p_nam_hoc_id
      and evidence.deleted_at is null
      and not evidence.la_du_lieu_demo
      and not coalesce((
        select assessment.la_du_lieu_demo
        from public.tu_danh_gia assessment
        where assessment.id = p_tu_danh_gia_id
          and assessment.co_so_id = p_co_so_id
          and assessment.nam_hoc_id = p_nam_hoc_id
          and assessment.tieu_chi_id = p_tieu_chi_id
      ), false)
      and evidence.trang_thai_xac_minh = 'da_xac_minh'
      and (
        evidence.ngay_het_gia_tri is null
        or evidence.ngay_het_gia_tri >= least(current_date, school_year.ngay_ket_thuc)
      )
      and public.fn_tieu_chi_thuoc_nam_hoc(p_nam_hoc_id, p_tieu_chi_id)
  )
$$;

create or replace function public.fn_minh_chung_hop_le_cho_tieu_chi_cap(
  p_co_so_id uuid,
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_tieu_chi_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.tu_danh_gia assessment
    where assessment.co_so_id = p_co_so_id
      and assessment.nam_hoc_id = p_nam_hoc_id
      and assessment.cap_hoc = p_cap_hoc
      and assessment.tieu_chi_id = p_tieu_chi_id
      and not assessment.la_du_lieu_demo
      and public.fn_minh_chung_hop_le_cho_tu_danh_gia(
        assessment.id,
        assessment.co_so_id,
        assessment.nam_hoc_id,
        assessment.tieu_chi_id
      )
  )
$$;

create or replace function public.fn_kiem_tra_san_sang_bao_cao(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_loai_bao_cao public.loai_bao_cao default 'mau_1_tu_danh_gia'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_missing_criteria text[] := array[]::text[];
  v_missing_descriptions text[] := array[]::text[];
  v_missing_evidence text[] := array[]::text[];
  v_unverified_evidence text[] := array[]::text[];
  v_other_blockers text[] := array[]::text[];
  v_missing_council boolean;
  v_ready boolean;
begin
  if v_co_so_id is null or not public.fn_has_permission('report.read', v_co_so_id) then
    raise exception 'Ban khong co quyen kiem tra bao cao cua don vi.';
  end if;

  if not exists (
    select 1 from public.nam_hoc
    where id = p_nam_hoc_id and co_so_id = v_co_so_id
  ) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  select coalesce(array_agg(vtc.ma order by vtc.ma), array[]::text[])
  into v_missing_criteria
  from public.v_tieu_chi_nam_hoc vtc
  left join public.tu_danh_gia assessment
    on assessment.co_so_id = vtc.co_so_id
    and assessment.nam_hoc_id = vtc.nam_hoc_id
    and assessment.tieu_chi_id = vtc.id
    and assessment.cap_hoc = p_cap_hoc
    and not assessment.la_du_lieu_demo
  where vtc.co_so_id = v_co_so_id
    and vtc.nam_hoc_id = p_nam_hoc_id
    and assessment.id is null;

  select coalesce(array_agg(vtc.ma order by vtc.ma), array[]::text[])
  into v_missing_descriptions
  from public.v_tieu_chi_nam_hoc vtc
  join public.tu_danh_gia assessment
    on assessment.co_so_id = vtc.co_so_id
    and assessment.nam_hoc_id = vtc.nam_hoc_id
    and assessment.tieu_chi_id = vtc.id
    and assessment.cap_hoc = p_cap_hoc
    and not assessment.la_du_lieu_demo
  where vtc.co_so_id = v_co_so_id
    and vtc.nam_hoc_id = p_nam_hoc_id
    and (
      nullif(pg_catalog.btrim(coalesce(assessment.mo_ta_muc_1, '')), '') is null
      or (
        assessment.muc_dat = 2
        and nullif(pg_catalog.btrim(coalesce(assessment.mo_ta_muc_2, '')), '') is null
      )
    );

  select coalesce(array_agg(vtc.ma order by vtc.ma), array[]::text[])
  into v_missing_evidence
  from public.v_tieu_chi_nam_hoc vtc
  where vtc.co_so_id = v_co_so_id
    and vtc.nam_hoc_id = p_nam_hoc_id
    and not public.fn_minh_chung_hop_le_cho_tieu_chi_cap(
      v_co_so_id, p_nam_hoc_id, p_cap_hoc, vtc.id
    );

  select coalesce(
    array_agg(distinct evidence.ma order by evidence.ma),
    array[]::text[]
  )
  into v_unverified_evidence
  from public.tu_danh_gia assessment
  join public.tu_danh_gia_minh_chung scoped_link
    on scoped_link.tu_danh_gia_id = assessment.id
  join public.minh_chung evidence
    on evidence.id = scoped_link.minh_chung_id
  where assessment.co_so_id = v_co_so_id
    and assessment.nam_hoc_id = p_nam_hoc_id
    and assessment.cap_hoc = p_cap_hoc
    and not assessment.la_du_lieu_demo
    and not evidence.la_du_lieu_demo
    and evidence.deleted_at is null
    and evidence.trang_thai_xac_minh <> 'da_xac_minh';

  select not exists (
    select 1
    from public.hoi_dong_tu_danh_gia council
    join public.thanh_vien_hoi_dong member on member.hoi_dong_id = council.id
    where council.co_so_id = v_co_so_id
      and council.nam_hoc_id = p_nam_hoc_id
  ) into v_missing_council;

  if (
    select count(*) from public.v_tieu_chi_nam_hoc
    where co_so_id = v_co_so_id and nam_hoc_id = p_nam_hoc_id
  ) <> 15 then
    v_other_blockers := array_append(
      v_other_blockers,
      'Nam hoc khong co du 15 tieu chi cua bo tieu chuan da khoa.'
    );
  end if;

  if exists (
    select 1 from public.tu_danh_gia assessment
    where assessment.co_so_id = v_co_so_id
      and assessment.nam_hoc_id = p_nam_hoc_id
      and assessment.cap_hoc = p_cap_hoc
      and not assessment.la_du_lieu_demo
      and assessment.minh_chung_can_ra_soat
  ) then
    v_other_blockers := array_append(
      v_other_blockers,
      'Co lua chon minh chung cua truong nhieu cap can duoc ra soat lai.'
    );
  end if;

  if p_loai_bao_cao = 'mau_1_tu_danh_gia' then
    if exists (
      select 1
      from public.v_tieu_chi_nam_hoc vtc
      left join public.nhan_xet_tieu_chuan note
        on note.co_so_id = vtc.co_so_id
        and note.nam_hoc_id = vtc.nam_hoc_id
        and note.tieu_chuan_id = vtc.tieu_chuan_id
        and note.cap_hoc = p_cap_hoc
        and not note.la_du_lieu_demo
      where vtc.co_so_id = v_co_so_id
        and vtc.nam_hoc_id = p_nam_hoc_id
        and (
          nullif(pg_catalog.btrim(coalesce(note.diem_manh_noi_bat, '')), '') is null
          or nullif(pg_catalog.btrim(coalesce(note.han_che_trong_tam, '')), '') is null
          or nullif(pg_catalog.btrim(coalesce(note.dinh_huong_cai_tien, '')), '') is null
        )
    ) then
      v_other_blockers := array_append(
        v_other_blockers,
        'Chua du nhan xet sau tung tieu chuan.'
      );
    end if;
  elsif p_loai_bao_cao = 'mau_2_ke_hoach_cai_tien' then
    if not exists (
      select 1 from public.ke_hoach_cai_tien plan
      where plan.co_so_id = v_co_so_id
        and plan.nam_hoc_id = p_nam_hoc_id
        and plan.archived_at is null
        and not plan.la_du_lieu_demo
    ) then
      v_other_blockers := array_append(
        v_other_blockers,
        'Chua co dong ke hoach cai tien.'
      );
    end if;

    if not exists (
      select 1 from public.noi_dung_mau_2 content
      where content.co_so_id = v_co_so_id
        and content.nam_hoc_id = p_nam_hoc_id
        and content.cap_hoc = p_cap_hoc
        and nullif(pg_catalog.btrim(coalesce(content.can_cu_xay_dung, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.muc_dich_yeu_cau, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.tom_tat_van_de_trong_tam, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.theo_doi_danh_gia, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.to_chuc_thuc_hien, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.co_che_danh_gia_bao_cao, '')), '') is not null
    ) then
      v_other_blockers := array_append(
        v_other_blockers,
        'Chua du noi dung 8 phan cua Mau 2.'
      );
    end if;
  end if;

  v_ready := cardinality(v_missing_criteria) = 0
    and cardinality(v_missing_descriptions) = 0
    and cardinality(v_missing_evidence) = 0
    and cardinality(v_unverified_evidence) = 0
    and not v_missing_council
    and cardinality(v_other_blockers) = 0;

  return jsonb_build_object(
    'ready', v_ready,
    'missing_criteria', to_jsonb(v_missing_criteria),
    'missing_descriptions', to_jsonb(v_missing_descriptions),
    'missing_evidence', to_jsonb(v_missing_evidence),
    'unverified_evidence', to_jsonb(v_unverified_evidence),
    'missing_council', v_missing_council,
    'other_blockers', to_jsonb(v_other_blockers)
  );
end;
$$;

revoke all on function public.fn_minh_chung_hop_le_cho_tu_danh_gia(
  uuid, uuid, uuid, uuid
) from public, anon;
grant execute on function public.fn_minh_chung_hop_le_cho_tu_danh_gia(
  uuid, uuid, uuid, uuid
) to authenticated;

revoke all on function public.fn_minh_chung_hop_le_cho_tieu_chi_cap(
  uuid, uuid, public.cap_hoc, uuid
) from public, anon;
grant execute on function public.fn_minh_chung_hop_le_cho_tieu_chi_cap(
  uuid, uuid, public.cap_hoc, uuid
) to authenticated;

revoke all on function public.fn_kiem_tra_san_sang_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao
) from public, anon;
grant execute on function public.fn_kiem_tra_san_sang_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao
) to authenticated;

commit;
