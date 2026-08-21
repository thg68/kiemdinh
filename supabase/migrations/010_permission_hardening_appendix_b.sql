-- Sprint 6 hardening: dong bo RLS/RBAC theo Phu luc B.
-- Nguyen tac: phan quyen o tang CSDL, khong chi an nut tren giao dien.

insert into quyen(ma, ten, mo_ta, resource, action)
values
  ('assignment.write', 'Quan ly phan cong', 'Tao, sua, xoa phan cong tieu chi trong co so giao duc.', 'assignment', 'write')
on conflict (ma) do update
set ten = excluded.ten,
    mo_ta = excluded.mo_ta,
    resource = excluded.resource,
    action = excluded.action;

with role_permission(role_code, permission_code) as (
  values
    ('PRINCIPAL', 'assignment.write'),
    ('SELF_ASSESSMENT_CHAIR', 'assignment.write')
)
insert into vai_tro_quyen(vai_tro_id, quyen_id)
select vt.id, q.id
from role_permission rp
join vai_tro vt on vt.ma = rp.role_code
join quyen q on q.ma = rp.permission_code
on conflict (vai_tro_id, quyen_id) do nothing;

delete from vai_tro_quyen vtq
using vai_tro vt, quyen q
where vtq.vai_tro_id = vt.id
  and vtq.quyen_id = q.id
  and (
    (vt.ma = 'TEACHER' and q.ma in ('assessment.read'))
    or (vt.ma = 'VIEWER' and q.ma in ('standard.read', 'criterion.read', 'evidence.read'))
    or (vt.ma = 'MEMBER' and q.ma in ('report.read'))
  );

