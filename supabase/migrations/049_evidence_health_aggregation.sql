begin;

create or replace function public.fn_suc_khoe_minh_chung(p_nam_hoc_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_result jsonb;
begin
  if v_co_so_id is null or not public.fn_has_permission('evidence.verify', v_co_so_id) then
    raise exception using errcode = '42501', message = 'Bạn không có quyền xem tổng hợp sức khỏe minh chứng.';
  end if;

  if not exists (
    select 1 from public.nam_hoc school_year
    where school_year.id = p_nam_hoc_id and school_year.co_so_id = v_co_so_id
  ) then
    raise exception using errcode = 'P0002', message = 'Năm học không thuộc đơn vị hiện tại.';
  end if;

  select jsonb_build_object(
    'expired', coalesce((
      select jsonb_agg(jsonb_build_object('id', evidence.id, 'ma', evidence.ma, 'ten', evidence.ten) order by evidence.ma)
      from public.minh_chung evidence
      where evidence.co_so_id = v_co_so_id
        and evidence.nam_hoc_id = p_nam_hoc_id
        and evidence.deleted_at is null
        and evidence.ngay_het_gia_tri < current_date
    ), '[]'::jsonb),
    'orphans', coalesce((
      select jsonb_agg(jsonb_build_object('id', evidence.id, 'ma', evidence.ma, 'ten', evidence.ten) order by evidence.ma)
      from public.minh_chung evidence
      where evidence.co_so_id = v_co_so_id
        and evidence.nam_hoc_id = p_nam_hoc_id
        and evidence.deleted_at is null
        and not exists (
          select 1 from public.minh_chung_tieu_chi link
          where link.minh_chung_id = evidence.id
        )
    ), '[]'::jsonb),
    'duplicate_groups', coalesce((
      select jsonb_agg(jsonb_build_object('hash_tep', duplicate.hash_tep, 'items', duplicate.items) order by duplicate.hash_tep)
      from (
        select evidence.hash_tep,
          jsonb_agg(jsonb_build_object('id', evidence.id, 'ma', evidence.ma, 'ten', evidence.ten, 'hash_tep', evidence.hash_tep) order by evidence.ma) as items
        from public.minh_chung evidence
        where evidence.co_so_id = v_co_so_id
          and evidence.nam_hoc_id = p_nam_hoc_id
          and evidence.deleted_at is null
          and evidence.hash_tep is not null
        group by evidence.hash_tep
        having count(*) > 1
      ) duplicate
    ), '[]'::jsonb),
    'empty_criteria', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', criterion.id,
        'ma', criterion.ma,
        'ten', criterion.ten,
        'la_bat_buoc', criterion.la_bat_buoc,
        'tieu_chuan_id', criterion.tieu_chuan_id,
        'tieu_chuan_so_thu_tu', criterion.tieu_chuan_so_thu_tu,
        'tieu_chuan_ten', criterion.tieu_chuan_ten
      ) order by criterion.ma)
      from public.v_tieu_chi_nam_hoc criterion
      where criterion.co_so_id = v_co_so_id
        and criterion.nam_hoc_id = p_nam_hoc_id
        and not exists (
          select 1
          from public.minh_chung_tieu_chi link
          join public.minh_chung evidence on evidence.id = link.minh_chung_id
          where link.tieu_chi_id = criterion.id
            and evidence.co_so_id = v_co_so_id
            and evidence.nam_hoc_id = p_nam_hoc_id
            and evidence.deleted_at is null
        )
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.fn_suc_khoe_minh_chung(uuid) from public, anon, authenticated;
grant execute on function public.fn_suc_khoe_minh_chung(uuid) to authenticated;

commit;
