-- Sprint 4 demo fix: khong phu thuoc ham digest() cua pgcrypto trong search_path.

create or replace function fn_tao_du_lieu_demo_sprint4()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_nguoi_dung_id uuid := fn_current_nguoi_dung_id();
  v_nam_hoc_id uuid;
  v_cap_hoc cap_hoc;
  v_tieu_chi record;
  v_tieu_chuan record;
  v_ma varchar;
  v_minh_chung_id uuid;
  v_so_minh_chung integer := 0;
  v_so_tu_danh_gia integer := 0;
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not (
    fn_has_role('PRINCIPAL', v_co_so_id)
    or fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id)
    or fn_has_role('SECRETARY', v_co_so_id)
  ) then
    raise exception 'Chi hieu truong, chu tich hoi dong hoac thu ky moi duoc tao du lieu demo.';
  end if;

  select id into v_nam_hoc_id
  from nam_hoc
  where co_so_id = v_co_so_id
  order by (trang_thai = 'dang_hoat_dong') desc, ngay_bat_dau desc
  limit 1;

  if v_nam_hoc_id is null then
    raise exception 'Co so giao duc chua co nam hoc.';
  end if;

  select coalesce(cap_hoc[1], 'mam_non'::cap_hoc) into v_cap_hoc
  from co_so_giao_duc
  where id = v_co_so_id;

  for v_tieu_chi in
    select id, ma, ten, la_bat_buoc
    from tieu_chi
    order by ma
  loop
    select mc.id into v_minh_chung_id
    from minh_chung mc
    join minh_chung_tieu_chi mctc on mctc.minh_chung_id = mc.id
    where mc.co_so_id = v_co_so_id
      and mc.nam_hoc_id = v_nam_hoc_id
      and mctc.tieu_chi_id = v_tieu_chi.id
      and mc.ten like '[DEMO]%'
      and mc.deleted_at is null
    limit 1;

    if v_minh_chung_id is null then
      v_ma := fn_sinh_ma_minh_chung(v_tieu_chi.id, v_co_so_id);

      insert into minh_chung(
        co_so_id,
        nam_hoc_id,
        ma,
        ten,
        loai_tep,
        duong_dan,
        hash_tep,
        ngay_ban_hanh,
        nguoi_tai_len,
        trang_thai_xac_minh,
        ghi_chu
      )
      values (
        v_co_so_id,
        v_nam_hoc_id,
        v_ma,
        '[DEMO] Minh chung cho tieu chi ' || v_tieu_chi.ma,
        'text/uri-list',
        'https://demo.local/minh-chung/' || v_ma,
        lpad(md5(v_co_so_id::text || v_nam_hoc_id::text || v_tieu_chi.id::text), 64, '0'),
        current_date,
        v_nguoi_dung_id,
        'da_xac_minh',
        '[DEMO] Du lieu mau de thu xuat bao cao, khong phai minh chung that.'
      )
      returning id into v_minh_chung_id;

      insert into minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, muc, la_tieu_chi_goc, created_by)
      values (v_minh_chung_id, v_tieu_chi.id, 2, true, v_nguoi_dung_id)
      on conflict (minh_chung_id, tieu_chi_id) do nothing;

      v_so_minh_chung := v_so_minh_chung + 1;
    end if;

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
      trang_thai
    )
    values (
      v_co_so_id,
      v_nam_hoc_id,
      v_tieu_chi.id,
      v_cap_hoc,
      '[DEMO] Nha truong co thong tin van hanh va minh chung mau cho tieu chi ' || v_tieu_chi.ma || '. Noi dung nay chi phuc vu trinh dien luong xuat bao cao.',
      true,
      '[DEMO] Nha truong co ket qua cai tien mau cho tieu chi ' || v_tieu_chi.ma || '. Noi dung nay khong thay the du lieu that cua nha truong.',
      true,
      2,
      v_nguoi_dung_id,
      'dang_ra_soat'
    )
    on conflict (co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc)
    do update set
      mo_ta_muc_1 = excluded.mo_ta_muc_1,
      dat_muc_1 = excluded.dat_muc_1,
      mo_ta_muc_2 = excluded.mo_ta_muc_2,
      dat_muc_2 = excluded.dat_muc_2,
      muc_dat = excluded.muc_dat,
      nguoi_nhap = excluded.nguoi_nhap,
      trang_thai = excluded.trang_thai;

    v_so_tu_danh_gia := v_so_tu_danh_gia + 1;
  end loop;

  for v_tieu_chuan in
    select id, so_thu_tu, ten
    from tieu_chuan
    order by so_thu_tu
  loop
    insert into nhan_xet_tieu_chuan(
      co_so_id,
      nam_hoc_id,
      tieu_chuan_id,
      cap_hoc,
      diem_manh_noi_bat,
      han_che_trong_tam,
      dinh_huong_cai_tien,
      nguoi_cap_nhat
    )
    values (
      v_co_so_id,
      v_nam_hoc_id,
      v_tieu_chuan.id,
      v_cap_hoc,
      '[DEMO] Diem manh mau cua Tieu chuan ' || v_tieu_chuan.so_thu_tu || ', dung de kiem tra dinh dang bao cao.',
      '[DEMO] Han che mau cua Tieu chuan ' || v_tieu_chuan.so_thu_tu || ', can thay bang phan tich that truoc khi xuat ban.',
      '[DEMO] Dinh huong cai tien mau cua Tieu chuan ' || v_tieu_chuan.so_thu_tu || ', khong phai ke hoach that.',
      v_nguoi_dung_id
    )
    on conflict (co_so_id, nam_hoc_id, tieu_chuan_id, cap_hoc)
    do update set
      diem_manh_noi_bat = excluded.diem_manh_noi_bat,
      han_che_trong_tam = excluded.han_che_trong_tam,
      dinh_huong_cai_tien = excluded.dinh_huong_cai_tien,
      nguoi_cap_nhat = excluded.nguoi_cap_nhat;
  end loop;

  insert into ke_hoach_cai_tien(
    co_so_id,
    nam_hoc_id,
    tieu_chuan_id,
    tieu_chi_id,
    noi_dung,
    muc_tieu,
    hoat_dong,
    chi_so_ket_qua,
    thoi_gian_bat_dau,
    thoi_gian_ket_thuc,
    phu_trach_id,
    nguon_luc,
    minh_chung_du_kien,
    muc_do_thuc_hien,
    ghi_chu
  )
  select
    v_co_so_id,
    v_nam_hoc_id,
    tc.tieu_chuan_id,
    tc.id,
    '[DEMO] Noi dung cai tien cho tieu chi ' || tc.ma,
    '[DEMO] Muc tieu cai tien co the do luong duoc cho tieu chi ' || tc.ma,
    '[DEMO] Ra soat minh chung, phan cong nguoi phu trach va cap nhat tien do hang thang.',
    '[DEMO] Hoan thanh minh chung va bien ban ra soat dung han.',
    current_date,
    current_date + interval '90 days',
    v_nguoi_dung_id,
    '[DEMO] Thoi gian cua hoi dong tu danh gia va to chuyen mon.',
    '[DEMO] Bien ban ra soat, danh muc minh chung cap nhat.',
    'dang_thuc_hien',
    '[DEMO] Ban ghi mau de thu Mau 2.'
  from tieu_chi tc
  where tc.ma in ('1.3', '2.1', '3.1', '4.1')
  on conflict do nothing;

  perform fn_log_audit(
    'DEMO_SPRINT4_CREATED',
    'nam_hoc',
    v_nam_hoc_id,
    null,
    jsonb_build_object('cap_hoc', v_cap_hoc, 'so_minh_chung_moi', v_so_minh_chung, 'so_tu_danh_gia', v_so_tu_danh_gia)
  );

  return jsonb_build_object(
    'nam_hoc_id', v_nam_hoc_id,
    'cap_hoc', v_cap_hoc,
    'so_minh_chung_moi', v_so_minh_chung,
    'so_tu_danh_gia', v_so_tu_danh_gia
  );
end;
$$;

grant execute on function fn_tao_du_lieu_demo_sprint4() to authenticated;
