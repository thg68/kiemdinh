begin;

alter table public.ke_hoach_cai_tien
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.nguoi_dung(id);

alter table public.van_ban_lien_quan
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.nguoi_dung(id);

alter table public.van_ban_lien_quan
  add constraint ck_van_ban_duong_dan_http
  check (duong_dan is null or duong_dan ~* '^https?://[^[:space:]]+$') not valid,
  add constraint ck_van_ban_thu_tu_hieu_luc
  check (ngay_het_hieu_luc is null or ngay_hieu_luc is null or ngay_het_hieu_luc >= ngay_hieu_luc) not valid;

create index if not exists idx_ke_hoach_active_scope
on public.ke_hoach_cai_tien(co_so_id, nam_hoc_id, created_at desc)
where archived_at is null;

create index if not exists idx_van_ban_active_scope
on public.van_ban_lien_quan(co_so_id, nam_hoc_id, ngay_ban_hanh desc)
where archived_at is null;

create or replace function public.fn_guard_operational_archive()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if old.archived_at is null and new.archived_at is not null then
    new.archived_by := public.fn_current_nguoi_dung_id();
  elsif old.archived_at is not null and new.archived_at is null then
    new.archived_by := null;
  elsif new.archived_at is not null and new.archived_by is distinct from old.archived_by then
    raise exception using errcode = '42501', message = 'Không được thay đổi người lưu trữ bản ghi.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ke_hoach_archive_guard on public.ke_hoach_cai_tien;
create trigger trg_ke_hoach_archive_guard
before update of archived_at, archived_by on public.ke_hoach_cai_tien
for each row execute function public.fn_guard_operational_archive();

drop trigger if exists trg_van_ban_archive_guard on public.van_ban_lien_quan;
create trigger trg_van_ban_archive_guard
before update of archived_at, archived_by on public.van_ban_lien_quan
for each row execute function public.fn_guard_operational_archive();

create or replace function public.fn_audit_operational_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_action text;
  v_id uuid := new.id;
  v_archived_at timestamptz := new.archived_at;
begin
  v_action := case
    when tg_table_name = 'ke_hoach_cai_tien' and tg_op = 'INSERT' then 'IMPROVEMENT_PLAN_CREATED'
    when tg_table_name = 'ke_hoach_cai_tien' and tg_op = 'UPDATE' and old.archived_at is null and new.archived_at is not null then 'IMPROVEMENT_PLAN_ARCHIVED'
    when tg_table_name = 'ke_hoach_cai_tien' and tg_op = 'UPDATE' and old.archived_at is not null and new.archived_at is null then 'IMPROVEMENT_PLAN_RESTORED'
    when tg_table_name = 'ke_hoach_cai_tien' and tg_op = 'UPDATE' then 'IMPROVEMENT_PLAN_UPDATED'
    when tg_table_name = 'van_ban_lien_quan' and tg_op = 'INSERT' then 'RELATED_DOCUMENT_CREATED'
    when tg_table_name = 'van_ban_lien_quan' and tg_op = 'UPDATE' and old.archived_at is null and new.archived_at is not null then 'RELATED_DOCUMENT_ARCHIVED'
    when tg_table_name = 'van_ban_lien_quan' and tg_op = 'UPDATE' and old.archived_at is not null and new.archived_at is null then 'RELATED_DOCUMENT_RESTORED'
    when tg_table_name = 'van_ban_lien_quan' and tg_op = 'UPDATE' then 'RELATED_DOCUMENT_UPDATED'
    else upper(tg_table_name || '_' || tg_op)
  end;

  perform public.fn_log_audit(
    v_action::varchar,
    tg_table_name::varchar,
    v_id,
    null,
    jsonb_build_object('archived', v_archived_at is not null)
  );
  return new;
end;
$$;

drop trigger if exists trg_ke_hoach_mutation_audit on public.ke_hoach_cai_tien;
create trigger trg_ke_hoach_mutation_audit
after insert or update on public.ke_hoach_cai_tien
for each row execute function public.fn_audit_operational_mutation();

drop trigger if exists trg_van_ban_mutation_audit on public.van_ban_lien_quan;
create trigger trg_van_ban_mutation_audit
after insert or update on public.van_ban_lien_quan
for each row execute function public.fn_audit_operational_mutation();

create or replace function public.fn_guard_assignment_target()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.vai_tro_trong_tieu_chi not in ('phu_trach_nhap_lieu', 'ra_soat', 'tong_hop') then
    raise exception using errcode = '22023', message = 'Vai trò trong phân công không hợp lệ.';
  end if;

  if not exists (
    select 1
    from public.nguoi_dung app_user
    where app_user.id = new.nguoi_dung_id
      and app_user.co_so_id = new.co_so_id
      and app_user.trang_thai = 'active'
      and exists (
        select 1
        from public.nguoi_dung_vai_tro user_role
        join public.vai_tro role on role.id = user_role.vai_tro_id
        where user_role.nguoi_dung_id = app_user.id
          and user_role.co_so_id = new.co_so_id
          and role.ma in ('MEMBER', 'TEACHER')
      )
  ) then
    raise exception using errcode = '22023', message = 'Chỉ được phân công tài khoản đang hoạt động có vai trò Ủy viên/Tổ trưởng hoặc Giáo viên.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_phan_cong_target_guard on public.phan_cong_tieu_chi;
