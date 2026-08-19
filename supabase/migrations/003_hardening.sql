-- Sprint 2.5: vá các điểm hardening trước khi chuyển sang tự đánh giá.

create table if not exists van_ban_lien_quan (
  id uuid primary key default gen_random_uuid(),
  co_so_id uuid not null references co_so_giao_duc(id),
  nam_hoc_id uuid not null,
  ten text not null,
  so_hieu varchar(100),
  co_quan_ban_hanh varchar(255),
  ngay_ban_hanh date,
  ngay_hieu_luc date,
  ngay_het_hieu_luc date,
  duong_dan text,
  ghi_chu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (nam_hoc_id, co_so_id) references nam_hoc(id, co_so_id)
);

create index if not exists idx_van_ban_lien_quan_co_so_nam
on van_ban_lien_quan(co_so_id, nam_hoc_id);

alter table van_ban_lien_quan enable row level security;

drop trigger if exists trg_van_ban_lien_quan_updated_at on van_ban_lien_quan;
create trigger trg_van_ban_lien_quan_updated_at
before update on van_ban_lien_quan
for each row execute function fn_set_updated_at();

create policy "van_ban_lien_quan_select_same_tenant" on van_ban_lien_quan
for select to authenticated
using (co_so_id = fn_current_co_so_id());

create policy "van_ban_lien_quan_write_same_tenant" on van_ban_lien_quan
for all to authenticated
using (
  co_so_id = fn_current_co_so_id()
  and (
    fn_has_role('PRINCIPAL', co_so_id)
    or fn_has_role('SELF_ASSESSMENT_CHAIR', co_so_id)
    or fn_has_role('SECRETARY', co_so_id)
  )
)
with check (
  co_so_id = fn_current_co_so_id()
  and (
    fn_has_role('PRINCIPAL', co_so_id)
    or fn_has_role('SELF_ASSESSMENT_CHAIR', co_so_id)
    or fn_has_role('SECRETARY', co_so_id)
  )
);

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

  if p_tieu_chi_ids is null or array_length(p_tieu_chi_ids, 1) is null then
    raise exception 'Hãy chọn ít nhất một tiêu chí.';
  end if;

  if p_tieu_chi_goc_id is null or p_tieu_chi_goc_id <> all(p_tieu_chi_ids) then
    raise exception 'Tiêu chí gốc phải nằm trong danh sách tiêu chí đã chọn.';
  end if;

  if not exists (
    select 1
    from nam_hoc
    where id = p_nam_hoc_id
      and co_so_id = v_co_so_id
  ) then
    raise exception 'Năm học không thuộc cơ sở giáo dục hiện tại.';
  end if;

  -- Phân quyền nghiệp vụ: Principal/Chair/Secretary thao tác toàn tenant;
  -- Member và Teacher chỉ được tạo minh chứng cho tiêu chí được phân công.
  if not fn_user_has_tenant_evidence_role(v_co_so_id, 'evidence.create') then
    if fn_has_role('MEMBER', v_co_so_id) or fn_has_role('TEACHER', v_co_so_id) then
      foreach v_tieu_chi_id in array p_tieu_chi_ids loop
        if not fn_is_assigned_to_criterion(v_tieu_chi_id, p_nam_hoc_id) then
          raise exception 'Bạn chưa được phân công tiêu chí này.';
        end if;
      end loop;
    else
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

grant execute on function fn_log_audit(varchar, varchar, uuid, jsonb, jsonb) to authenticated;
