begin;

alter table public.tu_danh_gia
  add column if not exists minh_chung_can_ra_soat boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.tu_danh_gia'::regclass
      and conname = 'uq_tu_danh_gia_id_scope'
  ) then
    alter table public.tu_danh_gia
      add constraint uq_tu_danh_gia_id_scope
      unique (id, co_so_id, nam_hoc_id);
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.minh_chung'::regclass
      and conname = 'uq_minh_chung_id_scope'
  ) then
    alter table public.minh_chung
      add constraint uq_minh_chung_id_scope
      unique (id, co_so_id, nam_hoc_id);
  end if;
end;
$$;

-- minh_chung_tieu_chi vẫn là ma trận dùng lại một mã minh chứng cho nhiều
-- tiêu chí. Bảng này mới là tập minh chứng của đúng một bản tự đánh giá/cấp học.
create table if not exists public.tu_danh_gia_minh_chung (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null,
  nam_hoc_id uuid not null,
  tu_danh_gia_id uuid not null,
  minh_chung_id uuid not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_tu_danh_gia_minh_chung
    unique (tu_danh_gia_id, minh_chung_id),
  constraint fk_tdg_minh_chung_tu_danh_gia_scope
    foreign key (tu_danh_gia_id, co_so_id, nam_hoc_id)
    references public.tu_danh_gia(id, co_so_id, nam_hoc_id)
    on delete cascade,
  constraint fk_tdg_minh_chung_minh_chung_scope
    foreign key (minh_chung_id, co_so_id, nam_hoc_id)
    references public.minh_chung(id, co_so_id, nam_hoc_id)
    on delete restrict,
  constraint fk_tdg_minh_chung_created_by_scope
    foreign key (created_by, co_so_id)
    references public.nguoi_dung(id, co_so_id)
    on delete restrict
);

comment on table public.tu_danh_gia_minh_chung is
  'Tập minh chứng được chọn cho từng bản tự đánh giá, tách biệt theo cấp học.';
comment on column public.tu_danh_gia.minh_chung_can_ra_soat is
  'Dữ liệu chuyển đổi từ ma trận chung của trường nhiều cấp cần người dùng xác nhận lại.';

create index if not exists idx_tdg_minh_chung_scope
  on public.tu_danh_gia_minh_chung(co_so_id, nam_hoc_id, tu_danh_gia_id);
create index if not exists idx_tdg_minh_chung_evidence
  on public.tu_danh_gia_minh_chung(minh_chung_id, tu_danh_gia_id);

drop trigger if exists trg_tdg_minh_chung_updated_at
on public.tu_danh_gia_minh_chung;
create trigger trg_tdg_minh_chung_updated_at
before update on public.tu_danh_gia_minh_chung
for each row execute function public.fn_set_updated_at();

alter table public.tu_danh_gia_minh_chung enable row level security;

drop policy if exists "tdg_minh_chung_select_by_assessment_permission"
on public.tu_danh_gia_minh_chung;
create policy "tdg_minh_chung_select_by_assessment_permission"
on public.tu_danh_gia_minh_chung
for select to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and exists (
    select 1
    from public.tu_danh_gia assessment
    where assessment.id = tu_danh_gia_minh_chung.tu_danh_gia_id
      and assessment.co_so_id = tu_danh_gia_minh_chung.co_so_id
      and assessment.nam_hoc_id = tu_danh_gia_minh_chung.nam_hoc_id
      and public.fn_can_read_tu_danh_gia(
        assessment.co_so_id,
        assessment.nam_hoc_id,
        assessment.tieu_chi_id
      )
  )
);

revoke all on table public.tu_danh_gia_minh_chung
from public, anon, authenticated;
grant select on table public.tu_danh_gia_minh_chung to authenticated;

-- Giữ nguyên ý nghĩa dữ liệu cũ bằng cách sao chép các liên kết tiêu chí vào
-- từng bản tự đánh giá. Với trường nhiều cấp, các bản này được đánh dấu để
-- người dùng xác nhận lại thay vì âm thầm coi tập chung là lựa chọn cuối cùng.
insert into public.tu_danh_gia_minh_chung(
  co_so_id,
  nam_hoc_id,
  tu_danh_gia_id,
  minh_chung_id,
  created_by
)
select
  assessment.co_so_id,
  assessment.nam_hoc_id,
  assessment.id,
  evidence.id,
  assessment.nguoi_nhap