create or replace function fn_is_management_role(p_co_so_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    fn_has_role('PRINCIPAL', p_co_so_id)
    or fn_has_role('SELF_ASSESSMENT_CHAIR', p_co_so_id)
    or fn_has_role('SECRETARY', p_co_so_id)
$$;

create or replace function fn_can_manage_assignment(p_co_so_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_co_so_id = fn_current_co_so_id()
    and fn_has_permission('assignment.write', p_co_so_id)
    and (
      fn_has_role('PRINCIPAL', p_co_so_id)
      or fn_has_role('SELF_ASSESSMENT_CHAIR', p_co_so_id)
    )
$$;

create or replace function fn_can_read_assignment(
  p_co_so_id uuid,
  p_nguoi_dung_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_co_so_id = fn_current_co_so_id()
    and (
      fn_is_management_role(p_co_so_id)
      or p_nguoi_dung_id = fn_current_nguoi_dung_id()
    )
$$;

drop policy if exists "phan_cong_same_tenant" on phan_cong_tieu_chi;
drop policy if exists "phan_cong_select_appendix_b" on phan_cong_tieu_chi;
drop policy if exists "phan_cong_insert_appendix_b" on phan_cong_tieu_chi;
drop policy if exists "phan_cong_update_appendix_b" on phan_cong_tieu_chi;
drop policy if exists "phan_cong_delete_appendix_b" on phan_cong_tieu_chi;

create policy "phan_cong_select_appendix_b" on phan_cong_tieu_chi
for select to authenticated
using (fn_can_read_assignment(co_so_id, nguoi_dung_id));

create policy "phan_cong_insert_appendix_b" on phan_cong_tieu_chi
for insert to authenticated
with check (fn_can_manage_assignment(co_so_id));

create policy "phan_cong_update_appendix_b" on phan_cong_tieu_chi
for update to authenticated
using (fn_can_manage_assignment(co_so_id))
with check (fn_can_manage_assignment(co_so_id));

create policy "phan_cong_delete_appendix_b" on phan_cong_tieu_chi
for delete to authenticated
using (fn_can_manage_assignment(co_so_id));

create or replace function fn_can_read_tu_danh_gia(
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
    and (
      (
        fn_has_permission('assessment.read', p_co_so_id)
        and fn_is_management_role(p_co_so_id)
      )
      or (
        fn_has_role('MEMBER', p_co_so_id)
        and fn_has_permission('assessment.read', p_co_so_id)
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
  -- Chot/duyet muc la quyen cua Hieu truong hoac Chu tich hoi dong, khong phai quyen bien tap.
  if (new.trang_thai = 'da_duyet'::trang_thai_tu_danh_gia)
    and not (
      fn_has_permission('assessment.approve', new.co_so_id)
      and (
        fn_has_role('PRINCIPAL', new.co_so_id)
        or fn_has_role('SELF_ASSESSMENT_CHAIR', new.co_so_id)
      )
    )
  then
    raise exception 'Chi hieu truong hoac chu tich hoi dong moi duoc chot muc tu danh gia.';
  end if;

  if tg_op = 'UPDATE'
    and old.trang_thai = 'da_duyet'::trang_thai_tu_danh_gia
    and new is distinct from old
    and not (
      fn_has_permission('assessment.approve', new.co_so_id)
      and (
        fn_has_role('PRINCIPAL', new.co_so_id)
        or fn_has_role('SELF_ASSESSMENT_CHAIR', new.co_so_id)
      )
    )
  then
    raise exception 'Chi hieu truong hoac chu tich hoi dong moi duoc sua ket qua da chot.';
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

drop policy if exists "tu_danh_gia_select_by_permission" on tu_danh_gia;
create policy "tu_danh_gia_select_by_permission" on tu_danh_gia
for select to authenticated
using (fn_can_read_tu_danh_gia(co_so_id, nam_hoc_id, tieu_chi_id));

drop policy if exists "lich_su_tdg_select_same_tenant" on lich_su_tu_danh_gia;
create policy "lich_su_tdg_select_same_tenant" on lich_su_tu_danh_gia
for select to authenticated
using (
  exists (
    select 1
    from tu_danh_gia tdg
    where tdg.id = lich_su_tu_danh_gia.tu_danh_gia_id
      and fn_can_read_tu_danh_gia(tdg.co_so_id, tdg.nam_hoc_id, tdg.tieu_chi_id)
  )
);

create or replace function fn_can_read_minh_chung(p_minh_chung_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from minh_chung mc
    where mc.id = p_minh_chung_id
      and mc.deleted_at is null
      and mc.co_so_id = fn_current_co_so_id()
      and (
        fn_user_has_tenant_evidence_role(mc.co_so_id, 'evidence.read')
        or (
          fn_has_role('MEMBER', mc.co_so_id)
          and fn_has_permission('evidence.read', mc.co_so_id)
          and exists (
            select 1
            from minh_chung_tieu_chi mctc
            where mctc.minh_chung_id = mc.id
              and fn_is_assigned_to_criterion(mctc.tieu_chi_id, mc.nam_hoc_id)
          )
        )
        or (
          fn_has_role('TEACHER', mc.co_so_id)
          and fn_has_permission('evidence.read', mc.co_so_id)
          and (
            mc.nguoi_tai_len = fn_current_nguoi_dung_id()
            or exists (
              select 1
              from minh_chung_tieu_chi mctc
              where mctc.minh_chung_id = mc.id
                and fn_is_assigned_to_criterion(mctc.tieu_chi_id, mc.nam_hoc_id)
            )
          )
        )
      )
  )
$$;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    drop policy if exists "evidence_storage_select" on storage.objects;

    create policy "evidence_storage_select" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'evidence'
      and exists (
        select 1
        from minh_chung mc
        where mc.storage_path = storage.objects.name
          and fn_can_read_minh_chung(mc.id)
      )
    );
  end if;
end;
$$;

create or replace function fn_is_approved_report_status(p_trang_thai text)
returns boolean
language sql
immutable
as $$
  select p_trang_thai in ('da_phe_duyet', 'da_duyet', 'phe_duyet')
$$;

create or replace function fn_can_read_bao_cao(
  p_co_so_id uuid,
  p_trang_thai text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_co_so_id = fn_current_co_so_id()
    and (
      (
        fn_has_permission('report.read', p_co_so_id)
        and fn_is_management_role(p_co_so_id)
      )
      or (
        fn_has_role('VIEWER', p_co_so_id)
        and fn_has_permission('report.read', p_co_so_id)
        and fn_is_approved_report_status(p_trang_thai)
      )
    )
$$;

create or replace function fn_can_read_report_note(
  p_co_so_id uuid,
  p_nam_hoc_id uuid,
  p_tieu_chuan_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_co_so_id = fn_current_co_so_id()
    and (
      fn_is_management_role(p_co_so_id)
      or exists (
        select 1
        from phan_cong_tieu_chi pctc
        join tieu_chi tc on tc.id = pctc.tieu_chi_id
        where pctc.co_so_id = p_co_so_id
          and pctc.nam_hoc_id = p_nam_hoc_id
          and pctc.nguoi_dung_id = fn_current_nguoi_dung_id()
          and tc.tieu_chuan_id = p_tieu_chuan_id
      )
    )
$$;

drop policy if exists "nhan_xet_tieu_chuan_select_same_tenant" on nhan_xet_tieu_chuan;
create policy "nhan_xet_tieu_chuan_select_same_tenant" on nhan_xet_tieu_chuan
for select to authenticated
using (fn_can_read_report_note(co_so_id, nam_hoc_id, tieu_chuan_id));

create or replace function fn_check_bao_cao_approval_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Phe duyet bao cao chi thuoc Hieu truong/Giam doc hoac Chu tich hoi dong.
  if fn_is_approved_report_status(new.trang_thai)
    and not (
      fn_has_permission('report.approve', new.co_so_id)
      and (
        fn_has_role('PRINCIPAL', new.co_so_id)
        or fn_has_role('SELF_ASSESSMENT_CHAIR', new.co_so_id)
      )
    )
  then
    raise exception 'Chi hieu truong hoac chu tich hoi dong moi duoc phe duyet bao cao.';
  end if;

  if tg_op = 'UPDATE'
    and fn_is_approved_report_status(old.trang_thai)
    and new is distinct from old
    and not (
      fn_has_permission('report.approve', new.co_so_id)
      and (
        fn_has_role('PRINCIPAL', new.co_so_id)
        or fn_has_role('SELF_ASSESSMENT_CHAIR', new.co_so_id)
      )
    )
  then
    raise exception 'Chi hieu truong hoac chu tich hoi dong moi duoc sua bao cao da phe duyet.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_bao_cao_approval_permission on bao_cao;
create trigger trg_check_bao_cao_approval_permission
before insert or update on bao_cao
for each row execute function fn_check_bao_cao_approval_permission();

drop policy if exists "bao_cao_select_by_permission" on bao_cao;
create policy "bao_cao_select_by_permission" on bao_cao
for select to authenticated
using (fn_can_read_bao_cao(co_so_id, trang_thai));

drop policy if exists "bao_cao_update_by_permission" on bao_cao;
create policy "bao_cao_update_by_permission" on bao_cao
for update to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and (
    fn_has_permission('report.export', co_so_id)
    or fn_has_permission('report.approve', co_so_id)
  )
)
with check (
  co_so_id = fn_current_co_so_id()
  and (
    fn_has_permission('report.export', co_so_id)
    or fn_has_permission('report.approve', co_so_id)
  )
);

grant execute on function fn_is_management_role(uuid) to authenticated;
grant execute on function fn_can_manage_assignment(uuid) to authenticated;
grant execute on function fn_can_read_assignment(uuid, uuid) to authenticated;
grant execute on function fn_can_read_tu_danh_gia(uuid, uuid, uuid) to authenticated;
grant execute on function fn_can_read_bao_cao(uuid, text) to authenticated;
grant execute on function fn_can_read_report_note(uuid, uuid, uuid) to authenticated;
