-- Sprint 9: atomic write flows, import staging, report readiness and immutable snapshots.

alter table public.bao_cao
  add column if not exists cap_hoc public.cap_hoc,
  add column if not exists ten_tep_goc text,
  add column if not exists mime_type text,
  add column if not exists kich_thuoc bigint,
  add column if not exists sha256 varchar(64),
  add column if not exists export_metadata jsonb not null default '{}'::jsonb;

create table if not exists public.noi_dung_mau_2 (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references public.co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  cap_hoc public.cap_hoc not null,
  can_cu_xay_dung text,
  muc_dich_yeu_cau text,
  tom_tat_van_de_trong_tam text,
  theo_doi_danh_gia text,
  to_chuc_thuc_hien text,
  co_che_danh_gia_bao_cao text,
  nguoi_cap_nhat uuid references public.nguoi_dung(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (co_so_id, nam_hoc_id, cap_hoc),
  foreign key (nam_hoc_id, co_so_id) references public.nam_hoc(id, co_so_id)
);

create table if not exists public.dot_import (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references public.co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  ten_tep_goc text not null,
  hash_tep varchar(64) not null check (hash_tep ~ '^[0-9a-f]{64}$'),
  storage_path text,
  trang_thai text not null default 'staging'
    check (trang_thai in ('staging', 'invalid', 'validated', 'committing', 'committed', 'failed')),
  tong_so_dong integer not null default 0,
  so_dong_hop_le integer not null default 0,
  so_dong_loi integer not null default 0,
  nguoi_tao uuid not null references public.nguoi_dung(id),
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (co_so_id, nam_hoc_id, hash_tep),
  foreign key (nam_hoc_id, co_so_id) references public.nam_hoc(id, co_so_id)
);

create table if not exists public.dong_import (
  id uuid primary key default gen_random_uuid(),
  dot_import_id uuid not null references public.dot_import(id) on delete cascade,
  co_so_id uuid not null references public.co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  so_dong integer not null check (so_dong > 0),
  loai_dong text not null check (loai_dong in ('evidence', 'assessment', 'standard_note', 'plan', 'unknown')),
  du_lieu jsonb not null,
  loi text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dot_import_id, so_dong),
  foreign key (nam_hoc_id, co_so_id) references public.nam_hoc(id, co_so_id)
);

create index if not exists idx_dot_import_tenant_year
on public.dot_import(co_so_id, nam_hoc_id, created_at desc);

create index if not exists idx_dong_import_batch
on public.dong_import(dot_import_id, so_dong);

alter table public.noi_dung_mau_2 enable row level security;
alter table public.dot_import enable row level security;
alter table public.dong_import enable row level security;

drop policy if exists "noi_dung_mau_2_read" on public.noi_dung_mau_2;
create policy "noi_dung_mau_2_read" on public.noi_dung_mau_2
for select to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('report.read', co_so_id)
);

drop policy if exists "noi_dung_mau_2_write" on public.noi_dung_mau_2;
create policy "noi_dung_mau_2_write" on public.noi_dung_mau_2
for all to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_can_write_ke_hoach_cai_tien(co_so_id)
)
with check (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_can_write_ke_hoach_cai_tien(co_so_id)
);

insert into public.quyen(ma, ten, mo_ta, resource, action)
values ('import.manage', 'Nhap du lieu nam hoc', 'Tao, xem truoc va xac nhan dot import cua don vi.', 'import', 'manage')
on conflict (ma) do update
set ten = excluded.ten, mo_ta = excluded.mo_ta, resource = excluded.resource, action = excluded.action;

with role_permission(role_code) as (
  values ('PRINCIPAL'), ('SELF_ASSESSMENT_CHAIR'), ('SECRETARY')
)
insert into public.vai_tro_quyen(vai_tro_id, quyen_id)
select vt.id, q.id
from role_permission rp
join public.vai_tro vt on vt.ma = rp.role_code
join public.quyen q on q.ma = 'import.manage'
on conflict (vai_tro_id, quyen_id) do nothing;

drop policy if exists "dot_import_read" on public.dot_import;
create policy "dot_import_read" on public.dot_import
for select to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('import.manage', co_so_id)
);

drop policy if exists "dong_import_read" on public.dong_import;
create policy "dong_import_read" on public.dong_import
for select to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('import.manage', co_so_id)
);

drop trigger if exists trg_noi_dung_mau_2_updated_at on public.noi_dung_mau_2;
create trigger trg_noi_dung_mau_2_updated_at
before update on public.noi_dung_mau_2
for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_dot_import_updated_at on public.dot_import;
create trigger trg_dot_import_updated_at
before update on public.dot_import
for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_dong_import_updated_at on public.dong_import;
create trigger trg_dong_import_updated_at
before update on public.dong_import
for each row execute function public.fn_set_updated_at();

