-- Sprint 2: Kho minh chứng, permission theo Phụ lục B và Storage private.

create table if not exists quyen (
  id uuid primary key default gen_random_uuid(),
  ma varchar(100) not null unique,
  ten varchar(255) not null,
  mo_ta text,
  resource varchar(100) not null,
  action varchar(100) not null,
  created_at timestamptz not null default now()
);

create table if not exists vai_tro_quyen (
  vai_tro_id uuid not null references vai_tro(id) on delete cascade,
  quyen_id uuid not null references quyen(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (vai_tro_id, quyen_id)
);

alter table vai_tro add column if not exists scope varchar(50);
alter table vai_tro add column if not exists is_system boolean not null default false;
alter table vai_tro add column if not exists updated_at timestamptz not null default now();

alter table nguoi_dung_vai_tro add column if not exists valid_from date;
alter table nguoi_dung_vai_tro add column if not exists valid_until date;
alter table nguoi_dung_vai_tro add column if not exists created_by uuid references nguoi_dung(id);

alter table phan_cong_tieu_chi add column if not exists vai_tro_phan_cong varchar(100);
alter table phan_cong_tieu_chi add column if not exists ngay_bat_dau date;
alter table phan_cong_tieu_chi add column if not exists ngay_ket_thuc date;
alter table phan_cong_tieu_chi add column if not exists created_by uuid references nguoi_dung(id);

alter table quyen enable row level security;
alter table vai_tro_quyen enable row level security;

drop trigger if exists trg_vai_tro_updated_at on vai_tro;
create trigger trg_vai_tro_updated_at
before update on vai_tro
for each row execute function fn_set_updated_at();

insert into quyen(ma, ten, mo_ta, resource, action)
values
  ('standard.read', 'Đọc bộ tiêu chuẩn', 'Xem bộ tiêu chuẩn và tiêu chí.', 'standard', 'read'),
  ('criterion.read', 'Đọc tiêu chí', 'Xem tiêu chí và yêu cầu mức.', 'criterion', 'read'),
  ('evidence.read', 'Đọc minh chứng', 'Xem metadata minh chứng trong phạm vi được phép.', 'evidence', 'read'),
  ('evidence.create', 'Tạo minh chứng', 'Tải tệp hoặc tạo minh chứng liên kết.', 'evidence', 'create'),
  ('evidence.update', 'Sửa minh chứng', 'Cập nhật metadata minh chứng.', 'evidence', 'update'),
  ('evidence.delete', 'Lưu trữ minh chứng', 'Không hard-delete, chỉ vô hiệu hóa/lưu trữ.', 'evidence', 'delete'),
  ('evidence.link', 'Gắn minh chứng', 'Gắn minh chứng với tiêu chí.', 'evidence', 'link'),
  ('evidence.unlink', 'Bỏ gắn minh chứng', 'Bỏ liên kết sai giữa minh chứng và tiêu chí.', 'evidence', 'unlink'),
  ('evidence.verify', 'Xác minh minh chứng', 'Xác minh hoặc từ chối minh chứng.', 'evidence', 'verify'),
  ('assignment.read', 'Đọc phân công', 'Xem phân công tiêu chí.', 'assignment', 'read'),
  ('audit.read', 'Đọc nhật ký', 'Xem nhật ký thao tác trong phạm vi được phép.', 'audit', 'read')
on conflict (ma) do update
set ten = excluded.ten,
    mo_ta = excluded.mo_ta,
    resource = excluded.resource,
    action = excluded.action;

with role_permission(role_code, permission_code) as (
  values
    ('PRINCIPAL', 'standard.read'),
    ('PRINCIPAL', 'criterion.read'),
    ('PRINCIPAL', 'evidence.read'),
    ('PRINCIPAL', 'evidence.create'),
    ('PRINCIPAL', 'evidence.update'),
    ('PRINCIPAL', 'evidence.delete'),
    ('PRINCIPAL', 'evidence.link'),
    ('PRINCIPAL', 'evidence.unlink'),
    ('PRINCIPAL', 'evidence.verify'),
    ('PRINCIPAL', 'assignment.read'),
    ('PRINCIPAL', 'audit.read'),
    ('SELF_ASSESSMENT_CHAIR', 'standard.read'),
    ('SELF_ASSESSMENT_CHAIR', 'criterion.read'),
    ('SELF_ASSESSMENT_CHAIR', 'evidence.read'),
    ('SELF_ASSESSMENT_CHAIR', 'evidence.create'),
    ('SELF_ASSESSMENT_CHAIR', 'evidence.update'),
    ('SELF_ASSESSMENT_CHAIR', 'evidence.link'),
    ('SELF_ASSESSMENT_CHAIR', 'evidence.unlink'),
    ('SELF_ASSESSMENT_CHAIR', 'evidence.verify'),
    ('SELF_ASSESSMENT_CHAIR', 'assignment.read'),
    ('SELF_ASSESSMENT_CHAIR', 'audit.read'),
    ('SECRETARY', 'standard.read'),
    ('SECRETARY', 'criterion.read'),
    ('SECRETARY', 'evidence.read'),
    ('SECRETARY', 'evidence.create'),
    ('SECRETARY', 'evidence.update'),
    ('SECRETARY', 'evidence.link'),
    ('SECRETARY', 'evidence.unlink'),
    ('SECRETARY', 'evidence.verify'),
    ('SECRETARY', 'assignment.read'),
    ('MEMBER', 'standard.read'),
    ('MEMBER', 'criterion.read'),
    ('MEMBER', 'evidence.read'),
    ('MEMBER', 'evidence.create'),
    ('MEMBER', 'evidence.update'),
    ('MEMBER', 'evidence.link'),
    ('MEMBER', 'assignment.read'),
    ('TEACHER', 'standard.read'),
    ('TEACHER', 'criterion.read'),
    ('TEACHER', 'evidence.read'),
    ('TEACHER', 'evidence.create'),
    ('TEACHER', 'evidence.update'),
    ('VIEWER', 'standard.read'),
    ('VIEWER', 'criterion.read'),
    ('VIEWER', 'evidence.read')
)
insert into vai_tro_quyen(vai_tro_id, quyen_id)
select vt.id, q.id
from role_permission rp
join vai_tro vt on vt.ma = rp.role_code
join quyen q on q.ma = rp.permission_code
on conflict (vai_tro_id, quyen_id) do nothing;

create or replace function fn_has_permission(p_permission text, p_co_so_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from nguoi_dung nd
    join nguoi_dung_vai_tro ndvt on ndvt.nguoi_dung_id = nd.id
    join vai_tro vt on vt.id = ndvt.vai_tro_id
    join vai_tro_quyen vtq on vtq.vai_tro_id = vt.id
    join quyen q on q.id = vtq.quyen_id
    where nd.auth_user_id = auth.uid()
      and nd.trang_thai = 'active'
      and q.ma = p_permission
      and (ndvt.valid_from is null or ndvt.valid_from <= current_date)
      and (ndvt.valid_until is null or ndvt.valid_until >= current_date)
      and (
        p_co_so_id is null
        or ndvt.co_so_id = p_co_so_id
        or vt.pham_vi = 'he_thong'
        or vt.scope = 'he_thong'
      )
  )
$$;

create or replace function fn_is_assigned_to_criterion(p_tieu_chi_id uuid, p_nam_hoc_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from phan_cong_tieu_chi pctc
    where pctc.nguoi_dung_id = fn_current_nguoi_dung_id()
      and pctc.co_so_id = fn_current_co_so_id()
      and pctc.tieu_chi_id = p_tieu_chi_id
      and (p_nam_hoc_id is null or pctc.nam_hoc_id = p_nam_hoc_id)
      and (pctc.ngay_bat_dau is null or pctc.ngay_bat_dau <= current_date)
      and (pctc.ngay_ket_thuc is null or pctc.ngay_ket_thuc >= current_date)
  )
$$;

create or replace function fn_user_has_tenant_evidence_role(p_co_so_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select fn_has_permission(p_permission, p_co_so_id)
    and (
      fn_has_role('PRINCIPAL', p_co_so_id)
      or fn_has_role('SELF_ASSESSMENT_CHAIR', p_co_so_id)
      or fn_has_role('SECRETARY', p_co_so_id)
    )
$$;

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
          and mc.nguoi_tai_len = fn_current_nguoi_dung_id()
        )
      )
  )
