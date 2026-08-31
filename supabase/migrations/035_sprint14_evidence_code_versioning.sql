begin;

-- UUID tieu_chi thay đổi khi văn bản pháp lý có phiên bản mới, nhưng mã logic
-- (ví dụ 1.1) vẫn là thành phần của mã minh chứng. Bộ đếm vì vậy phải khóa
-- theo (co_so_id, ma_tieu_chi) để không cấp lại mã đã tồn tại.
alter table public.bo_dem_ma_minh_chung
  add column ma_tieu_chi varchar(10);

update public.bo_dem_ma_minh_chung counter
set ma_tieu_chi = criterion.ma
from public.tieu_chi criterion
where criterion.id = counter.tieu_chi_id;

create temporary table sprint14_bo_dem_backfill (
  co_so_id uuid not null,
  ma_tieu_chi varchar(10) not null,
  so_tiep_theo integer not null,
  updated_at timestamptz not null,
  primary key (co_so_id, ma_tieu_chi)
) on commit drop;

insert into sprint14_bo_dem_backfill(
  co_so_id,
  ma_tieu_chi,
  so_tiep_theo,
  updated_at
)
select
  counter.co_so_id,
  counter.ma_tieu_chi,
  max(counter.so_tiep_theo),
  max(counter.updated_at)
from public.bo_dem_ma_minh_chung counter
group by counter.co_so_id, counter.ma_tieu_chi;

-- Đối chiếu với kho minh chứng để bảo toàn cả dữ liệu import hoặc dữ liệu cũ
-- từng được tạo bên ngoài bộ đếm.
insert into sprint14_bo_dem_backfill(
  co_so_id,
  ma_tieu_chi,
  so_tiep_theo,
  updated_at
)
select
  evidence.co_so_id,
  split_part(evidence.ma, '.', 2) || '.' || split_part(evidence.ma, '.', 3),
  max(split_part(evidence.ma, '.', 4)::integer) + 1,
  max(evidence.updated_at)
from public.minh_chung evidence
where evidence.ma ~ '^MC\.[1-4]\.[1-5]\.[0-9]+$'
group by
  evidence.co_so_id,
  split_part(evidence.ma, '.', 2) || '.' || split_part(evidence.ma, '.', 3)
on conflict (co_so_id, ma_tieu_chi)
do update set
  so_tiep_theo = greatest(
    sprint14_bo_dem_backfill.so_tiep_theo,
    excluded.so_tiep_theo
  ),
  updated_at = greatest(
    sprint14_bo_dem_backfill.updated_at,
    excluded.updated_at
  );

alter table public.bo_dem_ma_minh_chung
  drop constraint bo_dem_ma_minh_chung_pkey;

alter table public.bo_dem_ma_minh_chung
  drop column tieu_chi_id;

truncate table public.bo_dem_ma_minh_chung;

alter table public.bo_dem_ma_minh_chung
  alter column ma_tieu_chi set not null,
  add constraint ck_bo_dem_ma_tieu_chi_dinh_dang
    check (ma_tieu_chi ~ '^[1-4]\.[1-5]$'),
  add primary key (co_so_id, ma_tieu_chi);

insert into public.bo_dem_ma_minh_chung(
  co_so_id,
  ma_tieu_chi,
  so_tiep_theo,
  updated_at
)
select
  co_so_id,
  ma_tieu_chi,
  so_tiep_theo,
  updated_at
from sprint14_bo_dem_backfill;

create or replace function public.fn_sinh_ma_minh_chung(
  p_tieu_chi_id uuid,
  p_co_so_id uuid
)
returns varchar
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_hien_tai uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_ma_tieu_chi varchar(10);
  v_so_cao_nhat integer;
  v_so integer;
