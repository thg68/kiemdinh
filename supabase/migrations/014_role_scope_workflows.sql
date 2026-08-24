-- Sprint phan quyen: phan cong pham vi, chot tu danh gia, phe duyet bao cao.
-- Nguyen tac: UI chi goi RPC; quyen quyet dinh nam o CSDL/RLS.

create or replace function fn_phan_cong_tieu_chi_cho_nguoi_dung(
  p_nam_hoc_id uuid,
  p_nguoi_dung_id uuid,
  p_tieu_chi_ids uuid[],
  p_vai_tro_trong_tieu_chi text default 'phu_trach_nhap_lieu'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_tieu_chi_id uuid;
begin
  if v_co_so_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not fn_can_manage_assignment(v_co_so_id) then
    raise exception 'Chi Hieu truong hoac Chu tich hoi dong moi duoc phan cong tieu chi.';
  end if;

  if not exists (
    select 1 from nam_hoc
    where id = p_nam_hoc_id
      and co_so_id = v_co_so_id
  ) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  if not exists (
    select 1 from nguoi_dung
    where id = p_nguoi_dung_id
      and co_so_id = v_co_so_id
  ) then
    raise exception 'Nguoi dung khong thuoc don vi hien tai.';
  end if;

  delete from phan_cong_tieu_chi
  where co_so_id = v_co_so_id
    and nam_hoc_id = p_nam_hoc_id
    and nguoi_dung_id = p_nguoi_dung_id;

  foreach v_tieu_chi_id in array coalesce(p_tieu_chi_ids, array[]::uuid[]) loop
    insert into phan_cong_tieu_chi(
      co_so_id,
      nam_hoc_id,
      nguoi_dung_id,
      tieu_chi_id,
      vai_tro_trong_tieu_chi,
      vai_tro_phan_cong,
      created_by
    )
    values (
      v_co_so_id,
      p_nam_hoc_id,
      p_nguoi_dung_id,
      v_tieu_chi_id,
      p_vai_tro_trong_tieu_chi,
      p_vai_tro_trong_tieu_chi,
      fn_current_nguoi_dung_id()
    )
    on conflict (nam_hoc_id, nguoi_dung_id, tieu_chi_id)
    do update set
      vai_tro_trong_tieu_chi = excluded.vai_tro_trong_tieu_chi,
      vai_tro_phan_cong = excluded.vai_tro_phan_cong,
      updated_at = now();
  end loop;

  perform fn_log_audit(
    'ASSIGNMENT_UPDATED',
    'phan_cong_tieu_chi',
    p_nguoi_dung_id,
    null,
    jsonb_build_object(
      'nam_hoc_id', p_nam_hoc_id,
      'nguoi_dung_id', p_nguoi_dung_id,
      'tieu_chi_ids', p_tieu_chi_ids,
      'vai_tro_trong_tieu_chi', p_vai_tro_trong_tieu_chi
    )
  );
end;
$$;

create or replace function fn_cap_nhat_trang_thai_tu_danh_gia(
  p_nam_hoc_id uuid,
  p_cap_hoc cap_hoc,
  p_tieu_chi_id uuid,
  p_trang_thai trang_thai_tu_danh_gia
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_nguoi_dung_id uuid := fn_current_nguoi_dung_id();
begin
  if v_co_so_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if p_trang_thai = 'da_duyet'::trang_thai_tu_danh_gia then
    if not (
      fn_has_permission('assessment.approve', v_co_so_id)
      and (
        fn_has_role('PRINCIPAL', v_co_so_id)
        or fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id)
      )
    ) then
      raise exception 'Chi Hieu truong hoac Chu tich hoi dong moi duoc chot muc tu danh gia.';
    end if;
  elsif p_trang_thai in ('cho_duyet'::trang_thai_tu_danh_gia, 'dang_ra_soat'::trang_thai_tu_danh_gia, 'nhap'::trang_thai_tu_danh_gia) then
    if not fn_can_write_tu_danh_gia(v_co_so_id, p_nam_hoc_id, p_tieu_chi_id) then
      raise exception 'Ban chua co quyen cap nhat trang thai tieu chi nay.';
    end if;
  else
    raise exception 'Trang thai tu danh gia khong duoc cap nhat tu giao dien nay.';
  end if;

  update tu_danh_gia
  set trang_thai = p_trang_thai,
      nguoi_duyet = case when p_trang_thai = 'da_duyet'::trang_thai_tu_danh_gia then v_nguoi_dung_id else nguoi_duyet end,
      updated_at = now(),
      ngay_cap_nhat = now()
  where co_so_id = v_co_so_id
    and nam_hoc_id = p_nam_hoc_id
    and cap_hoc = p_cap_hoc
    and tieu_chi_id = p_tieu_chi_id;

  if not found then
    raise exception 'Chua co ban ghi tu danh gia de cap nhat trang thai.';
  end if;

  perform fn_log_audit(
    'ASSESSMENT_STATUS_UPDATED',
    'tu_danh_gia',
    p_tieu_chi_id,
    null,
    jsonb_build_object(
      'nam_hoc_id', p_nam_hoc_id,
      'cap_hoc', p_cap_hoc,
      'tieu_chi_id', p_tieu_chi_id,
      'trang_thai', p_trang_thai
    )
  );
end;
$$;

create or replace function fn_luu_trang_thai_bao_cao(
  p_nam_hoc_id uuid,
  p_loai_bao_cao loai_bao_cao,
  p_trang_thai text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_nguoi_dung_id uuid := fn_current_nguoi_dung_id();
  v_bao_cao_id uuid;
begin
  if v_co_so_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not exists (
    select 1 from nam_hoc
    where id = p_nam_hoc_id
      and co_so_id = v_co_so_id
  ) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  if p_trang_thai not in ('nhap', 'cho_duyet', 'da_phe_duyet', 'tra_lai') then
    raise exception 'Trang thai bao cao khong hop le.';
  end if;

  if p_trang_thai = 'da_phe_duyet' then
    if not (
      fn_has_permission('report.approve', v_co_so_id)
      and (
        fn_has_role('PRINCIPAL', v_co_so_id)
        or fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id)
      )
    ) then
      raise exception 'Chi Hieu truong hoac Chu tich hoi dong moi duoc phe duyet bao cao.';
    end if;
  elsif not fn_has_permission('report.export', v_co_so_id) then
    raise exception 'Ban chua co quyen bien tap hoac xuat bao cao.';
  end if;

  insert into bao_cao(
    co_so_id,
    nam_hoc_id,
    loai_bao_cao,
    version,
    trang_thai,
    nguoi_tao,
    nguoi_phe_duyet,
    ngay_phe_duyet
  )
  values (
    v_co_so_id,
    p_nam_hoc_id,
    p_loai_bao_cao,
    1,
    p_trang_thai,
    v_nguoi_dung_id,
    case when p_trang_thai = 'da_phe_duyet' then v_nguoi_dung_id else null end,
    case when p_trang_thai = 'da_phe_duyet' then now() else null end
  )
  on conflict (co_so_id, nam_hoc_id, loai_bao_cao, version)
  do update set
    trang_thai = excluded.trang_thai,
    nguoi_phe_duyet = excluded.nguoi_phe_duyet,
    ngay_phe_duyet = excluded.ngay_phe_duyet,
    updated_at = now()
  returning id into v_bao_cao_id;

  perform fn_log_audit(
    'REPORT_STATUS_UPDATED',
    'bao_cao',
    v_bao_cao_id,
    null,
    jsonb_build_object(
      'nam_hoc_id', p_nam_hoc_id,
      'loai_bao_cao', p_loai_bao_cao,
      'trang_thai', p_trang_thai
    )
  );

  return v_bao_cao_id;
end;
$$;

revoke all on function fn_phan_cong_tieu_chi_cho_nguoi_dung(uuid, uuid, uuid[], text) from public;
grant execute on function fn_phan_cong_tieu_chi_cho_nguoi_dung(uuid, uuid, uuid[], text) to authenticated;

revoke all on function fn_cap_nhat_trang_thai_tu_danh_gia(uuid, cap_hoc, uuid, trang_thai_tu_danh_gia) from public;
grant execute on function fn_cap_nhat_trang_thai_tu_danh_gia(uuid, cap_hoc, uuid, trang_thai_tu_danh_gia) to authenticated;

revoke all on function fn_luu_trang_thai_bao_cao(uuid, loai_bao_cao, text) from public;
grant execute on function fn_luu_trang_thai_bao_cao(uuid, loai_bao_cao, text) to authenticated;
