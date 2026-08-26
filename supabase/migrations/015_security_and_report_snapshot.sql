-- Sprint hardening: thu hep RLS theo Phu luc B va bat buoc luu file snapshot khi phe duyet bao cao.

create or replace function fn_can_manage_tenant_setup(p_co_so_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select fn_has_role('SYSTEM_ADMIN')
    or (
      p_co_so_id = fn_current_co_so_id()
      and fn_has_role('PRINCIPAL', p_co_so_id)
    )
$$;

create or replace function fn_can_read_ke_hoach_cai_tien(
  p_co_so_id uuid,
  p_nam_hoc_id uuid,
  p_tieu_chi_id uuid,
  p_phu_trach_id uuid
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
      or fn_has_role('SYSTEM_ADMIN')
      or p_phu_trach_id = fn_current_nguoi_dung_id()
      or fn_is_assigned_to_criterion(p_tieu_chi_id, p_nam_hoc_id)
    )
$$;

create or replace function fn_can_write_ke_hoach_cai_tien(p_co_so_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_co_so_id = fn_current_co_so_id()
    and (
      fn_is_management_role(p_co_so_id)
      or fn_has_role('SYSTEM_ADMIN')
    )
$$;

create or replace function fn_can_read_council(p_co_so_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_co_so_id = fn_current_co_so_id()
    and (
      fn_is_management_role(p_co_so_id)
      or fn_has_permission('report.read', p_co_so_id)
      or fn_has_role('SYSTEM_ADMIN')
    )
$$;

create or replace function fn_can_write_council(p_co_so_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_co_so_id = fn_current_co_so_id()
    and (
      fn_is_management_role(p_co_so_id)
      or fn_has_role('SYSTEM_ADMIN')
    )
$$;

drop policy if exists "co_so_write_admin" on co_so_giao_duc;
drop policy if exists "co_so_insert_system_admin" on co_so_giao_duc;
drop policy if exists "co_so_update_principal_or_system" on co_so_giao_duc;
drop policy if exists "co_so_delete_system_admin" on co_so_giao_duc;

create policy "co_so_insert_system_admin" on co_so_giao_duc
for insert to authenticated
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "co_so_update_principal_or_system" on co_so_giao_duc
for update to authenticated
using (fn_can_manage_tenant_setup(id))
with check (fn_can_manage_tenant_setup(id));

create policy "co_so_delete_system_admin" on co_so_giao_duc
for delete to authenticated
using (fn_has_role('SYSTEM_ADMIN'));

drop policy if exists "nam_hoc_same_tenant" on nam_hoc;
drop policy if exists "nam_hoc_select_same_tenant" on nam_hoc;
drop policy if exists "nam_hoc_insert_principal_or_system" on nam_hoc;
drop policy if exists "nam_hoc_update_principal_or_system" on nam_hoc;
drop policy if exists "nam_hoc_delete_principal_or_system" on nam_hoc;

create policy "nam_hoc_select_same_tenant" on nam_hoc
for select to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "nam_hoc_insert_principal_or_system" on nam_hoc
for insert to authenticated
with check (fn_can_manage_tenant_setup(co_so_id));

create policy "nam_hoc_update_principal_or_system" on nam_hoc
for update to authenticated
using (fn_can_manage_tenant_setup(co_so_id))
with check (fn_can_manage_tenant_setup(co_so_id));

create policy "nam_hoc_delete_principal_or_system" on nam_hoc
for delete to authenticated
using (fn_can_manage_tenant_setup(co_so_id));

drop policy if exists "nguoi_dung_write_admin" on nguoi_dung;
drop policy if exists "nguoi_dung_insert_by_manager" on nguoi_dung;
drop policy if exists "nguoi_dung_update_by_manager" on nguoi_dung;
drop policy if exists "nguoi_dung_delete_system_admin" on nguoi_dung;

create policy "nguoi_dung_insert_by_manager" on nguoi_dung
for insert to authenticated
with check (fn_can_manage_users(co_so_id) or fn_has_role('SYSTEM_ADMIN'));

create policy "nguoi_dung_update_by_manager" on nguoi_dung
for update to authenticated
using (fn_can_manage_users(co_so_id) or fn_has_role('SYSTEM_ADMIN'))
with check (fn_can_manage_users(co_so_id) or fn_has_role('SYSTEM_ADMIN'));

create policy "nguoi_dung_delete_system_admin" on nguoi_dung
for delete to authenticated
using (fn_has_role('SYSTEM_ADMIN'));

drop policy if exists "nguoi_dung_vai_tro_write_admin" on nguoi_dung_vai_tro;
drop policy if exists "nguoi_dung_vai_tro_insert_system_admin" on nguoi_dung_vai_tro;
drop policy if exists "nguoi_dung_vai_tro_update_system_admin" on nguoi_dung_vai_tro;
drop policy if exists "nguoi_dung_vai_tro_delete_system_admin" on nguoi_dung_vai_tro;

create policy "nguoi_dung_vai_tro_insert_system_admin" on nguoi_dung_vai_tro
for insert to authenticated
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "nguoi_dung_vai_tro_update_system_admin" on nguoi_dung_vai_tro
for update to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "nguoi_dung_vai_tro_delete_system_admin" on nguoi_dung_vai_tro
for delete to authenticated
using (fn_has_role('SYSTEM_ADMIN'));

drop policy if exists "ke_hoach_same_tenant" on ke_hoach_cai_tien;
drop policy if exists "ke_hoach_select_by_permission" on ke_hoach_cai_tien;
drop policy if exists "ke_hoach_insert_by_permission" on ke_hoach_cai_tien;
drop policy if exists "ke_hoach_update_by_permission" on ke_hoach_cai_tien;
drop policy if exists "ke_hoach_delete_by_permission" on ke_hoach_cai_tien;

create policy "ke_hoach_select_by_permission" on ke_hoach_cai_tien
for select to authenticated
using (fn_can_read_ke_hoach_cai_tien(co_so_id, nam_hoc_id, tieu_chi_id, phu_trach_id));

create policy "ke_hoach_insert_by_permission" on ke_hoach_cai_tien
for insert to authenticated
with check (fn_can_write_ke_hoach_cai_tien(co_so_id));

create policy "ke_hoach_update_by_permission" on ke_hoach_cai_tien
for update to authenticated
using (fn_can_write_ke_hoach_cai_tien(co_so_id))
with check (fn_can_write_ke_hoach_cai_tien(co_so_id));

create policy "ke_hoach_delete_by_permission" on ke_hoach_cai_tien
for delete to authenticated
using (fn_can_write_ke_hoach_cai_tien(co_so_id));

drop policy if exists "so_lieu_same_tenant" on so_lieu_dinh_luong;
drop policy if exists "so_lieu_select_by_permission" on so_lieu_dinh_luong;
drop policy if exists "so_lieu_write_management" on so_lieu_dinh_luong;

create policy "so_lieu_select_by_permission" on so_lieu_dinh_luong
for select to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and (
    fn_is_management_role(co_so_id)
    or fn_has_permission('assessment.read', co_so_id)
    or fn_has_role('SYSTEM_ADMIN')
  )
);

create policy "so_lieu_write_management" on so_lieu_dinh_luong
for all to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and (
    fn_is_management_role(co_so_id)
    or fn_has_role('SYSTEM_ADMIN')
  )
)
with check (
  co_so_id = fn_current_co_so_id()
  and (
    fn_is_management_role(co_so_id)
    or fn_has_role('SYSTEM_ADMIN')
  )
);

drop policy if exists "hoi_dong_same_tenant" on hoi_dong_tu_danh_gia;
drop policy if exists "hoi_dong_select_by_permission" on hoi_dong_tu_danh_gia;
drop policy if exists "hoi_dong_insert_by_permission" on hoi_dong_tu_danh_gia;
drop policy if exists "hoi_dong_update_by_permission" on hoi_dong_tu_danh_gia;
drop policy if exists "hoi_dong_delete_by_permission" on hoi_dong_tu_danh_gia;

create policy "hoi_dong_select_by_permission" on hoi_dong_tu_danh_gia
for select to authenticated
using (fn_can_read_council(co_so_id));

create policy "hoi_dong_insert_by_permission" on hoi_dong_tu_danh_gia
for insert to authenticated
with check (fn_can_write_council(co_so_id));

create policy "hoi_dong_update_by_permission" on hoi_dong_tu_danh_gia
for update to authenticated
using (fn_can_write_council(co_so_id))
with check (fn_can_write_council(co_so_id));

create policy "hoi_dong_delete_by_permission" on hoi_dong_tu_danh_gia
for delete to authenticated
using (fn_can_write_council(co_so_id));

drop policy if exists "thanh_vien_hoi_dong_same_tenant" on thanh_vien_hoi_dong;
drop policy if exists "thanh_vien_hoi_dong_select_by_permission" on thanh_vien_hoi_dong;
drop policy if exists "thanh_vien_hoi_dong_insert_by_permission" on thanh_vien_hoi_dong;
drop policy if exists "thanh_vien_hoi_dong_update_by_permission" on thanh_vien_hoi_dong;
drop policy if exists "thanh_vien_hoi_dong_delete_by_permission" on thanh_vien_hoi_dong;

create policy "thanh_vien_hoi_dong_select_by_permission" on thanh_vien_hoi_dong
for select to authenticated
using (
  exists (
    select 1
    from hoi_dong_tu_danh_gia hd
    where hd.id = thanh_vien_hoi_dong.hoi_dong_id
      and fn_can_read_council(hd.co_so_id)
  )
);

create policy "thanh_vien_hoi_dong_insert_by_permission" on thanh_vien_hoi_dong
for insert to authenticated
with check (
  exists (
    select 1
    from hoi_dong_tu_danh_gia hd
    where hd.id = thanh_vien_hoi_dong.hoi_dong_id
      and fn_can_write_council(hd.co_so_id)
  )
);

create policy "thanh_vien_hoi_dong_update_by_permission" on thanh_vien_hoi_dong
for update to authenticated
using (
  exists (
    select 1
    from hoi_dong_tu_danh_gia hd
    where hd.id = thanh_vien_hoi_dong.hoi_dong_id
      and fn_can_write_council(hd.co_so_id)
  )
)
with check (
  exists (
    select 1
    from hoi_dong_tu_danh_gia hd
    where hd.id = thanh_vien_hoi_dong.hoi_dong_id
      and fn_can_write_council(hd.co_so_id)
  )
);

create policy "thanh_vien_hoi_dong_delete_by_permission" on thanh_vien_hoi_dong
for delete to authenticated
using (
  exists (
    select 1
    from hoi_dong_tu_danh_gia hd
    where hd.id = thanh_vien_hoi_dong.hoi_dong_id
      and fn_can_write_council(hd.co_so_id)
  )
);

create or replace function fn_guard_minh_chung_verification_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Trang thai xac minh chi duoc doi boi vai tro co quyen evidence.verify.
  if tg_op = 'UPDATE'
    and (
      new.trang_thai_xac_minh is distinct from old.trang_thai_xac_minh
      or new.nguoi_xac_minh is distinct from old.nguoi_xac_minh
      or new.ngay_xac_minh is distinct from old.ngay_xac_minh
    )
    and not (
      fn_has_permission('evidence.verify', old.co_so_id)
      and fn_is_management_role(old.co_so_id)
    )
  then
    raise exception 'Ban khong co quyen xac minh hoac thay doi trang thai minh chung.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_minh_chung_verification_update on minh_chung;
create trigger trg_guard_minh_chung_verification_update
before update on minh_chung
for each row execute function fn_guard_minh_chung_verification_update();

create or replace function fn_xac_minh_minh_chung(
  p_minh_chung_id uuid,
  p_trang_thai trang_thai_xac_minh_minh_chung
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_nguoi_dung_id uuid := fn_current_nguoi_dung_id();
  v_old_status trang_thai_xac_minh_minh_chung;
  v_minh_chung minh_chung%rowtype;
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if p_trang_thai not in ('cho_xac_minh', 'da_xac_minh', 'tu_choi') then
    raise exception 'Trang thai xac minh minh chung khong hop le.';
  end if;

  select * into v_minh_chung
  from minh_chung
  where id = p_minh_chung_id
    and co_so_id = v_co_so_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Khong tim thay minh chung trong don vi hien tai.';
  end if;

  if not (
    fn_has_permission('evidence.verify', v_co_so_id)
    and fn_is_management_role(v_co_so_id)
  ) then
    raise exception 'Ban khong co quyen xac minh minh chung.';
  end if;

  v_old_status := v_minh_chung.trang_thai_xac_minh;

  update minh_chung
  set
    trang_thai_xac_minh = p_trang_thai,
    nguoi_xac_minh = case when p_trang_thai = 'cho_xac_minh' then null else v_nguoi_dung_id end,
    ngay_xac_minh = case when p_trang_thai = 'cho_xac_minh' then null else now() end,
    updated_at = now()
  where id = p_minh_chung_id;

  perform fn_log_audit(
    'EVIDENCE_STATUS_UPDATED',
    'minh_chung',
    p_minh_chung_id,
    jsonb_build_object('trang_thai_xac_minh', v_old_status),
    jsonb_build_object('trang_thai_xac_minh', p_trang_thai)
  );
end;
$$;

drop policy if exists "bao_cao_same_tenant" on bao_cao;
drop policy if exists "bao_cao_insert_by_permission" on bao_cao;
drop policy if exists "bao_cao_update_by_permission" on bao_cao;
drop policy if exists "bao_cao_delete_by_permission" on bao_cao;
drop policy if exists "bao_cao_insert_system_admin" on bao_cao;
drop policy if exists "bao_cao_update_system_admin" on bao_cao;
drop policy if exists "bao_cao_delete_system_admin" on bao_cao;

create policy "bao_cao_insert_system_admin" on bao_cao
for insert to authenticated
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "bao_cao_update_system_admin" on bao_cao
for update to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "bao_cao_delete_system_admin" on bao_cao
for delete to authenticated
using (fn_has_role('SYSTEM_ADMIN'));

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets(id, name, public)
    values ('reports', 'reports', false)
    on conflict (id) do update
      set public = false;

    drop policy if exists "reports_storage_select" on storage.objects;
    drop policy if exists "reports_storage_insert" on storage.objects;
    drop policy if exists "reports_storage_update" on storage.objects;
    drop policy if exists "reports_storage_delete" on storage.objects;

    create policy "reports_storage_select" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = fn_current_co_so_id()::text
      and (
        fn_is_management_role(fn_current_co_so_id())
        or fn_has_permission('report.read', fn_current_co_so_id())
        or fn_has_role('SYSTEM_ADMIN')
      )
    );

    create policy "reports_storage_insert" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = fn_current_co_so_id()::text
      and fn_has_permission('report.export', fn_current_co_so_id())
    );

    create policy "reports_storage_update" on storage.objects
    for update to authenticated
    using (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = fn_current_co_so_id()::text
      and fn_has_permission('report.export', fn_current_co_so_id())
    )
    with check (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = fn_current_co_so_id()::text
      and fn_has_permission('report.export', fn_current_co_so_id())
    );

    create policy "reports_storage_delete" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'reports'
      and (storage.foldername(name))[1] = fn_current_co_so_id()::text
      and fn_has_role('PRINCIPAL', fn_current_co_so_id())
    );
  end if;