begin
  if auth.uid() is null or v_nguoi_dung_id is null or v_co_so_hien_tai is null then
    raise exception 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;

  if p_co_so_id is distinct from v_co_so_hien_tai then
    raise exception 'Không được sinh mã minh chứng cho cơ sở giáo dục khác.';
  end if;

  if not public.fn_has_permission('evidence.create', v_co_so_hien_tai) then
    raise exception 'Bạn không có quyền tạo minh chứng.';
  end if;

  select criterion.ma
  into v_ma_tieu_chi
  from public.tieu_chi criterion
  where criterion.id = p_tieu_chi_id;

  if v_ma_tieu_chi is null then
    raise exception 'Không tìm thấy tiêu chí %', p_tieu_chi_id;
  end if;

  select coalesce(
    max(substring(evidence.ma from '\.([0-9]+)$')::integer),
    0
  )
  into v_so_cao_nhat
  from public.minh_chung evidence
  where evidence.co_so_id = v_co_so_hien_tai
    and evidence.ma ~ (
      '^MC\.'
      || replace(v_ma_tieu_chi, '.', '\.')
      || '\.[0-9]+$'
    );

  -- UPSERT trên khóa logic vừa đồng bộ với kho vừa tuần tự hóa các yêu cầu
  -- đồng thời, tránh hai phiên cùng nhận một mã.
  insert into public.bo_dem_ma_minh_chung(
    co_so_id,
    ma_tieu_chi,
    so_tiep_theo
  )
  values (
    v_co_so_hien_tai,
    v_ma_tieu_chi,
    v_so_cao_nhat + 2
  )
  on conflict (co_so_id, ma_tieu_chi)
  do update set
    so_tiep_theo = greatest(
      public.bo_dem_ma_minh_chung.so_tiep_theo,
      v_so_cao_nhat + 1
    ) + 1,
    updated_at = now()
  returning so_tiep_theo - 1 into v_so;

  return 'MC.' || v_ma_tieu_chi || '.' || lpad(v_so::text, 2, '0');
end;
$$;

