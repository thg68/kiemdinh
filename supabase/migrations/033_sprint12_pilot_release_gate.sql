-- Sprint 12: co lap du lieu demo va tao cong kiem tra du lieu thi diem.
-- Khong xoa du lieu cu tu dong vi nha truong can co quyen ra soat truoc khi xoa.

alter table public.minh_chung add column if not exists la_du_lieu_demo boolean not null default false;
alter table public.tu_danh_gia add column if not exists la_du_lieu_demo boolean not null default false;
alter table public.nhan_xet_tieu_chuan add column if not exists la_du_lieu_demo boolean not null default false;
alter table public.ke_hoach_cai_tien add column if not exists la_du_lieu_demo boolean not null default false;

update public.minh_chung set la_du_lieu_demo = true
where not la_du_lieu_demo
  and position('[DEMO]' in upper(coalesce(ten, '') || ' ' || coalesce(ghi_chu, ''))) > 0;
update public.tu_danh_gia set la_du_lieu_demo = true
where not la_du_lieu_demo
  and position('[DEMO]' in upper(coalesce(mo_ta_muc_1, '') || ' ' || coalesce(mo_ta_muc_2, ''))) > 0;
update public.nhan_xet_tieu_chuan set la_du_lieu_demo = true
where not la_du_lieu_demo
  and position('[DEMO]' in upper(coalesce(diem_manh_noi_bat, '') || ' ' ||
    coalesce(han_che_trong_tam, '') || ' ' || coalesce(dinh_huong_cai_tien, ''))) > 0;
update public.ke_hoach_cai_tien set la_du_lieu_demo = true
where not la_du_lieu_demo
  and position('[DEMO]' in upper(coalesce(noi_dung, '') || ' ' || coalesce(muc_tieu, '') || ' ' ||
    coalesce(hoat_dong, '') || ' ' || coalesce(ghi_chu, ''))) > 0;

create index if not exists idx_minh_chung_demo_theo_nam
  on public.minh_chung(co_so_id, nam_hoc_id) where la_du_lieu_demo;
create index if not exists idx_tu_danh_gia_demo_theo_nam
  on public.tu_danh_gia(co_so_id, nam_hoc_id, cap_hoc) where la_du_lieu_demo;

-- Tu dong danh dau neu ban ghi moi van mang nhan [DEMO].
create or replace function public.fn_gan_co_du_lieu_demo()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if position('[DEMO]' in upper(to_jsonb(new)::text)) > 0 then
    new.la_du_lieu_demo := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_gan_co_demo_minh_chung on public.minh_chung;
create trigger trg_gan_co_demo_minh_chung before insert or update on public.minh_chung
for each row execute function public.fn_gan_co_du_lieu_demo();
drop trigger if exists trg_gan_co_demo_tu_danh_gia on public.tu_danh_gia;
create trigger trg_gan_co_demo_tu_danh_gia before insert or update on public.tu_danh_gia
for each row execute function public.fn_gan_co_du_lieu_demo();
drop trigger if exists trg_gan_co_demo_nhan_xet on public.nhan_xet_tieu_chuan;
create trigger trg_gan_co_demo_nhan_xet before insert or update on public.nhan_xet_tieu_chuan
for each row execute function public.fn_gan_co_du_lieu_demo();
drop trigger if exists trg_gan_co_demo_ke_hoach on public.ke_hoach_cai_tien;
create trigger trg_gan_co_demo_ke_hoach before insert or update on public.ke_hoach_cai_tien
for each row execute function public.fn_gan_co_du_lieu_demo();

-- Engine va bao cao chi nhan minh chung that, da xac minh va con hieu luc.
create or replace view public.v_minh_chung_hop_le_danh_gia
with (security_invoker = true)
as
select mc.*
from public.minh_chung mc
join public.nam_hoc nh on nh.id = mc.nam_hoc_id and nh.co_so_id = mc.co_so_id
where mc.deleted_at is null
  and not mc.la_du_lieu_demo
  and mc.trang_thai_xac_minh = 'da_xac_minh'
  and (mc.ngay_het_gia_tri is null or mc.ngay_het_gia_tri >= least(current_date, nh.ngay_ket_thuc));

grant select on public.v_minh_chung_hop_le_danh_gia to authenticated;

create or replace function public.fn_nam_hoc_co_du_lieu_demo(p_co_so_id uuid, p_nam_hoc_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
      select 1 from public.minh_chung
      where co_so_id = p_co_so_id and nam_hoc_id = p_nam_hoc_id and la_du_lieu_demo
    ) or exists (
      select 1 from public.tu_danh_gia
      where co_so_id = p_co_so_id and nam_hoc_id = p_nam_hoc_id and la_du_lieu_demo
    ) or exists (
      select 1 from public.nhan_xet_tieu_chuan
      where co_so_id = p_co_so_id and nam_hoc_id = p_nam_hoc_id and la_du_lieu_demo
    ) or exists (
      select 1 from public.ke_hoach_cai_tien
      where co_so_id = p_co_so_id and nam_hoc_id = p_nam_hoc_id and la_du_lieu_demo
    );
$$;

-- Snapshot da phe duyet la ban chinh thuc, DB phai chan neu con demo.
create or replace function public.fn_chan_phe_duyet_bao_cao_demo()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.trang_thai = 'da_phe_duyet'
    and public.fn_nam_hoc_co_du_lieu_demo(new.co_so_id, new.nam_hoc_id) then
    raise exception 'Bao cao khong the phe duyet khi nam hoc con du lieu demo.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_chan_phe_duyet_bao_cao_demo on public.bao_cao;
create trigger trg_chan_phe_duyet_bao_cao_demo before insert or update on public.bao_cao
for each row execute function public.fn_chan_phe_duyet_bao_cao_demo();