-- Luu tu danh gia va ma tran minh chung trong mot transaction PostgreSQL.
create or replace function public.fn_luu_tu_danh_gia_atomic(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_tieu_chi_id uuid,
  p_mo_ta_muc_1 text,
  p_mo_ta_muc_2 text,
  p_muc_dat smallint,
  p_minh_chung_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_tu_danh_gia_id uuid;
  v_minh_chung_ids uuid[];
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if p_muc_dat not between 0 and 2 then
    raise exception 'Muc tu danh gia chi nhan gia tri 0, 1 hoac 2.';
  end if;

  if not public.fn_can_write_tu_danh_gia(v_co_so_id, p_nam_hoc_id, p_tieu_chi_id) then
    raise exception 'Ban chua co quyen cap nhat tieu chi nay.';
  end if;

  if not public.fn_tieu_chi_thuoc_nam_hoc(p_nam_hoc_id, p_tieu_chi_id) then
    raise exception 'Tieu chi khong thuoc phien ban bo tieu chuan cua nam hoc.';
  end if;

  select coalesce(array_agg(distinct evidence_id order by evidence_id), array[]::uuid[])
  into v_minh_chung_ids
  from unnest(coalesce(p_minh_chung_ids, array[]::uuid[])) evidence_id;

  if exists (
    select 1
    from unnest(v_minh_chung_ids) selected(id)
    left join public.minh_chung mc
      on mc.id = selected.id
      and mc.co_so_id = v_co_so_id
      and mc.nam_hoc_id = p_nam_hoc_id
      and mc.deleted_at is null
    where mc.id is null
  ) then
    raise exception 'Co minh chung khong thuoc don vi hoac nam hoc hien tai.';
  end if;

  if exists (
    select 1
    from public.minh_chung_tieu_chi mctc
    where mctc.tieu_chi_id = p_tieu_chi_id
      and mctc.la_tieu_chi_goc
      and not (mctc.minh_chung_id = any(v_minh_chung_ids))
  ) then
    raise exception 'Khong the go tieu chi goc khoi minh chung da duoc cap ma.';
  end if;

  insert into public.minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, muc, la_tieu_chi_goc)
  select selected.id, p_tieu_chi_id, null, false
  from unnest(v_minh_chung_ids) selected(id)
  on conflict (minh_chung_id, tieu_chi_id) do nothing;

  delete from public.minh_chung_tieu_chi mctc
  using public.minh_chung mc
  where mctc.minh_chung_id = mc.id
    and mctc.tieu_chi_id = p_tieu_chi_id
    and not mctc.la_tieu_chi_goc
    and mc.co_so_id = v_co_so_id
    and mc.nam_hoc_id = p_nam_hoc_id
    and not (mctc.minh_chung_id = any(v_minh_chung_ids));

  insert into public.tu_danh_gia(
    co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc,
    mo_ta_muc_1, dat_muc_1, mo_ta_muc_2, dat_muc_2, muc_dat, nguoi_nhap
  )
  values (
    v_co_so_id, p_nam_hoc_id, p_tieu_chi_id, p_cap_hoc,
    p_mo_ta_muc_1, p_muc_dat >= 1, p_mo_ta_muc_2, p_muc_dat >= 2, p_muc_dat, v_nguoi_dung_id
  )
  on conflict (co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc)
  do update set
    mo_ta_muc_1 = excluded.mo_ta_muc_1,
    dat_muc_1 = excluded.dat_muc_1,
    mo_ta_muc_2 = excluded.mo_ta_muc_2,
    dat_muc_2 = excluded.dat_muc_2,
    muc_dat = excluded.muc_dat,
    nguoi_nhap = excluded.nguoi_nhap,
    updated_at = now()
  returning id into v_tu_danh_gia_id;

  perform public.fn_log_audit(
    'ASSESSMENT_SAVED_ATOMIC',
    'tu_danh_gia',
    v_tu_danh_gia_id,
    null,
    jsonb_build_object(
      'nam_hoc_id', p_nam_hoc_id,
      'cap_hoc', p_cap_hoc,
      'tieu_chi_id', p_tieu_chi_id,
      'muc_dat', p_muc_dat,
      'minh_chung_ids', v_minh_chung_ids
    )
  );

  return v_tu_danh_gia_id;
end;
$$;

