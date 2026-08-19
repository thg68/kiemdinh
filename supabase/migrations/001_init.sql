-- Sprint 1: schema nền cho ứng dụng quản trị nhà trường.
-- Database giữ vai trò bảo vệ toàn vẹn dữ liệu, phân quyền tenant và thao tác atomic.

create extension if not exists pgcrypto;

create type loai_hinh_co_so as enum ('mam_non', 'pho_thong', 'gdtx');
create type cap_hoc as enum ('mam_non', 'tieu_hoc', 'thcs', 'thpt', 'gdtx', 'khac');
create type trang_thai_co_so as enum ('active', 'inactive');
create type trang_thai_nam_hoc as enum ('chuan_bi', 'dang_hoat_dong', 'da_khoa', 'luu_tru');
create type trang_thai_nguoi_dung as enum ('active', 'inactive', 'locked', 'invited');
create type trang_thai_xac_minh_minh_chung as enum ('cho_xac_minh', 'da_xac_minh', 'tu_choi', 'het_hieu_luc');
create type trang_thai_tu_danh_gia as enum ('nhap', 'ke_thua_cho_cap_nhat', 'dang_ra_soat', 'cho_duyet', 'da_duyet');
create type trang_thai_ke_hoach_cai_tien as enum ('chua_thuc_hien', 'dang_thuc_hien', 'hoan_thanh', 'cham_tien_do', 'khong_thuc_hien');
create type loai_bao_cao as enum ('mau_1_tu_danh_gia', 'mau_2_ke_hoach_cai_tien', 'danh_muc_minh_chung');

create or replace function fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table co_so_giao_duc (
  id uuid primary key default gen_random_uuid(),
  ten varchar(255) not null,
  ma_truong varchar(100) unique,
  loai_hinh loai_hinh_co_so not null,
  cap_hoc cap_hoc[] not null default '{}',
  cong_lap boolean,
  dia_chi text,
  co_quan_quan_ly varchar(255),
  nam_thanh_lap smallint,
  trang_thai trang_thai_co_so not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table nam_hoc (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  ten varchar(20) not null,
  ngay_bat_dau date not null,
  ngay_ket_thuc date not null,
  trang_thai trang_thai_nam_hoc not null default 'chuan_bi',
  ke_thua_tu_nam_hoc_id uuid references nam_hoc(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (co_so_id, ten),
  unique (id, co_so_id),
  check (ngay_ket_thuc > ngay_bat_dau)
);

create unique index uq_nam_hoc_dang_hoat_dong
on nam_hoc(co_so_id)
where trang_thai = 'dang_hoat_dong';

create table nguoi_dung (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  co_so_id uuid not null references co_so_giao_duc(id),
  ho_ten varchar(255) not null,
  email varchar(255),
  dien_thoai varchar(30),
  trang_thai trang_thai_nguoi_dung not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, co_so_id)
);

create table vai_tro (
  id uuid primary key default gen_random_uuid(),
  ma varchar(100) not null unique,
  ten varchar(255) not null,
  mo_ta text,
  pham_vi varchar(50) not null default 'co_so',
  created_at timestamptz not null default now()
);

create table nguoi_dung_vai_tro (
  nguoi_dung_id uuid not null references nguoi_dung(id) on delete cascade,
  vai_tro_id uuid not null references vai_tro(id) on delete cascade,
  co_so_id uuid references co_so_giao_duc(id),
  created_at timestamptz not null default now(),
  primary key (nguoi_dung_id, vai_tro_id, co_so_id),
  foreign key (nguoi_dung_id, co_so_id) references nguoi_dung(id, co_so_id)
);

create table nhat_ky_truy_cap (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid references co_so_giao_duc(id),
  nguoi_dung_id uuid references nguoi_dung(id),
  hanh_dong varchar(100) not null,
  doi_tuong varchar(100) not null,
  doi_tuong_id uuid,
  du_lieu_cu jsonb,
  du_lieu_moi jsonb,
  ip inet,
  user_agent text,
  thoi_diem timestamptz not null default now()
);

create table bo_tieu_chuan (
  id uuid primary key default gen_random_uuid(),
  ma_van_ban varchar(100) not null,
  ten text not null,
  ngay_hieu_luc date,
  ngay_het_hieu_luc date,
  loai_hinh loai_hinh_co_so not null,
  version integer not null default 1,
  trang_thai varchar(50) not null default 'dang_ap_dung',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ma_van_ban, loai_hinh, version)
);

