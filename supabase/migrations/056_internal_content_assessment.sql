-- Tích hợp Phiếu nội hàm vào aggregate tu_danh_gia hiện có.
-- Dữ liệu khởi tạo lấy từ muc_tieu_chi TT57 đã khóa phiên bản, không dùng seed demo TT18.

create table if not exists public.noi_ham (
  id uuid primary key default gen_random_uuid(),
  muc_tieu_chi_id uuid not null references public.muc_tieu_chi(id) on delete restrict,
  ma varchar(50) not null,
  trich_dan_goc text not null,
  noi_dung text not null,
  thu_tu smallint not null default 1 check (thu_tu > 0),
  nguon varchar(50) not null default 'tt57_level_requirement',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (muc_tieu_chi_id, ma),
  unique (id, muc_tieu_chi_id),
  check (nullif(pg_catalog.btrim(trich_dan_goc), '') is not null),
  check (nullif(pg_catalog.btrim(noi_dung), '') is not null)
);

create table if not exists public.menh_de_trang_thai (
  id uuid primary key default gen_random_uuid(),
  noi_ham_id uuid not null references public.noi_ham(id) on delete restrict,
  ma varchar(70) not null,
  noi_dung text not null,
  loai varchar(30) not null check (
    loai in ('dap_ung', 'dap_ung_mot_phan', 'chua_dap_ung', 'khac')
  ),
  la_dat boolean not null default false,
  la_khong_dat boolean not null default false,
  yeu_cau_minh_chung boolean not null default false,
  thu_tu smallint not null default 1 check (thu_tu > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (noi_ham_id, ma),
  unique (id, noi_ham_id),
  check (nullif(pg_catalog.btrim(noi_dung), '') is not null),
  check (not (la_dat and la_khong_dat)),
  check (la_dat = (loai = 'dap_ung')),
  check (la_khong_dat = (loai = 'chua_dap_ung')),
  check (not la_khong_dat or not yeu_cau_minh_chung)
);

create table if not exists public.lua_chon_noi_ham (
  id uuid primary key default gen_random_uuid(),
  tu_danh_gia_id uuid not null references public.tu_danh_gia(id) on delete cascade,
  noi_ham_id uuid not null references public.noi_ham(id) on delete restrict,
  menh_de_id uuid not null,
  mo_ta_thuc_te text not null default '',
  revision integer not null default 1 check (revision > 0),
  created_by uuid references public.nguoi_dung(id) on delete set null,
  updated_by uuid references public.nguoi_dung(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tu_danh_gia_id, noi_ham_id),
  unique (id, tu_danh_gia_id),
  foreign key (menh_de_id, noi_ham_id)
    references public.menh_de_trang_thai(id, noi_ham_id)
    on delete restrict
);

create table if not exists public.lua_chon_noi_ham_minh_chung (
  lua_chon_id uuid not null references public.lua_chon_noi_ham(id) on delete cascade,
  minh_chung_id uuid not null references public.minh_chung(id) on delete restrict,
  created_by uuid references public.nguoi_dung(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (lua_chon_id, minh_chung_id)
);

create index if not exists ix_noi_ham_muc_thu_tu
  on public.noi_ham(muc_tieu_chi_id, thu_tu);
create index if not exists ix_menh_de_noi_ham_thu_tu
  on public.menh_de_trang_thai(noi_ham_id, thu_tu);
create index if not exists ix_lua_chon_noi_ham_assessment
  on public.lua_chon_noi_ham(tu_danh_gia_id, noi_ham_id);
create index if not exists ix_lua_chon_noi_ham_evidence
  on public.lua_chon_noi_ham_minh_chung(minh_chung_id, lua_chon_id);

drop trigger if exists trg_noi_ham_updated_at on public.noi_ham;
create trigger trg_noi_ham_updated_at
before update on public.noi_ham
for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_menh_de_trang_thai_updated_at on public.menh_de_trang_thai;
create trigger trg_menh_de_trang_thai_updated_at
before update on public.menh_de_trang_thai
for each row execute function public.fn_set_updated_at();

drop trigger if exists trg_lua_chon_noi_ham_updated_at on public.lua_chon_noi_ham;
create trigger trg_lua_chon_noi_ham_updated_at
before update on public.lua_chon_noi_ham
for each row execute function public.fn_set_updated_at();

create or replace function public.fn_guard_lua_chon_noi_ham()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_assessment public.tu_danh_gia%rowtype;
  v_tieu_chi_id uuid;
  v_tu_danh_gia_id uuid := case when tg_op = 'DELETE' then old.tu_danh_gia_id else new.tu_danh_gia_id end;
  v_noi_ham_id uuid := case when tg_op = 'DELETE' then old.noi_ham_id else new.noi_ham_id end;
begin
  select assessment.*
  into v_assessment
  from public.tu_danh_gia assessment
  where assessment.id = v_tu_danh_gia_id;

  if v_assessment.id is null then
    raise exception using errcode = '23503', message = 'Ban tu danh gia khong ton tai.';
  end if;

  if v_assessment.trang_thai not in ('nhap', 'dang_ra_soat', 'ke_thua_cho_cap_nhat') then
    raise exception using errcode = '42501', message = 'Khong duoc sua phieu noi ham khi tieu chi dang cho duyet hoac da duyet.';
  end if;

  select level.tieu_chi_id
  into v_tieu_chi_id
  from public.noi_ham content
  join public.muc_tieu_chi level on level.id = content.muc_tieu_chi_id
  where content.id = v_noi_ham_id;

  if v_tieu_chi_id is distinct from v_assessment.tieu_chi_id then
    raise exception using errcode = '23514', message = 'Noi ham khong thuoc tieu chi dang tu danh gia.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_guard_lua_chon_noi_ham on public.lua_chon_noi_ham;
create trigger trg_guard_lua_chon_noi_ham
before insert or update or delete on public.lua_chon_noi_ham
for each row execute function public.fn_guard_lua_chon_noi_ham();

create or replace function public.fn_guard_lua_chon_noi_ham_minh_chung()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_assessment public.tu_danh_gia%rowtype;
  v_evidence public.minh_chung%rowtype;
  v_lua_chon_id uuid := case when tg_op = 'DELETE' then old.lua_chon_id else new.lua_chon_id end;
  v_minh_chung_id uuid := case when tg_op = 'DELETE' then old.minh_chung_id else new.minh_chung_id end;
begin
  select assessment.*
  into v_assessment
  from public.lua_chon_noi_ham selection
  join public.tu_danh_gia assessment on assessment.id = selection.tu_danh_gia_id
  where selection.id = v_lua_chon_id;

  if v_assessment.id is null then
    raise exception using errcode = '23503', message = 'Lua chon noi ham khong ton tai.';
  end if;

  if v_assessment.trang_thai not in ('nhap', 'dang_ra_soat', 'ke_thua_cho_cap_nhat') then
    raise exception using errcode = '42501', message = 'Khong duoc sua minh chung cua phieu noi ham khi tieu chi da khoa.';
  end if;

  select evidence.*
  into v_evidence
  from public.minh_chung evidence
  where evidence.id = v_minh_chung_id
    and evidence.deleted_at is null;

  if v_evidence.id is null
    or v_evidence.co_so_id is distinct from v_assessment.co_so_id
    or v_evidence.nam_hoc_id is distinct from v_assessment.nam_hoc_id
  then
    raise exception using errcode = '23514', message = 'Minh chung khong cung don vi va nam hoc voi ban tu danh gia.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_guard_lua_chon_noi_ham_minh_chung
on public.lua_chon_noi_ham_minh_chung;
create trigger trg_guard_lua_chon_noi_ham_minh_chung
before insert or update or delete on public.lua_chon_noi_ham_minh_chung
for each row execute function public.fn_guard_lua_chon_noi_ham_minh_chung();

alter table public.noi_ham enable row level security;
alter table public.menh_de_trang_thai enable row level security;
alter table public.lua_chon_noi_ham enable row level security;
alter table public.lua_chon_noi_ham_minh_chung enable row level security;

drop policy if exists "noi_ham_read_authenticated" on public.noi_ham;
create policy "noi_ham_read_authenticated" on public.noi_ham
for select to authenticated using (true);

drop policy if exists "menh_de_trang_thai_read_authenticated" on public.menh_de_trang_thai;
create policy "menh_de_trang_thai_read_authenticated" on public.menh_de_trang_thai
for select to authenticated using (true);

drop policy if exists "lua_chon_noi_ham_read_scope" on public.lua_chon_noi_ham;
create policy "lua_chon_noi_ham_read_scope" on public.lua_chon_noi_ham
for select to authenticated
using (
  exists (
    select 1
    from public.tu_danh_gia assessment
    where assessment.id = lua_chon_noi_ham.tu_danh_gia_id
      and public.fn_can_read_tu_danh_gia(
        assessment.co_so_id,
        assessment.nam_hoc_id,
        assessment.tieu_chi_id
      )
  )
);

drop policy if exists "lua_chon_noi_ham_evidence_read_scope"
on public.lua_chon_noi_ham_minh_chung;
create policy "lua_chon_noi_ham_evidence_read_scope"
on public.lua_chon_noi_ham_minh_chung
for select to authenticated
using (
  exists (
    select 1
    from public.lua_chon_noi_ham selection
    join public.tu_danh_gia assessment on assessment.id = selection.tu_danh_gia_id
    where selection.id = lua_chon_noi_ham_minh_chung.lua_chon_id
      and public.fn_can_read_tu_danh_gia(
        assessment.co_so_id,
        assessment.nam_hoc_id,
        assessment.tieu_chi_id
      )
  )
);

revoke all on table public.noi_ham from public, anon, authenticated;
revoke all on table public.menh_de_trang_thai from public, anon, authenticated;
revoke all on table public.lua_chon_noi_ham from public, anon, authenticated;
revoke all on table public.lua_chon_noi_ham_minh_chung from public, anon, authenticated;
grant select on table public.noi_ham to authenticated;
grant select on table public.menh_de_trang_thai to authenticated;
grant select on table public.lua_chon_noi_ham to authenticated;
grant select on table public.lua_chon_noi_ham_minh_chung to authenticated;

create or replace view public.v_noi_ham_tieu_chi
with (security_invoker = true)
as
select
  content.id,
  level.tieu_chi_id,
  level.muc,
  content.ma,
  content.trich_dan_goc,
  content.noi_dung,
  content.thu_tu,
  content.nguon
from public.noi_ham content
join public.muc_tieu_chi level on level.id = content.muc_tieu_chi_id;

revoke all on table public.v_noi_ham_tieu_chi from public, anon, authenticated;
grant select on table public.v_noi_ham_tieu_chi to authenticated;

-- Bản nền production dùng nguyên yêu cầu từng Mức của TT57 làm một nội hàm.
-- Thư viện chuyên gia có thể bổ sung nhiều nội hàm/mệnh đề mà không đổi transaction/UI.
insert into public.noi_ham(
  muc_tieu_chi_id,
  ma,
  trich_dan_goc,
  noi_dung,
  thu_tu,
  nguon
)
select
  level.id,
  criterion.ma || '-M' || level.muc::text || '-NH01',
  level.noi_dung_yeu_cau,
  level.noi_dung_yeu_cau,
  1,
  'tt57_level_requirement'
from public.muc_tieu_chi level
join public.tieu_chi criterion on criterion.id = level.tieu_chi_id
where nullif(pg_catalog.btrim(level.noi_dung_yeu_cau), '') is not null
on conflict (muc_tieu_chi_id, ma) do update
set trich_dan_goc = excluded.trich_dan_goc,
    noi_dung = excluded.noi_dung,
    nguon = excluded.nguon,
    updated_at = now();

insert into public.menh_de_trang_thai(
  noi_ham_id,
  ma,
  noi_dung,
  loai,
  la_dat,
  la_khong_dat,
  yeu_cau_minh_chung,
  thu_tu
)
select
  content.id,
  content.ma || proposition.suffix,
  proposition.noi_dung,
  proposition.loai,
  proposition.la_dat,
  proposition.la_khong_dat,
  proposition.yeu_cau_minh_chung,
  proposition.thu_tu
from public.noi_ham content
cross join (
  values
    ('.A', 'Đáp ứng đầy đủ nội dung quy định', 'dap_ung', true, false, true, 1::smallint),
    ('.P', 'Đáp ứng một phần nội dung quy định', 'dap_ung_mot_phan', false, false, false, 2::smallint),
    ('.N', 'Chưa đáp ứng nội dung quy định', 'chua_dap_ung', false, true, false, 3::smallint),
    ('.O', 'Nội dung khác của nhà trường', 'khac', false, false, false, 4::smallint)
) as proposition(
  suffix,
  noi_dung,
  loai,
  la_dat,
  la_khong_dat,
  yeu_cau_minh_chung,
  thu_tu
)
on conflict (noi_ham_id, ma) do update
set noi_dung = excluded.noi_dung,
    loai = excluded.loai,
    la_dat = excluded.la_dat,
    la_khong_dat = excluded.la_khong_dat,
    yeu_cau_minh_chung = excluded.yeu_cau_minh_chung,
    thu_tu = excluded.thu_tu,
    updated_at = now();

create or replace function public.fn_luu_phieu_noi_ham_atomic(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_tieu_chi_id uuid,
  p_lua_chon jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_payload jsonb := coalesce(p_lua_chon, '[]'::jsonb);
  v_minh_chung_ids uuid[] := array[]::uuid[];
  v_tu_danh_gia_id uuid;
  v_mo_ta_muc_1 text := '';
  v_mo_ta_muc_2 text := '';
  v_muc_1_hoan_thanh boolean := false;
  v_muc_2_hoan_thanh boolean := false;
  v_muc_dat smallint := 0;
  v_entry jsonb;
  v_lua_chon_id uuid;
  v_noi_ham_id uuid;
  v_menh_de_id uuid;
  v_entry_minh_chung_ids uuid[];
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception using errcode = '28000', message = 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if pg_catalog.jsonb_typeof(v_payload) <> 'array' then
    raise exception using errcode = '22023', message = 'Danh sach lua chon noi ham khong hop le.';
  end if;

  if not public.fn_can_write_tu_danh_gia(v_co_so_id, p_nam_hoc_id, p_tieu_chi_id) then
    raise exception using errcode = '42501', message = 'Ban chua co quyen cap nhat tieu chi nay.';
  end if;

  if not public.fn_tieu_chi_thuoc_nam_hoc(p_nam_hoc_id, p_tieu_chi_id) then
    raise exception using errcode = '23514', message = 'Tieu chi khong thuoc phien ban bo tieu chuan cua nam hoc.';
  end if;

  if (
    select count(*)
    from pg_catalog.jsonb_array_elements(v_payload)
  ) <> (
    select count(distinct entry ->> 'noi_ham_id')
    from pg_catalog.jsonb_array_elements(v_payload) entry
  ) then
    raise exception using errcode = '23505', message = 'Moi noi ham chi duoc co mot lua chon.';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(v_payload) entry
    left join public.noi_ham content
      on content.id = (entry ->> 'noi_ham_id')::uuid
    left join public.muc_tieu_chi level
      on level.id = content.muc_tieu_chi_id
    left join public.menh_de_trang_thai proposition
      on proposition.id = (entry ->> 'menh_de_id')::uuid
      and proposition.noi_ham_id = content.id
    where content.id is null
      or level.tieu_chi_id is distinct from p_tieu_chi_id
      or proposition.id is null
  ) then
    raise exception using errcode = '23514', message = 'Lua chon noi ham khong thuoc tieu chi hien tai.';
  end if;

  select coalesce(
    pg_catalog.array_agg(distinct evidence_id::uuid order by evidence_id::uuid),
    array[]::uuid[]
  )
  into v_minh_chung_ids
  from pg_catalog.jsonb_array_elements(v_payload) entry
  cross join lateral pg_catalog.jsonb_array_elements_text(
    coalesce(entry -> 'minh_chung_ids', '[]'::jsonb)
  ) evidence(evidence_id);

  if exists (
    select 1
    from unnest(v_minh_chung_ids) selected(id)
    left join public.minh_chung evidence
      on evidence.id = selected.id
      and evidence.co_so_id = v_co_so_id
      and evidence.nam_hoc_id = p_nam_hoc_id
      and evidence.deleted_at is null
    where evidence.id is null
  ) then
    raise exception using errcode = '23514', message = 'Co minh chung khong thuoc don vi hoac nam hoc hien tai.';
  end if;

  select coalesce(pg_catalog.string_agg(
    coalesce(
      nullif(pg_catalog.btrim(entry ->> 'mo_ta_thuc_te'), ''),
      proposition.noi_dung
    ),
    E'\n\n' order by content.thu_tu
  ), '')
  into v_mo_ta_muc_1
  from pg_catalog.jsonb_array_elements(v_payload) entry
  join public.noi_ham content on content.id = (entry ->> 'noi_ham_id')::uuid
  join public.muc_tieu_chi level on level.id = content.muc_tieu_chi_id and level.muc = 1
  join public.menh_de_trang_thai proposition
    on proposition.id = (entry ->> 'menh_de_id')::uuid
    and proposition.noi_ham_id = content.id;

  select coalesce(pg_catalog.string_agg(
    coalesce(
      nullif(pg_catalog.btrim(entry ->> 'mo_ta_thuc_te'), ''),
      proposition.noi_dung
    ),
    E'\n\n' order by content.thu_tu
  ), '')
  into v_mo_ta_muc_2
  from pg_catalog.jsonb_array_elements(v_payload) entry
  join public.noi_ham content on content.id = (entry ->> 'noi_ham_id')::uuid
  join public.muc_tieu_chi level on level.id = content.muc_tieu_chi_id and level.muc = 2
  join public.menh_de_trang_thai proposition
    on proposition.id = (entry ->> 'menh_de_id')::uuid
    and proposition.noi_ham_id = content.id;

  select count(*) > 0 and pg_catalog.bool_and(
    entry.value is not null
    and proposition.la_dat
    and nullif(pg_catalog.btrim(entry.value ->> 'mo_ta_thuc_te'), '') is not null
    and (
      not proposition.yeu_cau_minh_chung
      or exists (
        select 1
        from pg_catalog.jsonb_array_elements_text(
          coalesce(entry.value -> 'minh_chung_ids', '[]'::jsonb)
        ) selected(id)
        join public.v_minh_chung_hop_le_danh_gia evidence
          on evidence.id = selected.id::uuid
          and evidence.co_so_id = v_co_so_id
          and evidence.nam_hoc_id = p_nam_hoc_id
      )
    )
  )
  into v_muc_1_hoan_thanh
  from public.noi_ham content
  join public.muc_tieu_chi level
    on level.id = content.muc_tieu_chi_id
    and level.tieu_chi_id = p_tieu_chi_id
    and level.muc = 1
  left join lateral (
    select candidate.value
    from pg_catalog.jsonb_array_elements(v_payload) candidate(value)
    where candidate.value ->> 'noi_ham_id' = content.id::text
    limit 1
  ) entry on true
  left join public.menh_de_trang_thai proposition
    on proposition.id = (entry.value ->> 'menh_de_id')::uuid
    and proposition.noi_ham_id = content.id;

  select count(*) > 0 and pg_catalog.bool_and(
    entry.value is not null
    and proposition.la_dat
    and nullif(pg_catalog.btrim(entry.value ->> 'mo_ta_thuc_te'), '') is not null
    and (
      not proposition.yeu_cau_minh_chung
      or exists (
        select 1
        from pg_catalog.jsonb_array_elements_text(
          coalesce(entry.value -> 'minh_chung_ids', '[]'::jsonb)
        ) selected(id)
        join public.v_minh_chung_hop_le_danh_gia evidence
          on evidence.id = selected.id::uuid
          and evidence.co_so_id = v_co_so_id
          and evidence.nam_hoc_id = p_nam_hoc_id
      )
    )
  )
  into v_muc_2_hoan_thanh
  from public.noi_ham content
  join public.muc_tieu_chi level
    on level.id = content.muc_tieu_chi_id
    and level.tieu_chi_id = p_tieu_chi_id
    and level.muc = 2
  left join lateral (
    select candidate.value
    from pg_catalog.jsonb_array_elements(v_payload) candidate(value)
    where candidate.value ->> 'noi_ham_id' = content.id::text
    limit 1
  ) entry on true
  left join public.menh_de_trang_thai proposition
    on proposition.id = (entry.value ->> 'menh_de_id')::uuid
    and proposition.noi_ham_id = content.id;

  v_muc_dat := case
    when v_muc_1_hoan_thanh and v_muc_2_hoan_thanh then 2
    when v_muc_1_hoan_thanh then 1
    else 0
  end;

  v_tu_danh_gia_id := public.fn_luu_tu_danh_gia_atomic(
    p_nam_hoc_id,
    p_cap_hoc,
    p_tieu_chi_id,
    v_mo_ta_muc_1,
    v_mo_ta_muc_2,
    v_muc_dat,
    v_minh_chung_ids
  );

  delete from public.lua_chon_noi_ham existing
  where existing.tu_danh_gia_id = v_tu_danh_gia_id
    and not exists (
      select 1
      from pg_catalog.jsonb_array_elements(v_payload) entry
      where entry ->> 'noi_ham_id' = existing.noi_ham_id::text
    );

  for v_entry in
    select entry.value
    from pg_catalog.jsonb_array_elements(v_payload) entry(value)
  loop
    v_noi_ham_id := (v_entry ->> 'noi_ham_id')::uuid;
    v_menh_de_id := (v_entry ->> 'menh_de_id')::uuid;

    insert into public.lua_chon_noi_ham(
      tu_danh_gia_id,
      noi_ham_id,
      menh_de_id,
      mo_ta_thuc_te,
      created_by,
      updated_by
    )
    values (
      v_tu_danh_gia_id,
      v_noi_ham_id,
      v_menh_de_id,
      coalesce(v_entry ->> 'mo_ta_thuc_te', ''),
      v_nguoi_dung_id,
      v_nguoi_dung_id
    )
    on conflict (tu_danh_gia_id, noi_ham_id) do update
    set menh_de_id = excluded.menh_de_id,
        mo_ta_thuc_te = excluded.mo_ta_thuc_te,
        revision = public.lua_chon_noi_ham.revision + 1,
        updated_by = excluded.updated_by,
        updated_at = now()
    returning id into v_lua_chon_id;

    select coalesce(
      pg_catalog.array_agg(distinct evidence_id::uuid order by evidence_id::uuid),
      array[]::uuid[]
    )
    into v_entry_minh_chung_ids
    from pg_catalog.jsonb_array_elements_text(
      coalesce(v_entry -> 'minh_chung_ids', '[]'::jsonb)
    ) evidence(evidence_id);

    insert into public.lua_chon_noi_ham_minh_chung(
      lua_chon_id,
      minh_chung_id,
      created_by
    )
    select v_lua_chon_id, selected.id, v_nguoi_dung_id
    from unnest(v_entry_minh_chung_ids) selected(id)
    on conflict (lua_chon_id, minh_chung_id) do nothing;

    delete from public.lua_chon_noi_ham_minh_chung link
    where link.lua_chon_id = v_lua_chon_id
      and not (link.minh_chung_id = any(v_entry_minh_chung_ids));
  end loop;

  return pg_catalog.jsonb_build_object(
    'tu_danh_gia_id', v_tu_danh_gia_id,
    'muc_dat', v_muc_dat,
    'muc_1_hoan_thanh', v_muc_1_hoan_thanh,
    'muc_2_hoan_thanh', v_muc_2_hoan_thanh
  );
end;
$$;

revoke all on function public.fn_guard_lua_chon_noi_ham() from public, anon, authenticated;
revoke all on function public.fn_guard_lua_chon_noi_ham_minh_chung() from public, anon, authenticated;
revoke all on function public.fn_luu_phieu_noi_ham_atomic(
  uuid, public.cap_hoc, uuid, jsonb
) from public, anon, authenticated;
grant execute on function public.fn_luu_phieu_noi_ham_atomic(
  uuid, public.cap_hoc, uuid, jsonb
) to authenticated;

comment on table public.noi_ham is
  'Nội hàm có phiên bản gián tiếp qua muc_tieu_chi của bộ tiêu chuẩn đã khóa.';
comment on table public.menh_de_trang_thai is
  'Mệnh đề trạng thái có thể kiểm chứng để người dùng chọn trong Phiếu nội hàm.';
comment on table public.lua_chon_noi_ham is
  'Lựa chọn nội hàm thuộc aggregate tu_danh_gia; không phải một luồng đánh giá song song.';
comment on function public.fn_luu_phieu_noi_ham_atomic(uuid, public.cap_hoc, uuid, jsonb) is
  'Lưu lựa chọn nội hàm, liên kết minh chứng và snapshot tu_danh_gia trong cùng transaction.';

