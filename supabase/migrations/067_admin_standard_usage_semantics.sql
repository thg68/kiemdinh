begin;

drop function if exists public.fn_admin_danh_sach_bo_tieu_chuan();

create function public.fn_admin_danh_sach_bo_tieu_chuan()
returns table (
  id uuid,
  ma_van_ban text,
  ten text,
  loai_hinh text,
  version integer,
  trang_thai text,
  ngay_hieu_luc date,
  ngay_het_hieu_luc date,
  so_tieu_chuan bigint,
  so_tieu_chi bigint,
  so_co_so_su_dung bigint,
  so_luot_ap_dung bigint,
  cac_ky_nam_hoc_su_dung text[]
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public.fn_require_system_admin();

  return query
  select
    standard_set.id,
    standard_set.ma_van_ban::text,
    standard_set.ten,
    standard_set.loai_hinh::text,
    standard_set.version,
    standard_set.trang_thai::text,
    standard_set.ngay_hieu_luc,
    standard_set.ngay_het_hieu_luc,
    (
      select count(*)::bigint
      from public.tieu_chuan standard
      where standard.bo_id = standard_set.id
    ),
    (
      select count(*)::bigint
      from public.tieu_chuan standard
      join public.tieu_chi criterion on criterion.tieu_chuan_id = standard.id
      where standard.bo_id = standard_set.id
    ),
    (
      select count(distinct school_year.co_so_id)::bigint
      from public.nam_hoc school_year
      where school_year.bo_tieu_chuan_id = standard_set.id
    ),
    (
      select count(*)::bigint
      from public.nam_hoc school_year
      where school_year.bo_tieu_chuan_id = standard_set.id
    ),
    coalesce(
      (
        select array_agg(period.ten order by period.ten)::text[]
        from (
          select distinct school_year.ten::text as ten
          from public.nam_hoc school_year
          where school_year.bo_tieu_chuan_id = standard_set.id
        ) period
      ),
      array[]::text[]
    )
  from public.bo_tieu_chuan standard_set
  order by standard_set.ma_van_ban, standard_set.version desc, standard_set.loai_hinh;
end;
$$;

revoke all on function public.fn_admin_danh_sach_bo_tieu_chuan()
from public, anon, authenticated;
grant execute on function public.fn_admin_danh_sach_bo_tieu_chuan()
to authenticated;

comment on function public.fn_admin_danh_sach_bo_tieu_chuan() is
  'Tra danh muc bo tieu chuan kem so co so, luot ap dung co so-nam hoc va cac ky nam hoc rieng biet.';

commit;
