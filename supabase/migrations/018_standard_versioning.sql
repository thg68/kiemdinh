-- Sprint 8: rang buoc nam hoc voi phien ban bo tieu chuan va minh chung hop le.

-- 1. Them cot nullable de migration khong lam hong du lieu dang co.
alter table public.nam_hoc
  add column if not exists bo_tieu_chuan_id uuid;

-- 2. Backfill bo moi nhat dung loai hinh, co hieu luc tai nam hoc.
update public.nam_hoc nh
set bo_tieu_chuan_id = (
  select btc.id
  from public.bo_tieu_chuan btc
  join public.co_so_giao_duc cs on cs.id = nh.co_so_id
  where btc.loai_hinh = cs.loai_hinh
    and (btc.ngay_hieu_luc is null or btc.ngay_hieu_luc <= nh.ngay_ket_thuc)
  order by
    (btc.trang_thai = 'dang_ap_dung') desc,
    btc.ngay_hieu_luc desc nulls last,
    btc.version desc,
    btc.created_at desc
  limit 1
)
where nh.bo_tieu_chuan_id is null;

-- 3. Dung migration neu con nam hoc khong the gan phien ban an toan.
do $$
begin
  if exists (select 1 from public.nam_hoc where bo_tieu_chuan_id is null) then
    raise exception 'Khong the backfill bo_tieu_chuan_id cho tat ca nam hoc.';
  end if;
end;
$$;

-- 4. Them FK sau khi backfill da thanh cong.
alter table public.nam_hoc
  drop constraint if exists fk_nam_hoc_bo_tieu_chuan;

alter table public.nam_hoc
  add constraint fk_nam_hoc_bo_tieu_chuan
  foreign key (bo_tieu_chuan_id)
  references public.bo_tieu_chuan(id)
  on delete restrict;

-- 5. Chi dat NOT NULL sau khi da validate va co FK.
alter table public.nam_hoc
  alter column bo_tieu_chuan_id set not null;

create index if not exists idx_nam_hoc_bo_tieu_chuan
  on public.nam_hoc(bo_tieu_chuan_id);

create or replace function public.fn_guard_nam_hoc_standard_version()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_loai_hinh_co_so public.loai_hinh_co_so;
  v_loai_hinh_bo public.loai_hinh_co_so;
begin
  if new.bo_tieu_chuan_id is null then
    select btc.id
    into new.bo_tieu_chuan_id
    from public.bo_tieu_chuan btc
    join public.co_so_giao_duc cs on cs.id = new.co_so_id
    where btc.loai_hinh = cs.loai_hinh
      and btc.trang_thai = 'dang_ap_dung'
      and (btc.ngay_hieu_luc is null or btc.ngay_hieu_luc <= new.ngay_ket_thuc)
    order by btc.ngay_hieu_luc desc nulls last, btc.version desc, btc.created_at desc
    limit 1;
  end if;

  select cs.loai_hinh, btc.loai_hinh
  into v_loai_hinh_co_so, v_loai_hinh_bo
  from public.co_so_giao_duc cs
  join public.bo_tieu_chuan btc on btc.id = new.bo_tieu_chuan_id
  where cs.id = new.co_so_id;

  if v_loai_hinh_co_so is null or v_loai_hinh_bo is null then
    raise exception 'Khong tim thay co so giao duc hoac bo tieu chuan.';
  end if;

  if v_loai_hinh_co_so <> v_loai_hinh_bo then
    raise exception 'Bo tieu chuan khong dung loai hinh cua co so giao duc.';
  end if;

  if tg_op = 'UPDATE'
    and new.bo_tieu_chuan_id is distinct from old.bo_tieu_chuan_id
    and (
      exists (select 1 from public.tu_danh_gia where nam_hoc_id = old.id)
      or exists (select 1 from public.minh_chung where nam_hoc_id = old.id)
      or exists (select 1 from public.ke_hoach_cai_tien where nam_hoc_id = old.id)
      or exists (select 1 from public.phan_cong_tieu_chi where nam_hoc_id = old.id)
      or exists (select 1 from public.bao_cao where nam_hoc_id = old.id)
    )
  then
    raise exception 'Khong duoc doi phien ban bo tieu chuan sau khi nam hoc da co du lieu nghiep vu.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_nam_hoc_standard_version on public.nam_hoc;