-- Chuyen nam hoc active trong mot transaction; unique partial index chan hai nam active.
create or replace function public.fn_dat_nam_hoc_dang_hoat_dong(p_nam_hoc_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_old_year_id uuid;
begin
  if v_co_so_id is null or not public.fn_can_manage_tenant_setup(v_co_so_id) then
    raise exception 'Ban khong co quyen chon nam hoc dang hoat dong.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_co_so_id::text, 9002));

  if not exists (
    select 1 from public.nam_hoc
    where id = p_nam_hoc_id and co_so_id = v_co_so_id
  ) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  select id into v_old_year_id
  from public.nam_hoc
  where co_so_id = v_co_so_id and trang_thai = 'dang_hoat_dong'
  for update;

  if v_old_year_id = p_nam_hoc_id then
    return;
  end if;

  update public.nam_hoc
  set trang_thai = 'chuan_bi'
  where co_so_id = v_co_so_id and trang_thai = 'dang_hoat_dong';

  update public.nam_hoc
  set trang_thai = 'dang_hoat_dong'
  where id = p_nam_hoc_id and co_so_id = v_co_so_id;

  perform public.fn_log_audit(
    'ACTIVE_SCHOOL_YEAR_CHANGED', 'nam_hoc', p_nam_hoc_id, null,
    jsonb_build_object('nam_hoc_cu_id', v_old_year_id, 'nam_hoc_moi_id', p_nam_hoc_id)
  );
end;
$$;

-- Khong cho client tao trang thai 0 active bang update/delete truc tiep.
drop policy if exists "nam_hoc_update_principal_or_system" on public.nam_hoc;
drop policy if exists "nam_hoc_delete_principal_or_system" on public.nam_hoc;

-- Readiness la source of truth duy nhat cho UI va approval gate.
create or replace function public.fn_kiem_tra_san_sang_bao_cao(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_loai_bao_cao public.loai_bao_cao default 'mau_1_tu_danh_gia'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_missing_criteria text[] := array[]::text[];
  v_missing_descriptions text[] := array[]::text[];
  v_missing_evidence text[] := array[]::text[];
  v_unverified_evidence text[] := array[]::text[];
  v_other_blockers text[] := array[]::text[];
  v_missing_council boolean;
  v_ready boolean;
begin
  if v_co_so_id is null or not public.fn_has_permission('report.read', v_co_so_id) then
    raise exception 'Ban khong co quyen kiem tra bao cao cua don vi.';
  end if;

  if not exists (
    select 1 from public.nam_hoc
    where id = p_nam_hoc_id and co_so_id = v_co_so_id
  ) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  select coalesce(array_agg(vtc.ma order by vtc.ma), array[]::text[])
  into v_missing_criteria
  from public.v_tieu_chi_nam_hoc vtc
  left join public.tu_danh_gia tdg
    on tdg.co_so_id = vtc.co_so_id
    and tdg.nam_hoc_id = vtc.nam_hoc_id
    and tdg.tieu_chi_id = vtc.id
    and tdg.cap_hoc = p_cap_hoc
  where vtc.co_so_id = v_co_so_id
    and vtc.nam_hoc_id = p_nam_hoc_id
    and tdg.id is null;

  select coalesce(array_agg(vtc.ma order by vtc.ma), array[]::text[])
  into v_missing_descriptions
  from public.v_tieu_chi_nam_hoc vtc
  join public.tu_danh_gia tdg
    on tdg.co_so_id = vtc.co_so_id
    and tdg.nam_hoc_id = vtc.nam_hoc_id
    and tdg.tieu_chi_id = vtc.id
    and tdg.cap_hoc = p_cap_hoc
  where vtc.co_so_id = v_co_so_id
    and vtc.nam_hoc_id = p_nam_hoc_id
    and (
      nullif(pg_catalog.btrim(coalesce(tdg.mo_ta_muc_1, '')), '') is null
      or (tdg.muc_dat = 2 and nullif(pg_catalog.btrim(coalesce(tdg.mo_ta_muc_2, '')), '') is null)
    );

  select coalesce(array_agg(vtc.ma order by vtc.ma), array[]::text[])
  into v_missing_evidence
  from public.v_tieu_chi_nam_hoc vtc
  where vtc.co_so_id = v_co_so_id
    and vtc.nam_hoc_id = p_nam_hoc_id
    and not public.fn_minh_chung_hop_le_cho_tieu_chi(v_co_so_id, p_nam_hoc_id, vtc.id);

  select coalesce(array_agg(distinct mc.ma order by mc.ma), array[]::text[])
  into v_unverified_evidence
  from public.minh_chung mc
  join public.minh_chung_tieu_chi mctc on mctc.minh_chung_id = mc.id
  where mc.co_so_id = v_co_so_id
    and mc.nam_hoc_id = p_nam_hoc_id
    and mc.deleted_at is null
    and mc.trang_thai_xac_minh <> 'da_xac_minh';

  select not exists (
    select 1
    from public.hoi_dong_tu_danh_gia hd
    join public.thanh_vien_hoi_dong tv on tv.hoi_dong_id = hd.id
    where hd.co_so_id = v_co_so_id and hd.nam_hoc_id = p_nam_hoc_id
  ) into v_missing_council;

  if (select count(*) from public.v_tieu_chi_nam_hoc where co_so_id = v_co_so_id and nam_hoc_id = p_nam_hoc_id) <> 15 then
    v_other_blockers := array_append(v_other_blockers, 'Nam hoc khong co du 15 tieu chi cua bo tieu chuan da khoa.');
  end if;

  if p_loai_bao_cao = 'mau_1_tu_danh_gia' then
    if exists (
      select 1
      from public.v_tieu_chi_nam_hoc vtc
      left join public.nhan_xet_tieu_chuan n on n.co_so_id = vtc.co_so_id
        and n.nam_hoc_id = vtc.nam_hoc_id
        and n.tieu_chuan_id = vtc.tieu_chuan_id
        and n.cap_hoc = p_cap_hoc
      where vtc.co_so_id = v_co_so_id and vtc.nam_hoc_id = p_nam_hoc_id
        and (
          nullif(pg_catalog.btrim(coalesce(n.diem_manh_noi_bat, '')), '') is null
          or nullif(pg_catalog.btrim(coalesce(n.han_che_trong_tam, '')), '') is null
          or nullif(pg_catalog.btrim(coalesce(n.dinh_huong_cai_tien, '')), '') is null
        )
    ) then
      v_other_blockers := array_append(v_other_blockers, 'Chua du nhan xet sau tung tieu chuan.');
    end if;
  elsif p_loai_bao_cao = 'mau_2_ke_hoach_cai_tien' then
    if not exists (
      select 1 from public.ke_hoach_cai_tien
      where co_so_id = v_co_so_id and nam_hoc_id = p_nam_hoc_id
    ) then
      v_other_blockers := array_append(v_other_blockers, 'Chua co dong ke hoach cai tien.');
    end if;

    if not exists (
      select 1 from public.noi_dung_mau_2 nd
      where nd.co_so_id = v_co_so_id and nd.nam_hoc_id = p_nam_hoc_id and nd.cap_hoc = p_cap_hoc
        and nullif(pg_catalog.btrim(coalesce(nd.can_cu_xay_dung, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(nd.muc_dich_yeu_cau, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(nd.tom_tat_van_de_trong_tam, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(nd.theo_doi_danh_gia, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(nd.to_chuc_thuc_hien, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(nd.co_che_danh_gia_bao_cao, '')), '') is not null
    ) then
      v_other_blockers := array_append(v_other_blockers, 'Chua du noi dung 8 phan cua Mau 2.');
    end if;
  end if;

  v_ready := cardinality(v_missing_criteria) = 0
    and cardinality(v_missing_descriptions) = 0
    and cardinality(v_missing_evidence) = 0
    and cardinality(v_unverified_evidence) = 0
    and not v_missing_council
    and cardinality(v_other_blockers) = 0;

  return jsonb_build_object(
    'ready', v_ready,
    'missing_criteria', to_jsonb(v_missing_criteria),
    'missing_descriptions', to_jsonb(v_missing_descriptions),
    'missing_evidence', to_jsonb(v_missing_evidence),
    'unverified_evidence', to_jsonb(v_unverified_evidence),
    'missing_council', v_missing_council,
    'other_blockers', to_jsonb(v_other_blockers)
  );
end;
$$;

create or replace function public.fn_guard_approved_report_snapshot()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' and old.trang_thai = 'da_phe_duyet' then
    raise exception 'Snapshot bao cao da phe duyet la bat bien va khong duoc xoa.';
  end if;

  if tg_op = 'UPDATE' and old.trang_thai = 'da_phe_duyet' then
    raise exception 'Snapshot bao cao da phe duyet la bat bien va khong duoc ghi de.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_guard_approved_report_snapshot on public.bao_cao;
create trigger trg_guard_approved_report_snapshot
before update or delete on public.bao_cao
for each row execute function public.fn_guard_approved_report_snapshot();

drop function if exists public.fn_luu_trang_thai_bao_cao(uuid, public.loai_bao_cao, text, text);

create or replace function public.fn_luu_trang_thai_bao_cao(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_loai_bao_cao public.loai_bao_cao,
  p_trang_thai text,
  p_storage_path text default null,
  p_ten_tep_goc text default null,
  p_mime_type text default null,
  p_kich_thuoc bigint default null,
  p_sha256 varchar default null,
  p_export_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_bao_cao_id uuid;
  v_version integer;
  v_readiness jsonb;
  v_storage_path text := nullif(p_storage_path, '');
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not exists (select 1 from public.nam_hoc where id = p_nam_hoc_id and co_so_id = v_co_so_id) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  if p_trang_thai not in ('nhap', 'cho_duyet', 'da_phe_duyet', 'tra_lai') then
    raise exception 'Trang thai bao cao khong hop le.';
  end if;

  if v_storage_path is not null and v_storage_path not like v_co_so_id::text || '/%' then
    raise exception 'Duong dan luu tru bao cao khong thuoc don vi hien tai.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_co_so_id::text || p_nam_hoc_id::text || p_loai_bao_cao::text || p_cap_hoc::text, 9006)
  );

  if p_trang_thai = 'da_phe_duyet' then
    if not (
      public.fn_has_permission('report.approve', v_co_so_id)
      and (public.fn_has_role('PRINCIPAL', v_co_so_id) or public.fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id))
    ) then
      raise exception 'Chi Hieu truong hoac Chu tich hoi dong moi duoc phe duyet bao cao.';
    end if;

    v_readiness := public.fn_kiem_tra_san_sang_bao_cao(p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao);
    if not coalesce((v_readiness ->> 'ready')::boolean, false) then
      raise exception 'Bao cao chua san sang de phe duyet: %', v_readiness::text;
    end if;

    if v_storage_path is null or nullif(p_ten_tep_goc, '') is null then
      raise exception 'Bao cao phe duyet phai co file snapshot va ten tep goc.';
    end if;
  elsif not public.fn_has_permission('report.export', v_co_so_id) then
    raise exception 'Ban chua co quyen bien tap hoac xuat bao cao.';
  end if;

  select id, version into v_bao_cao_id, v_version
  from public.bao_cao
  where co_so_id = v_co_so_id
    and nam_hoc_id = p_nam_hoc_id
    and loai_bao_cao = p_loai_bao_cao
    and cap_hoc = p_cap_hoc
    and trang_thai <> 'da_phe_duyet'
  order by version desc
  limit 1
  for update;

  if v_bao_cao_id is null then
    select coalesce(max(version), 0) + 1 into v_version
    from public.bao_cao
    where co_so_id = v_co_so_id
      and nam_hoc_id = p_nam_hoc_id
      and loai_bao_cao = p_loai_bao_cao;

    insert into public.bao_cao(
      co_so_id, nam_hoc_id, cap_hoc, loai_bao_cao, version, trang_thai,
      storage_path, ten_tep_goc, mime_type, kich_thuoc, sha256, export_metadata,
      nguoi_tao, nguoi_phe_duyet, ngay_phe_duyet
    ) values (
      v_co_so_id, p_nam_hoc_id, p_cap_hoc, p_loai_bao_cao, v_version, p_trang_thai,
      v_storage_path, p_ten_tep_goc, p_mime_type, p_kich_thuoc, p_sha256,
      coalesce(p_export_metadata, '{}'::jsonb), v_nguoi_dung_id,
      case when p_trang_thai = 'da_phe_duyet' then v_nguoi_dung_id end,
      case when p_trang_thai = 'da_phe_duyet' then now() end
    ) returning id into v_bao_cao_id;
  else
    update public.bao_cao
    set trang_thai = p_trang_thai,
        storage_path = coalesce(v_storage_path, storage_path),
        ten_tep_goc = coalesce(nullif(p_ten_tep_goc, ''), ten_tep_goc),
        mime_type = coalesce(nullif(p_mime_type, ''), mime_type),
        kich_thuoc = coalesce(p_kich_thuoc, kich_thuoc),
        sha256 = coalesce(nullif(p_sha256, ''), sha256),
        export_metadata = export_metadata || coalesce(p_export_metadata, '{}'::jsonb),
        nguoi_phe_duyet = case when p_trang_thai = 'da_phe_duyet' then v_nguoi_dung_id end,
        ngay_phe_duyet = case when p_trang_thai = 'da_phe_duyet' then now() end,
        updated_at = now()
    where id = v_bao_cao_id;
  end if;

  perform public.fn_log_audit(
    'REPORT_STATUS_UPDATED', 'bao_cao', v_bao_cao_id, null,
    jsonb_build_object(
      'nam_hoc_id', p_nam_hoc_id, 'cap_hoc', p_cap_hoc,
      'loai_bao_cao', p_loai_bao_cao, 'trang_thai', p_trang_thai,
      'version', v_version, 'storage_path', v_storage_path
    )
  );

  return v_bao_cao_id;
end;
$$;

create or replace function public.fn_tao_dot_import(
  p_nam_hoc_id uuid,
  p_ten_tep_goc text,
  p_hash_tep varchar,
  p_storage_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_user_id uuid := public.fn_current_nguoi_dung_id();
  v_id uuid;
begin
  if v_co_so_id is null or v_user_id is null or not public.fn_has_permission('import.manage', v_co_so_id) then
    raise exception 'Ban khong co quyen import du lieu nam hoc.';
  end if;

  if not exists (select 1 from public.nam_hoc where id = p_nam_hoc_id and co_so_id = v_co_so_id) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  if p_hash_tep !~ '^[0-9a-f]{64}$' then
    raise exception 'Hash tep import khong hop le.';
  end if;

  if p_storage_path is not null and p_storage_path not like v_co_so_id::text || '/' || p_nam_hoc_id::text || '/%' then
    raise exception 'Duong dan tep import khong thuoc don vi va nam hoc hien tai.';
  end if;

  insert into public.dot_import(co_so_id, nam_hoc_id, ten_tep_goc, hash_tep, storage_path, nguoi_tao)
  values (v_co_so_id, p_nam_hoc_id, p_ten_tep_goc, p_hash_tep, p_storage_path, v_user_id)
  on conflict (co_so_id, nam_hoc_id, hash_tep)
  do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.dot_import
    where co_so_id = v_co_so_id and nam_hoc_id = p_nam_hoc_id and hash_tep = p_hash_tep;
  end if;

  return v_id;
end;
$$;

create or replace function public.fn_ghi_dong_import(
  p_dot_import_id uuid,
  p_so_dong integer,
  p_loai_dong text,
  p_du_lieu jsonb,
  p_loi text[] default array[]::text[]
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_batch public.dot_import%rowtype;
  v_id uuid;
begin
  select * into v_batch from public.dot_import
  where id = p_dot_import_id and co_so_id = public.fn_current_co_so_id()
  for update;

  if not found or not public.fn_has_permission('import.manage', v_batch.co_so_id) then
    raise exception 'Khong tim thay dot import hoac ban khong co quyen.';
  end if;

  if v_batch.trang_thai = 'committed' then
    raise exception 'Dot import da commit va khong the thay doi.';
  end if;

  insert into public.dong_import(dot_import_id, co_so_id, nam_hoc_id, so_dong, loai_dong, du_lieu, loi)
  values (v_batch.id, v_batch.co_so_id, v_batch.nam_hoc_id, p_so_dong, p_loai_dong, p_du_lieu, coalesce(p_loi, array[]::text[]))
  on conflict (dot_import_id, so_dong)
  do update set loai_dong = excluded.loai_dong, du_lieu = excluded.du_lieu, loi = excluded.loi, updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.fn_hoan_tat_staging_import(p_dot_import_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_batch public.dot_import%rowtype;
  v_total integer;
  v_valid integer;
  v_errors integer;
begin
  select * into v_batch from public.dot_import
  where id = p_dot_import_id and co_so_id = public.fn_current_co_so_id()
  for update;

  if not found or not public.fn_has_permission('import.manage', v_batch.co_so_id) then
    raise exception 'Khong tim thay dot import hoac ban khong co quyen.';
  end if;

  select count(*), count(*) filter (where cardinality(loi) = 0), count(*) filter (where cardinality(loi) > 0)
  into v_total, v_valid, v_errors
  from public.dong_import where dot_import_id = p_dot_import_id;

  update public.dot_import
  set tong_so_dong = v_total, so_dong_hop_le = v_valid, so_dong_loi = v_errors,
      trang_thai = case when v_total > 0 and v_errors = 0 then 'validated' else 'invalid' end
  where id = p_dot_import_id;

  return jsonb_build_object('total', v_total, 'valid', v_valid, 'errors', v_errors, 'ready', v_total > 0 and v_errors = 0);
end;
$$;

-- Commit chi chay khi preview khong con loi; cung file hash chi co mot batch.
create or replace function public.fn_commit_dot_import(p_dot_import_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_batch public.dot_import%rowtype;
  v_row public.dong_import%rowtype;
  v_criterion_id uuid;
  v_criterion_ids uuid[];
  v_standard_id uuid;
  v_evidence_ids uuid[];
  v_new_evidence_id uuid;
  v_count integer := 0;
begin
  select * into v_batch from public.dot_import
  where id = p_dot_import_id and co_so_id = public.fn_current_co_so_id()
  for update;

  if not found or not public.fn_has_permission('import.manage', v_batch.co_so_id) then
    raise exception 'Khong tim thay dot import hoac ban khong co quyen.';
  end if;

  if v_batch.trang_thai = 'committed' then
    return jsonb_build_object('committed', true, 'idempotent', true, 'rows', v_batch.so_dong_hop_le);
  end if;

  if v_batch.trang_thai <> 'validated' or v_batch.so_dong_loi > 0 then
    raise exception 'Dot import chua qua buoc validate hoac van con dong loi.';
  end if;

  update public.dot_import set trang_thai = 'committing' where id = v_batch.id;

  for v_row in
    select * from public.dong_import
    where dot_import_id = v_batch.id
    order by case loai_dong when 'evidence' then 1 when 'assessment' then 2 when 'standard_note' then 3 else 4 end, so_dong
  loop
    select id into v_criterion_id
    from public.v_tieu_chi_nam_hoc
    where co_so_id = v_batch.co_so_id and nam_hoc_id = v_batch.nam_hoc_id
      and ma = nullif(pg_catalog.btrim(pg_catalog.split_part(v_row.du_lieu ->> 'ma_tieu_chi', ',', 1)), '');

    if v_row.loai_dong in ('evidence', 'assessment') and v_criterion_id is null then
      raise exception 'Dong % tham chieu tieu chi khong hop le.', v_row.so_dong;
    end if;

    if v_row.loai_dong = 'evidence' then
      select coalesce(array_agg(tc.id order by source.ord), array[]::uuid[])
      into v_criterion_ids
      from unnest(pg_catalog.string_to_array(v_row.du_lieu ->> 'ma_tieu_chi', ',')) with ordinality source(ma, ord)
      join public.v_tieu_chi_nam_hoc tc
        on tc.co_so_id = v_batch.co_so_id
        and tc.nam_hoc_id = v_batch.nam_hoc_id
        and tc.ma = pg_catalog.btrim(source.ma);

      if cardinality(v_criterion_ids) <> cardinality(pg_catalog.string_to_array(v_row.du_lieu ->> 'ma_tieu_chi', ',')) then
        raise exception 'Dong % co tieu chi minh chung khong hop le.', v_row.so_dong;
      end if;

      v_new_evidence_id := public.fn_tao_minh_chung(
        v_batch.nam_hoc_id,
        v_criterion_ids,
        v_criterion_ids[1],
        coalesce(nullif(v_row.du_lieu ->> 'ten_minh_chung', ''), 'Minh chung import'),
        nullif(v_row.du_lieu ->> 'loai_tep', ''),
        nullif(v_row.du_lieu ->> 'duong_dan', ''),
        nullif(v_row.du_lieu ->> 'storage_path', ''),
        nullif(v_row.du_lieu ->> 'hash_tep', ''),
        nullif(v_row.du_lieu ->> 'kich_thuoc', '')::bigint,
        nullif(v_row.du_lieu ->> 'ngay_ban_hanh', '')::date,
        nullif(v_row.du_lieu ->> 'ngay_het_gia_tri', '')::date
      );

      if coalesce((v_row.du_lieu ->> 'da_xac_minh')::boolean, false) then
        if not public.fn_has_permission('evidence.verify', v_batch.co_so_id) then
          raise exception 'Dong % yeu cau xac minh nhung tai khoan import khong co quyen.', v_row.so_dong;
        end if;
        update public.minh_chung
        set trang_thai_xac_minh = 'da_xac_minh', nguoi_xac_minh = public.fn_current_nguoi_dung_id(),
            ngay_xac_minh = now(), updated_at = now()
        where id = v_new_evidence_id;
      end if;
    elsif v_row.loai_dong = 'assessment' then
      select coalesce(array_agg(mc.id), array[]::uuid[]) into v_evidence_ids
      from public.minh_chung mc
      join public.minh_chung_tieu_chi mctc on mctc.minh_chung_id = mc.id
      where mc.co_so_id = v_batch.co_so_id and mc.nam_hoc_id = v_batch.nam_hoc_id
        and mctc.tieu_chi_id = v_criterion_id;

      perform public.fn_luu_tu_danh_gia_atomic(
        v_batch.nam_hoc_id,
        coalesce(nullif(v_row.du_lieu ->> 'cap_hoc', '')::public.cap_hoc, 'mam_non'::public.cap_hoc),
        v_criterion_id,
        v_row.du_lieu ->> 'mo_ta_muc_1',
        v_row.du_lieu ->> 'mo_ta_muc_2',
        coalesce(nullif(v_row.du_lieu ->> 'muc_dat', '')::smallint, 0::smallint),
        v_evidence_ids
      );
    elsif v_row.loai_dong = 'standard_note' then
      select distinct tieu_chuan_id into v_standard_id
      from public.v_tieu_chi_nam_hoc
      where co_so_id = v_batch.co_so_id and nam_hoc_id = v_batch.nam_hoc_id
        and tieu_chuan_so_thu_tu = (v_row.du_lieu ->> 'tieu_chuan_so')::smallint;

      insert into public.nhan_xet_tieu_chuan(
        co_so_id, nam_hoc_id, tieu_chuan_id, cap_hoc,
        diem_manh_noi_bat, han_che_trong_tam, dinh_huong_cai_tien, nguoi_cap_nhat
      ) values (
        v_batch.co_so_id, v_batch.nam_hoc_id, v_standard_id,
        coalesce(nullif(v_row.du_lieu ->> 'cap_hoc', '')::public.cap_hoc, 'mam_non'::public.cap_hoc),
        v_row.du_lieu ->> 'diem_manh_noi_bat', v_row.du_lieu ->> 'han_che_trong_tam',
        v_row.du_lieu ->> 'dinh_huong_cai_tien', public.fn_current_nguoi_dung_id()
      ) on conflict (co_so_id, nam_hoc_id, tieu_chuan_id, cap_hoc)
      do update set diem_manh_noi_bat = excluded.diem_manh_noi_bat,
        han_che_trong_tam = excluded.han_che_trong_tam,
        dinh_huong_cai_tien = excluded.dinh_huong_cai_tien,
        nguoi_cap_nhat = excluded.nguoi_cap_nhat,
        updated_at = now();
    elsif v_row.loai_dong = 'plan' then
      select tieu_chuan_id into v_standard_id from public.tieu_chi where id = v_criterion_id;
      insert into public.ke_hoach_cai_tien(
        co_so_id, nam_hoc_id, tieu_chuan_id, tieu_chi_id, noi_dung, muc_tieu,
        hoat_dong, chi_so_ket_qua, thoi_gian_bat_dau, thoi_gian_ket_thuc,
        phu_trach_id, nguon_luc, minh_chung_du_kien, muc_do_thuc_hien, ghi_chu
      ) values (
        v_batch.co_so_id, v_batch.nam_hoc_id, v_standard_id, v_criterion_id,
        v_row.du_lieu ->> 'noi_dung', v_row.du_lieu ->> 'muc_tieu', v_row.du_lieu ->> 'hoat_dong',
        v_row.du_lieu ->> 'chi_so_ket_qua', nullif(v_row.du_lieu ->> 'thoi_gian_bat_dau', '')::date,
        nullif(v_row.du_lieu ->> 'thoi_gian_ket_thuc', '')::date, public.fn_current_nguoi_dung_id(),
        v_row.du_lieu ->> 'nguon_luc', v_row.du_lieu ->> 'minh_chung_du_kien',
        coalesce(nullif(v_row.du_lieu ->> 'muc_do_thuc_hien', '')::public.trang_thai_ke_hoach_cai_tien, 'chua_thuc_hien'),
        v_row.du_lieu ->> 'ghi_chu'
      );
    end if;

    v_count := v_count + 1;
  end loop;

  update public.dot_import
  set trang_thai = 'committed', committed_at = now()
  where id = v_batch.id;

  perform public.fn_log_audit(
    'IMPORT_COMMITTED', 'dot_import', v_batch.id, null,
    jsonb_build_object('nam_hoc_id', v_batch.nam_hoc_id, 'hash_tep', v_batch.hash_tep, 'so_dong', v_count)
  );

  return jsonb_build_object('committed', true, 'idempotent', false, 'rows', v_count);
end;
$$;

insert into storage.buckets(id, name, public)
values ('imports', 'imports', false)
on conflict (id) do update set public = false;

drop policy if exists "imports_storage_select" on storage.objects;
create policy "imports_storage_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'imports'
  and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
  and public.fn_has_permission('import.manage', public.fn_current_co_so_id())
);

drop policy if exists "imports_storage_insert" on storage.objects;
create policy "imports_storage_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'imports'
  and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
  and public.fn_has_permission('import.manage', public.fn_current_co_so_id())
);

drop policy if exists "imports_storage_delete" on storage.objects;
create policy "imports_storage_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'imports'
  and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
  and public.fn_has_permission('import.manage', public.fn_current_co_so_id())
);

revoke all on function public.fn_luu_tu_danh_gia_atomic(uuid, public.cap_hoc, uuid, text, text, smallint, uuid[]) from public, anon;
grant execute on function public.fn_luu_tu_danh_gia_atomic(uuid, public.cap_hoc, uuid, text, text, smallint, uuid[]) to authenticated;
revoke all on function public.fn_dat_nam_hoc_dang_hoat_dong(uuid) from public, anon;
grant execute on function public.fn_dat_nam_hoc_dang_hoat_dong(uuid) to authenticated;
revoke all on function public.fn_kiem_tra_san_sang_bao_cao(uuid, public.cap_hoc, public.loai_bao_cao) from public, anon;
grant execute on function public.fn_kiem_tra_san_sang_bao_cao(uuid, public.cap_hoc, public.loai_bao_cao) to authenticated;
revoke all on function public.fn_luu_trang_thai_bao_cao(uuid, public.cap_hoc, public.loai_bao_cao, text, text, text, text, bigint, varchar, jsonb) from public, anon;
grant execute on function public.fn_luu_trang_thai_bao_cao(uuid, public.cap_hoc, public.loai_bao_cao, text, text, text, text, bigint, varchar, jsonb) to authenticated;
revoke all on function public.fn_tao_dot_import(uuid, text, varchar, text) from public, anon;
grant execute on function public.fn_tao_dot_import(uuid, text, varchar, text) to authenticated;
revoke all on function public.fn_ghi_dong_import(uuid, integer, text, jsonb, text[]) from public, anon;
grant execute on function public.fn_ghi_dong_import(uuid, integer, text, jsonb, text[]) to authenticated;
revoke all on function public.fn_hoan_tat_staging_import(uuid) from public, anon;
grant execute on function public.fn_hoan_tat_staging_import(uuid) to authenticated;
revoke all on function public.fn_commit_dot_import(uuid) from public, anon;
grant execute on function public.fn_commit_dot_import(uuid) to authenticated;
revoke all on function public.fn_guard_approved_report_snapshot() from public, anon, authenticated;

grant select on public.noi_dung_mau_2, public.dot_import, public.dong_import to authenticated;
grant insert, update on public.noi_dung_mau_2 to authenticated;