create table tieu_chuan (
  id uuid primary key default gen_random_uuid(),
  bo_id uuid not null references bo_tieu_chuan(id) on delete restrict,
  so_thu_tu smallint not null check (so_thu_tu between 1 and 4),
  ten text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bo_id, so_thu_tu)
);

create table tieu_chi (
  id uuid primary key default gen_random_uuid(),
  tieu_chuan_id uuid not null references tieu_chuan(id) on delete restrict,
  ma varchar(10) not null,
  ten text not null,
  la_bat_buoc boolean not null default false,
  loai_hinh_ap_dung loai_hinh_co_so not null,
  thu_tu smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tieu_chuan_id, ma),
  unique (id, loai_hinh_ap_dung),
  check (ma ~ '^[1-4]\.[1-5]$')
);

create table muc_tieu_chi (
  id uuid primary key default gen_random_uuid(),
  tieu_chi_id uuid not null references tieu_chi(id) on delete restrict,
  muc smallint not null check (muc in (1, 2)),
  noi_dung_yeu_cau text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tieu_chi_id, muc)
);

create table minh_chung_goi_y (
  id uuid primary key default gen_random_uuid(),
  tieu_chi_id uuid not null references tieu_chi(id) on delete restrict,
  nhom_noi_dung text,
  mo_ta text not null,
  thu_tu smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table chi_so_dinh_luong (
  id uuid primary key default gen_random_uuid(),
  tieu_chi_id uuid not null references tieu_chi(id) on delete restrict,
  ma varchar(50),
  ten_chi_so text not null,
  don_vi varchar(50),
  cong_thuc text,
  mo_ta text,
  thu_tu smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tieu_chi_id, ma)
);

create table bo_dem_ma_minh_chung (
  co_so_id uuid not null references co_so_giao_duc(id) on delete cascade,
  tieu_chi_id uuid not null references tieu_chi(id) on delete restrict,
  so_tiep_theo integer not null default 1 check (so_tiep_theo > 0),
  updated_at timestamptz not null default now(),
  primary key (co_so_id, tieu_chi_id)
);

create table minh_chung (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  ma varchar(50) not null,
  ten text not null,
  loai_tep varchar(100),
  duong_dan text,
  storage_path text,
  hash_tep varchar(64),
  kich_thuoc bigint,
  ngay_ban_hanh date,
  ngay_het_gia_tri date,
  nguoi_tai_len uuid references nguoi_dung(id),
  trang_thai_xac_minh trang_thai_xac_minh_minh_chung not null default 'cho_xac_minh',
  nguoi_xac_minh uuid references nguoi_dung(id),
  ngay_xac_minh timestamptz,
  ghi_chu text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (co_so_id, ma),
  foreign key (nam_hoc_id, co_so_id) references nam_hoc(id, co_so_id)
);

create table minh_chung_tieu_chi (
  minh_chung_id uuid not null references minh_chung(id) on delete cascade,
  tieu_chi_id uuid not null references tieu_chi(id) on delete restrict,
  muc smallint check (muc in (1, 2)),
  la_tieu_chi_goc boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references nguoi_dung(id),
  primary key (minh_chung_id, tieu_chi_id),
  unique (minh_chung_id, tieu_chi_id)
);

create unique index uq_minh_chung_mot_tieu_chi_goc
on minh_chung_tieu_chi(minh_chung_id)
where la_tieu_chi_goc;

create table tu_danh_gia (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  tieu_chi_id uuid not null references tieu_chi(id) on delete restrict,
  cap_hoc cap_hoc not null,
  mo_ta_muc_1 text,
  dat_muc_1 boolean not null default false,
  mo_ta_muc_2 text,
  dat_muc_2 boolean not null default false,
  muc_dat smallint not null default 0 check (muc_dat in (0, 1, 2)),
  nguoi_nhap uuid references nguoi_dung(id),
  nguoi_duyet uuid references nguoi_dung(id),
  ngay_cap_nhat timestamptz not null default now(),
  trang_thai trang_thai_tu_danh_gia not null default 'nhap',
  ke_thua_tu_id uuid references tu_danh_gia(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc),
  foreign key (nam_hoc_id, co_so_id) references nam_hoc(id, co_so_id),
  check (not dat_muc_2 or dat_muc_1),
  check (
    (muc_dat = 0 and dat_muc_1 = false and dat_muc_2 = false)
    or (muc_dat = 1 and dat_muc_1 = true and dat_muc_2 = false)
    or (muc_dat = 2 and dat_muc_1 = true and dat_muc_2 = true)
  )
);