$$;

create or replace function fn_can_write_minh_chung(p_minh_chung_id uuid, p_permission text)
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
        fn_user_has_tenant_evidence_role(mc.co_so_id, p_permission)
        or (
          fn_has_role('MEMBER', mc.co_so_id)
          and fn_has_permission(p_permission, mc.co_so_id)
          and exists (
            select 1
            from minh_chung_tieu_chi mctc
            where mctc.minh_chung_id = mc.id
              and fn_is_assigned_to_criterion(mctc.tieu_chi_id, mc.nam_hoc_id)
          )
        )
        or (
          p_permission = 'evidence.update'
          and fn_has_role('TEACHER', mc.co_so_id)
          and fn_has_permission('evidence.update', mc.co_so_id)
          and mc.nguoi_tai_len = fn_current_nguoi_dung_id()
          and mc.trang_thai_xac_minh = 'cho_xac_minh'
        )
      )
  )
$$;

create or replace function fn_log_audit(
  p_hanh_dong varchar,
  p_doi_tuong varchar,
  p_doi_tuong_id uuid,
  p_du_lieu_cu jsonb default null,
  p_du_lieu_moi jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into nhat_ky_truy_cap(
    co_so_id,
    nguoi_dung_id,
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    du_lieu_cu,
    du_lieu_moi
  )
  values (
    fn_current_co_so_id(),
    fn_current_nguoi_dung_id(),
    p_hanh_dong,
    p_doi_tuong,
    p_doi_tuong_id,
    p_du_lieu_cu,
    p_du_lieu_moi
  );
end;
$$;

create or replace function fn_tao_minh_chung(
  p_nam_hoc_id uuid,
  p_tieu_chi_ids uuid[],
  p_tieu_chi_goc_id uuid,
  p_ten text,
  p_loai_tep varchar,
  p_duong_dan text,
  p_storage_path text,
  p_hash_tep varchar,
  p_kich_thuoc bigint,
  p_ngay_ban_hanh date,
  p_ngay_het_gia_tri date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_nguoi_dung_id uuid := fn_current_nguoi_dung_id();
  v_ma varchar;
  v_minh_chung_id uuid;
  v_tieu_chi_id uuid;
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;

  if p_tieu_chi_goc_id is null or p_tieu_chi_goc_id <> all(p_tieu_chi_ids) then
    raise exception 'Tiêu chí gốc phải nằm trong danh sách tiêu chí đã chọn.';
  end if;

  if not exists (
    select 1 from nam_hoc
    where id = p_nam_hoc_id
      and co_so_id = v_co_so_id
  ) then
    raise exception 'Năm học không thuộc cơ sở giáo dục hiện tại.';
  end if;

  -- Teacher và Member chỉ được tạo minh chứng trong phạm vi chính mình/phân công.
  if not fn_user_has_tenant_evidence_role(v_co_so_id, 'evidence.create') then
    if fn_has_role('MEMBER', v_co_so_id) then
      foreach v_tieu_chi_id in array p_tieu_chi_ids loop
        if not fn_is_assigned_to_criterion(v_tieu_chi_id, p_nam_hoc_id) then
          raise exception 'Bạn chưa được phân công tiêu chí này.';
        end if;
      end loop;
    elsif not (fn_has_role('TEACHER', v_co_so_id) and fn_has_permission('evidence.create', v_co_so_id)) then
      raise exception 'Bạn không có quyền tạo minh chứng.';
    end if;
  end if;

  v_ma := fn_sinh_ma_minh_chung(p_tieu_chi_goc_id, v_co_so_id);

  insert into minh_chung(
    co_so_id,
    nam_hoc_id,
    ma,
    ten,
    loai_tep,
    duong_dan,
    storage_path,
    hash_tep,
    kich_thuoc,
    ngay_ban_hanh,
    ngay_het_gia_tri,
    nguoi_tai_len
  )
  values (
    v_co_so_id,
    p_nam_hoc_id,
    v_ma,
    p_ten,
    p_loai_tep,
    nullif(p_duong_dan, ''),
    nullif(p_storage_path, ''),
    nullif(p_hash_tep, ''),
    p_kich_thuoc,
    p_ngay_ban_hanh,
    p_ngay_het_gia_tri,
    v_nguoi_dung_id
  )
  returning id into v_minh_chung_id;

  foreach v_tieu_chi_id in array p_tieu_chi_ids loop
    insert into minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, la_tieu_chi_goc, created_by)
    values (v_minh_chung_id, v_tieu_chi_id, v_tieu_chi_id = p_tieu_chi_goc_id, v_nguoi_dung_id)
    on conflict (minh_chung_id, tieu_chi_id) do nothing;
  end loop;

  perform fn_log_audit(
    'EVIDENCE_CREATED',
    'minh_chung',
    v_minh_chung_id,
    null,
    jsonb_build_object('ma', v_ma, 'tieu_chi_ids', p_tieu_chi_ids)
  );

  return v_minh_chung_id;
end;
$$;

create or replace function fn_gan_minh_chung_tieu_chi(
  p_minh_chung_id uuid,
  p_tieu_chi_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mc minh_chung%rowtype;
  v_tieu_chi_id uuid;
begin
  select * into v_mc
  from minh_chung
  where id = p_minh_chung_id
    and co_so_id = fn_current_co_so_id()
    and deleted_at is null;

  if v_mc.id is null then
    raise exception 'Không tìm thấy minh chứng trong cơ sở giáo dục hiện tại.';
  end if;

  if not fn_user_has_tenant_evidence_role(v_mc.co_so_id, 'evidence.link') then
    if fn_has_role('MEMBER', v_mc.co_so_id) then
      foreach v_tieu_chi_id in array p_tieu_chi_ids loop
        if not fn_is_assigned_to_criterion(v_tieu_chi_id, v_mc.nam_hoc_id) then
          raise exception 'Bạn chưa được phân công tiêu chí này.';
        end if;
      end loop;
    else
      raise exception 'Bạn không có quyền gắn minh chứng.';
    end if;
  end if;

  foreach v_tieu_chi_id in array p_tieu_chi_ids loop
    insert into minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, la_tieu_chi_goc, created_by)
    values (p_minh_chung_id, v_tieu_chi_id, false, fn_current_nguoi_dung_id())
    on conflict (minh_chung_id, tieu_chi_id) do nothing;
  end loop;

  perform fn_log_audit(
    'EVIDENCE_LINKED',
    'minh_chung',
    p_minh_chung_id,
    null,
    jsonb_build_object('tieu_chi_ids', p_tieu_chi_ids)
  );
end;
$$;

drop policy if exists "minh_chung_same_tenant" on minh_chung;
drop policy if exists "minh_chung_tieu_chi_same_tenant" on minh_chung_tieu_chi;

create policy "minh_chung_select_by_permission" on minh_chung
for select to authenticated
using (fn_can_read_minh_chung(id));

create policy "minh_chung_insert_by_permission" on minh_chung
for insert to authenticated
with check (
  co_so_id = fn_current_co_so_id()
  and nguoi_tai_len = fn_current_nguoi_dung_id()
  and fn_has_permission('evidence.create', co_so_id)
);

create policy "minh_chung_update_by_permission" on minh_chung
for update to authenticated
using (fn_can_write_minh_chung(id, 'evidence.update'))
with check (co_so_id = fn_current_co_so_id());

create policy "minh_chung_delete_by_permission" on minh_chung
for delete to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and fn_user_has_tenant_evidence_role(co_so_id, 'evidence.delete')
);

