-- Dam bao luong thiet lap don vi ban dau cung khoa dung phien ban bo tieu chuan.

create or replace function public.fn_khoi_tao_co_so_va_nam_hoc(
  p_ten_co_so text,
  p_ma_truong text,
  p_loai_hinh public.loai_hinh_co_so,
  p_cap_hoc public.cap_hoc[],
  p_nam_hoc_ten varchar,
  p_ngay_bat_dau date,
  p_ngay_ket_thuc date,
  p_ho_ten text
)
returns table (co_so_id uuid, nam_hoc_id uuid, nguoi_dung_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_principal_role_id uuid;
  v_bo_tieu_chuan_id uuid;
begin
  if v_auth_user_id is null then
    raise exception 'Ban can dang nhap truoc khi tao co so giao duc.';
  end if;

  if exists (
    select 1
    from public.nguoi_dung nd
    where nd.auth_user_id = v_auth_user_id
  ) then
    raise exception 'Tai khoan nay da thuoc mot co so giao duc.';
  end if;

  if p_ngay_ket_thuc <= p_ngay_bat_dau then
    raise exception 'Ngay ket thuc nam hoc phai sau ngay bat dau.';
  end if;

  select btc.id into v_bo_tieu_chuan_id
  from public.bo_tieu_chuan btc
  where btc.loai_hinh = p_loai_hinh
    and btc.trang_thai = 'dang_ap_dung'
    and (btc.ngay_hieu_luc is null or btc.ngay_hieu_luc <= p_ngay_ket_thuc)
  order by btc.ngay_hieu_luc desc nulls last, btc.version desc, btc.created_at desc
  limit 1;

  if v_bo_tieu_chuan_id is null then
    raise exception 'Khong tim thay bo tieu chuan phu hop cho nam hoc ban dau.';
  end if;

  insert into public.co_so_giao_duc(ten, ma_truong, loai_hinh, cap_hoc)
  values (
    trim(p_ten_co_so),
    nullif(trim(p_ma_truong), ''),
    p_loai_hinh,
    coalesce(p_cap_hoc, '{}'::public.cap_hoc[])
  )
  returning id into co_so_id;

  insert into public.nam_hoc(
    co_so_id,
    ten,
    ngay_bat_dau,
    ngay_ket_thuc,
    trang_thai,
    bo_tieu_chuan_id
  )
  values (
    co_so_id,
    p_nam_hoc_ten,
    p_ngay_bat_dau,
    p_ngay_ket_thuc,
    'dang_hoat_dong',
    v_bo_tieu_chuan_id
  )
  returning id into nam_hoc_id;

  insert into public.nguoi_dung(auth_user_id, co_so_id, ho_ten, email, trang_thai)
  values (
    v_auth_user_id,
    co_so_id,
    coalesce(nullif(trim(p_ho_ten), ''), (select au.email from auth.users au where au.id = v_auth_user_id)),
    (select au.email from auth.users au where au.id = v_auth_user_id),
    'active'
  )
  returning id into nguoi_dung_id;

  select vt.id into v_principal_role_id
  from public.vai_tro vt
  where vt.ma = 'PRINCIPAL';

  if v_principal_role_id is null then
    raise exception 'Khong tim thay vai tro Hieu truong.';
  end if;

  insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
  values (nguoi_dung_id, v_principal_role_id, co_so_id);

  return next;
end;
$$;

revoke all on function public.fn_khoi_tao_co_so_va_nam_hoc(
  text, text, public.loai_hinh_co_so, public.cap_hoc[], varchar, date, date, text
) from public, anon;
grant execute on function public.fn_khoi_tao_co_so_va_nam_hoc(
  text, text, public.loai_hinh_co_so, public.cap_hoc[], varchar, date, date, text
) to authenticated;