create trigger trg_guard_nam_hoc_standard_version
before insert or update of bo_tieu_chuan_id, co_so_id, ngay_ket_thuc
on public.nam_hoc
for each row execute function public.fn_guard_nam_hoc_standard_version();

-- View canonical: moi truy van nghiep vu di tu nam hoc den dung phien ban.
create or replace view public.v_tieu_chi_nam_hoc
with (security_invoker = true)
as
select
  nh.id as nam_hoc_id,
  nh.co_so_id,
  nh.bo_tieu_chuan_id,
  btc.ma_van_ban,
  btc.version as bo_version,
  btc.loai_hinh,
  tcu.id as tieu_chuan_id,
  tcu.so_thu_tu as tieu_chuan_so_thu_tu,
  tcu.ten as tieu_chuan_ten,
  tc.id,
  tc.ma,
  tc.ten,
  tc.la_bat_buoc,
  tc.loai_hinh_ap_dung,
  tc.thu_tu,
  levels.muc_1,
  levels.muc_2,
  evidence_hint.minh_chung_goi_y
from public.nam_hoc nh
join public.bo_tieu_chuan btc on btc.id = nh.bo_tieu_chuan_id
join public.tieu_chuan tcu on tcu.bo_id = btc.id
join public.tieu_chi tc on tc.tieu_chuan_id = tcu.id
left join lateral (
  select
    max(mtc.noi_dung_yeu_cau) filter (where mtc.muc = 1) as muc_1,
    max(mtc.noi_dung_yeu_cau) filter (where mtc.muc = 2) as muc_2
  from public.muc_tieu_chi mtc
  where mtc.tieu_chi_id = tc.id
) levels on true
left join lateral (
  select string_agg(mcgy.mo_ta, E'\n' order by mcgy.thu_tu, mcgy.id) as minh_chung_goi_y
  from public.minh_chung_goi_y mcgy
  where mcgy.tieu_chi_id = tc.id
) evidence_hint on true;

grant select on public.v_tieu_chi_nam_hoc to authenticated;

create or replace function public.fn_tieu_chi_thuoc_nam_hoc(
  p_nam_hoc_id uuid,
  p_tieu_chi_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.nam_hoc nh
    join public.tieu_chuan tcu on tcu.bo_id = nh.bo_tieu_chuan_id
    join public.tieu_chi tc on tc.tieu_chuan_id = tcu.id
    where nh.id = p_nam_hoc_id
      and tc.id = p_tieu_chi_id
  )
$$;

create or replace function public.fn_tieu_chuan_thuoc_nam_hoc(
  p_nam_hoc_id uuid,
  p_tieu_chuan_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.nam_hoc nh
    join public.tieu_chuan tcu on tcu.bo_id = nh.bo_tieu_chuan_id
    where nh.id = p_nam_hoc_id
      and tcu.id = p_tieu_chuan_id
  )
$$;

create or replace function public.fn_guard_year_criterion_version()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tieu_chuan_id uuid := nullif(to_jsonb(new)->>'tieu_chuan_id', '')::uuid;
begin
  if new.tieu_chi_id is not null
    and not public.fn_tieu_chi_thuoc_nam_hoc(new.nam_hoc_id, new.tieu_chi_id)
  then
    raise exception 'Tieu chi khong thuoc phien ban bo tieu chuan cua nam hoc.';
  end if;

  if tg_table_name = 'ke_hoach_cai_tien'
    and v_tieu_chuan_id is not null
    and not public.fn_tieu_chuan_thuoc_nam_hoc(new.nam_hoc_id, v_tieu_chuan_id)
  then
    raise exception 'Tieu chuan khong thuoc phien ban bo tieu chuan cua nam hoc.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_tu_danh_gia_standard_version on public.tu_danh_gia;
