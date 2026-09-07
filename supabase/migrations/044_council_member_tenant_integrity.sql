begin;

alter table public.hoi_dong_tu_danh_gia
  add constraint uq_hoi_dong_id_scope
  unique (id, co_so_id, nam_hoc_id);

alter table public.thanh_vien_hoi_dong
  add column if not exists co_so_id uuid,
  add column if not exists nam_hoc_id uuid;

update public.thanh_vien_hoi_dong member
set co_so_id = council.co_so_id,
    nam_hoc_id = council.nam_hoc_id
from public.hoi_dong_tu_danh_gia council
where council.id = member.hoi_dong_id
  and (member.co_so_id is null or member.nam_hoc_id is null);

alter table public.thanh_vien_hoi_dong
  alter column co_so_id set not null,
  alter column nam_hoc_id set not null;

alter table public.thanh_vien_hoi_dong
  add constraint fk_thanh_vien_hoi_dong_scope
  foreign key (hoi_dong_id, co_so_id, nam_hoc_id)
  references public.hoi_dong_tu_danh_gia(id, co_so_id, nam_hoc_id)
  on delete cascade
  not valid;

alter table public.thanh_vien_hoi_dong
  add constraint fk_thanh_vien_nguoi_dung_scope
  foreign key (nguoi_dung_id, co_so_id)
  references public.nguoi_dung(id, co_so_id)
  on delete restrict
  not valid;

create index if not exists idx_thanh_vien_hoi_dong_scope
  on public.thanh_vien_hoi_dong(co_so_id, nam_hoc_id, hoi_dong_id, thu_tu);

-- Không sửa hoặc xóa âm thầm dữ liệu lịch sử sai phạm vi. View này là hàng đợi
-- để quản trị viên xử lý trước khi VALIDATE hai khóa ngoại ở một đợt bảo trì.
create or replace view public.v_thanh_vien_hoi_dong_can_ra_soat
with (security_invoker = true)
as
select
  member.id,
  member.hoi_dong_id,
  member.nguoi_dung_id,
  member.co_so_id,
  member.nam_hoc_id,
  case
    when user_profile.id is null then 'nguoi_dung_khac_don_vi'
    when user_profile.trang_thai <> 'active' then 'nguoi_dung_khong_hoat_dong'
    else 'pham_vi_hoi_dong_khong_hop_le'
  end as ly_do
from public.thanh_vien_hoi_dong member
left join public.nguoi_dung user_profile
  on user_profile.id = member.nguoi_dung_id
  and user_profile.co_so_id = member.co_so_id
left join public.hoi_dong_tu_danh_gia council
  on council.id = member.hoi_dong_id
  and council.co_so_id = member.co_so_id
  and council.nam_hoc_id = member.nam_hoc_id
where user_profile.id is null
  or user_profile.trang_thai <> 'active'
  or council.id is null;

create or replace function public.fn_guard_thanh_vien_hoi_dong_scope()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_council public.hoi_dong_tu_danh_gia%rowtype;
  v_current_co_so_id uuid := public.fn_current_co_so_id();
begin
  select council.*
  into v_council
  from public.hoi_dong_tu_danh_gia council
  where council.id = new.hoi_dong_id;

  if not found then
    raise exception using errcode = '23503', message = 'Hoi dong tu danh gia khong ton tai.';
  end if;

  if v_current_co_so_id is not null
    and v_current_co_so_id is distinct from v_council.co_so_id
  then
    raise exception using errcode = '42501', message = 'Ban khong co quyen thay doi hoi dong cua don vi khac.';
  end if;

  new.co_so_id := coalesce(new.co_so_id, v_council.co_so_id);
  new.nam_hoc_id := coalesce(new.nam_hoc_id, v_council.nam_hoc_id);

  if new.co_so_id is distinct from v_council.co_so_id
    or new.nam_hoc_id is distinct from v_council.nam_hoc_id
  then
    raise exception using errcode = '23514', message = 'Pham vi thanh vien khong khop voi hoi dong.';
  end if;

  if not exists (
    select 1
    from public.nguoi_dung user_profile
    where user_profile.id = new.nguoi_dung_id
      and user_profile.co_so_id = v_council.co_so_id
      and user_profile.trang_thai = 'active'
  ) then
    raise exception using errcode = '23514', message = 'Thanh vien phai dang hoat dong va thuoc cung don vi voi hoi dong.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_thanh_vien_hoi_dong_scope
on public.thanh_vien_hoi_dong;
create trigger trg_guard_thanh_vien_hoi_dong_scope
before insert or update of hoi_dong_id, nguoi_dung_id, co_so_id, nam_hoc_id
on public.thanh_vien_hoi_dong
for each row execute function public.fn_guard_thanh_vien_hoi_dong_scope();

revoke all on function public.fn_guard_thanh_vien_hoi_dong_scope()
from public, anon, authenticated;

drop policy if exists "thanh_vien_hoi_dong_select_by_permission"
on public.thanh_vien_hoi_dong;
create policy "thanh_vien_hoi_dong_select_by_permission"
on public.thanh_vien_hoi_dong
for select to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_can_read_council(co_so_id)
);

drop policy if exists "thanh_vien_hoi_dong_insert_by_permission"
on public.thanh_vien_hoi_dong;
create policy "thanh_vien_hoi_dong_insert_by_permission"
on public.thanh_vien_hoi_dong
for insert to authenticated
with check (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_can_write_council(co_so_id)
);

drop policy if exists "thanh_vien_hoi_dong_update_by_permission"
on public.thanh_vien_hoi_dong;
create policy "thanh_vien_hoi_dong_update_by_permission"
on public.thanh_vien_hoi_dong
for update to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_can_write_council(co_so_id)
)
with check (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_can_write_council(co_so_id)
);

drop policy if exists "thanh_vien_hoi_dong_delete_by_permission"
on public.thanh_vien_hoi_dong;
create policy "thanh_vien_hoi_dong_delete_by_permission"
on public.thanh_vien_hoi_dong
for delete to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_can_write_council(co_so_id)
);

revoke all on table public.v_thanh_vien_hoi_dong_can_ra_soat from public, anon;
grant select on table public.v_thanh_vien_hoi_dong_can_ra_soat to authenticated;

commit;