create trigger trg_phan_cong_target_guard
before insert or update of co_so_id, nguoi_dung_id, vai_tro_trong_tieu_chi
on public.phan_cong_tieu_chi
for each row execute function public.fn_guard_assignment_target();

-- RPC lặp lại kiểm tra trước DELETE để payload sai không xóa phân công hợp lệ đang có.
create or replace function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_nguoi_dung_id uuid,
  p_tieu_chi_ids uuid[],
  p_vai_tro_trong_tieu_chi text default 'phu_trach_nhap_lieu'
)
returns void
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_tieu_chi_id uuid;
begin
  if v_co_so_id is null or public.fn_current_nguoi_dung_id() is null then
    raise exception using errcode = '42501', message = 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;
  if not public.fn_can_manage_assignment(v_co_so_id) then
    raise exception using errcode = '42501', message = 'Chỉ Hiệu trưởng hoặc Chủ tịch hội đồng mới được phân công tiêu chí.';
  end if;
  if p_vai_tro_trong_tieu_chi not in ('phu_trach_nhap_lieu', 'ra_soat', 'tong_hop') then
    raise exception using errcode = '22023', message = 'Vai trò trong phân công không hợp lệ.';
  end if;
  if not exists (
    select 1 from public.nam_hoc school_year
    join public.co_so_giao_duc school on school.id = school_year.co_so_id
    where school_year.id = p_nam_hoc_id and school_year.co_so_id = v_co_so_id
      and p_cap_hoc = any(school.cap_hoc)
  ) then
    raise exception using errcode = '22023', message = 'Năm học hoặc cấp học không thuộc đơn vị hiện tại.';
  end if;
  if not exists (
    select 1 from public.nguoi_dung app_user
    where app_user.id = p_nguoi_dung_id
      and app_user.co_so_id = v_co_so_id
      and app_user.trang_thai = 'active'
      and exists (
        select 1 from public.nguoi_dung_vai_tro user_role
        join public.vai_tro role on role.id = user_role.vai_tro_id
        where user_role.nguoi_dung_id = app_user.id
          and user_role.co_so_id = v_co_so_id
          and role.ma in ('MEMBER', 'TEACHER')
      )
  ) then
    raise exception using errcode = '22023', message = 'Chỉ được phân công tài khoản đang hoạt động có vai trò Ủy viên/Tổ trưởng hoặc Giáo viên.';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_tieu_chi_ids, array[]::uuid[])) selected(tieu_chi_id)
    where selected.tieu_chi_id is null
      or not public.fn_tieu_chi_thuoc_nam_hoc(p_nam_hoc_id, selected.tieu_chi_id)
  ) then
    raise exception using errcode = '22023', message = 'Tiêu chí phân công không thuộc phiên bản bộ tiêu chuẩn của năm học.';
  end if;

  delete from public.phan_cong_tieu_chi assignment
  where assignment.co_so_id = v_co_so_id
    and assignment.nam_hoc_id = p_nam_hoc_id
    and assignment.cap_hoc = p_cap_hoc
    and assignment.nguoi_dung_id = p_nguoi_dung_id;

  foreach v_tieu_chi_id in array coalesce(p_tieu_chi_ids, array[]::uuid[]) loop
    insert into public.phan_cong_tieu_chi(
      co_so_id, nam_hoc_id, cap_hoc, nguoi_dung_id, tieu_chi_id,
      vai_tro_trong_tieu_chi, vai_tro_phan_cong, created_by, can_ra_soat
    ) values (
      v_co_so_id, p_nam_hoc_id, p_cap_hoc, p_nguoi_dung_id, v_tieu_chi_id,
      p_vai_tro_trong_tieu_chi, p_vai_tro_trong_tieu_chi,
      public.fn_current_nguoi_dung_id(), false
    )
    on conflict (nam_hoc_id, nguoi_dung_id, tieu_chi_id, cap_hoc) where cap_hoc is not null
    do update set vai_tro_trong_tieu_chi = excluded.vai_tro_trong_tieu_chi,
      vai_tro_phan_cong = excluded.vai_tro_phan_cong, can_ra_soat = false, updated_at = now();
  end loop;

  perform public.fn_log_audit(
    'ASSIGNMENT_UPDATED', 'phan_cong_tieu_chi', p_nguoi_dung_id, null,
    jsonb_build_object('nam_hoc_id', p_nam_hoc_id, 'cap_hoc', p_cap_hoc,
      'criterion_count', cardinality(coalesce(p_tieu_chi_ids, array[]::uuid[])),
      'vai_tro_trong_tieu_chi', p_vai_tro_trong_tieu_chi)
  );
end;
$$;

revoke all on function public.fn_guard_operational_archive() from public, anon, authenticated;
revoke all on function public.fn_audit_operational_mutation() from public, anon, authenticated;
revoke all on function public.fn_guard_assignment_target() from public, anon, authenticated;
revoke all on function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(uuid, public.cap_hoc, uuid, uuid[], text)
from public, anon, authenticated;
grant execute on function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(uuid, public.cap_hoc, uuid, uuid[], text)
to authenticated;

commit;
