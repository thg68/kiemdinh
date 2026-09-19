create or replace function public.fn_admin_danh_sach_tai_khoan(
  p_tu_khoa text default null,
  p_co_so_id uuid default null,
  p_vai_tro text default null,
  p_trang_thai text default null,
  p_email_da_xac_thuc boolean default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  auth_user_id uuid,
  nguoi_dung_id uuid,
  ho_ten text,
  email text,
  email_da_xac_thuc boolean,
  email_xac_thuc_luc timestamptz,
  trang_thai text,
  co_so_id uuid,
  co_so_ten text,
  vai_tro_mas text[],
  vai_tro_tens text[],
  created_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_tu_khoa text := nullif(pg_catalog.btrim(coalesce(p_tu_khoa, '')), '');
  v_vai_tro text := nullif(pg_catalog.btrim(coalesce(p_vai_tro, '')), '');
  v_trang_thai text := nullif(pg_catalog.btrim(coalesce(p_trang_thai, '')), '');
begin
  perform public.fn_require_system_admin();

  if p_limit < 1 or p_limit > 100 or p_offset < 0 then
    raise exception using errcode = '22023', message = 'Phan trang khong hop le.';
  end if;

  if v_tu_khoa is not null and char_length(v_tu_khoa) > 100 then
    raise exception using errcode = '22023', message = 'Tu khoa khong duoc vuot qua 100 ky tu.';
  end if;

  if v_trang_thai is not null and v_trang_thai not in (
    'active', 'inactive', 'locked', 'invited', 'pending_verification', 'pending_profile'
  ) then
    raise exception using errcode = '22023', message = 'Trang thai tai khoan khong hop le.';
  end if;

  if v_vai_tro is not null and not exists (
    select 1 from public.vai_tro role where role.ma = v_vai_tro
  ) then
    raise exception using errcode = '22023', message = 'Vai tro khong hop le.';
  end if;

  return query
  with accounts as (
    select
      au.id as auth_user_id,
      app_user.id as nguoi_dung_id,
      coalesce(
        nullif(pg_catalog.btrim(app_user.ho_ten::text), ''),
        nullif(pg_catalog.btrim(au.raw_user_meta_data ->> 'ho_ten'), ''),
        nullif(pg_catalog.split_part(coalesce(au.email, ''), '@', 1), ''),
        'Tài khoản chưa hoàn tất hồ sơ'
      )::text as ho_ten,
      lower(coalesce(nullif(pg_catalog.btrim(au.email::text), ''), app_user.email::text))::text as email,
      au.email_confirmed_at is not null as email_da_xac_thuc,
      au.email_confirmed_at as email_xac_thuc_luc,
      case
        when app_user.id is not null then app_user.trang_thai::text
        when au.email_confirmed_at is null then 'pending_verification'
        else 'pending_profile'
      end::text as trang_thai,
      coalesce(app_user.co_so_id, pending_school.id) as co_so_id,
      coalesce(school.ten, pending_school.ten)::text as co_so_ten,
      coalesce(role_data.ma, '{}'::text[]) as vai_tro_mas,
      coalesce(role_data.ten, '{}'::text[]) as vai_tro_tens,
      au.created_at,
      role_data.priority
    from auth.users au
    left join public.nguoi_dung app_user on app_user.auth_user_id = au.id
    left join public.co_so_giao_duc school on school.id = app_user.co_so_id
    left join public.co_so_giao_duc pending_school
      on app_user.id is null
      and pending_school.id::text = nullif(pg_catalog.btrim(au.raw_user_meta_data ->> 'co_so_id'), '')
    left join lateral (
      select
        array_agg(role.ma::text order by case role.ma
          when 'SYSTEM_ADMIN' then 0 when 'PRINCIPAL' then 1
          when 'SELF_ASSESSMENT_CHAIR' then 2 when 'SECRETARY' then 3
          when 'MEMBER' then 4 when 'TEACHER' then 5 when 'VIEWER' then 6 else 99
        end, role.ten) as ma,
        array_agg(role.ten::text order by case role.ma
          when 'SYSTEM_ADMIN' then 0 when 'PRINCIPAL' then 1
          when 'SELF_ASSESSMENT_CHAIR' then 2 when 'SECRETARY' then 3
          when 'MEMBER' then 4 when 'TEACHER' then 5 when 'VIEWER' then 6 else 99
        end, role.ten) as ten,
        min(case role.ma
          when 'SYSTEM_ADMIN' then 0 when 'PRINCIPAL' then 1
          when 'SELF_ASSESSMENT_CHAIR' then 2 when 'SECRETARY' then 3
          when 'MEMBER' then 4 when 'TEACHER' then 5 when 'VIEWER' then 6 else 99
        end) as priority
      from public.nguoi_dung_vai_tro user_role
      join public.vai_tro role on role.id = user_role.vai_tro_id
      where user_role.nguoi_dung_id = app_user.id
        and (user_role.valid_from is null or user_role.valid_from <= current_date)
        and (user_role.valid_until is null or user_role.valid_until >= current_date)
    ) role_data on true
  )
  select
    account.auth_user_id,
    account.nguoi_dung_id,
    account.ho_ten,
    account.email,
    account.email_da_xac_thuc,
    account.email_xac_thuc_luc,
    account.trang_thai,
    account.co_so_id,
    account.co_so_ten,
    account.vai_tro_mas,
    account.vai_tro_tens,
    account.created_at,
    count(*) over ()::bigint
  from accounts account
  where (p_co_so_id is null or account.co_so_id = p_co_so_id)
    and (v_trang_thai is null or account.trang_thai = v_trang_thai)
    and (p_email_da_xac_thuc is null or account.email_da_xac_thuc = p_email_da_xac_thuc)
    and (v_vai_tro is null or v_vai_tro = any(account.vai_tro_mas))
    and (
      v_tu_khoa is null
      or account.ho_ten ilike '%' || v_tu_khoa || '%'
      or account.email ilike '%' || v_tu_khoa || '%'
      or account.co_so_ten ilike '%' || v_tu_khoa || '%'
    )
  order by account.priority nulls last, account.ho_ten, account.auth_user_id
  limit p_limit
  offset p_offset;
end;
$$;

revoke all on function public.fn_admin_danh_sach_tai_khoan(text, uuid, text, text, boolean, integer, integer)
  from public, anon, authenticated;
grant execute on function public.fn_admin_danh_sach_tai_khoan(text, uuid, text, text, boolean, integer, integer)
  to authenticated;