create table lich_su_tu_danh_gia (
  id uuid primary key default gen_random_uuid(),
  tu_danh_gia_id uuid not null references tu_danh_gia(id) on delete cascade,
  nguoi_dung_id uuid references nguoi_dung(id),
  muc_cu smallint check (muc_cu in (0, 1, 2)),
  muc_moi smallint check (muc_moi in (0, 1, 2)),
  dat_muc_1_cu boolean,
  dat_muc_1_moi boolean,
  dat_muc_2_cu boolean,
  dat_muc_2_moi boolean,
  ly_do text,
  created_at timestamptz not null default now()
);

create table ke_hoach_cai_tien (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  tieu_chuan_id uuid references tieu_chuan(id) on delete restrict,
  tieu_chi_id uuid references tieu_chi(id) on delete restrict,
  noi_dung text,
  muc_tieu text,
  hoat_dong text,
  chi_so_ket_qua text,
  thoi_gian_bat_dau date,
  thoi_gian_ket_thuc date,
  phu_trach_id uuid references nguoi_dung(id),
  nguon_luc text,
  minh_chung_du_kien text,
  muc_do_thuc_hien trang_thai_ke_hoach_cai_tien not null default 'chua_thuc_hien',
  ghi_chu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (nam_hoc_id, co_so_id) references nam_hoc(id, co_so_id),
  check (thoi_gian_ket_thuc is null or thoi_gian_bat_dau is null or thoi_gian_ket_thuc >= thoi_gian_bat_dau)
);

create table so_lieu_dinh_luong (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  chi_so_id uuid not null references chi_so_dinh_luong(id) on delete restrict,
  cap_hoc cap_hoc,
  gia_tri numeric,
  ghi_chu text,
  nguoi_nhap uuid references nguoi_dung(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (co_so_id, nam_hoc_id, chi_so_id, cap_hoc),
  foreign key (nam_hoc_id, co_so_id) references nam_hoc(id, co_so_id)
);

create table phan_cong_tieu_chi (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  nguoi_dung_id uuid not null references nguoi_dung(id),
  tieu_chi_id uuid not null references tieu_chi(id) on delete restrict,
  vai_tro_trong_tieu_chi varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nam_hoc_id, nguoi_dung_id, tieu_chi_id),
  foreign key (nam_hoc_id, co_so_id) references nam_hoc(id, co_so_id),
  foreign key (nguoi_dung_id, co_so_id) references nguoi_dung(id, co_so_id)
);

create table hoi_dong_tu_danh_gia (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  ten text not null,
  so_quyet_dinh varchar(100),
  ngay_quyet_dinh date,
  trang_thai varchar(50) not null default 'nhap',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (nam_hoc_id, co_so_id) references nam_hoc(id, co_so_id)
);

create table thanh_vien_hoi_dong (
  id uuid primary key default gen_random_uuid(),
  hoi_dong_id uuid not null references hoi_dong_tu_danh_gia(id) on delete cascade,
  nguoi_dung_id uuid not null references nguoi_dung(id),
  chuc_vu varchar(255),
  vai_tro_hoi_dong varchar(50) not null,
  thu_tu smallint not null default 1,
  created_at timestamptz not null default now(),
  unique (hoi_dong_id, nguoi_dung_id)
);

create table bao_cao (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  loai_bao_cao loai_bao_cao not null,
  version integer not null default 1,
  trang_thai varchar(50) not null default 'nhap',
  storage_path text,
  nguoi_tao uuid references nguoi_dung(id),
  nguoi_phe_duyet uuid references nguoi_dung(id),
  ngay_phe_duyet timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (co_so_id, nam_hoc_id, loai_bao_cao, version),
  foreign key (nam_hoc_id, co_so_id) references nam_hoc(id, co_so_id)
);

create or replace function fn_current_nguoi_dung_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from nguoi_dung
  where auth_user_id = auth.uid()
    and trang_thai = 'active'
  limit 1
$$;

create or replace function fn_current_co_so_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select co_so_id
  from nguoi_dung
  where auth_user_id = auth.uid()
    and trang_thai = 'active'
  limit 1
$$;

