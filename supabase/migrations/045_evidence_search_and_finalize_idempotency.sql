begin;

alter table public.minh_chung
  add column if not exists finalize_key uuid;

create unique index if not exists uq_minh_chung_finalize_key_tenant
  on public.minh_chung(co_so_id, finalize_key)
  where finalize_key is not null;

comment on column public.minh_chung.finalize_key is
  'Khoa yeu cau do client sinh, bao dam retry finalize khong tao them minh chung hoac ma moi.';

create or replace function public.fn_tim_minh_chung_de_dung_lai(
  p_nam_hoc_id uuid,
  p_tu_khoa text default '',
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  ma varchar,
  ten text,
  trang_thai_xac_minh public.trang_thai_xac_minh_minh_chung,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_keyword text := btrim(coalesce(p_tu_khoa, ''));
begin
  if v_co_so_id is null then
    raise exception using errcode = '28000', message = 'Ban can dang nhap de tim minh chung.';
  end if;
  if p_limit not between 1 and 50 or p_offset < 0 then
    raise exception using errcode = '22023', message = 'Pham vi phan trang khong hop le.';
  end if;
  if not exists (
    select 1 from public.nam_hoc school_year
    where school_year.id = p_nam_hoc_id and school_year.co_so_id = v_co_so_id
  ) then
    raise exception using errcode = 'P0002', message = 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  return query
  select
    evidence.id,
    evidence.ma,
    evidence.ten,
    evidence.trang_thai_xac_minh,
    count(*) over() as total_count
  from public.minh_chung evidence
  where evidence.co_so_id = v_co_so_id
    and evidence.nam_hoc_id = p_nam_hoc_id
    and evidence.deleted_at is null
    and public.fn_can_read_minh_chung(evidence.id)
    and (
      v_keyword = ''
      or evidence.ma ilike '%' || v_keyword || '%'
      or evidence.ten ilike '%' || v_keyword || '%'
    )
  order by evidence.created_at desc, evidence.id desc
  limit p_limit offset p_offset;
end;
$$;

create or replace function public.fn_tao_minh_chung_idempotent(
  p_finalize_key uuid,
  p_nam_hoc_id uuid,
  p_tieu_chi_ids uuid[],
  p_tieu_chi_goc_id uuid,
  p_ten text,
  p_loai_tep varchar,
  p_duong_dan text,
  p_storage_path text,
  p_hash_tep varchar,
  p_kich_thuoc bigint,
  p_ngay_ban_hanh date,
  p_ngay_het_gia_tri date
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_existing_id uuid;
  v_minh_chung_id uuid;
begin
  if v_co_so_id is null or public.fn_current_nguoi_dung_id() is null then
    raise exception using errcode = '28000', message = 'Ban can dang nhap de tao minh chung.';
  end if;
  if p_finalize_key is null then
    raise exception using errcode = '22023', message = 'Khoa hoan tat minh chung khong hop le.';
  end if;

  -- Khóa theo cặp tenant/request để hai request đồng thời không cùng sinh mã.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_co_so_id::text || ':' || p_finalize_key::text, 0)
  );

  select evidence.id
  into v_existing_id
  from public.minh_chung evidence
  where evidence.co_so_id = v_co_so_id
    and evidence.finalize_key = p_finalize_key;

  if v_existing_id is not null then
    return jsonb_build_object('id', v_existing_id, 'created', false);
  end if;

  v_minh_chung_id := public.fn_tao_minh_chung(
    p_nam_hoc_id,
    p_tieu_chi_ids,
    p_tieu_chi_goc_id,
    p_ten,
    p_loai_tep,
    p_duong_dan,
    p_storage_path,
    p_hash_tep,
    p_kich_thuoc,
    p_ngay_ban_hanh,
    p_ngay_het_gia_tri
  );

  update public.minh_chung
  set finalize_key = p_finalize_key
  where id = v_minh_chung_id and co_so_id = v_co_so_id;

  return jsonb_build_object('id', v_minh_chung_id, 'created', true);
end;
$$;

revoke all on function public.fn_tim_minh_chung_de_dung_lai(uuid, text, integer, integer)
from public, anon;
grant execute on function public.fn_tim_minh_chung_de_dung_lai(uuid, text, integer, integer)
to authenticated;

revoke all on function public.fn_tao_minh_chung_idempotent(
  uuid, uuid, uuid[], uuid, text, varchar, text, text, varchar, bigint, date, date
) from public, anon;
grant execute on function public.fn_tao_minh_chung_idempotent(
  uuid, uuid, uuid[], uuid, text, varchar, text, text, varchar, bigint, date, date
) to authenticated;

commit;
