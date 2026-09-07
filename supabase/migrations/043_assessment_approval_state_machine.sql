begin;

alter table public.tu_danh_gia
  add column if not exists revision bigint not null default 1;

alter table public.tu_danh_gia
  drop constraint if exists ck_tu_danh_gia_revision_positive;
alter table public.tu_danh_gia
  add constraint ck_tu_danh_gia_revision_positive check (revision > 0);

comment on column public.tu_danh_gia.revision is
  'So phien ban tang sau moi lan cap nhat, dung de chan ghi de du lieu da thay doi.';

create or replace function public.fn_bump_tu_danh_gia_revision()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;

drop trigger if exists trg_bump_tu_danh_gia_revision on public.tu_danh_gia;
create trigger trg_bump_tu_danh_gia_revision
before update on public.tu_danh_gia
for each row execute function public.fn_bump_tu_danh_gia_revision();

-- Chỉ RPC chuyển trạng thái mới được phép mở khóa đường chuyển. Nhờ đó việc gọi
-- UPDATE trực tiếp qua PostgREST không thể bỏ qua state machine và phân quyền.
create or replace function public.fn_guard_tu_danh_gia_workflow()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.trang_thai is distinct from new.trang_thai
    and coalesce(current_setting('app.assessment_status_transition', true), '') <> 'allowed'
  then
    raise exception using
      errcode = '55000',
      message = 'Trang thai tu danh gia chi duoc thay doi qua quy trinh duyet.';
  end if;

  if old.trang_thai in (
      'cho_duyet'::public.trang_thai_tu_danh_gia,
      'da_duyet'::public.trang_thai_tu_danh_gia
    )
    and (
      old.mo_ta_muc_1 is distinct from new.mo_ta_muc_1
      or old.dat_muc_1 is distinct from new.dat_muc_1
      or old.mo_ta_muc_2 is distinct from new.mo_ta_muc_2
      or old.dat_muc_2 is distinct from new.dat_muc_2
      or old.muc_dat is distinct from new.muc_dat
      or old.tieu_chi_id is distinct from new.tieu_chi_id
      or old.cap_hoc is distinct from new.cap_hoc
      or old.nam_hoc_id is distinct from new.nam_hoc_id
      or old.co_so_id is distinct from new.co_so_id
    )
  then
    raise exception using
      errcode = '55000',
      message = 'Ban tu danh gia dang cho duyet hoac da duyet, khong the sua noi dung.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_tu_danh_gia_workflow on public.tu_danh_gia;
create trigger trg_guard_tu_danh_gia_workflow
before update on public.tu_danh_gia
for each row execute function public.fn_guard_tu_danh_gia_workflow();

create or replace function public.fn_guard_tu_danh_gia_minh_chung_workflow()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_tu_danh_gia_id uuid := case when tg_op = 'DELETE' then old.tu_danh_gia_id else new.tu_danh_gia_id end;
  v_trang_thai public.trang_thai_tu_danh_gia;
begin
  select assessment.trang_thai
  into v_trang_thai
  from public.tu_danh_gia assessment
  where assessment.id = v_tu_danh_gia_id;

  if v_trang_thai in (
    'cho_duyet'::public.trang_thai_tu_danh_gia,
    'da_duyet'::public.trang_thai_tu_danh_gia
  ) then
    raise exception using
      errcode = '55000',
      message = 'Ban tu danh gia dang cho duyet hoac da duyet, khong the thay doi minh chung.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_guard_tdg_minh_chung_workflow
on public.tu_danh_gia_minh_chung;
create trigger trg_guard_tdg_minh_chung_workflow
before insert or update or delete on public.tu_danh_gia_minh_chung
for each row execute function public.fn_guard_tu_danh_gia_minh_chung_workflow();

drop function if exists public.fn_cap_nhat_trang_thai_tu_danh_gia(
  uuid, public.cap_hoc, uuid, public.trang_thai_tu_danh_gia
);

