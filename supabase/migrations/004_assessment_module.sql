-- Sprint 3: Tu danh gia va cac rang buoc tinh muc.
-- CSDL chan cac trang thai "dat" khong co mo ta hien trang hoac minh chung.

insert into quyen(ma, ten, mo_ta, resource, action)
values
  ('assessment.read', 'Doc tu danh gia', 'Xem ket qua tu danh gia trong co so giao duc.', 'assessment', 'read'),
  ('assessment.write', 'Cap nhat tu danh gia', 'Nhap mo ta hien trang va muc dat cho tieu chi duoc phep.', 'assessment', 'write'),
  ('assessment.approve', 'Duyet tu danh gia', 'Duyet ket qua tu danh gia cua nha truong.', 'assessment', 'approve')
on conflict (ma) do update
set ten = excluded.ten,
    mo_ta = excluded.mo_ta,
    resource = excluded.resource,
    action = excluded.action;

with role_permission(role_code, permission_code) as (
  values
    ('PRINCIPAL', 'assessment.read'),
    ('PRINCIPAL', 'assessment.write'),
    ('PRINCIPAL', 'assessment.approve'),
    ('SELF_ASSESSMENT_CHAIR', 'assessment.read'),
    ('SELF_ASSESSMENT_CHAIR', 'assessment.write'),
    ('SELF_ASSESSMENT_CHAIR', 'assessment.approve'),
    ('SECRETARY', 'assessment.read'),
    ('SECRETARY', 'assessment.write'),
    ('MEMBER', 'assessment.read'),
    ('MEMBER', 'assessment.write'),
    ('TEACHER', 'assessment.read'),
    ('VIEWER', 'assessment.read')
)
insert into vai_tro_quyen(vai_tro_id, quyen_id)
select vt.id, q.id
from role_permission rp
join vai_tro vt on vt.ma = rp.role_code
join quyen q on q.ma = rp.permission_code
on conflict (vai_tro_id, quyen_id) do nothing;