create policy "minh_chung_tieu_chi_select_by_evidence_permission" on minh_chung_tieu_chi
for select to authenticated
using (fn_can_read_minh_chung(minh_chung_id));

create policy "minh_chung_tieu_chi_insert_by_permission" on minh_chung_tieu_chi
for insert to authenticated
with check (
  fn_can_read_minh_chung(minh_chung_id)
  and (
    exists (
      select 1
      from minh_chung mc
      where mc.id = minh_chung_id
        and fn_user_has_tenant_evidence_role(mc.co_so_id, 'evidence.link')
    )
    or fn_is_assigned_to_criterion(tieu_chi_id, (select nam_hoc_id from minh_chung where id = minh_chung_id))
  )
);

create policy "minh_chung_tieu_chi_delete_by_permission" on minh_chung_tieu_chi
for delete to authenticated
using (
  exists (
    select 1
    from minh_chung mc
    where mc.id = minh_chung_id
      and (
        fn_user_has_tenant_evidence_role(mc.co_so_id, 'evidence.unlink')
        or fn_is_assigned_to_criterion(tieu_chi_id, mc.nam_hoc_id)
      )
  )
);

create policy "quyen_read_authenticated" on quyen
for select to authenticated
using (true);

create policy "quyen_write_system_admin" on quyen
for all to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "vai_tro_quyen_read_authenticated" on vai_tro_quyen
for select to authenticated
using (true);