create or replace function fn_has_role(p_role text, p_co_so_id uuid default null)
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
    where nd.auth_user_id = auth.uid()
      and nd.trang_thai = 'active'
      and vt.ma = p_role
      and (
        p_co_so_id is null
        or ndvt.co_so_id = p_co_so_id
        or vt.pham_vi = 'he_thong'
      )
  )
$$;

create or replace function fn_sinh_ma_minh_chung(p_tieu_chi_id uuid, p_co_so_id uuid)
returns varchar
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma_tieu_chi varchar(10);
  v_so integer;
begin
  select ma into v_ma_tieu_chi
  from tieu_chi
  where id = p_tieu_chi_id;

  if v_ma_tieu_chi is null then
    raise exception 'Không tìm thấy tiêu chí %', p_tieu_chi_id;
  end if;

  insert into bo_dem_ma_minh_chung(co_so_id, tieu_chi_id, so_tiep_theo)
  values (p_co_so_id, p_tieu_chi_id, 2)
  on conflict (co_so_id, tieu_chi_id)
  do update
    set so_tiep_theo = bo_dem_ma_minh_chung.so_tiep_theo + 1,
        updated_at = now()
  returning so_tiep_theo - 1 into v_so;

  return 'MC.' || v_ma_tieu_chi || '.' || lpad(v_so::text, 2, '0');
end;
$$;

