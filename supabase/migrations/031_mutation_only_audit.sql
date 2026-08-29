-- Chi ghi nhat ky cho thao tac lam thay doi du lieu.
-- Cac client cu van co the goi RPC truy cap, nhung ham khong chen ban ghi moi.
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
begin
  if auth.uid() is null or v_co_so_id is null or public.fn_current_nguoi_dung_id() is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if p_du_lieu_moi is not null and octet_length(p_du_lieu_moi::text) > 8192 then
    raise exception 'Du lieu nhat ky vuot qua gioi han cho phep.';
  end if;

  case p_hanh_dong
    when 'EVIDENCE_LIST_READ', 'EVIDENCE_HEALTH_READ' then
      if not public.fn_has_permission('evidence.read', v_co_so_id) then
        raise exception 'Ban khong co quyen xem minh chung.';
      end if;
    when 'EVIDENCE_DETAIL_READ', 'EVIDENCE_FILE_SIGNED_URL_CREATED' then
      if p_doi_tuong_id is null or not public.fn_can_read_minh_chung(p_doi_tuong_id) then
        raise exception 'Ban khong co quyen xem minh chung nay.';
      end if;
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
    else
      raise exception 'Hanh dong nhat ky khong duoc phep.';
  end case;

  -- Co y khong goi fn_log_audit: doc/xem/xuat khong phai la thay doi du lieu.
  return;
end;
$$;

revoke all on function public.fn_log_user_access(varchar, uuid, jsonb)
from public, anon;
grant execute on function public.fn_log_user_access(varchar, uuid, jsonb)
to authenticated;

-- Giu ban ghi lich su trong CSDL, chi an chung khoi man hinh Nhat ky.
drop policy if exists "nhat_ky_select_by_permission" on public.nhat_ky_truy_cap;

create policy "nhat_ky_select_by_permission" on public.nhat_ky_truy_cap
for select to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('audit.read', co_so_id)
  and hanh_dong not in (
    'EVIDENCE_LIST_READ',
    'EVIDENCE_HEALTH_READ',
    'EVIDENCE_DETAIL_READ',
    'EVIDENCE_FILE_SIGNED_URL_CREATED',
    'REPORT_EXPORTED'
  )
);