-- Cong du lieu thi diem chi doc trong tenant cua nguoi dang nhap.
create or replace function public.fn_kiem_tra_du_lieu_thi_diem(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_evidence_count integer;
  v_criteria_with_evidence integer;
  v_assessment_count integer;
  v_demo_count integer;
  v_role_count integer;
  v_missing_roles text[];
  v_blockers text[] := array[]::text[];
  v_required_roles constant text[] := array[
    'SYSTEM_ADMIN', 'PRINCIPAL', 'SELF_ASSESSMENT_CHAIR', 'SECRETARY',
    'MEMBER', 'TEACHER', 'VIEWER'
  ];
begin
  if v_co_so_id is null or not public.fn_has_permission('report.read', v_co_so_id) then
    raise exception 'Ban khong co quyen kiem tra du lieu thi diem cua don vi.';
  end if;
  if not exists (select 1 from public.nam_hoc where id = p_nam_hoc_id and co_so_id = v_co_so_id) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  select count(*)::integer into v_evidence_count
  from public.minh_chung mc
  where mc.co_so_id = v_co_so_id and mc.nam_hoc_id = p_nam_hoc_id
    and mc.deleted_at is null and not mc.la_du_lieu_demo;

  select count(distinct mctc.tieu_chi_id)::integer into v_criteria_with_evidence
  from public.minh_chung mc
  join public.minh_chung_tieu_chi mctc on mctc.minh_chung_id = mc.id
  join public.v_tieu_chi_nam_hoc vtc on vtc.id = mctc.tieu_chi_id
    and vtc.co_so_id = mc.co_so_id and vtc.nam_hoc_id = mc.nam_hoc_id
  where mc.co_so_id = v_co_so_id and mc.nam_hoc_id = p_nam_hoc_id
    and mc.deleted_at is null and not mc.la_du_lieu_demo;

  select count(distinct tdg.tieu_chi_id)::integer into v_assessment_count
  from public.tu_danh_gia tdg
  join public.v_tieu_chi_nam_hoc vtc on vtc.id = tdg.tieu_chi_id
    and vtc.co_so_id = tdg.co_so_id and vtc.nam_hoc_id = tdg.nam_hoc_id
  where tdg.co_so_id = v_co_so_id and tdg.nam_hoc_id = p_nam_hoc_id
    and tdg.cap_hoc = p_cap_hoc and not tdg.la_du_lieu_demo
    and nullif(pg_catalog.btrim(coalesce(tdg.mo_ta_muc_1, '')), '') is not null;

  select
    (select count(*) from public.minh_chung where co_so_id = v_co_so_id and nam_hoc_id = p_nam_hoc_id and la_du_lieu_demo)
    + (select count(*) from public.tu_danh_gia where co_so_id = v_co_so_id and nam_hoc_id = p_nam_hoc_id and la_du_lieu_demo)
    + (select count(*) from public.nhan_xet_tieu_chuan where co_so_id = v_co_so_id and nam_hoc_id = p_nam_hoc_id and la_du_lieu_demo)
    + (select count(*) from public.ke_hoach_cai_tien where co_so_id = v_co_so_id and nam_hoc_id = p_nam_hoc_id and la_du_lieu_demo)
  into v_demo_count;

  select coalesce(array_agg(required_role order by required_role), array[]::text[])
  into v_missing_roles
  from unnest(v_required_roles) required_role
  where not exists (
    select 1
    from public.nguoi_dung_vai_tro ndvt
    join public.nguoi_dung nd on nd.id = ndvt.nguoi_dung_id
    join public.vai_tro vt on vt.id = ndvt.vai_tro_id
    where ndvt.co_so_id = v_co_so_id and nd.co_so_id = v_co_so_id
      and nd.trang_thai = 'active' and vt.ma = required_role
  );

  v_role_count := cardinality(v_required_roles) - cardinality(v_missing_roles);
  if v_evidence_count < 100 then
    v_blockers := array_append(v_blockers, 'Can toi thieu 100 minh chung khong phai du lieu demo.');
  end if;
  if v_criteria_with_evidence < 15 then
    v_blockers := array_append(v_blockers, 'Chua du 15/15 tieu chi co minh chung.');
  end if;
  if v_assessment_count < 15 then
    v_blockers := array_append(v_blockers, 'Chua du 15/15 tieu chi co noi dung tu danh gia.');
  end if;
  if v_demo_count > 0 then
    v_blockers := array_append(v_blockers, 'Nam hoc van con du lieu demo can co lap hoac xoa.');
  end if;
  if cardinality(v_missing_roles) > 0 then
    v_blockers := array_append(v_blockers, 'Chua co du tai khoan hoat dong cho 7 vai tro kiem thu.');
  end if;

  return jsonb_build_object(
    'ready', cardinality(v_blockers) = 0,
    'evidence_count', v_evidence_count,
    'criteria_with_evidence', v_criteria_with_evidence,
    'assessment_count', v_assessment_count,
    'demo_record_count', v_demo_count,
    'validated_role_count', v_role_count,
    'missing_roles', to_jsonb(v_missing_roles),
    'blockers', to_jsonb(v_blockers)
  );
end;
$$;

revoke all on function public.fn_gan_co_du_lieu_demo() from public, anon, authenticated;
revoke all on function public.fn_nam_hoc_co_du_lieu_demo(uuid, uuid) from public, anon, authenticated;
revoke all on function public.fn_chan_phe_duyet_bao_cao_demo() from public, anon, authenticated;
revoke all on function public.fn_kiem_tra_du_lieu_thi_diem(uuid, public.cap_hoc) from public, anon;
grant execute on function public.fn_kiem_tra_du_lieu_thi_diem(uuid, public.cap_hoc) to authenticated;