end;
$$;

drop function if exists fn_luu_trang_thai_bao_cao(uuid, loai_bao_cao, text);

create or replace function fn_luu_trang_thai_bao_cao(
  p_nam_hoc_id uuid,
  p_loai_bao_cao loai_bao_cao,
  p_trang_thai text,
  p_storage_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_nguoi_dung_id uuid := fn_current_nguoi_dung_id();
  v_bao_cao_id uuid;
  v_existing_storage_path text;
  v_storage_path text := nullif(p_storage_path, '');
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not exists (
    select 1 from nam_hoc
    where id = p_nam_hoc_id
      and co_so_id = v_co_so_id
  ) then
    raise exception 'Nam hoc khong thuoc don vi hien tai.';
  end if;

  if p_trang_thai not in ('nhap', 'cho_duyet', 'da_phe_duyet', 'tra_lai') then
    raise exception 'Trang thai bao cao khong hop le.';
  end if;

  if v_storage_path is not null and v_storage_path not like v_co_so_id::text || '/%' then
    raise exception 'Duong dan luu tru bao cao khong thuoc don vi hien tai.';
  end if;

  select storage_path into v_existing_storage_path
  from bao_cao
  where co_so_id = v_co_so_id
    and nam_hoc_id = p_nam_hoc_id
    and loai_bao_cao = p_loai_bao_cao
    and version = 1;

  if p_trang_thai = 'da_phe_duyet' then
    if not (
      fn_has_permission('report.approve', v_co_so_id)
      and (
        fn_has_role('PRINCIPAL', v_co_so_id)
        or fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id)
      )
    ) then
      raise exception 'Chi Hieu truong hoac Chu tich hoi dong moi duoc phe duyet bao cao.';
    end if;

    if coalesce(v_storage_path, v_existing_storage_path) is null then
      raise exception 'Bao cao phe duyet phai co file snapshot luu tru trong bucket reports.';
    end if;
  elsif not fn_has_permission('report.export', v_co_so_id) then
    raise exception 'Ban chua co quyen bien tap hoac xuat bao cao.';
  end if;

  insert into bao_cao(
    co_so_id,
    nam_hoc_id,
    loai_bao_cao,
    version,
    trang_thai,
    storage_path,
    nguoi_tao,
    nguoi_phe_duyet,
    ngay_phe_duyet
  )
  values (
    v_co_so_id,
    p_nam_hoc_id,
    p_loai_bao_cao,
    1,
    p_trang_thai,
    v_storage_path,
    v_nguoi_dung_id,
    case when p_trang_thai = 'da_phe_duyet' then v_nguoi_dung_id else null end,
    case when p_trang_thai = 'da_phe_duyet' then now() else null end
  )
  on conflict (co_so_id, nam_hoc_id, loai_bao_cao, version)
  do update set
    trang_thai = excluded.trang_thai,
    storage_path = coalesce(excluded.storage_path, bao_cao.storage_path),
    nguoi_phe_duyet = excluded.nguoi_phe_duyet,
    ngay_phe_duyet = excluded.ngay_phe_duyet,
    updated_at = now()
  returning id into v_bao_cao_id;

  perform fn_log_audit(
    'REPORT_STATUS_UPDATED',
    'bao_cao',
    v_bao_cao_id,
    null,
    jsonb_build_object(
      'nam_hoc_id', p_nam_hoc_id,
      'loai_bao_cao', p_loai_bao_cao,
      'trang_thai', p_trang_thai,
      'storage_path', coalesce(v_storage_path, v_existing_storage_path)
    )
  );

  return v_bao_cao_id;
