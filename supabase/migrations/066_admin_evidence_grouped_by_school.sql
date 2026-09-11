begin;

create or replace function public.fn_admin_tong_hop_minh_chung_theo_co_so(
  p_tu_khoa text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  co_so_id uuid,
  ma_truong text,
  co_so_ten text,
  trang_thai_co_so text,
  tong_minh_chung bigint,
  cho_xac_minh bigint,
  da_xac_minh bigint,
  can_kiem_tra bigint,
  het_han bigint,
  cap_nhat_gan_nhat timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tu_khoa text := nullif(pg_catalog.btrim(coalesce(p_tu_khoa, '')), '');
begin
  perform public.fn_require_system_admin();

  if p_limit < 1 or p_limit > 100 or p_offset < 0 then
    raise exception using errcode = '22023', message = 'Phan trang khong hop le.';
  end if;

  if v_tu_khoa is not null and char_length(v_tu_khoa) > 100 then
    raise exception using errcode = '22023', message = 'Tu khoa khong duoc vuot qua 100 ky tu.';
  end if;

  return query
  with evidence_summary as (
    select
      evidence.co_so_id,
      count(*)::bigint as tong_minh_chung,
      count(*) filter (
        where evidence.trang_thai_xac_minh::text = 'cho_xac_minh'
      )::bigint as cho_xac_minh,
      count(*) filter (
        where evidence.trang_thai_xac_minh::text = 'da_xac_minh'
      )::bigint as da_xac_minh,
      count(*) filter (
        where evidence.can_kiem_tra_ky_thuat
          or evidence.ngay_het_gia_tri < current_date
          or (evidence.storage_path is null and evidence.duong_dan is null)
      )::bigint as can_kiem_tra,
      count(*) filter (
        where evidence.ngay_het_gia_tri < current_date
      )::bigint as het_han,
      max(evidence.updated_at) as cap_nhat_gan_nhat
    from public.minh_chung evidence
    where evidence.deleted_at is null
    group by evidence.co_so_id
  )
  select
    school.id,
    school.ma_truong::text,
    school.ten::text,
    school.trang_thai::text,
    coalesce(summary.tong_minh_chung, 0::bigint),
    coalesce(summary.cho_xac_minh, 0::bigint),
    coalesce(summary.da_xac_minh, 0::bigint),
    coalesce(summary.can_kiem_tra, 0::bigint),
    coalesce(summary.het_han, 0::bigint),
    summary.cap_nhat_gan_nhat,
    count(*) over ()::bigint
  from public.co_so_giao_duc school
  left join evidence_summary summary on summary.co_so_id = school.id
  where v_tu_khoa is null
    or school.ten ilike '%' || v_tu_khoa || '%'
    or school.ma_truong ilike '%' || v_tu_khoa || '%'
  order by
    coalesce(summary.tong_minh_chung, 0) desc,
    summary.cap_nhat_gan_nhat desc nulls last,
    school.ten,
    school.id
  limit p_limit
  offset p_offset;
end;
$$;

revoke all on function public.fn_admin_tong_hop_minh_chung_theo_co_so(text, integer, integer)
from public, anon, authenticated;
grant execute on function public.fn_admin_tong_hop_minh_chung_theo_co_so(text, integer, integer)
to authenticated;

comment on function public.fn_admin_tong_hop_minh_chung_theo_co_so(text, integer, integer) is
  'Tong hop metadata minh chung theo co so; khong tra noi dung, duong dan, hash hoac lien ket tai tep.';

commit;
