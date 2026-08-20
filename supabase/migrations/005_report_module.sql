-- Sprint 4: Xuat bao cao, nhan xet tieu chuan va phan quyen xuat file.

alter type loai_bao_cao add value if not exists 'goi_minh_chung';
alter type loai_bao_cao add value if not exists 'du_lieu_nam_hoc_json';

insert into quyen(ma, ten, mo_ta, resource, action)
values
  ('report.read', 'Doc bao cao', 'Xem bao cao va du lieu tong hop trong co so giao duc.', 'report', 'read'),
  ('report.export', 'Xuat bao cao', 'Xuat Mau 1, Mau 2, danh muc minh chung, goi minh chung va JSON.', 'report', 'export'),
  ('report.approve', 'Phe duyet bao cao', 'Phe duyet bao cao tu danh gia cua co so giao duc.', 'report', 'approve')
on conflict (ma) do update
set ten = excluded.ten,
    mo_ta = excluded.mo_ta,
    resource = excluded.resource,
    action = excluded.action;

with role_permission(role_code, permission_code) as (
  values
    ('PRINCIPAL', 'report.read'),
    ('PRINCIPAL', 'report.export'),
    ('PRINCIPAL', 'report.approve'),
    ('SELF_ASSESSMENT_CHAIR', 'report.read'),
    ('SELF_ASSESSMENT_CHAIR', 'report.export'),
    ('SELF_ASSESSMENT_CHAIR', 'report.approve'),
    ('SECRETARY', 'report.read'),
    ('SECRETARY', 'report.export'),
    ('MEMBER', 'report.read'),
    ('VIEWER', 'report.read')
)
insert into vai_tro_quyen(vai_tro_id, quyen_id)
select vt.id, q.id
from role_permission rp
join vai_tro vt on vt.ma = rp.role_code
join quyen q on q.ma = rp.permission_code
on conflict (vai_tro_id, quyen_id) do nothing;

create table if not exists nhan_xet_tieu_chuan (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  tieu_chuan_id uuid not null references tieu_chuan(id) on delete restrict,
  cap_hoc cap_hoc not null,
  diem_manh_noi_bat text,
  han_che_trong_tam text,
  dinh_huong_cai_tien text,
  nguoi_cap_nhat uuid references nguoi_dung(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (co_so_id, nam_hoc_id, tieu_chuan_id, cap_hoc),
  foreign key (nam_hoc_id, co_so_id) references nam_hoc(id, co_so_id)
);

create index if not exists idx_nhan_xet_tieu_chuan_co_so_nam
on nhan_xet_tieu_chuan(co_so_id, nam_hoc_id, cap_hoc);

alter table nhan_xet_tieu_chuan enable row level security;

drop trigger if exists trg_nhan_xet_tieu_chuan_updated_at on nhan_xet_tieu_chuan;
create trigger trg_nhan_xet_tieu_chuan_updated_at
before update on nhan_xet_tieu_chuan
for each row execute function fn_set_updated_at();

create or replace function fn_can_write_report_note(
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
    and fn_has_permission('report.export', p_co_so_id)
    and (
      fn_has_role('PRINCIPAL', p_co_so_id)
      or fn_has_role('SELF_ASSESSMENT_CHAIR', p_co_so_id)
      or fn_has_role('SECRETARY', p_co_so_id)
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
drop policy if exists "nhan_xet_tieu_chuan_insert_by_permission" on nhan_xet_tieu_chuan;
drop policy if exists "nhan_xet_tieu_chuan_update_by_permission" on nhan_xet_tieu_chuan;
drop policy if exists "nhan_xet_tieu_chuan_delete_by_permission" on nhan_xet_tieu_chuan;

create policy "nhan_xet_tieu_chuan_select_same_tenant" on nhan_xet_tieu_chuan
for select to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and (fn_has_permission('report.read', co_so_id) or fn_has_permission('report.export', co_so_id))
);

create policy "nhan_xet_tieu_chuan_insert_by_permission" on nhan_xet_tieu_chuan
for insert to authenticated
with check (fn_can_write_report_note(co_so_id, nam_hoc_id, tieu_chuan_id));

create policy "nhan_xet_tieu_chuan_update_by_permission" on nhan_xet_tieu_chuan
for update to authenticated
using (fn_can_write_report_note(co_so_id, nam_hoc_id, tieu_chuan_id))
with check (fn_can_write_report_note(co_so_id, nam_hoc_id, tieu_chuan_id));

create policy "nhan_xet_tieu_chuan_delete_by_permission" on nhan_xet_tieu_chuan
for delete to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and (
    fn_has_role('PRINCIPAL', co_so_id)
    or fn_has_role('SELF_ASSESSMENT_CHAIR', co_so_id)
  )
);

drop policy if exists "bao_cao_same_tenant" on bao_cao;
drop policy if exists "bao_cao_select_by_permission" on bao_cao;
drop policy if exists "bao_cao_insert_by_permission" on bao_cao;
drop policy if exists "bao_cao_update_by_permission" on bao_cao;
drop policy if exists "bao_cao_delete_by_permission" on bao_cao;

create policy "bao_cao_select_by_permission" on bao_cao
for select to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and fn_has_permission('report.read', co_so_id)
);

create policy "bao_cao_insert_by_permission" on bao_cao
for insert to authenticated
with check (
  co_so_id = fn_current_co_so_id()
  and fn_has_permission('report.export', co_so_id)
);

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

create policy "bao_cao_delete_by_permission" on bao_cao
for delete to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and fn_has_role('PRINCIPAL', co_so_id)
);

grant execute on function fn_can_write_report_note(uuid, uuid, uuid) to authenticated;