create or replace function public.fn_cap_nhat_trang_thai_tu_danh_gia(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_tieu_chi_id uuid,
  p_trang_thai public.trang_thai_tu_danh_gia,
  p_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_assessment public.tu_danh_gia%rowtype;
  v_new_revision bigint;
  v_is_approver boolean;
begin
  if v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception using errcode = '28000', message = 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  select assessment.*
  into v_assessment
  from public.tu_danh_gia assessment
  where assessment.co_so_id = v_co_so_id
    and assessment.nam_hoc_id = p_nam_hoc_id
    and assessment.cap_hoc = p_cap_hoc
    and assessment.tieu_chi_id = p_tieu_chi_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Khong tim thay ban tu danh gia trong pham vi da chon.';
  end if;

  if v_assessment.revision <> p_expected_revision then
    raise exception using
      errcode = '40001',
      message = 'Ban tu danh gia da thay doi. Hay tai lai du lieu truoc khi thao tac.';
  end if;

  v_is_approver := public.fn_has_permission('assessment.approve', v_co_so_id)
    and (
      public.fn_has_role('PRINCIPAL', v_co_so_id)
      or public.fn_has_role('SELF_ASSESSMENT_CHAIR', v_co_so_id)
    );

  if p_trang_thai = 'cho_duyet'::public.trang_thai_tu_danh_gia then
    if v_assessment.trang_thai not in (
      'nhap'::public.trang_thai_tu_danh_gia,
      'dang_ra_soat'::public.trang_thai_tu_danh_gia,
      'ke_thua_cho_cap_nhat'::public.trang_thai_tu_danh_gia
    ) then
      raise exception using errcode = '55000', message = 'Chi co the gui duyet tu ban nhap hoac ban dang ra soat.';
    end if;

    if not public.fn_can_write_tu_danh_gia(
      v_co_so_id, p_nam_hoc_id, p_tieu_chi_id
    ) then
      raise exception using errcode = '42501', message = 'Ban khong co quyen gui duyet tu danh gia nay.';
    end if;
  elsif p_trang_thai in (
    'da_duyet'::public.trang_thai_tu_danh_gia,
    'dang_ra_soat'::public.trang_thai_tu_danh_gia
  ) then
    if v_assessment.trang_thai <> 'cho_duyet'::public.trang_thai_tu_danh_gia then
      raise exception using errcode = '55000', message = 'Chi co the duyet tu trang thai cho duyet.';
    end if;

    if not v_is_approver then
      raise exception using errcode = '42501', message = 'Ban khong co quyen duyet tu danh gia.';
    end if;
  else
    raise exception using errcode = '22023', message = 'Trang thai dich khong nam trong quy trinh duyet.';
  end if;

  -- Khi ghi nhận mức đạt, toàn bộ minh chứng của đúng bản tự đánh giá/cấp học
  -- phải đã xác minh và còn hiệu lực. Một minh chứng lỗi không được che bởi một
  -- minh chứng hợp lệ khác.
  if p_trang_thai in (
      'cho_duyet'::public.trang_thai_tu_danh_gia,
      'da_duyet'::public.trang_thai_tu_danh_gia
    )
    and v_assessment.muc_dat > 0
    and (
      not public.fn_minh_chung_hop_le_cho_tu_danh_gia(
        v_assessment.id,
        v_assessment.co_so_id,
        v_assessment.nam_hoc_id,
        v_assessment.tieu_chi_id
      )
      or exists (
        select 1
        from public.tu_danh_gia_minh_chung scoped_link
        join public.minh_chung evidence
          on evidence.id = scoped_link.minh_chung_id
          and evidence.co_so_id = scoped_link.co_so_id
          and evidence.nam_hoc_id = scoped_link.nam_hoc_id
        join public.nam_hoc school_year
          on school_year.id = evidence.nam_hoc_id
          and school_year.co_so_id = evidence.co_so_id
        where scoped_link.tu_danh_gia_id = v_assessment.id
          and (
            evidence.deleted_at is not null
            or evidence.trang_thai_xac_minh <> 'da_xac_minh'
            or (
              evidence.ngay_het_gia_tri is not null
              and evidence.ngay_het_gia_tri < least(current_date, school_year.ngay_ket_thuc)
            )
          )
      )
    )
  then
    raise exception using
      errcode = '23514',
      message = 'Tat ca minh chung cua ban tu danh gia phai da xac minh va con hieu luc.';
  end if;

  perform set_config('app.assessment_status_transition', 'allowed', true);

  update public.tu_danh_gia assessment
  set trang_thai = p_trang_thai,
      nguoi_duyet = case
        when p_trang_thai = 'da_duyet'::public.trang_thai_tu_danh_gia then v_nguoi_dung_id
        when p_trang_thai in (
          'cho_duyet'::public.trang_thai_tu_danh_gia,
          'dang_ra_soat'::public.trang_thai_tu_danh_gia
        ) then null
        else assessment.nguoi_duyet
      end,
      updated_at = now(),
      ngay_cap_nhat = now()
  where assessment.id = v_assessment.id
  returning assessment.revision into v_new_revision;

  perform public.fn_log_audit(
    'ASSESSMENT_STATUS_UPDATED',
    'tu_danh_gia',
    v_assessment.id,
    jsonb_build_object(
      'trang_thai', v_assessment.trang_thai,
      'revision', v_assessment.revision
    ),
    jsonb_build_object(
      'trang_thai', p_trang_thai,
      'revision', v_new_revision,
      'nam_hoc_id', p_nam_hoc_id,
      'cap_hoc', p_cap_hoc,
      'tieu_chi_id', p_tieu_chi_id
    )
  );

  return jsonb_build_object(
    'id', v_assessment.id,
    'co_so_id', v_assessment.co_so_id,
    'nam_hoc_id', v_assessment.nam_hoc_id,
    'cap_hoc', v_assessment.cap_hoc,
    'tieu_chi_id', v_assessment.tieu_chi_id,
    'trang_thai', p_trang_thai,
    'revision', v_new_revision
  );
end;
$$;

revoke all on function public.fn_cap_nhat_trang_thai_tu_danh_gia(
  uuid, public.cap_hoc, uuid, public.trang_thai_tu_danh_gia, bigint
) from public, anon;
grant execute on function public.fn_cap_nhat_trang_thai_tu_danh_gia(
  uuid, public.cap_hoc, uuid, public.trang_thai_tu_danh_gia, bigint
) to authenticated;

commit;