create or replace function public.fn_tao_minh_chung(
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
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_ma varchar;
  v_minh_chung_id uuid;
  v_tieu_chi_id uuid;
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;

  if p_tieu_chi_ids is null or array_length(p_tieu_chi_ids, 1) is null then
    raise exception 'Hãy chọn ít nhất một tiêu chí.';
  end if;

  if p_tieu_chi_goc_id is null or p_tieu_chi_goc_id <> all(p_tieu_chi_ids) then
    raise exception 'Tiêu chí gốc phải nằm trong danh sách tiêu chí đã chọn.';
  end if;

  if not exists (
    select 1
    from public.nam_hoc school_year
    where school_year.id = p_nam_hoc_id
      and school_year.co_so_id = v_co_so_id
  ) then
    raise exception 'Năm học không thuộc cơ sở giáo dục hiện tại.';
  end if;

  -- Kiểm tra toàn bộ mảng trước khi sinh mã để lỗi sai phiên bản không
  -- làm thay đổi bộ đếm hay tạo dữ liệu dở dang.
  if exists (
    select 1
    from unnest(p_tieu_chi_ids) selected(tieu_chi_id)
    where selected.tieu_chi_id is null
      or not public.fn_tieu_chi_thuoc_nam_hoc(
        p_nam_hoc_id,
        selected.tieu_chi_id
      )
  ) then
    raise exception 'Tiêu chí đã chọn không thuộc phiên bản bộ tiêu chuẩn của năm học.';
  end if;

  if not public.fn_user_has_tenant_evidence_role(
    v_co_so_id,
    'evidence.create'
  ) then
    if public.fn_has_role('MEMBER', v_co_so_id)
      or public.fn_has_role('TEACHER', v_co_so_id)
    then
      foreach v_tieu_chi_id in array p_tieu_chi_ids loop
        if not public.fn_is_assigned_to_criterion(
          v_tieu_chi_id,
          p_nam_hoc_id
        ) then
          raise exception 'Bạn chưa được phân công tiêu chí này.';
        end if;
      end loop;
    else
      raise exception 'Bạn không có quyền tạo minh chứng.';
    end if;
  end if;

  v_ma := public.fn_sinh_ma_minh_chung(
    p_tieu_chi_goc_id,
    v_co_so_id
  );

  insert into public.minh_chung(
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
    insert into public.minh_chung_tieu_chi(
      minh_chung_id,
      tieu_chi_id,
      la_tieu_chi_goc,
      created_by
    )
    values (
      v_minh_chung_id,
      v_tieu_chi_id,
      v_tieu_chi_id = p_tieu_chi_goc_id,
      v_nguoi_dung_id
    )
    on conflict (minh_chung_id, tieu_chi_id) do nothing;
  end loop;

  perform public.fn_log_audit(
    'EVIDENCE_CREATED',
    'minh_chung',
    v_minh_chung_id,
    null,
    jsonb_build_object(
      'ma',
      v_ma,
      'tieu_chi_ids',
      p_tieu_chi_ids
    )
  );

  return v_minh_chung_id;
end;
$$;

create or replace function public.fn_gan_minh_chung_tieu_chi(
  p_minh_chung_id uuid,
  p_tieu_chi_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_minh_chung public.minh_chung%rowtype;
  v_tieu_chi_id uuid;
begin
  if auth.uid() is null
    or public.fn_current_nguoi_dung_id() is null
    or public.fn_current_co_so_id() is null
  then
    raise exception 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;

  if p_tieu_chi_ids is null or array_length(p_tieu_chi_ids, 1) is null then
    raise exception 'Hãy chọn ít nhất một tiêu chí.';
  end if;

  select evidence.*
  into v_minh_chung
  from public.minh_chung evidence
  where evidence.id = p_minh_chung_id
    and evidence.co_so_id = public.fn_current_co_so_id()
    and evidence.deleted_at is null;

  if v_minh_chung.id is null then
    raise exception 'Không tìm thấy minh chứng trong cơ sở giáo dục hiện tại.';
  end if;

  if exists (
    select 1
    from unnest(p_tieu_chi_ids) selected(tieu_chi_id)
    where selected.tieu_chi_id is null
      or not public.fn_tieu_chi_thuoc_nam_hoc(
        v_minh_chung.nam_hoc_id,
        selected.tieu_chi_id
      )
  ) then
    raise exception 'Tiêu chí đã chọn không thuộc phiên bản bộ tiêu chuẩn của năm học.';
  end if;

  if not public.fn_user_has_tenant_evidence_role(
    v_minh_chung.co_so_id,
    'evidence.link'
  ) then
    if public.fn_has_role('MEMBER', v_minh_chung.co_so_id) then
      foreach v_tieu_chi_id in array p_tieu_chi_ids loop
        if not public.fn_is_assigned_to_criterion(
          v_tieu_chi_id,
          v_minh_chung.nam_hoc_id
        ) then
          raise exception 'Bạn chưa được phân công tiêu chí này.';
        end if;
      end loop;
    else
      raise exception 'Bạn không có quyền gắn minh chứng.';
    end if;
  end if;

  foreach v_tieu_chi_id in array p_tieu_chi_ids loop
    insert into public.minh_chung_tieu_chi(
      minh_chung_id,
      tieu_chi_id,
      la_tieu_chi_goc,
      created_by
    )
    values (
      p_minh_chung_id,
      v_tieu_chi_id,
      false,
      public.fn_current_nguoi_dung_id()
    )
    on conflict (minh_chung_id, tieu_chi_id) do nothing;
  end loop;

  perform public.fn_log_audit(
    'EVIDENCE_LINKED',
    'minh_chung',
    p_minh_chung_id,
    null,
    jsonb_build_object('tieu_chi_ids', p_tieu_chi_ids)
  );
end;
$$;

create or replace function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
  p_nam_hoc_id uuid,
  p_nguoi_dung_id uuid,
  p_tieu_chi_ids uuid[],
  p_vai_tro_trong_tieu_chi text default 'phu_trach_nhap_lieu'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_tieu_chi_id uuid;
begin
  if v_co_so_id is null or public.fn_current_nguoi_dung_id() is null then
    raise exception 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;

  if not public.fn_can_manage_assignment(v_co_so_id) then
    raise exception 'Chỉ Hiệu trưởng hoặc Chủ tịch hội đồng mới được phân công tiêu chí.';
  end if;

  if not exists (
    select 1
    from public.nam_hoc school_year
    where school_year.id = p_nam_hoc_id
      and school_year.co_so_id = v_co_so_id
  ) then
    raise exception 'Năm học không thuộc đơn vị hiện tại.';
  end if;

  if not exists (
    select 1
    from public.nguoi_dung app_user
    where app_user.id = p_nguoi_dung_id
      and app_user.co_so_id = v_co_so_id
  ) then
    raise exception 'Người dùng không thuộc đơn vị hiện tại.';
  end if;

  -- Phải kiểm tra trước lệnh DELETE; nếu client gửi UUID của phiên bản cũ thì
  -- phân công hợp lệ đang có không bị xóa rồi mới phát hiện lỗi.
  if exists (
    select 1
    from unnest(coalesce(p_tieu_chi_ids, array[]::uuid[])) selected(tieu_chi_id)
    where selected.tieu_chi_id is null
      or not public.fn_tieu_chi_thuoc_nam_hoc(
        p_nam_hoc_id,
        selected.tieu_chi_id
      )
  ) then
    raise exception 'Tiêu chí phân công không thuộc phiên bản bộ tiêu chuẩn của năm học.';
  end if;

  delete from public.phan_cong_tieu_chi assignment
  where assignment.co_so_id = v_co_so_id
    and assignment.nam_hoc_id = p_nam_hoc_id
    and assignment.nguoi_dung_id = p_nguoi_dung_id;

  foreach v_tieu_chi_id in array coalesce(
    p_tieu_chi_ids,
    array[]::uuid[]
  ) loop
    insert into public.phan_cong_tieu_chi(
      co_so_id,
      nam_hoc_id,
      nguoi_dung_id,
      tieu_chi_id,
      vai_tro_trong_tieu_chi,
      vai_tro_phan_cong,
      created_by
    )
    values (
      v_co_so_id,
      p_nam_hoc_id,
      p_nguoi_dung_id,
      v_tieu_chi_id,
      p_vai_tro_trong_tieu_chi,
      p_vai_tro_trong_tieu_chi,
      public.fn_current_nguoi_dung_id()
    )
    on conflict (nam_hoc_id, nguoi_dung_id, tieu_chi_id)
    do update set
      vai_tro_trong_tieu_chi = excluded.vai_tro_trong_tieu_chi,
      vai_tro_phan_cong = excluded.vai_tro_phan_cong,
      updated_at = now();
  end loop;

  perform public.fn_log_audit(
    'ASSIGNMENT_UPDATED',
    'phan_cong_tieu_chi',
    p_nguoi_dung_id,
    null,
    jsonb_build_object(
      'nam_hoc_id',
      p_nam_hoc_id,
      'nguoi_dung_id',
      p_nguoi_dung_id,
      'tieu_chi_ids',
      p_tieu_chi_ids,
      'vai_tro_trong_tieu_chi',
      p_vai_tro_trong_tieu_chi
    )
  );
end;
$$;

-- Hàm sinh mã và helper phiên bản chỉ được các RPC SECURITY DEFINER gọi.
revoke all on function public.fn_sinh_ma_minh_chung(uuid, uuid)
from public, anon, authenticated;

revoke all on function public.fn_tao_minh_chung(
  uuid,
  uuid[],
  uuid,
  text,
  varchar,
  text,
  text,
  varchar,
  bigint,
  date,
  date
) from public, anon, authenticated;
grant execute on function public.fn_tao_minh_chung(
  uuid,
  uuid[],
  uuid,
  text,
  varchar,
  text,
  text,
  varchar,
  bigint,
  date,
  date
) to authenticated;

revoke all on function public.fn_gan_minh_chung_tieu_chi(uuid, uuid[])
from public, anon, authenticated;
grant execute on function public.fn_gan_minh_chung_tieu_chi(uuid, uuid[])
to authenticated;

revoke all on function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
  uuid,
  uuid,
  uuid[],
  text
) from public, anon, authenticated;
grant execute on function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
  uuid,
  uuid,
  uuid[],
  text
) to authenticated;

commit;
