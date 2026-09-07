begin;

alter function public.fn_kiem_tra_san_sang_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao
) rename to fn_kiem_tra_san_sang_bao_cao_before_archive;

create function public.fn_kiem_tra_san_sang_bao_cao(
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
  v_result jsonb;
  v_blocker constant text := 'Chua co dong ke hoach cai tien.';
begin
  v_result := public.fn_kiem_tra_san_sang_bao_cao_before_archive(
    p_nam_hoc_id,
    p_cap_hoc,
    p_loai_bao_cao
  );

  if p_loai_bao_cao = 'mau_2_ke_hoach_cai_tien'
    and not exists (
      select 1
      from public.ke_hoach_cai_tien plan
      where plan.co_so_id = public.fn_current_co_so_id()
        and plan.nam_hoc_id = p_nam_hoc_id
        and plan.archived_at is null
    )
    and not coalesce(v_result -> 'other_blockers', '[]'::jsonb)
      @> pg_catalog.jsonb_build_array(v_blocker)
  then
    v_result := pg_catalog.jsonb_set(
      v_result,
      '{other_blockers}',
      coalesce(v_result -> 'other_blockers', '[]'::jsonb)
        || pg_catalog.jsonb_build_array(v_blocker)
    );
    v_result := pg_catalog.jsonb_set(v_result, '{ready}', 'false'::jsonb);
  end if;

  return v_result;
end;
$$;

revoke all on function public.fn_kiem_tra_san_sang_bao_cao_before_archive(
  uuid, public.cap_hoc, public.loai_bao_cao
) from public, anon, authenticated;
revoke all on function public.fn_kiem_tra_san_sang_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao
) from public, anon;
grant execute on function public.fn_kiem_tra_san_sang_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao
) to authenticated;

alter function public.fn_report_source_manifest_for_tenant(
  uuid, uuid, public.cap_hoc, public.loai_bao_cao
) rename to fn_report_source_manifest_for_tenant_before_archive;

create function public.fn_report_source_manifest_for_tenant(
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
  select public.fn_report_source_manifest_for_tenant_before_archive(
    p_co_so_id,
    p_nam_hoc_id,
    p_cap_hoc,
    p_loai_bao_cao
  ) || pg_catalog.jsonb_build_object(
    'ke_hoach_cai_tien',
    coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(plan) - 'co_so_id' - 'nam_hoc_id'
        order by plan.created_at, plan.id
      )
      from public.ke_hoach_cai_tien plan
      where plan.co_so_id = p_co_so_id
        and plan.nam_hoc_id = p_nam_hoc_id
        and plan.archived_at is null
        and not plan.la_du_lieu_demo
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.fn_report_source_manifest_for_tenant_before_archive(
  uuid, uuid, public.cap_hoc, public.loai_bao_cao
) from public, anon, authenticated;
revoke all on function public.fn_report_source_manifest_for_tenant(
  uuid, uuid, public.cap_hoc, public.loai_bao_cao
) from public, anon, authenticated;

commit;