from public.tu_danh_gia assessment
join public.minh_chung_tieu_chi criterion_link
  on criterion_link.tieu_chi_id = assessment.tieu_chi_id
join public.minh_chung evidence
  on evidence.id = criterion_link.minh_chung_id
  and evidence.co_so_id = assessment.co_so_id
  and evidence.nam_hoc_id = assessment.nam_hoc_id
on conflict (tu_danh_gia_id, minh_chung_id) do nothing;

alter table public.tu_danh_gia
  disable trigger trg_tu_danh_gia_has_evidence;

with multi_level_criterion as (
  select co_so_id, nam_hoc_id, tieu_chi_id
  from public.tu_danh_gia
  group by co_so_id, nam_hoc_id, tieu_chi_id
  having count(distinct cap_hoc) > 1
)
update public.tu_danh_gia assessment
set minh_chung_can_ra_soat = true
from multi_level_criterion ambiguous_scope
where assessment.co_so_id = ambiguous_scope.co_so_id
  and assessment.nam_hoc_id = ambiguous_scope.nam_hoc_id
  and assessment.tieu_chi_id = ambiguous_scope.tieu_chi_id
  and exists (
    select 1
    from public.tu_danh_gia_minh_chung scoped_link
    where scoped_link.tu_danh_gia_id = assessment.id
  );

alter table public.tu_danh_gia
  enable trigger trg_tu_danh_gia_has_evidence;

create or replace function public.fn_minh_chung_hop_le_cho_tu_danh_gia(
  p_tu_danh_gia_id uuid,
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
    from public.tu_danh_gia_minh_chung scoped_link
    join public.minh_chung evidence
      on evidence.id = scoped_link.minh_chung_id
      and evidence.co_so_id = scoped_link.co_so_id
      and evidence.nam_hoc_id = scoped_link.nam_hoc_id
    join public.nam_hoc school_year
      on school_year.id = evidence.nam_hoc_id
      and school_year.co_so_id = evidence.co_so_id
    join public.minh_chung_tieu_chi criterion_link
      on criterion_link.minh_chung_id = evidence.id
      and criterion_link.tieu_chi_id = p_tieu_chi_id
    where scoped_link.tu_danh_gia_id = p_tu_danh_gia_id
      and scoped_link.co_so_id = p_co_so_id
      and scoped_link.nam_hoc_id = p_nam_hoc_id
      and evidence.deleted_at is null
      and evidence.trang_thai_xac_minh = 'da_xac_minh'
      and (
        evidence.ngay_het_gia_tri is null
        or evidence.ngay_het_gia_tri >= least(
          current_date,
          school_year.ngay_ket_thuc
        )
      )
      and public.fn_tieu_chi_thuoc_nam_hoc(
        p_nam_hoc_id,
        p_tieu_chi_id
      )
  )
$$;

