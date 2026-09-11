begin;

alter table public.minh_chung
  add column if not exists can_kiem_tra_ky_thuat boolean not null default false,
  add column if not exists ghi_chu_ky_thuat varchar(500),
  add column if not exists ky_thuat_cap_nhat_luc timestamptz,
  add column if not exists ky_thuat_cap_nhat_boi uuid references public.nguoi_dung(id);

create index if not exists idx_co_so_admin_trang_thai_ten
  on public.co_so_giao_duc(trang_thai, ten, id);

create index if not exists idx_minh_chung_admin_kiem_tra
  on public.minh_chung(can_kiem_tra_ky_thuat, created_at desc)
  where deleted_at is null;

create or replace function public.fn_require_system_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
begin
  if auth.uid() is null or v_nguoi_dung_id is null then
    raise exception using
      errcode = '42501',
      message = 'Ban can dang nhap bang tai khoan quan tri he thong.';
  end if;

  if not public.fn_has_role('SYSTEM_ADMIN') then
    raise exception using
      errcode = '42501',
      message = 'Tai khoan khong co quyen quan tri he thong.';
  end if;

  return v_nguoi_dung_id;
end;
$$;

create or replace function public.fn_admin_tong_quan()
returns table (
  tong_co_so bigint,
  co_so_dang_hoat_dong bigint,
  co_so_chua_co_nam_hoc_hoat_dong bigint,
  tong_nguoi_dung bigint,
  nguoi_dung_dang_hoat_dong bigint,
  tong_minh_chung bigint,
  minh_chung_can_kiem_tra bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public.fn_require_system_admin();

  return query
  with school_stats as (
    select
      count(*)::bigint as tong,
      count(*) filter (where school.trang_thai = 'active')::bigint as dang_hoat_dong,
      count(*) filter (
        where school.trang_thai = 'active'
          and not exists (
            select 1
            from public.nam_hoc school_year
            where school_year.co_so_id = school.id
              and school_year.trang_thai = 'dang_hoat_dong'
          )
      )::bigint as chua_co_nam_hoc
    from public.co_so_giao_duc school
  ),
  user_stats as (
    select
      count(*)::bigint as tong,
      count(*) filter (where app_user.trang_thai = 'active')::bigint as dang_hoat_dong
    from public.nguoi_dung app_user
  ),
  evidence_stats as (
    select
      count(*) filter (where evidence.deleted_at is null)::bigint as tong,
      count(*) filter (
        where evidence.deleted_at is null
          and (
            evidence.can_kiem_tra_ky_thuat
            or evidence.ngay_het_gia_tri < current_date
            or (evidence.storage_path is null and evidence.duong_dan is null)
          )
      )::bigint as can_kiem_tra
    from public.minh_chung evidence
  )
  select
    school_stats.tong,
    school_stats.dang_hoat_dong,
    school_stats.chua_co_nam_hoc,
    user_stats.tong,
    user_stats.dang_hoat_dong,
    evidence_stats.tong,
    evidence_stats.can_kiem_tra
  from school_stats
  cross join user_stats
  cross join evidence_stats;
end;
$$;

create or replace function public.fn_admin_danh_sach_co_so(
  p_tu_khoa text default null,
  p_trang_thai text default null,
  p_loai_hinh text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  ma_truong text,
  ten text,
  loai_hinh text,
  cap_hoc text[],
  trang_thai text,
  tinh_thanh text,
  phuong_xa text,
  dia_chi text,
  cho_phep_tu_dang_ky boolean,
  nam_hoc_dang_hoat_dong text,
  so_nguoi_dung bigint,
  so_minh_chung bigint,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tu_khoa text := nullif(pg_catalog.btrim(coalesce(p_tu_khoa, '')), '');
  v_trang_thai text := nullif(pg_catalog.btrim(coalesce(p_trang_thai, '')), '');
  v_loai_hinh text := nullif(pg_catalog.btrim(coalesce(p_loai_hinh, '')), '');
begin
  perform public.fn_require_system_admin();

  if p_limit < 1 or p_limit > 100 or p_offset < 0 then
    raise exception using errcode = '22023', message = 'Phan trang khong hop le.';
  end if;

  if v_tu_khoa is not null and char_length(v_tu_khoa) > 100 then
    raise exception using errcode = '22023', message = 'Tu khoa khong duoc vuot qua 100 ky tu.';
  end if;

  if v_trang_thai is not null and v_trang_thai not in ('active', 'inactive') then
    raise exception using errcode = '22023', message = 'Trang thai co so khong hop le.';
  end if;

  if v_loai_hinh is not null and v_loai_hinh not in ('mam_non', 'pho_thong', 'gdtx') then
    raise exception using errcode = '22023', message = 'Loai hinh co so khong hop le.';
  end if;

  return query
  select
    school.id,
    school.ma_truong::text,
    school.ten::text,
    school.loai_hinh::text,
    school.cap_hoc::text[],
    school.trang_thai::text,
    school.tinh_thanh::text,
    school.phuong_xa::text,
    school.dia_chi,
    school.cho_phep_tu_dang_ky,
    active_year.ten::text,
    (select count(*) from public.nguoi_dung app_user where app_user.co_so_id = school.id)::bigint,
    (
      select count(*)
      from public.minh_chung evidence
      where evidence.co_so_id = school.id
        and evidence.deleted_at is null
    )::bigint,
    count(*) over ()::bigint
  from public.co_so_giao_duc school
  left join lateral (
    select school_year.ten
    from public.nam_hoc school_year
    where school_year.co_so_id = school.id
      and school_year.trang_thai = 'dang_hoat_dong'
    order by school_year.ngay_bat_dau desc, school_year.id
    limit 1
  ) active_year on true
  where (v_trang_thai is null or school.trang_thai::text = v_trang_thai)
    and (v_loai_hinh is null or school.loai_hinh::text = v_loai_hinh)
    and (
      v_tu_khoa is null
      or school.ten ilike '%' || v_tu_khoa || '%'
      or school.ma_truong ilike '%' || v_tu_khoa || '%'
      or school.phuong_xa ilike '%' || v_tu_khoa || '%'
    )
  order by
    case when school.trang_thai = 'active' then 0 else 1 end,
    school.ten,
    school.id
  limit p_limit
  offset p_offset;
end;
$$;

create or replace function public.fn_admin_cap_nhat_trang_thai_co_so(
  p_co_so_id uuid,
  p_trang_thai text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_trang_thai_cu text;
begin
  if p_co_so_id is null or p_trang_thai is null or p_trang_thai not in ('active', 'inactive') then
    raise exception using errcode = '22023', message = 'Thong tin cap nhat co so khong hop le.';
  end if;

  select school.trang_thai::text
  into v_trang_thai_cu
  from public.co_so_giao_duc school
  where school.id = p_co_so_id
  for update;

  if v_trang_thai_cu is null then
    raise exception using errcode = 'P0002', message = 'Khong tim thay co so giao duc.';
  end if;

  if v_trang_thai_cu = p_trang_thai then
    return v_trang_thai_cu;
  end if;

  update public.co_so_giao_duc
  set trang_thai = p_trang_thai::public.trang_thai_co_so,
      updated_at = now()
  where id = p_co_so_id;

  insert into public.nhat_ky_truy_cap(
    co_so_id, nguoi_dung_id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu_cu, du_lieu_moi
  ) values (
    p_co_so_id,
    v_actor_id,
    'ADMIN_SCHOOL_STATUS_UPDATED',
    'co_so_giao_duc',
    p_co_so_id,
    jsonb_build_object('trang_thai', v_trang_thai_cu),
    jsonb_build_object('trang_thai', p_trang_thai)
  );

  return p_trang_thai;
end;
$$;

create or replace function public.fn_admin_tuy_chon_co_so(
  p_tu_khoa text default null,
  p_limit integer default 500
)
returns table (
  id uuid,
  ma_truong text,
  ten text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tu_khoa text := nullif(pg_catalog.btrim(coalesce(p_tu_khoa, '')), '');
begin
  perform public.fn_require_system_admin();

  if p_limit < 1 or p_limit > 500 then
    raise exception using errcode = '22023', message = 'Gioi han danh sach co so khong hop le.';
  end if;

  return query
  select school.id, school.ma_truong::text, school.ten::text
  from public.co_so_giao_duc school
  where v_tu_khoa is null
    or school.ten ilike '%' || v_tu_khoa || '%'
    or school.ma_truong ilike '%' || v_tu_khoa || '%'
  order by school.ten, school.id
  limit p_limit;
end;
$$;

create or replace function public.fn_admin_danh_sach_nguoi_tham_gia(
  p_tu_khoa text default null,
  p_co_so_id uuid default null,
  p_vai_tro text default null,
  p_trang_thai text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  ho_ten text,
  email text,
  trang_thai text,
  co_so_id uuid,
  co_so_ten text,
  vai_tro_mas text[],
  vai_tro_tens text[],
  created_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tu_khoa text := nullif(pg_catalog.btrim(coalesce(p_tu_khoa, '')), '');
  v_vai_tro text := nullif(pg_catalog.btrim(coalesce(p_vai_tro, '')), '');
  v_trang_thai text := nullif(pg_catalog.btrim(coalesce(p_trang_thai, '')), '');
begin
  perform public.fn_require_system_admin();

  if p_limit < 1 or p_limit > 100 or p_offset < 0 then
    raise exception using errcode = '22023', message = 'Phan trang khong hop le.';
  end if;

  if v_tu_khoa is not null and char_length(v_tu_khoa) > 100 then
    raise exception using errcode = '22023', message = 'Tu khoa khong duoc vuot qua 100 ky tu.';
  end if;

  if v_trang_thai is not null and v_trang_thai not in ('active', 'inactive', 'locked', 'invited') then
    raise exception using errcode = '22023', message = 'Trang thai nguoi dung khong hop le.';
  end if;

  if v_vai_tro is not null and not exists (
    select 1 from public.vai_tro role where role.ma = v_vai_tro
  ) then
    raise exception using errcode = '22023', message = 'Vai tro khong hop le.';
  end if;

  return query
  select
    app_user.id,
    app_user.ho_ten::text,
    app_user.email::text,
    app_user.trang_thai::text,
    app_user.co_so_id,
    school.ten::text,
    coalesce(role_data.ma, '{}'::text[]),
    coalesce(role_data.ten, '{}'::text[]),
    app_user.created_at,
    count(*) over ()::bigint
  from public.nguoi_dung app_user
  join public.co_so_giao_duc school on school.id = app_user.co_so_id
  left join lateral (
    select
      array_agg(role.ma::text order by case role.ma
        when 'SYSTEM_ADMIN' then 0
        when 'PRINCIPAL' then 1
        when 'SELF_ASSESSMENT_CHAIR' then 2
        when 'SECRETARY' then 3
        when 'MEMBER' then 4
        when 'TEACHER' then 5
        when 'VIEWER' then 6
        else 99
      end, role.ten) as ma,
      array_agg(role.ten::text order by case role.ma
        when 'SYSTEM_ADMIN' then 0
        when 'PRINCIPAL' then 1
        when 'SELF_ASSESSMENT_CHAIR' then 2
        when 'SECRETARY' then 3
        when 'MEMBER' then 4
        when 'TEACHER' then 5
        when 'VIEWER' then 6
        else 99
      end, role.ten) as ten,
      min(case role.ma
        when 'SYSTEM_ADMIN' then 0
        when 'PRINCIPAL' then 1
        when 'SELF_ASSESSMENT_CHAIR' then 2
        when 'SECRETARY' then 3
        when 'MEMBER' then 4
        when 'TEACHER' then 5
        when 'VIEWER' then 6
        else 99
      end) as priority
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = app_user.id
      and (user_role.valid_from is null or user_role.valid_from <= current_date)
      and (user_role.valid_until is null or user_role.valid_until >= current_date)
  ) role_data on true
  where (p_co_so_id is null or app_user.co_so_id = p_co_so_id)
    and (v_trang_thai is null or app_user.trang_thai::text = v_trang_thai)
    and (v_vai_tro is null or v_vai_tro = any(coalesce(role_data.ma, '{}'::text[])))
    and (
      v_tu_khoa is null
      or app_user.ho_ten ilike '%' || v_tu_khoa || '%'
      or app_user.email ilike '%' || v_tu_khoa || '%'
      or school.ten ilike '%' || v_tu_khoa || '%'
    )
  order by role_data.priority nulls last, app_user.ho_ten, app_user.id
  limit p_limit
  offset p_offset;
end;
$$;

create or replace function public.fn_admin_cap_nhat_trang_thai_nguoi_dung(
  p_nguoi_dung_id uuid,
  p_trang_thai text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_target public.nguoi_dung%rowtype;
begin
  if p_nguoi_dung_id is null or p_trang_thai is null or p_trang_thai not in ('active', 'inactive', 'locked') then
    raise exception using errcode = '22023', message = 'Thong tin cap nhat nguoi dung khong hop le.';
  end if;

  select * into v_target
  from public.nguoi_dung app_user
  where app_user.id = p_nguoi_dung_id
  for update;

  if v_target.id is null then
    raise exception using errcode = 'P0002', message = 'Khong tim thay nguoi dung.';
  end if;

  if v_target.id = v_actor_id then
    raise exception using errcode = '42501', message = 'Khong the thay doi trang thai tai khoan cua chinh minh.';
  end if;

  if exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = v_target.id
      and role.ma = 'SYSTEM_ADMIN'
  ) then
    raise exception using errcode = '42501', message = 'Khong thay doi quan tri he thong tu danh sach nguoi tham gia.';
  end if;

  if v_target.trang_thai::text = p_trang_thai then
    return p_trang_thai;
  end if;

  update public.nguoi_dung
  set trang_thai = p_trang_thai::public.trang_thai_nguoi_dung,
      updated_at = now()
  where id = v_target.id;

  insert into public.nhat_ky_truy_cap(
    co_so_id, nguoi_dung_id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu_cu, du_lieu_moi
  ) values (
    v_target.co_so_id,
    v_actor_id,
    'ADMIN_USER_STATUS_UPDATED',
    'nguoi_dung',
    v_target.id,
    jsonb_build_object('trang_thai', v_target.trang_thai::text),
    jsonb_build_object('trang_thai', p_trang_thai)
  );

  return p_trang_thai;
end;
$$;

create or replace function public.fn_admin_danh_sach_minh_chung(
  p_tu_khoa text default null,
  p_co_so_id uuid default null,
  p_trang_thai text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  co_so_id uuid,
  co_so_ten text,
  nam_hoc_ten text,
  ma text,
  loai_tep text,
  kich_thuoc bigint,
  ngay_ban_hanh date,
  ngay_het_gia_tri date,
  trang_thai_xac_minh text,
  nguoi_tai_len_ten text,
  co_tep boolean,
  co_lien_ket boolean,
  het_han boolean,
  thieu_tham_chieu boolean,
  can_kiem_tra_ky_thuat boolean,
  ghi_chu_ky_thuat text,
  ky_thuat_cap_nhat_luc timestamptz,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tu_khoa text := nullif(pg_catalog.btrim(coalesce(p_tu_khoa, '')), '');
  v_trang_thai text := nullif(pg_catalog.btrim(coalesce(p_trang_thai, '')), '');
begin
  perform public.fn_require_system_admin();

  if p_limit < 1 or p_limit > 100 or p_offset < 0 then
    raise exception using errcode = '22023', message = 'Phan trang khong hop le.';
  end if;

  if v_tu_khoa is not null and char_length(v_tu_khoa) > 100 then
    raise exception using errcode = '22023', message = 'Tu khoa khong duoc vuot qua 100 ky tu.';
  end if;

  if v_trang_thai is not null and v_trang_thai not in (
    'cho_xac_minh', 'da_xac_minh', 'tu_choi', 'het_hieu_luc', 'can_kiem_tra'
  ) then
    raise exception using errcode = '22023', message = 'Trang thai minh chung khong hop le.';
  end if;

  return query
  select
    evidence.id,
    evidence.co_so_id,
    school.ten::text,
    school_year.ten::text,
    evidence.ma::text,
    evidence.loai_tep::text,
    evidence.kich_thuoc,
    evidence.ngay_ban_hanh,
    evidence.ngay_het_gia_tri,
    evidence.trang_thai_xac_minh::text,
    uploader.ho_ten::text,
    evidence.storage_path is not null,
    evidence.duong_dan is not null,
    evidence.ngay_het_gia_tri < current_date,
    evidence.storage_path is null and evidence.duong_dan is null,
    evidence.can_kiem_tra_ky_thuat,
    evidence.ghi_chu_ky_thuat::text,
    evidence.ky_thuat_cap_nhat_luc,
    evidence.created_at,
    count(*) over ()::bigint
  from public.minh_chung evidence
  join public.co_so_giao_duc school on school.id = evidence.co_so_id
  join public.nam_hoc school_year on school_year.id = evidence.nam_hoc_id
  left join public.nguoi_dung uploader on uploader.id = evidence.nguoi_tai_len
  where evidence.deleted_at is null
    and (p_co_so_id is null or evidence.co_so_id = p_co_so_id)
    and (
      v_trang_thai is null
      or (v_trang_thai = 'can_kiem_tra' and (
        evidence.can_kiem_tra_ky_thuat
        or evidence.ngay_het_gia_tri < current_date
        or (evidence.storage_path is null and evidence.duong_dan is null)
      ))
      or evidence.trang_thai_xac_minh::text = v_trang_thai
    )
    and (
      v_tu_khoa is null
      or evidence.ma ilike '%' || v_tu_khoa || '%'
      or evidence.loai_tep ilike '%' || v_tu_khoa || '%'
      or school.ten ilike '%' || v_tu_khoa || '%'
      or school_year.ten ilike '%' || v_tu_khoa || '%'
    )
  order by
    case when (
      evidence.can_kiem_tra_ky_thuat
      or evidence.ngay_het_gia_tri < current_date
      or (evidence.storage_path is null and evidence.duong_dan is null)
    ) then 0 else 1 end,
    evidence.created_at desc,
    evidence.id
  limit p_limit
  offset p_offset;
end;
$$;

create or replace function public.fn_admin_danh_dau_minh_chung(
  p_minh_chung_id uuid,
  p_can_kiem_tra boolean,
  p_ghi_chu text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_co_so_id uuid;
  v_trang_thai_cu boolean;
  v_ghi_chu text := nullif(pg_catalog.btrim(coalesce(p_ghi_chu, '')), '');
begin
  if p_minh_chung_id is null or p_can_kiem_tra is null then
    raise exception using errcode = '22023', message = 'Thong tin danh dau minh chung khong hop le.';
  end if;

  if v_ghi_chu is not null and char_length(v_ghi_chu) > 500 then
    raise exception using errcode = '22023', message = 'Ghi chu ky thuat khong duoc vuot qua 500 ky tu.';
  end if;

  select evidence.co_so_id, evidence.can_kiem_tra_ky_thuat
  into v_co_so_id, v_trang_thai_cu
  from public.minh_chung evidence
  where evidence.id = p_minh_chung_id
    and evidence.deleted_at is null
  for update;

  if v_co_so_id is null then
    raise exception using errcode = 'P0002', message = 'Khong tim thay minh chung.';
  end if;

  update public.minh_chung
  set can_kiem_tra_ky_thuat = p_can_kiem_tra,
      ghi_chu_ky_thuat = case when p_can_kiem_tra then v_ghi_chu else null end,
      ky_thuat_cap_nhat_luc = now(),
      ky_thuat_cap_nhat_boi = v_actor_id,
      updated_at = now()
  where id = p_minh_chung_id;

  insert into public.nhat_ky_truy_cap(
    co_so_id, nguoi_dung_id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu_cu, du_lieu_moi
  ) values (
    v_co_so_id,
    v_actor_id,
    'ADMIN_EVIDENCE_TECHNICAL_FLAG_UPDATED',
    'minh_chung',
    p_minh_chung_id,
    jsonb_build_object('can_kiem_tra_ky_thuat', v_trang_thai_cu),
    jsonb_build_object(
      'can_kiem_tra_ky_thuat', p_can_kiem_tra,
      'co_ghi_chu_ky_thuat', v_ghi_chu is not null
    )
  );
end;
$$;

create or replace function public.fn_admin_danh_sach_bo_tieu_chuan()
returns table (
  id uuid,
  ma_van_ban text,
  ten text,
  loai_hinh text,
  version integer,
  trang_thai text,
  ngay_hieu_luc date,
  ngay_het_hieu_luc date,
  so_tieu_chuan bigint,
  so_tieu_chi bigint,
  so_nam_hoc_su_dung bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public.fn_require_system_admin();

  return query
  select
    standard_set.id,
    standard_set.ma_van_ban::text,
    standard_set.ten,
    standard_set.loai_hinh::text,
    standard_set.version,
    standard_set.trang_thai::text,
    standard_set.ngay_hieu_luc,
    standard_set.ngay_het_hieu_luc,
    count(distinct standard.id)::bigint,
    count(distinct criterion.id)::bigint,
    count(distinct school_year.id)::bigint
  from public.bo_tieu_chuan standard_set
  left join public.tieu_chuan standard on standard.bo_id = standard_set.id
  left join public.tieu_chi criterion on criterion.tieu_chuan_id = standard.id
  left join public.nam_hoc school_year on school_year.bo_tieu_chuan_id = standard_set.id
  group by standard_set.id
  order by standard_set.loai_hinh, standard_set.version desc, standard_set.ma_van_ban;
end;
$$;

create or replace function public.fn_admin_nhat_ky(
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  thoi_diem timestamptz,
  hanh_dong text,
  doi_tuong text,
  doi_tuong_id uuid,
  nguoi_thuc_hien text,
  co_so_ten text,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public.fn_require_system_admin();

  if p_limit < 1 or p_limit > 100 or p_offset < 0 then
    raise exception using errcode = '22023', message = 'Phan trang khong hop le.';
  end if;

  return query
  select
    audit.id,
    audit.thoi_diem,
    audit.hanh_dong::text,
    audit.doi_tuong::text,
    audit.doi_tuong_id,
    coalesce(actor.ho_ten, actor.email, 'He thong')::text,
    school.ten::text,
    count(*) over ()::bigint
  from public.nhat_ky_truy_cap audit
  left join public.nguoi_dung actor on actor.id = audit.nguoi_dung_id
  left join public.co_so_giao_duc school on school.id = audit.co_so_id
  where audit.hanh_dong like 'ADMIN\_%' escape '\'
    or audit.hanh_dong in ('SCHOOL_CREATED_BY_SYSTEM_ADMIN', 'SYSTEM_ADMIN_BOOTSTRAPPED')
  order by audit.thoi_diem desc, audit.id desc
  limit p_limit
  offset p_offset;
end;
$$;

-- Các trigger audit cũ vẫn ghi thay đổi, nhưng chỉ giữ metadata tối thiểu để
-- nội dung tự đánh giá, đường dẫn tệp và dữ liệu nhận diện không đi vào log.
create or replace function public.fn_audit_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid;
  v_doi_tuong_id uuid;
  v_du_lieu_cu jsonb;
  v_du_lieu_moi jsonb;
begin
  if tg_op = 'DELETE' then
    v_co_so_id := (to_jsonb(old)->>'co_so_id')::uuid;
    v_doi_tuong_id := (to_jsonb(old)->>'id')::uuid;
  else
    v_co_so_id := (to_jsonb(new)->>'co_so_id')::uuid;
    v_doi_tuong_id := (to_jsonb(new)->>'id')::uuid;
  end if;

  if tg_table_name = 'minh_chung' then
    if tg_op in ('UPDATE', 'DELETE') then
      v_du_lieu_cu := jsonb_build_object(
        'id', old.id,
        'ma', old.ma,
        'trang_thai_xac_minh', old.trang_thai_xac_minh,
        'can_kiem_tra_ky_thuat', old.can_kiem_tra_ky_thuat
      );
    end if;
    if tg_op in ('INSERT', 'UPDATE') then
      v_du_lieu_moi := jsonb_build_object(
        'id', new.id,
        'ma', new.ma,
        'trang_thai_xac_minh', new.trang_thai_xac_minh,
        'can_kiem_tra_ky_thuat', new.can_kiem_tra_ky_thuat
      );
    end if;
  elsif tg_table_name = 'tu_danh_gia' then
    if tg_op in ('UPDATE', 'DELETE') then
      v_du_lieu_cu := jsonb_build_object(
        'id', old.id,
        'tieu_chi_id', old.tieu_chi_id,
        'muc_dat', old.muc_dat,
        'trang_thai', old.trang_thai
      );
    end if;
    if tg_op in ('INSERT', 'UPDATE') then
      v_du_lieu_moi := jsonb_build_object(
        'id', new.id,
        'tieu_chi_id', new.tieu_chi_id,
        'muc_dat', new.muc_dat,
        'trang_thai', new.trang_thai
      );
    end if;
  else
    v_du_lieu_cu := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
    v_du_lieu_moi := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  end if;

  insert into public.nhat_ky_truy_cap(
    co_so_id,
    nguoi_dung_id,
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    du_lieu_cu,
    du_lieu_moi
  ) values (
    v_co_so_id,
    public.fn_current_nguoi_dung_id(),
    tg_op,
    tg_table_name,
    v_doi_tuong_id,
    v_du_lieu_cu,
    v_du_lieu_moi
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.fn_require_system_admin()
from public, anon, authenticated;

revoke all on function public.fn_admin_tong_quan()
from public, anon, authenticated;
grant execute on function public.fn_admin_tong_quan()
to authenticated;

revoke all on function public.fn_admin_danh_sach_co_so(text, text, text, integer, integer)
from public, anon, authenticated;
grant execute on function public.fn_admin_danh_sach_co_so(text, text, text, integer, integer)
to authenticated;

revoke all on function public.fn_admin_cap_nhat_trang_thai_co_so(uuid, text)
from public, anon, authenticated;
grant execute on function public.fn_admin_cap_nhat_trang_thai_co_so(uuid, text)
to authenticated;

revoke all on function public.fn_admin_tuy_chon_co_so(text, integer)
from public, anon, authenticated;
grant execute on function public.fn_admin_tuy_chon_co_so(text, integer)
to authenticated;

revoke all on function public.fn_admin_danh_sach_nguoi_tham_gia(text, uuid, text, text, integer, integer)
from public, anon, authenticated;
grant execute on function public.fn_admin_danh_sach_nguoi_tham_gia(text, uuid, text, text, integer, integer)
to authenticated;

revoke all on function public.fn_admin_cap_nhat_trang_thai_nguoi_dung(uuid, text)
from public, anon, authenticated;
grant execute on function public.fn_admin_cap_nhat_trang_thai_nguoi_dung(uuid, text)
to authenticated;

revoke all on function public.fn_admin_danh_sach_minh_chung(text, uuid, text, integer, integer)
from public, anon, authenticated;
grant execute on function public.fn_admin_danh_sach_minh_chung(text, uuid, text, integer, integer)
to authenticated;

revoke all on function public.fn_admin_danh_dau_minh_chung(uuid, boolean, text)
from public, anon, authenticated;
grant execute on function public.fn_admin_danh_dau_minh_chung(uuid, boolean, text)
to authenticated;

revoke all on function public.fn_admin_danh_sach_bo_tieu_chuan()
from public, anon, authenticated;
grant execute on function public.fn_admin_danh_sach_bo_tieu_chuan()
to authenticated;

revoke all on function public.fn_admin_nhat_ky(integer, integer)
from public, anon, authenticated;
grant execute on function public.fn_admin_nhat_ky(integer, integer)
to authenticated;

revoke all on function public.fn_audit_change()
from public, anon, authenticated;

comment on function public.fn_admin_danh_sach_minh_chung(text, uuid, text, integer, integer) is
  'Danh sach metadata ky thuat minh chung cho SYSTEM_ADMIN; khong tra noi dung, duong dan, hash hoac URL tai tep.';

comment on function public.fn_admin_nhat_ky(integer, integer) is
  'Nhat ky van hanh an toan cho SYSTEM_ADMIN; khong tra payload cu/moi, JWT, signed URL hoac noi dung nghiep vu.';

commit;