end;
$$;

revoke all on function fn_can_manage_tenant_setup(uuid) from public;
grant execute on function fn_can_manage_tenant_setup(uuid) to authenticated;

revoke all on function fn_can_read_ke_hoach_cai_tien(uuid, uuid, uuid, uuid) from public;
grant execute on function fn_can_read_ke_hoach_cai_tien(uuid, uuid, uuid, uuid) to authenticated;

revoke all on function fn_can_write_ke_hoach_cai_tien(uuid) from public;
grant execute on function fn_can_write_ke_hoach_cai_tien(uuid) to authenticated;

revoke all on function fn_can_read_council(uuid) from public;
grant execute on function fn_can_read_council(uuid) to authenticated;

revoke all on function fn_can_write_council(uuid) from public;
grant execute on function fn_can_write_council(uuid) to authenticated;

revoke all on function fn_xac_minh_minh_chung(uuid, trang_thai_xac_minh_minh_chung) from public;
grant execute on function fn_xac_minh_minh_chung(uuid, trang_thai_xac_minh_minh_chung) to authenticated;

revoke all on function fn_luu_trang_thai_bao_cao(uuid, loai_bao_cao, text, text) from public;
grant execute on function fn_luu_trang_thai_bao_cao(uuid, loai_bao_cao, text, text) to authenticated;
