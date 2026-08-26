-- Sua loi bien output nam_hoc_id trung ten cot khi PostgreSQL bien dich ham ke thua.

create or replace function fn_tao_nam_hoc_ke_thua(
  p_ten varchar,
  p_ngay_bat_dau date,
  p_ngay_ket_thuc date,
  p_ke_thua_tu_nam_hoc_id uuid default null,
  p_dat_lam_dang_hoat_dong boolean default true
)
returns table (nam_hoc_id uuid, so_tu_danh_gia_ke_thua integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_nguoi_dung_id uuid := fn_current_nguoi_dung_id();
  v_nam_hoc_nguon_id uuid;
  v_nam_hoc_moi_id uuid;
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not (
    fn_has_role('PRINCIPAL', v_co_so_id)
    or fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id)
    or fn_has_role('SECRETARY', v_co_so_id)
  ) then
    raise exception 'Chi hieu truong, chu tich hoi dong hoac thu ky moi duoc tao nam hoc moi.';
  end if;

  if p_ngay_ket_thuc <= p_ngay_bat_dau then
    raise exception 'Ngay ket thuc nam hoc phai sau ngay bat dau.';
  end if;

  if p_ke_thua_tu_nam_hoc_id is not null then
    select nh.id into v_nam_hoc_nguon_id
    from nam_hoc nh
    where nh.id = p_ke_thua_tu_nam_hoc_id
      and nh.co_so_id = v_co_so_id;
  else
    select nh.id into v_nam_hoc_nguon_id
    from nam_hoc nh
    where nh.co_so_id = v_co_so_id
    order by (nh.trang_thai = 'dang_hoat_dong') desc, nh.ngay_bat_dau desc
    limit 1;
  end if;

  if p_ke_thua_tu_nam_hoc_id is not null and v_nam_hoc_nguon_id is null then
    raise exception 'Nam hoc nguon khong thuoc co so giao duc hien tai.';
  end if;

  if p_dat_lam_dang_hoat_dong then
    update nam_hoc nh
    set trang_thai = 'chuan_bi'
    where nh.co_so_id = v_co_so_id
      and nh.trang_thai = 'dang_hoat_dong';
  end if;

  insert into nam_hoc(
    co_so_id,
    ten,
    ngay_bat_dau,
    ngay_ket_thuc,
    trang_thai,
    ke_thua_tu_nam_hoc_id
  )
  values (
    v_co_so_id,
    p_ten,
    p_ngay_bat_dau,
    p_ngay_ket_thuc,
    case
      when p_dat_lam_dang_hoat_dong then 'dang_hoat_dong'::trang_thai_nam_hoc
      else 'chuan_bi'::trang_thai_nam_hoc
    end,
    v_nam_hoc_nguon_id
  )
  returning id into v_nam_hoc_moi_id;

  nam_hoc_id := v_nam_hoc_moi_id;

  if v_nam_hoc_nguon_id is not null then
    insert into tu_danh_gia(
      co_so_id,
      nam_hoc_id,
      tieu_chi_id,
      cap_hoc,
      mo_ta_muc_1,
      dat_muc_1,
      mo_ta_muc_2,
      dat_muc_2,
      muc_dat,
      nguoi_nhap,
      trang_thai,
      ke_thua_tu_id
    )
    select
      tdg.co_so_id,
      v_nam_hoc_moi_id,
      tdg.tieu_chi_id,
      tdg.cap_hoc,
      tdg.mo_ta_muc_1,
      false,
      tdg.mo_ta_muc_2,
      false,
      0,
      v_nguoi_dung_id,
      'ke_thua_cho_cap_nhat',
      tdg.id
    from tu_danh_gia tdg
    where tdg.co_so_id = v_co_so_id
      and tdg.nam_hoc_id = v_nam_hoc_nguon_id
    on conflict (co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc) do nothing;

    get diagnostics so_tu_danh_gia_ke_thua = row_count;
  else
    so_tu_danh_gia_ke_thua := 0;
  end if;

  perform fn_log_audit(
    'SCHOOL_YEAR_CREATED_WITH_INHERITANCE',
    'nam_hoc',
    v_nam_hoc_moi_id,
    null,
    jsonb_build_object(
      'ten', p_ten,
      'ke_thua_tu_nam_hoc_id', v_nam_hoc_nguon_id,
      'so_tu_danh_gia_ke_thua', so_tu_danh_gia_ke_thua
    )
  );

  return next;
end;
$$;

revoke all on function fn_tao_nam_hoc_ke_thua(varchar, date, date, uuid, boolean) from public;
grant execute on function fn_tao_nam_hoc_ke_thua(varchar, date, date, uuid, boolean) to authenticated;