create or replace function public.fn_minh_chung_hop_le_cho_tieu_chi_cap(
  p_co_so_id uuid,
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
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
    from public.tu_danh_gia assessment
    where assessment.co_so_id = p_co_so_id
      and assessment.nam_hoc_id = p_nam_hoc_id
      and assessment.cap_hoc = p_cap_hoc
      and assessment.tieu_chi_id = p_tieu_chi_id
      and public.fn_minh_chung_hop_le_cho_tu_danh_gia(
        assessment.id,
        assessment.co_so_id,
        assessment.nam_hoc_id,
        assessment.tieu_chi_id
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
  if not public.fn_tieu_chi_thuoc_nam_hoc(
    new.nam_hoc_id,
    new.tieu_chi_id
  ) then
    raise exception 'Tieu chi khong thuoc phien ban bo tieu chuan cua nam hoc.';
  end if;

  if new.dat_muc_2 and not new.dat_muc_1 then
    raise exception 'Khong duoc danh dau dat Muc 2 khi Muc 1 cua cung tieu chi chua dat.';
  end if;

  if new.dat_muc_1
    and nullif(trim(coalesce(new.mo_ta_muc_1, '')), '') is null
  then
    raise exception 'Khong duoc danh dau dat Muc 1 khi mo ta hien trang Muc 1 dang trong.';
  end if;

  if new.dat_muc_2
    and nullif(trim(coalesce(new.mo_ta_muc_2, '')), '') is null
  then
    raise exception 'Khong duoc danh dau dat Muc 2 khi mo ta hien trang Muc 2 dang trong.';
  end if;

  if (new.dat_muc_1 or new.dat_muc_2)
    and not public.fn_minh_chung_hop_le_cho_tu_danh_gia(
      new.id,
      new.co_so_id,
      new.nam_hoc_id,
      new.tieu_chi_id
    )
  then
    raise exception 'Chi minh chung da xac minh, con hieu luc, dung phien ban va dung cap hoc moi duoc dung de danh dau dat.';
  end if;

  new.muc_dat := case
    when new.dat_muc_2 then 2
    when new.dat_muc_1 then 1
    else 0
  end;
  new.ngay_cap_nhat := now();
  new.nguoi_nhap := coalesce(
    new.nguoi_nhap,
    public.fn_current_nguoi_dung_id()
  );

  return new;
end;
$$;

-- Lưu bản tự đánh giá và thay đúng tập minh chứng của bản đó trong cùng một
-- transaction. Không xóa quan hệ dùng lại chung khỏi minh_chung_tieu_chi.
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

  if not public.fn_can_write_tu_danh_gia(
    v_co_so_id,
    p_nam_hoc_id,
    p_tieu_chi_id
  ) then
    raise exception 'Ban chua co quyen cap nhat tieu chi nay.';
  end if;

  if not public.fn_tieu_chi_thuoc_nam_hoc(
    p_nam_hoc_id,
    p_tieu_chi_id
  ) then
    raise exception 'Tieu chi khong thuoc phien ban bo tieu chuan cua nam hoc.';
  end if;

  select coalesce(
    array_agg(distinct evidence_id order by evidence_id),
    array[]::uuid[]
  )
  into v_minh_chung_ids
  from unnest(
    coalesce(p_minh_chung_ids, array[]::uuid[])
  ) evidence_id;

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
    raise exception 'Co minh chung khong thuoc don vi hoac nam hoc hien tai.';
  end if;

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
    nguoi_nhap
  )
  values (
    v_co_so_id,
    p_nam_hoc_id,
    p_tieu_chi_id,
    p_cap_hoc,
    p_mo_ta_muc_1,
    false,
    p_mo_ta_muc_2,
    false,
    0,
    v_nguoi_dung_id
  )
  on conflict (co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc)
  do update set
    mo_ta_muc_1 = excluded.mo_ta_muc_1,
    mo_ta_muc_2 = excluded.mo_ta_muc_2,
    nguoi_nhap = excluded.nguoi_nhap,
    updated_at = now()
  returning id into v_tu_danh_gia_id;

  insert into public.minh_chung_tieu_chi(
    minh_chung_id,
    tieu_chi_id,
    muc,
    la_tieu_chi_goc,
    created_by
  )
  select
    selected.id,
    p_tieu_chi_id,
    null,
    false,
    v_nguoi_dung_id
  from unnest(v_minh_chung_ids) selected(id)
  on conflict (minh_chung_id, tieu_chi_id) do nothing;

  insert into public.tu_danh_gia_minh_chung(
    co_so_id,
    nam_hoc_id,
    tu_danh_gia_id,
    minh_chung_id,
    created_by
  )
  select
    v_co_so_id,
    p_nam_hoc_id,
    v_tu_danh_gia_id,
    selected.id,
    v_nguoi_dung_id
  from unnest(v_minh_chung_ids) selected(id)
  on conflict (tu_danh_gia_id, minh_chung_id) do nothing;

  delete from public.tu_danh_gia_minh_chung scoped_link
  where scoped_link.tu_danh_gia_id = v_tu_danh_gia_id
    and not (
      scoped_link.minh_chung_id = any(v_minh_chung_ids)
    );

  update public.tu_danh_gia
  set mo_ta_muc_1 = p_mo_ta_muc_1,
      dat_muc_1 = p_muc_dat >= 1,
      mo_ta_muc_2 = p_mo_ta_muc_2,
      dat_muc_2 = p_muc_dat >= 2,
      muc_dat = p_muc_dat,
      nguoi_nhap = v_nguoi_dung_id,
      minh_chung_can_ra_soat = false,
      updated_at = now()
  where id = v_tu_danh_gia_id;

  perform public.fn_log_audit(
    'ASSESSMENT_SAVED_ATOMIC',
    'tu_danh_gia',
    v_tu_danh_gia_id,
    null,
    jsonb_build_object(
      'muc_dat', p_muc_dat,
      'cap_hoc', p_cap_hoc,
      'so_minh_chung', cardinality(v_minh_chung_ids)
    )
  );

  return v_tu_danh_gia_id;
end;
$$;

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
  if v_co_so_id is null
    or not public.fn_has_permission('report.read', v_co_so_id)
  then
    raise exception 'Ban khong co quyen kiem tra bao cao cua don vi.';
  end if;

  if not exists (
    select 1
    from public.nam_hoc
    where id = p_nam_hoc_id
      and co_so_id = v_co_so_id
  ) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  select coalesce(array_agg(vtc.ma order by vtc.ma), array[]::text[])
  into v_missing_criteria
  from public.v_tieu_chi_nam_hoc vtc
  left join public.tu_danh_gia assessment
    on assessment.co_so_id = vtc.co_so_id
    and assessment.nam_hoc_id = vtc.nam_hoc_id
    and assessment.tieu_chi_id = vtc.id
    and assessment.cap_hoc = p_cap_hoc
  where vtc.co_so_id = v_co_so_id
    and vtc.nam_hoc_id = p_nam_hoc_id
    and assessment.id is null;

  select coalesce(array_agg(vtc.ma order by vtc.ma), array[]::text[])
  into v_missing_descriptions
  from public.v_tieu_chi_nam_hoc vtc
  join public.tu_danh_gia assessment
    on assessment.co_so_id = vtc.co_so_id
    and assessment.nam_hoc_id = vtc.nam_hoc_id
    and assessment.tieu_chi_id = vtc.id
    and assessment.cap_hoc = p_cap_hoc
  where vtc.co_so_id = v_co_so_id
    and vtc.nam_hoc_id = p_nam_hoc_id
    and (
      nullif(
        pg_catalog.btrim(coalesce(assessment.mo_ta_muc_1, '')),
        ''
      ) is null
      or (
        assessment.muc_dat = 2
        and nullif(
          pg_catalog.btrim(coalesce(assessment.mo_ta_muc_2, '')),
          ''
        ) is null
      )
    );

  select coalesce(array_agg(vtc.ma order by vtc.ma), array[]::text[])
  into v_missing_evidence
  from public.v_tieu_chi_nam_hoc vtc
  where vtc.co_so_id = v_co_so_id
    and vtc.nam_hoc_id = p_nam_hoc_id
    and not public.fn_minh_chung_hop_le_cho_tieu_chi_cap(
      v_co_so_id,
      p_nam_hoc_id,
      p_cap_hoc,
      vtc.id
    );

  select coalesce(
    array_agg(distinct evidence.ma order by evidence.ma),
    array[]::text[]
  )
  into v_unverified_evidence
  from public.tu_danh_gia assessment
  join public.tu_danh_gia_minh_chung scoped_link
    on scoped_link.tu_danh_gia_id = assessment.id
  join public.minh_chung evidence
    on evidence.id = scoped_link.minh_chung_id
  where assessment.co_so_id = v_co_so_id
    and assessment.nam_hoc_id = p_nam_hoc_id
    and assessment.cap_hoc = p_cap_hoc
    and evidence.deleted_at is null
    and evidence.trang_thai_xac_minh <> 'da_xac_minh';

  select not exists (
    select 1
    from public.hoi_dong_tu_danh_gia council
    join public.thanh_vien_hoi_dong member
      on member.hoi_dong_id = council.id
    where council.co_so_id = v_co_so_id
      and council.nam_hoc_id = p_nam_hoc_id
  )
  into v_missing_council;

  if (
    select count(*)
    from public.v_tieu_chi_nam_hoc
    where co_so_id = v_co_so_id
      and nam_hoc_id = p_nam_hoc_id
  ) <> 15 then
    v_other_blockers := array_append(
      v_other_blockers,
      'Nam hoc khong co du 15 tieu chi cua bo tieu chuan da khoa.'
    );
  end if;

  if exists (
    select 1
    from public.tu_danh_gia assessment
    where assessment.co_so_id = v_co_so_id
      and assessment.nam_hoc_id = p_nam_hoc_id
      and assessment.cap_hoc = p_cap_hoc
      and assessment.minh_chung_can_ra_soat
  ) then
    v_other_blockers := array_append(
      v_other_blockers,
      'Co lua chon minh chung cua truong nhieu cap can duoc ra soat lai.'
    );
  end if;

  if p_loai_bao_cao = 'mau_1_tu_danh_gia' then
    if exists (
      select 1
      from public.v_tieu_chi_nam_hoc vtc
      left join public.nhan_xet_tieu_chuan note
        on note.co_so_id = vtc.co_so_id
        and note.nam_hoc_id = vtc.nam_hoc_id
        and note.tieu_chuan_id = vtc.tieu_chuan_id
        and note.cap_hoc = p_cap_hoc
      where vtc.co_so_id = v_co_so_id
        and vtc.nam_hoc_id = p_nam_hoc_id
        and (
          nullif(pg_catalog.btrim(coalesce(note.diem_manh_noi_bat, '')), '') is null
          or nullif(pg_catalog.btrim(coalesce(note.han_che_trong_tam, '')), '') is null
          or nullif(pg_catalog.btrim(coalesce(note.dinh_huong_cai_tien, '')), '') is null
        )
    ) then
      v_other_blockers := array_append(
        v_other_blockers,
        'Chua du nhan xet sau tung tieu chuan.'
      );
    end if;
  elsif p_loai_bao_cao = 'mau_2_ke_hoach_cai_tien' then
    if not exists (
      select 1
      from public.ke_hoach_cai_tien
      where co_so_id = v_co_so_id
        and nam_hoc_id = p_nam_hoc_id
    ) then
      v_other_blockers := array_append(
        v_other_blockers,
        'Chua co dong ke hoach cai tien.'
      );
    end if;

    if not exists (
      select 1
      from public.noi_dung_mau_2 content
      where content.co_so_id = v_co_so_id
        and content.nam_hoc_id = p_nam_hoc_id
        and content.cap_hoc = p_cap_hoc
        and nullif(pg_catalog.btrim(coalesce(content.can_cu_xay_dung, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.muc_dich_yeu_cau, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.tom_tat_van_de_trong_tam, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.theo_doi_danh_gia, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.to_chuc_thuc_hien, '')), '') is not null
        and nullif(pg_catalog.btrim(coalesce(content.co_che_danh_gia_bao_cao, '')), '') is not null
    ) then
      v_other_blockers := array_append(
        v_other_blockers,
        'Chua du noi dung 8 phan cua Mau 2.'
      );
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

revoke all on function public.fn_minh_chung_hop_le_cho_tu_danh_gia(
  uuid, uuid, uuid, uuid
) from public, anon;
grant execute on function public.fn_minh_chung_hop_le_cho_tu_danh_gia(
  uuid, uuid, uuid, uuid
) to authenticated;

revoke all on function public.fn_minh_chung_hop_le_cho_tieu_chi_cap(
  uuid, uuid, public.cap_hoc, uuid
) from public, anon;
grant execute on function public.fn_minh_chung_hop_le_cho_tieu_chi_cap(
  uuid, uuid, public.cap_hoc, uuid
) to authenticated;

revoke all on function public.fn_luu_tu_danh_gia_atomic(
  uuid, public.cap_hoc, uuid, text, text, smallint, uuid[]
) from public, anon;
grant execute on function public.fn_luu_tu_danh_gia_atomic(
  uuid, public.cap_hoc, uuid, text, text, smallint, uuid[]
) to authenticated;

revoke all on function public.fn_kiem_tra_san_sang_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao
) from public, anon;
grant execute on function public.fn_kiem_tra_san_sang_bao_cao(
  uuid, public.cap_hoc, public.loai_bao_cao
) to authenticated;

revoke truncate, references, trigger
on table public.tu_danh_gia_minh_chung
from public, anon, authenticated;

commit;