create or replace function fn_khoi_tao_co_so_va_nam_hoc(
  p_ten_co_so text,
  p_ma_truong text,
  p_loai_hinh loai_hinh_co_so,
  p_cap_hoc cap_hoc[],
  p_nam_hoc_ten varchar,
  p_ngay_bat_dau date,
  p_ngay_ket_thuc date,
  p_ho_ten text
)
returns table (co_so_id uuid, nam_hoc_id uuid, nguoi_dung_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_principal_role_id uuid;
begin
  if v_auth_user_id is null then
    raise exception 'Bạn cần đăng nhập trước khi tạo cơ sở giáo dục.';
  end if;

  if exists (select 1 from nguoi_dung where auth_user_id = v_auth_user_id) then
    raise exception 'Tài khoản này đã thuộc một cơ sở giáo dục.';
  end if;

  insert into co_so_giao_duc(ten, ma_truong, loai_hinh, cap_hoc)
  values (p_ten_co_so, nullif(p_ma_truong, ''), p_loai_hinh, coalesce(p_cap_hoc, '{}'))
  returning id into co_so_id;

  insert into nam_hoc(co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
  values (co_so_id, p_nam_hoc_ten, p_ngay_bat_dau, p_ngay_ket_thuc, 'dang_hoat_dong')
  returning id into nam_hoc_id;

  insert into nguoi_dung(auth_user_id, co_so_id, ho_ten, email, trang_thai)
  values (
    v_auth_user_id,
    co_so_id,
    nullif(p_ho_ten, ''),
    (select email from auth.users where id = v_auth_user_id),
    'active'
  )
  returning id into nguoi_dung_id;

  select id into v_principal_role_id from vai_tro where ma = 'PRINCIPAL';

  insert into nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
  values (nguoi_dung_id, v_principal_role_id, co_so_id);

  return next;
end;
$$;

create or replace function fn_audit_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid;
  v_doi_tuong_id uuid;
begin
  if tg_op = 'DELETE' then
    v_co_so_id := (to_jsonb(old)->>'co_so_id')::uuid;
    v_doi_tuong_id := (to_jsonb(old)->>'id')::uuid;
  else
    v_co_so_id := (to_jsonb(new)->>'co_so_id')::uuid;
    v_doi_tuong_id := (to_jsonb(new)->>'id')::uuid;
  end if;

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
    v_co_so_id,
    fn_current_nguoi_dung_id(),
    tg_op,
    tg_table_name,
    v_doi_tuong_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

revoke all on function fn_sinh_ma_minh_chung(uuid, uuid) from public;
grant execute on function fn_sinh_ma_minh_chung(uuid, uuid) to authenticated;

revoke all on function fn_khoi_tao_co_so_va_nam_hoc(text, text, loai_hinh_co_so, cap_hoc[], varchar, date, date, text) from public;
grant execute on function fn_khoi_tao_co_so_va_nam_hoc(text, text, loai_hinh_co_so, cap_hoc[], varchar, date, date, text) to authenticated;

create or replace function fn_check_tu_danh_gia_has_evidence()
returns trigger
language plpgsql
as $$
begin
  -- Không cho lưu mô tả hiện trạng nếu tiêu chí chưa có minh chứng thật gắn kèm.
  if (coalesce(new.mo_ta_muc_1, '') <> '' or coalesce(new.mo_ta_muc_2, '') <> '')
    and not exists (
      select 1
      from minh_chung mc
      join minh_chung_tieu_chi mctc on mctc.minh_chung_id = mc.id
      where mc.co_so_id = new.co_so_id
        and mc.nam_hoc_id = new.nam_hoc_id
        and mctc.tieu_chi_id = new.tieu_chi_id
        and mc.deleted_at is null
    )
  then
    raise exception 'Không được nhập mô tả tự đánh giá khi tiêu chí chưa có minh chứng.';
  end if;

  return new;
end;
$$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'co_so_giao_duc', 'nam_hoc', 'nguoi_dung', 'bo_tieu_chuan', 'tieu_chuan',
    'tieu_chi', 'muc_tieu_chi', 'minh_chung_goi_y', 'chi_so_dinh_luong',
    'minh_chung', 'tu_danh_gia', 'ke_hoach_cai_tien', 'so_lieu_dinh_luong',
    'phan_cong_tieu_chi', 'hoi_dong_tu_danh_gia', 'bao_cao'
  ]
  loop
    execute format(
      'create trigger trg_%1$s_updated_at before update on %1$I for each row execute function fn_set_updated_at()',
      v_table
    );
  end loop;
end;
$$;

create trigger trg_tu_danh_gia_has_evidence
before insert or update on tu_danh_gia
for each row execute function fn_check_tu_danh_gia_has_evidence();

create trigger trg_audit_minh_chung
after insert or update or delete on minh_chung
for each row execute function fn_audit_change();

create trigger trg_audit_tu_danh_gia
after insert or update or delete on tu_danh_gia
for each row execute function fn_audit_change();

create index idx_nam_hoc_co_so on nam_hoc(co_so_id);
create index idx_nguoi_dung_co_so on nguoi_dung(co_so_id);
create index idx_nguoi_dung_auth_user on nguoi_dung(auth_user_id);
create index idx_nhat_ky_co_so_thoi_diem on nhat_ky_truy_cap(co_so_id, thoi_diem desc);
create index idx_nhat_ky_nguoi_dung_thoi_diem on nhat_ky_truy_cap(nguoi_dung_id, thoi_diem desc);
create index idx_nhat_ky_doi_tuong on nhat_ky_truy_cap(doi_tuong, doi_tuong_id);
create index idx_nhat_ky_hanh_dong on nhat_ky_truy_cap(hanh_dong);
create index idx_tieu_chuan_bo on tieu_chuan(bo_id);
create index idx_tieu_chi_tieu_chuan on tieu_chi(tieu_chuan_id);
create index idx_tieu_chi_ma on tieu_chi(ma);
create index idx_muc_tieu_chi on muc_tieu_chi(tieu_chi_id);
create index idx_minh_chung_co_so_nam on minh_chung(co_so_id, nam_hoc_id);
create index idx_minh_chung_ma on minh_chung(co_so_id, ma);
create index idx_minh_chung_hash on minh_chung(co_so_id, hash_tep);
create index idx_mc_tc_tieu_chi on minh_chung_tieu_chi(tieu_chi_id);
create index idx_tdg_co_so_nam on tu_danh_gia(co_so_id, nam_hoc_id);
create index idx_tdg_tieu_chi on tu_danh_gia(tieu_chi_id);
create index idx_so_lieu_co_so_nam on so_lieu_dinh_luong(co_so_id, nam_hoc_id);

insert into vai_tro(ma, ten, mo_ta, pham_vi)
values
  ('SYSTEM_ADMIN', 'Quản trị hệ thống', 'Quản lý dữ liệu tham chiếu và cấu hình toàn hệ thống.', 'he_thong'),
  ('PRINCIPAL', 'Hiệu trưởng', 'Quản lý dữ liệu trong phạm vi cơ sở giáo dục.', 'co_so'),
  ('SELF_ASSESSMENT_CHAIR', 'Chủ tịch hội đồng tự đánh giá', 'Điều phối và phê duyệt tự đánh giá.', 'co_so'),
  ('SECRETARY', 'Thư ký hội đồng tự đánh giá', 'Tổng hợp minh chứng và báo cáo.', 'co_so'),
  ('MEMBER', 'Thành viên hội đồng', 'Cập nhật tiêu chí được phân công.', 'co_so'),
  ('TEACHER', 'Giáo viên', 'Cung cấp minh chứng vận hành.', 'co_so'),
  ('VIEWER', 'Người xem', 'Chỉ đọc dữ liệu được phân quyền.', 'co_so')
on conflict (ma) do nothing;

with bo as (
  insert into bo_tieu_chuan(ma_van_ban, ten, ngay_hieu_luc, loai_hinh, version, trang_thai)
  values (
    '57/2026/TT-BGDDT',
    'Bộ tiêu chuẩn bảo đảm chất lượng giáo dục - khung chờ nhập nội dung phụ lục chính thức',
    '2026-07-07',
    'mam_non',
    1,
    'du_thao_du_lieu'
  )
  on conflict (ma_van_ban, loai_hinh, version) do update
    set ten = excluded.ten
  returning id
),
tc as (
  insert into tieu_chuan(bo_id, so_thu_tu, ten)
  select bo.id, v.so_thu_tu, v.ten
  from bo
  cross join (values
    (1, 'Tiêu chuẩn 1'),
    (2, 'Tiêu chuẩn 2'),
    (3, 'Tiêu chuẩn 3'),
    (4, 'Tiêu chuẩn 4')
  ) as v(so_thu_tu, ten)
  on conflict (bo_id, so_thu_tu) do update
    set ten = excluded.ten
  returning id, so_thu_tu
),
criteria_seed(ma, thu_tu, ten) as (
  values
    ('1.1', 1, 'Tiêu chí 1.1'),
    ('1.2', 2, 'Tiêu chí 1.2'),
    ('1.3', 3, 'Tiêu chí 1.3'),
    ('1.4', 4, 'Tiêu chí 1.4'),
    ('2.1', 1, 'Tiêu chí 2.1'),
    ('2.2', 2, 'Tiêu chí 2.2'),
    ('2.3', 3, 'Tiêu chí 2.3'),
    ('3.1', 1, 'Tiêu chí 3.1'),
    ('3.2', 2, 'Tiêu chí 3.2'),
    ('3.3', 3, 'Tiêu chí 3.3'),
    ('3.4', 4, 'Tiêu chí 3.4'),
    ('3.5', 5, 'Tiêu chí 3.5'),
    ('4.1', 1, 'Tiêu chí 4.1'),
    ('4.2', 2, 'Tiêu chí 4.2'),
    ('4.3', 3, 'Tiêu chí 4.3')
),
inserted_criteria as (
  insert into tieu_chi(tieu_chuan_id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, thu_tu)
  select
    tc.id,
    cs.ma,
    cs.ten,
    cs.ma in ('1.3', '1.4', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'),
    'mam_non',
    cs.thu_tu
  from criteria_seed cs
  join tc on tc.so_thu_tu = split_part(cs.ma, '.', 1)::smallint
  on conflict (tieu_chuan_id, ma) do update
    set la_bat_buoc = excluded.la_bat_buoc,
        loai_hinh_ap_dung = excluded.loai_hinh_ap_dung,
        thu_tu = excluded.thu_tu
  returning id
)
insert into muc_tieu_chi(tieu_chi_id, muc, noi_dung_yeu_cau)
select id, muc, ''
from inserted_criteria
cross join (values (1), (2)) as m(muc)
on conflict (tieu_chi_id, muc) do nothing;

alter table co_so_giao_duc enable row level security;
alter table nam_hoc enable row level security;
alter table nguoi_dung enable row level security;
alter table vai_tro enable row level security;
alter table nguoi_dung_vai_tro enable row level security;
alter table nhat_ky_truy_cap enable row level security;
alter table bo_tieu_chuan enable row level security;
alter table tieu_chuan enable row level security;
alter table tieu_chi enable row level security;
alter table muc_tieu_chi enable row level security;
alter table minh_chung_goi_y enable row level security;
alter table chi_so_dinh_luong enable row level security;
alter table bo_dem_ma_minh_chung enable row level security;
alter table minh_chung enable row level security;
alter table minh_chung_tieu_chi enable row level security;
alter table tu_danh_gia enable row level security;
alter table lich_su_tu_danh_gia enable row level security;
alter table ke_hoach_cai_tien enable row level security;
alter table so_lieu_dinh_luong enable row level security;
alter table phan_cong_tieu_chi enable row level security;
alter table hoi_dong_tu_danh_gia enable row level security;
alter table thanh_vien_hoi_dong enable row level security;
alter table bao_cao enable row level security;

create policy "co_so_select_same_tenant" on co_so_giao_duc
for select to authenticated
using (id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "co_so_write_admin" on co_so_giao_duc
for all to authenticated
using (id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "nam_hoc_same_tenant" on nam_hoc
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "nguoi_dung_same_tenant" on nguoi_dung
for select to authenticated
using (co_so_id = fn_current_co_so_id() or auth_user_id = auth.uid() or fn_has_role('SYSTEM_ADMIN'));

create policy "nguoi_dung_write_admin" on nguoi_dung
for all to authenticated
using (co_so_id = fn_current_co_so_id() or auth_user_id = auth.uid() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or auth_user_id = auth.uid() or fn_has_role('SYSTEM_ADMIN'));

create policy "vai_tro_read_authenticated" on vai_tro
for select to authenticated
using (true);

create policy "vai_tro_write_system_admin" on vai_tro
for all to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "nguoi_dung_vai_tro_same_tenant" on nguoi_dung_vai_tro
for select to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "nguoi_dung_vai_tro_write_admin" on nguoi_dung_vai_tro
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "nhat_ky_read_same_tenant" on nhat_ky_truy_cap
for select to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "nhat_ky_insert_same_tenant" on nhat_ky_truy_cap
for insert to authenticated
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "reference_read_authenticated" on bo_tieu_chuan
for select to authenticated
using (true);
create policy "reference_write_system_admin" on bo_tieu_chuan
for all to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "reference_read_authenticated" on tieu_chuan
for select to authenticated
using (true);
create policy "reference_write_system_admin" on tieu_chuan
for all to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "reference_read_authenticated" on tieu_chi
for select to authenticated
using (true);
create policy "reference_write_system_admin" on tieu_chi
for all to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "reference_read_authenticated" on muc_tieu_chi
for select to authenticated
using (true);
create policy "reference_write_system_admin" on muc_tieu_chi
for all to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "reference_read_authenticated" on minh_chung_goi_y
for select to authenticated
using (true);
create policy "reference_write_system_admin" on minh_chung_goi_y
for all to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "reference_read_authenticated" on chi_so_dinh_luong
for select to authenticated
using (true);
create policy "reference_write_system_admin" on chi_so_dinh_luong
for all to authenticated
using (fn_has_role('SYSTEM_ADMIN'))
with check (fn_has_role('SYSTEM_ADMIN'));

create policy "bo_dem_same_tenant" on bo_dem_ma_minh_chung
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "minh_chung_same_tenant" on minh_chung
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "minh_chung_tieu_chi_same_tenant" on minh_chung_tieu_chi
for all to authenticated
using (
  exists (
    select 1 from minh_chung mc
    where mc.id = minh_chung_tieu_chi.minh_chung_id
      and (mc.co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
  )
)
with check (
  exists (
    select 1 from minh_chung mc
    where mc.id = minh_chung_tieu_chi.minh_chung_id
      and (mc.co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
  )
);

create policy "tu_danh_gia_same_tenant" on tu_danh_gia
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "lich_su_tdg_same_tenant" on lich_su_tu_danh_gia
for select to authenticated
using (
  exists (
    select 1 from tu_danh_gia tdg
    where tdg.id = lich_su_tu_danh_gia.tu_danh_gia_id
      and (tdg.co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
  )
);

create policy "ke_hoach_same_tenant" on ke_hoach_cai_tien
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "so_lieu_same_tenant" on so_lieu_dinh_luong
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "phan_cong_same_tenant" on phan_cong_tieu_chi
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "hoi_dong_same_tenant" on hoi_dong_tu_danh_gia
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));

create policy "thanh_vien_hoi_dong_same_tenant" on thanh_vien_hoi_dong
for all to authenticated
using (
  exists (
    select 1 from hoi_dong_tu_danh_gia hd
    where hd.id = thanh_vien_hoi_dong.hoi_dong_id
      and (hd.co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
  )
)
with check (
  exists (
    select 1 from hoi_dong_tu_danh_gia hd
    where hd.id = thanh_vien_hoi_dong.hoi_dong_id
      and (hd.co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
  )
);

create policy "bao_cao_same_tenant" on bao_cao
for all to authenticated
using (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'))
with check (co_so_id = fn_current_co_so_id() or fn_has_role('SYSTEM_ADMIN'));