create trigger trg_tu_danh_gia_standard_version
before insert or update of nam_hoc_id, tieu_chi_id on public.tu_danh_gia
for each row execute function public.fn_guard_year_criterion_version();

drop trigger if exists trg_phan_cong_standard_version on public.phan_cong_tieu_chi;
create trigger trg_phan_cong_standard_version
before insert or update of nam_hoc_id, tieu_chi_id on public.phan_cong_tieu_chi
for each row execute function public.fn_guard_year_criterion_version();

drop trigger if exists trg_ke_hoach_standard_version on public.ke_hoach_cai_tien;
create trigger trg_ke_hoach_standard_version
before insert or update of nam_hoc_id, tieu_chuan_id, tieu_chi_id on public.ke_hoach_cai_tien
for each row execute function public.fn_guard_year_criterion_version();

create or replace function public.fn_guard_evidence_criterion_version()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_nam_hoc_id uuid;
begin
  select mc.nam_hoc_id into v_nam_hoc_id
  from public.minh_chung mc
  where mc.id = new.minh_chung_id;

  if v_nam_hoc_id is null
    or not public.fn_tieu_chi_thuoc_nam_hoc(v_nam_hoc_id, new.tieu_chi_id)
  then
    raise exception 'Khong duoc gan minh chung vao tieu chi khac phien ban nam hoc.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_minh_chung_tieu_chi_standard_version on public.minh_chung_tieu_chi;
create trigger trg_minh_chung_tieu_chi_standard_version
before insert or update of minh_chung_id, tieu_chi_id on public.minh_chung_tieu_chi
for each row execute function public.fn_guard_evidence_criterion_version();

-- Chinh sach minh chung dung cho tinh muc:
-- * chi da_xac_minh;
-- * tu_choi, cho_xac_minh, het_hieu_luc khong duoc tinh;
-- * het han theo moc min(hom nay, ngay ket thuc nam hoc) khong duoc tinh;
-- * minh chung soft-delete/thay the khong duoc tinh;
-- * minh chung nam cu khong tu dong duoc tinh cho nam moi.
create or replace view public.v_minh_chung_hop_le_danh_gia
with (security_invoker = true)
as
select mc.*
from public.minh_chung mc
join public.nam_hoc nh on nh.id = mc.nam_hoc_id and nh.co_so_id = mc.co_so_id
where mc.deleted_at is null
  and mc.trang_thai_xac_minh = 'da_xac_minh'
  and (
    mc.ngay_het_gia_tri is null
    or mc.ngay_het_gia_tri >= least(current_date, nh.ngay_ket_thuc)
  );

grant select on public.v_minh_chung_hop_le_danh_gia to authenticated;

create or replace function public.fn_minh_chung_hop_le_cho_tieu_chi(
  p_co_so_id uuid,
  p_nam_hoc_id uuid,
  p_tieu_chi_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.minh_chung mc
    join public.nam_hoc nh on nh.id = mc.nam_hoc_id and nh.co_so_id = mc.co_so_id
    join public.minh_chung_tieu_chi mctc on mctc.minh_chung_id = mc.id
    where mc.co_so_id = p_co_so_id
      and mc.nam_hoc_id = p_nam_hoc_id
      and mctc.tieu_chi_id = p_tieu_chi_id
      and public.fn_tieu_chi_thuoc_nam_hoc(p_nam_hoc_id, p_tieu_chi_id)
      and mc.deleted_at is null
      and mc.trang_thai_xac_minh = 'da_xac_minh'
      and (
        mc.ngay_het_gia_tri is null
        or mc.ngay_het_gia_tri >= least(current_date, nh.ngay_ket_thuc)
      )
  )
$$;

