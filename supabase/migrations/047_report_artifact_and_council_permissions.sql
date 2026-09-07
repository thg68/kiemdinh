begin;

insert into public.quyen(ma, ten, mo_ta, resource, action)
values
  ('council.read', 'Xem hội đồng tự đánh giá', 'Xem thông tin hội đồng trong đơn vị.', 'council', 'read'),
  ('council.manage', 'Quản lý hội đồng tự đánh giá', 'Tạo, sửa hội đồng và thành viên.', 'council', 'manage')
on conflict (ma) do update
set ten = excluded.ten,
    mo_ta = excluded.mo_ta,
    resource = excluded.resource,
    action = excluded.action;

with role_permission(role_code, permission_code) as (
  values
    ('PRINCIPAL', 'council.read'),
    ('PRINCIPAL', 'council.manage'),
    ('SELF_ASSESSMENT_CHAIR', 'council.read'),
    ('SELF_ASSESSMENT_CHAIR', 'council.manage'),
    ('SECRETARY', 'council.read'),
    ('MEMBER', 'council.read')
)
insert into public.vai_tro_quyen(vai_tro_id, quyen_id)
select role.id, permission.id
from role_permission mapping
join public.vai_tro role on role.ma = mapping.role_code
join public.quyen permission on permission.ma = mapping.permission_code
on conflict (vai_tro_id, quyen_id) do nothing;

drop policy if exists "hoi_dong_same_tenant" on public.hoi_dong_tu_danh_gia;
drop policy if exists "hoi_dong_select_by_permission" on public.hoi_dong_tu_danh_gia;
drop policy if exists "hoi_dong_insert_by_permission" on public.hoi_dong_tu_danh_gia;
drop policy if exists "hoi_dong_update_by_permission" on public.hoi_dong_tu_danh_gia;
drop policy if exists "hoi_dong_delete_by_permission" on public.hoi_dong_tu_danh_gia;

create policy "hoi_dong_select_by_permission"
on public.hoi_dong_tu_danh_gia for select to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.read', co_so_id)
);

create policy "hoi_dong_insert_by_permission"
on public.hoi_dong_tu_danh_gia for insert to authenticated
with check (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.manage', co_so_id)
);

create policy "hoi_dong_update_by_permission"
on public.hoi_dong_tu_danh_gia for update to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.manage', co_so_id)
)
with check (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.manage', co_so_id)
);

create policy "hoi_dong_delete_by_permission"
on public.hoi_dong_tu_danh_gia for delete to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.manage', co_so_id)
);

drop policy if exists "thanh_vien_hoi_dong_same_tenant" on public.thanh_vien_hoi_dong;
drop policy if exists "thanh_vien_select_by_permission" on public.thanh_vien_hoi_dong;
drop policy if exists "thanh_vien_insert_by_permission" on public.thanh_vien_hoi_dong;
drop policy if exists "thanh_vien_update_by_permission" on public.thanh_vien_hoi_dong;
drop policy if exists "thanh_vien_delete_by_permission" on public.thanh_vien_hoi_dong;

create policy "thanh_vien_select_by_permission"
on public.thanh_vien_hoi_dong for select to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.read', co_so_id)
);

create policy "thanh_vien_insert_by_permission"
on public.thanh_vien_hoi_dong for insert to authenticated
with check (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.manage', co_so_id)
);

create policy "thanh_vien_update_by_permission"
on public.thanh_vien_hoi_dong for update to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.manage', co_so_id)
)
with check (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.manage', co_so_id)
);

create policy "thanh_vien_delete_by_permission"
on public.thanh_vien_hoi_dong for delete to authenticated
using (
  co_so_id = public.fn_current_co_so_id()
  and public.fn_has_permission('council.manage', co_so_id)
);

-- Chi hai mau nghiep vu co vong doi nhap/cho duyet/phe duyet. Ba artifact con lai
-- la ban sao bo tro tao theo yeu cau va khong duoc cong bo nhu bao cao chinh thuc.
create or replace function public.fn_guard_report_artifact_workflow()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.loai_bao_cao not in (
    'mau_1_tu_danh_gia'::public.loai_bao_cao,
    'mau_2_ke_hoach_cai_tien'::public.loai_bao_cao
  ) then
    raise exception using
      errcode = '23514',
      message = 'Artifact xuat bo tro khong tham gia quy trinh phe duyet bao cao.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_report_artifact_workflow on public.bao_cao;
create trigger trg_guard_report_artifact_workflow
before insert or update of loai_bao_cao, trang_thai
on public.bao_cao
for each row execute function public.fn_guard_report_artifact_workflow();

create or replace view public.v_bao_cao_bo_tro_can_ra_soat
with (security_invoker = true)
as
select report.*
from public.bao_cao report
where report.loai_bao_cao not in (
  'mau_1_tu_danh_gia'::public.loai_bao_cao,
  'mau_2_ke_hoach_cai_tien'::public.loai_bao_cao
);

revoke all on table public.v_bao_cao_bo_tro_can_ra_soat
from public, anon, authenticated;
grant select on table public.v_bao_cao_bo_tro_can_ra_soat to authenticated;

revoke all on function public.fn_guard_report_artifact_workflow()
from public, anon, authenticated;

commit;