create policy "vai_tro_quyen_write_system_admin" on vai_tro_quyen
for all to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets(id, name, public)
    values ('evidence', 'evidence', false)
    on conflict (id) do update
      set public = false;

    drop policy if exists "evidence_storage_select" on storage.objects;
    drop policy if exists "evidence_storage_insert" on storage.objects;
    drop policy if exists "evidence_storage_update" on storage.objects;
    drop policy if exists "evidence_storage_delete" on storage.objects;

    create policy "evidence_storage_select" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'evidence'
      and (storage.foldername(name))[1] = fn_current_co_so_id()::text
    );

    create policy "evidence_storage_insert" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'evidence'
      and (storage.foldername(name))[1] = fn_current_co_so_id()::text
      and fn_has_permission('evidence.create', fn_current_co_so_id())
    );

    create policy "evidence_storage_update" on storage.objects
    for update to authenticated
    using (
      bucket_id = 'evidence'
      and (storage.foldername(name))[1] = fn_current_co_so_id()::text
      and fn_has_permission('evidence.update', fn_current_co_so_id())
    )
    with check (
      bucket_id = 'evidence'
      and (storage.foldername(name))[1] = fn_current_co_so_id()::text
      and fn_has_permission('evidence.update', fn_current_co_so_id())
    );
  end if;
end;
$$;

revoke all on function fn_has_permission(text, uuid) from public;
grant execute on function fn_has_permission(text, uuid) to authenticated;
revoke all on function fn_is_assigned_to_criterion(uuid, uuid) from public;
grant execute on function fn_is_assigned_to_criterion(uuid, uuid) to authenticated;
revoke all on function fn_tao_minh_chung(uuid, uuid[], uuid, text, varchar, text, text, varchar, bigint, date, date) from public;
grant execute on function fn_tao_minh_chung(uuid, uuid[], uuid, text, varchar, text, text, varchar, bigint, date, date) to authenticated;
revoke all on function fn_gan_minh_chung_tieu_chi(uuid, uuid[]) from public;
grant execute on function fn_gan_minh_chung_tieu_chi(uuid, uuid[]) to authenticated;