create or replace function public.fn_check_tu_danh_gia_has_evidence()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.fn_tieu_chi_thuoc_nam_hoc(new.nam_hoc_id, new.tieu_chi_id) then
    raise exception 'Tieu chi khong thuoc phien ban bo tieu chuan cua nam hoc.';
  end if;

  if new.dat_muc_2 and not new.dat_muc_1 then
    raise exception 'Khong duoc danh dau dat Muc 2 khi Muc 1 cua cung tieu chi chua dat.';
  end if;

  if new.dat_muc_1 and nullif(trim(coalesce(new.mo_ta_muc_1, '')), '') is null then
    raise exception 'Khong duoc danh dau dat Muc 1 khi mo ta hien trang Muc 1 dang trong.';
  end if;

  if new.dat_muc_2 and nullif(trim(coalesce(new.mo_ta_muc_2, '')), '') is null then
    raise exception 'Khong duoc danh dau dat Muc 2 khi mo ta hien trang Muc 2 dang trong.';
  end if;

  if (new.dat_muc_1 or new.dat_muc_2)
    and not public.fn_minh_chung_hop_le_cho_tieu_chi(
      new.co_so_id,
      new.nam_hoc_id,
      new.tieu_chi_id
    )
  then
    raise exception 'Chi minh chung da xac minh, con hieu luc va dung phien ban moi duoc dung de danh dau dat.';
  end if;

  new.muc_dat := case
    when new.dat_muc_2 then 2
    when new.dat_muc_1 then 1
    else 0
  end;
  new.ngay_cap_nhat := now();
  new.nguoi_nhap := coalesce(new.nguoi_nhap, public.fn_current_nguoi_dung_id());

  return new;
end;
$$;

-- Tao nam hoc moi voi bo moi nhat; du lieu ke thua duoc map theo ma tieu chi.
drop function if exists public.fn_tao_nam_hoc_ke_thua(varchar, date, date, uuid, boolean);

