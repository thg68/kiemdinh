begin;

create or replace function public.fn_danh_sach_loi_moi_cua_co_so()
returns table (
  id uuid,
  email text,
  ho_ten text,
  ma_vai_tro text,
  ten_vai_tro text,
  trang_thai text,
  het_han_luc timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    lm.id,
    lm.email::text,
    lm.ho_ten::text,
    vt.ma::text,
    vt.ten::text,
    lm.trang_thai::text,
    lm.het_han_luc,
    lm.created_at
  from public.loi_moi_thanh_vien lm
  join public.vai_tro vt on vt.id = lm.vai_tro_id
  where lm.co_so_id = public.fn_current_co_so_id()
    and public.fn_can_manage_users(lm.co_so_id)
    and lm.trang_thai = 'cho_phan_hoi'
    and lm.het_han_luc > now()
  order by lm.created_at desc
$$;

create or replace function public.fn_huy_loi_moi_thanh_vien(p_loi_moi_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_loi_moi public.loi_moi_thanh_vien%rowtype;
begin
  if v_co_so_id is null or not public.fn_can_manage_users(v_co_so_id) then
    raise exception 'Bạn không có quyền hủy lời mời thành viên.';
  end if;

  select *
  into v_loi_moi
  from public.loi_moi_thanh_vien lm
  where lm.id = p_loi_moi_id
    and lm.co_so_id = v_co_so_id
  for update;

  if v_loi_moi.id is null then
    raise exception 'Không tìm thấy lời mời trong đơn vị hiện tại.';
  end if;

  if v_loi_moi.trang_thai <> 'cho_phan_hoi' then
    raise exception 'Chỉ có thể hủy lời mời đang chờ phản hồi.';
  end if;

  update public.loi_moi_thanh_vien
  set trang_thai = 'da_huy',
      phan_hoi_luc = now()
  where id = p_loi_moi_id;

  perform public.fn_log_audit(
    'MEMBER_INVITATION_CANCELLED',
    'loi_moi_thanh_vien',
    p_loi_moi_id,
    null,
    jsonb_build_object('email', v_loi_moi.email)
  );
end;
$$;

revoke all on function public.fn_danh_sach_loi_moi_cua_co_so() from public, anon;
revoke all on function public.fn_huy_loi_moi_thanh_vien(uuid) from public, anon;
grant execute on function public.fn_danh_sach_loi_moi_cua_co_so() to authenticated;
grant execute on function public.fn_huy_loi_moi_thanh_vien(uuid) to authenticated;

commit;
