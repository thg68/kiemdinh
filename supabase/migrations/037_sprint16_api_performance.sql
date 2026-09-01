begin;

create table if not exists public.gioi_han_api (
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  co_so_id uuid not null references public.co_so_giao_duc(id) on delete cascade,
  hanh_dong varchar(50) not null check (
    hanh_dong in ('report_export', 'evidence_zip', 'evidence_signed_url')
  ),
  cua_so_bat_dau timestamptz not null,
  so_luong integer not null default 1 check (so_luong > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (auth_user_id, hanh_dong, cua_so_bat_dau)
);

alter table public.gioi_han_api enable row level security;
revoke all on table public.gioi_han_api from public, anon, authenticated;

create index if not exists idx_gioi_han_api_user_window
  on public.gioi_han_api(auth_user_id, cua_so_bat_dau);

create or replace function public.fn_kiem_tra_gioi_han_api(
  p_hanh_dong text
)
returns table (
  duoc_phep boolean,
  con_lai integer,
  thu_lai_sau_giay integer
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_gioi_han integer;
  v_so_giay_cua_so integer;
  v_cua_so_bat_dau timestamptz;
  v_so_luong integer;
  v_thu_lai_sau integer;
begin
  case p_hanh_dong
    when 'report_export' then
      v_gioi_han := 10;
      v_so_giay_cua_so := 300;
    when 'evidence_zip' then
      v_gioi_han := 2;
      v_so_giay_cua_so := 600;
    when 'evidence_signed_url' then
      v_gioi_han := 60;
      v_so_giay_cua_so := 60;
    else
      raise exception using
        errcode = '22023',
        message = 'Hành động rate limit không hợp lệ.';
  end case;

  if v_auth_user_id is null or v_co_so_id is null then
    raise exception using
      errcode = '42501',
      message = 'Yêu cầu đăng nhập hợp lệ.';
  end if;

  v_cua_so_bat_dau := pg_catalog.to_timestamp(
    pg_catalog.floor(
      extract(epoch from pg_catalog.clock_timestamp())
      / v_so_giay_cua_so
    ) * v_so_giay_cua_so
  );

  delete from public.gioi_han_api
  where auth_user_id = v_auth_user_id
    and cua_so_bat_dau < pg_catalog.clock_timestamp() - interval '1 day';

  insert into public.gioi_han_api as bucket (
    auth_user_id,
    co_so_id,
    hanh_dong,
    cua_so_bat_dau,
    so_luong
  )
  values (
    v_auth_user_id,
    v_co_so_id,
    p_hanh_dong,
    v_cua_so_bat_dau,
    1
  )
  on conflict (auth_user_id, hanh_dong, cua_so_bat_dau)
  do update set
    so_luong = bucket.so_luong + 1,
    updated_at = pg_catalog.clock_timestamp()
  returning so_luong into v_so_luong;

  v_thu_lai_sau := greatest(
    1,
    pg_catalog.ceil(
      extract(
        epoch from (
          v_cua_so_bat_dau
          + pg_catalog.make_interval(secs => v_so_giay_cua_so)
          - pg_catalog.clock_timestamp()
        )
      )
    )::integer
  );

  return query
  select
    v_so_luong <= v_gioi_han,
    greatest(v_gioi_han - v_so_luong, 0),
    v_thu_lai_sau;
end;
$$;

revoke all on function public.fn_kiem_tra_gioi_han_api(text)
  from public, anon;
grant execute on function public.fn_kiem_tra_gioi_han_api(text)
  to authenticated;

create index if not exists idx_minh_chung_tenant_year_created_active
  on public.minh_chung(co_so_id, nam_hoc_id, created_at desc, id)
  where deleted_at is null;

create index if not exists idx_minh_chung_tenant_year_status_created_active
  on public.minh_chung(
    co_so_id,
    nam_hoc_id,
    trang_thai_xac_minh,
    created_at desc,
    id
  )
  where deleted_at is null;

create index if not exists idx_minh_chung_tieu_chi_criterion_evidence
  on public.minh_chung_tieu_chi(tieu_chi_id, minh_chung_id);

create index if not exists idx_nhat_ky_tenant_object_time
  on public.nhat_ky_truy_cap(co_so_id, doi_tuong, thoi_diem desc, id);

create index if not exists idx_ke_hoach_tenant_year_created
  on public.ke_hoach_cai_tien(co_so_id, nam_hoc_id, created_at desc, id);

create index if not exists idx_ke_hoach_tenant_year_status_updated
  on public.ke_hoach_cai_tien(
    co_so_id,
    nam_hoc_id,
    muc_do_thuc_hien,
    updated_at desc,
    id
  );

create index if not exists idx_nguoi_dung_tenant_name
  on public.nguoi_dung(co_so_id, ho_ten, id);

create index if not exists idx_nguoi_dung_tenant_status_name
  on public.nguoi_dung(co_so_id, trang_thai, ho_ten, id);

commit;