create function public.fn_tao_nam_hoc_ke_thua(
  p_ten varchar,
  p_ngay_bat_dau date,
  p_ngay_ket_thuc date,
  p_ke_thua_tu_nam_hoc_id uuid default null,
  p_dat_lam_dang_hoat_dong boolean default true,
  p_bo_tieu_chuan_id uuid default null
)
returns table (nam_hoc_id uuid, so_tu_danh_gia_ke_thua integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
#variable_conflict use_column
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_nam_hoc_nguon_id uuid;
  v_nam_hoc_moi_id uuid;
  v_bo_tieu_chuan_id uuid;
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not (
    public.fn_has_role('PRINCIPAL', v_co_so_id)
    or public.fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id)
    or public.fn_has_role('SECRETARY', v_co_so_id)
  ) then
    raise exception 'Chi hieu truong, chu tich hoi dong hoac thu ky moi duoc tao nam hoc moi.';
  end if;

  if p_ngay_ket_thuc <= p_ngay_bat_dau then
    raise exception 'Ngay ket thuc nam hoc phai sau ngay bat dau.';
  end if;

  if p_ke_thua_tu_nam_hoc_id is not null then
    select nh.id into v_nam_hoc_nguon_id
    from public.nam_hoc nh
    where nh.id = p_ke_thua_tu_nam_hoc_id
      and nh.co_so_id = v_co_so_id;
  else
    select nh.id into v_nam_hoc_nguon_id
    from public.nam_hoc nh
    where nh.co_so_id = v_co_so_id
    order by (nh.trang_thai = 'dang_hoat_dong') desc, nh.ngay_bat_dau desc
    limit 1;
  end if;

  if p_ke_thua_tu_nam_hoc_id is not null and v_nam_hoc_nguon_id is null then
    raise exception 'Nam hoc nguon khong thuoc co so giao duc hien tai.';
  end if;

  if p_bo_tieu_chuan_id is not null then
    select btc.id into v_bo_tieu_chuan_id
    from public.bo_tieu_chuan btc
    join public.co_so_giao_duc cs on cs.id = v_co_so_id and cs.loai_hinh = btc.loai_hinh
    where btc.id = p_bo_tieu_chuan_id;
  else
    select btc.id into v_bo_tieu_chuan_id
    from public.bo_tieu_chuan btc
    join public.co_so_giao_duc cs on cs.id = v_co_so_id and cs.loai_hinh = btc.loai_hinh
    where btc.trang_thai = 'dang_ap_dung'
      and (btc.ngay_hieu_luc is null or btc.ngay_hieu_luc <= p_ngay_ket_thuc)
    order by btc.ngay_hieu_luc desc nulls last, btc.version desc, btc.created_at desc
    limit 1;
  end if;

  if v_bo_tieu_chuan_id is null then
    raise exception 'Khong tim thay bo tieu chuan phu hop cho nam hoc moi.';
  end if;

  if p_dat_lam_dang_hoat_dong then
    update public.nam_hoc nh
    set trang_thai = 'chuan_bi'
    where nh.co_so_id = v_co_so_id
      and nh.trang_thai = 'dang_hoat_dong';
  end if;

  insert into public.nam_hoc(
    co_so_id,
    ten,
    ngay_bat_dau,
    ngay_ket_thuc,
    trang_thai,
    ke_thua_tu_nam_hoc_id,
    bo_tieu_chuan_id
  )
  values (
    v_co_so_id,
    p_ten,
    p_ngay_bat_dau,
    p_ngay_ket_thuc,
    case
      when p_dat_lam_dang_hoat_dong then 'dang_hoat_dong'::public.trang_thai_nam_hoc
      else 'chuan_bi'::public.trang_thai_nam_hoc
    end,
    v_nam_hoc_nguon_id,
    v_bo_tieu_chuan_id
  )
  returning id into v_nam_hoc_moi_id;

  nam_hoc_id := v_nam_hoc_moi_id;

  if v_nam_hoc_nguon_id is not null then
    insert into public.tu_danh_gia(
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
      tc_moi.id,
      tdg.cap_hoc,
      tdg.mo_ta_muc_1,
      false,
      tdg.mo_ta_muc_2,
      false,
      0,
      v_nguoi_dung_id,
      'ke_thua_cho_cap_nhat',
      tdg.id
    from public.tu_danh_gia tdg
    join public.tieu_chi tc_cu on tc_cu.id = tdg.tieu_chi_id
    join public.tieu_chuan tcu_moi on tcu_moi.bo_id = v_bo_tieu_chuan_id
    join public.tieu_chi tc_moi
      on tc_moi.tieu_chuan_id = tcu_moi.id
      and tc_moi.ma = tc_cu.ma
    where tdg.co_so_id = v_co_so_id
      and tdg.nam_hoc_id = v_nam_hoc_nguon_id
    on conflict (co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc) do nothing;

    get diagnostics so_tu_danh_gia_ke_thua = row_count;
  else
    so_tu_danh_gia_ke_thua := 0;
  end if;

  perform public.fn_log_audit(
    'SCHOOL_YEAR_CREATED_WITH_INHERITANCE',
    'nam_hoc',
    v_nam_hoc_moi_id,
    null,
    jsonb_build_object(
      'ten', p_ten,
      'bo_tieu_chuan_id', v_bo_tieu_chuan_id,
      'ke_thua_tu_nam_hoc_id', v_nam_hoc_nguon_id,
      'so_tu_danh_gia_ke_thua', so_tu_danh_gia_ke_thua
    )
  );

  return next;
end;
$$;

revoke all on function public.fn_tao_nam_hoc_ke_thua(varchar, date, date, uuid, boolean, uuid)
from public, anon;
grant execute on function public.fn_tao_nam_hoc_ke_thua(varchar, date, date, uuid, boolean, uuid)
to authenticated;

-- Cac ham nay chi duoc trigger/RPC noi bo goi.
revoke all on function public.fn_guard_nam_hoc_standard_version() from public, anon, authenticated;
revoke all on function public.fn_tieu_chi_thuoc_nam_hoc(uuid, uuid) from public, anon, authenticated;
revoke all on function public.fn_tieu_chuan_thuoc_nam_hoc(uuid, uuid) from public, anon, authenticated;
revoke all on function public.fn_guard_year_criterion_version() from public, anon, authenticated;
revoke all on function public.fn_guard_evidence_criterion_version() from public, anon, authenticated;
revoke all on function public.fn_minh_chung_hop_le_cho_tieu_chi(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.fn_check_tu_danh_gia_has_evidence() from public, anon, authenticated;