create or replace function fn_can_write_tu_danh_gia(
  p_co_so_id uuid,
  p_nam_hoc_id uuid,
  p_tieu_chi_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_co_so_id = fn_current_co_so_id()
    and fn_has_permission('assessment.write', p_co_so_id)
    and (
      fn_has_role('PRINCIPAL', p_co_so_id)
      or fn_has_role('SELF_ASSESSMENT_CHAIR', p_co_so_id)
      or fn_has_role('SECRETARY', p_co_so_id)
      or (
        fn_has_role('MEMBER', p_co_so_id)
        and fn_is_assigned_to_criterion(p_tieu_chi_id, p_nam_hoc_id)
      )
    )
$$;

create or replace function fn_check_tu_danh_gia_has_evidence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_evidence boolean;
begin
  if new.dat_muc_2 and not new.dat_muc_1 then
    raise exception 'Khong duoc danh dau dat Muc 2 khi Muc 1 cua cung tieu chi chua dat.';
  end if;

  if new.dat_muc_1 and nullif(trim(coalesce(new.mo_ta_muc_1, '')), '') is null then
    raise exception 'Khong duoc danh dau dat Muc 1 khi mo ta hien trang Muc 1 dang trong.';
  end if;

  if new.dat_muc_2 and nullif(trim(coalesce(new.mo_ta_muc_2, '')), '') is null then
    raise exception 'Khong duoc danh dau dat Muc 2 khi mo ta hien trang Muc 2 dang trong.';
  end if;

  select exists (
    select 1
    from minh_chung mc
    join minh_chung_tieu_chi mctc on mctc.minh_chung_id = mc.id
    where mc.co_so_id = new.co_so_id
      and mc.nam_hoc_id = new.nam_hoc_id
      and mctc.tieu_chi_id = new.tieu_chi_id
      and mc.deleted_at is null
      and nullif(trim(mc.ma), '') is not null
  )
  into v_has_evidence;

  -- Minh chung la dieu kien can de ghi nhan muc dat, khong dung de sinh noi dung bao cao.
  if (new.dat_muc_1 or new.dat_muc_2) and not v_has_evidence then
    raise exception 'Khong duoc danh dau dat khi tieu chi chua co ma minh chung gan kem.';
  end if;

  new.muc_dat := case
    when new.dat_muc_2 then 2
    when new.dat_muc_1 then 1
    else 0
  end;
  new.ngay_cap_nhat := now();
  new.nguoi_nhap := coalesce(new.nguoi_nhap, fn_current_nguoi_dung_id());

  return new;
end;
$$;

create or replace function fn_log_tu_danh_gia_level_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.muc_dat = 0 and not new.dat_muc_1 and not new.dat_muc_2 then
      return new;
    end if;

    insert into lich_su_tu_danh_gia(
      tu_danh_gia_id,
      nguoi_dung_id,
      muc_cu,
      muc_moi,
      dat_muc_1_cu,
      dat_muc_1_moi,
      dat_muc_2_cu,
      dat_muc_2_moi,
      ly_do
    )
    values (
      new.id,
      fn_current_nguoi_dung_id(),
      null,
      new.muc_dat,
      null,
      new.dat_muc_1,
      null,
      new.dat_muc_2,
      'Tao moi ket qua tu danh gia'
    );

    return new;
  end if;

  if old.muc_dat is distinct from new.muc_dat
    or old.dat_muc_1 is distinct from new.dat_muc_1
    or old.dat_muc_2 is distinct from new.dat_muc_2
  then
    insert into lich_su_tu_danh_gia(
      tu_danh_gia_id,
      nguoi_dung_id,
      muc_cu,
      muc_moi,
      dat_muc_1_cu,
      dat_muc_1_moi,
      dat_muc_2_cu,
      dat_muc_2_moi,
      ly_do
    )
    values (
      new.id,
      fn_current_nguoi_dung_id(),
      old.muc_dat,
      new.muc_dat,
      old.dat_muc_1,
      new.dat_muc_1,
      old.dat_muc_2,
      new.dat_muc_2,
      'Thay doi muc tu danh gia'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_tu_danh_gia_has_evidence on tu_danh_gia;
create trigger trg_tu_danh_gia_has_evidence
before insert or update on tu_danh_gia
for each row execute function fn_check_tu_danh_gia_has_evidence();

drop trigger if exists trg_log_tu_danh_gia_level_change on tu_danh_gia;
create trigger trg_log_tu_danh_gia_level_change
after insert or update on tu_danh_gia
for each row execute function fn_log_tu_danh_gia_level_change();

drop policy if exists "tu_danh_gia_same_tenant" on tu_danh_gia;
drop policy if exists "tu_danh_gia_select_by_permission" on tu_danh_gia;
drop policy if exists "tu_danh_gia_insert_by_permission" on tu_danh_gia;
drop policy if exists "tu_danh_gia_update_by_permission" on tu_danh_gia;
drop policy if exists "tu_danh_gia_delete_by_permission" on tu_danh_gia;

create policy "tu_danh_gia_select_by_permission" on tu_danh_gia
for select to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and fn_has_permission('assessment.read', co_so_id)
);

create policy "tu_danh_gia_insert_by_permission" on tu_danh_gia
for insert to authenticated
with check (fn_can_write_tu_danh_gia(co_so_id, nam_hoc_id, tieu_chi_id));

create policy "tu_danh_gia_update_by_permission" on tu_danh_gia
for update to authenticated
using (fn_can_write_tu_danh_gia(co_so_id, nam_hoc_id, tieu_chi_id))
with check (fn_can_write_tu_danh_gia(co_so_id, nam_hoc_id, tieu_chi_id));

create policy "tu_danh_gia_delete_by_permission" on tu_danh_gia
for delete to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and (
    fn_has_role('PRINCIPAL', co_so_id)
    or fn_has_role('SELF_ASSESSMENT_CHAIR', co_so_id)
  )
);

drop policy if exists "lich_su_tdg_same_tenant" on lich_su_tu_danh_gia;
drop policy if exists "lich_su_tdg_select_same_tenant" on lich_su_tu_danh_gia;

create policy "lich_su_tdg_select_same_tenant" on lich_su_tu_danh_gia
for select to authenticated
using (
  exists (
    select 1
    from tu_danh_gia tdg
    where tdg.id = lich_su_tu_danh_gia.tu_danh_gia_id
      and tdg.co_so_id = fn_current_co_so_id()
      and fn_has_permission('assessment.read', tdg.co_so_id)
  )
);

grant execute on function fn_can_write_tu_danh_gia(uuid, uuid, uuid) to authenticated;
