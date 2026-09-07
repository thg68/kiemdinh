-- R-006: một phân công phải xác định rõ năm học, cấp học và tiêu chí.
alter table public.phan_cong_tieu_chi
  add column if not exists cap_hoc public.cap_hoc,
  add column if not exists can_ra_soat boolean not null default false;

-- Chỉ backfill khi đơn vị có đúng một cấp; trường nhiều cấp không đủ căn cứ để tự gán.
update public.phan_cong_tieu_chi assignment
set cap_hoc = school.cap_hoc[1]
from public.co_so_giao_duc school
where school.id = assignment.co_so_id
  and cardinality(school.cap_hoc) = 1
  and assignment.cap_hoc is null;

update public.phan_cong_tieu_chi assignment
set can_ra_soat = true
from public.co_so_giao_duc school
where school.id = assignment.co_so_id
  and cardinality(school.cap_hoc) > 1
  and assignment.cap_hoc is null;

alter table public.phan_cong_tieu_chi
  drop constraint if exists phan_cong_tieu_chi_nam_hoc_id_nguoi_dung_id_tieu_chi_id_key;

create unique index if not exists uq_phan_cong_nam_nguoi_tieu_chi_cap
on public.phan_cong_tieu_chi(nam_hoc_id, nguoi_dung_id, tieu_chi_id, cap_hoc)
where cap_hoc is not null;

create index if not exists idx_phan_cong_scope
on public.phan_cong_tieu_chi(co_so_id, nam_hoc_id, cap_hoc, nguoi_dung_id);

create or replace function public.fn_phan_cong_cap_hoc_hop_le()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.cap_hoc is null then
    raise exception using errcode = '23514', message = 'Phân công mới phải xác định cấp học.';
  end if;
  if not exists (
    select 1 from public.co_so_giao_duc school
    where school.id = new.co_so_id and new.cap_hoc = any(school.cap_hoc)
  ) then
    raise exception using errcode = '23514', message = 'Cấp học phân công không thuộc đơn vị.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_phan_cong_cap_hoc_hop_le on public.phan_cong_tieu_chi;
create trigger trg_phan_cong_cap_hoc_hop_le
before insert or update of co_so_id, cap_hoc on public.phan_cong_tieu_chi
for each row execute function public.fn_phan_cong_cap_hoc_hop_le();

create or replace view public.v_phan_cong_can_ra_soat
with (security_invoker = true)
as
select assignment.*
from public.phan_cong_tieu_chi assignment
where assignment.can_ra_soat or assignment.cap_hoc is null;

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
    where app_user.id = p_nguoi_dung_id and app_user.co_so_id = v_co_so_id
  ) then
    raise exception using errcode = '22023', message = 'Người dùng không thuộc đơn vị hiện tại.';
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
      'nguoi_dung_id', p_nguoi_dung_id, 'tieu_chi_ids', p_tieu_chi_ids,
      'vai_tro_trong_tieu_chi', p_vai_tro_trong_tieu_chi)
  );
end;
$$;

revoke all on function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(uuid, uuid, uuid[], text)
from public, anon, authenticated;
revoke all on function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(uuid, public.cap_hoc, uuid, uuid[], text)
from public, anon, authenticated;
grant execute on function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(uuid, public.cap_hoc, uuid, uuid[], text)
to authenticated;
grant select on public.v_phan_cong_can_ra_soat to authenticated;
