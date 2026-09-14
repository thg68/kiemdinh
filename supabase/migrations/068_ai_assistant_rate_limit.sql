begin;

alter table public.gioi_han_api
  drop constraint if exists gioi_han_api_hanh_dong_check;

alter table public.gioi_han_api
  add constraint gioi_han_api_hanh_dong_check
  check (hanh_dong in (
    'report_export',
    'evidence_zip',
    'evidence_signed_url',
    'ai_generate'
  ));

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
    when 'ai_generate' then
      v_gioi_han := 12;
      v_so_giay_cua_so := 300;
    else
      raise exception using
        errcode = '22023',
        message = 'Hành động rate limit không hợp lệ.';
  end case;

  if v_auth_user_id is null or v_co_so_id is null then
    raise exception using errcode = '42501', message = 'Yêu cầu đăng nhập hợp lệ.';
  end if;

  v_cua_so_bat_dau := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / v_so_giay_cua_so) * v_so_giay_cua_so
  );

  insert into public.gioi_han_api(
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
    so_luong = public.gioi_han_api.so_luong + 1,
    updated_at = now()
  returning so_luong into v_so_luong;

  v_thu_lai_sau := greatest(
    1,
    ceil(
      extract(epoch from (
        v_cua_so_bat_dau + make_interval(secs => v_so_giay_cua_so) - clock_timestamp()
      ))
    )::integer
  );

  return query
  select
    v_so_luong <= v_gioi_han,
    greatest(v_gioi_han - v_so_luong, 0),
    v_thu_lai_sau;
end;
$$;

revoke all on function public.fn_kiem_tra_gioi_han_api(text) from public, anon;
grant execute on function public.fn_kiem_tra_gioi_han_api(text) to authenticated;

commit;
