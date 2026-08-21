-- Sprint 6 hardening: hoan thien khung M1 cho 3 loai hinh va tao nam hoc ke thua.
-- Luu y: migration nay chi tao khung du lieu versioned, khong tu bien soan noi dung phap ly TT57.

do $$
declare
  v_loai_hinh loai_hinh_co_so;
  v_bo_id uuid;
  v_tieu_chuan_id uuid;
  v_standard record;
  v_criterion record;
begin
  foreach v_loai_hinh in array array['mam_non'::loai_hinh_co_so, 'pho_thong'::loai_hinh_co_so, 'gdtx'::loai_hinh_co_so]
  loop
    insert into bo_tieu_chuan(ma_van_ban, ten, ngay_hieu_luc, loai_hinh, version, trang_thai)
    values (
      '57/2026/TT-BGDDT',
      'Bo tieu chuan bao dam chat luong giao duc - cho nhap noi dung phu luc chinh thuc',
      '2026-07-07',
      v_loai_hinh,
      1,
      'cho_nhap_noi_dung'
    )
    on conflict (ma_van_ban, loai_hinh, version) do nothing;

    select id into v_bo_id
    from bo_tieu_chuan
    where ma_van_ban = '57/2026/TT-BGDDT'
      and loai_hinh = v_loai_hinh
      and version = 1;

    for v_standard in
      select * from (values
        (1, 'Tieu chuan 1'),
        (2, 'Tieu chuan 2'),
        (3, 'Tieu chuan 3'),
        (4, 'Tieu chuan 4')
      ) as s(so_thu_tu, ten)
    loop
      insert into tieu_chuan(bo_id, so_thu_tu, ten)
      values (v_bo_id, v_standard.so_thu_tu, v_standard.ten)
      on conflict (bo_id, so_thu_tu) do nothing;
    end loop;

    for v_criterion in
      select * from (values
        ('1.1', 1, 'Tieu chi 1.1'),
        ('1.2', 2, 'Tieu chi 1.2'),
        ('1.3', 3, 'Tieu chi 1.3'),
        ('1.4', 4, 'Tieu chi 1.4'),
        ('2.1', 1, 'Tieu chi 2.1'),
        ('2.2', 2, 'Tieu chi 2.2'),
        ('2.3', 3, 'Tieu chi 2.3'),
        ('3.1', 1, 'Tieu chi 3.1'),
        ('3.2', 2, 'Tieu chi 3.2'),
        ('3.3', 3, 'Tieu chi 3.3'),
        ('3.4', 4, 'Tieu chi 3.4'),
        ('3.5', 5, 'Tieu chi 3.5'),
        ('4.1', 1, 'Tieu chi 4.1'),
        ('4.2', 2, 'Tieu chi 4.2'),
        ('4.3', 3, 'Tieu chi 4.3')
      ) as c(ma, thu_tu, ten)
    loop
      select id into v_tieu_chuan_id
      from tieu_chuan
      where bo_id = v_bo_id
        and so_thu_tu = split_part(v_criterion.ma, '.', 1)::smallint;

      insert into tieu_chi(tieu_chuan_id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, thu_tu)
      values (
        v_tieu_chuan_id,
        v_criterion.ma,
        v_criterion.ten,
        v_criterion.ma in ('1.3', '1.4', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'),
        v_loai_hinh,
        v_criterion.thu_tu
      )
      on conflict (tieu_chuan_id, ma) do update
        set la_bat_buoc = excluded.la_bat_buoc,
            loai_hinh_ap_dung = excluded.loai_hinh_ap_dung,
            thu_tu = excluded.thu_tu;
    end loop;

    insert into muc_tieu_chi(tieu_chi_id, muc, noi_dung_yeu_cau)
    select tc.id, muc.muc, ''
    from tieu_chi tc
    join tieu_chuan tcu on tcu.id = tc.tieu_chuan_id
    cross join (values (1), (2)) as muc(muc)
    where tcu.bo_id = v_bo_id
    on conflict (tieu_chi_id, muc) do nothing;
  end loop;
end;
$$;

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
    select id into v_nam_hoc_nguon_id
    from nam_hoc
    where id = p_ke_thua_tu_nam_hoc_id
      and co_so_id = v_co_so_id;
  else
    select id into v_nam_hoc_nguon_id
    from nam_hoc
    where co_so_id = v_co_so_id
    order by (trang_thai = 'dang_hoat_dong') desc, ngay_bat_dau desc
    limit 1;
  end if;

  if p_ke_thua_tu_nam_hoc_id is not null and v_nam_hoc_nguon_id is null then
    raise exception 'Nam hoc nguon khong thuoc co so giao duc hien tai.';
  end if;

  if p_dat_lam_dang_hoat_dong then
    update nam_hoc
    set trang_thai = 'chuan_bi'
    where co_so_id = v_co_so_id
      and trang_thai = 'dang_hoat_dong';
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
    case when p_dat_lam_dang_hoat_dong then 'dang_hoat_dong'::trang_thai_nam_hoc else 'chuan_bi'::trang_thai_nam_hoc end,
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
