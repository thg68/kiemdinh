begin;

-- Mot cap hoc cu the chi co mot phan cong cho cung nguoi va tieu chi.
-- Dung named constraint de ON CONFLICT co arbiter ro rang cho ca runtime va lint.
alter table public.phan_cong_tieu_chi
  drop constraint if exists uq_phan_cong_nam_nguoi_tieu_chi_cap;
drop index if exists public.uq_phan_cong_nam_nguoi_tieu_chi_cap;
alter table public.phan_cong_tieu_chi
  add constraint uq_phan_cong_nam_nguoi_tieu_chi_cap
  unique nulls not distinct (
    nam_hoc_id,
    nguoi_dung_id,
    tieu_chi_id,
    cap_hoc
  );

-- Overload cu khong co cap_hoc da bi thu hoi quyen tu migration 042 va khong
-- con phu hop voi mo hinh truong nhieu cap. Xoa de tranh client goi nham va
-- de schema checker khong phan tich conflict target da het hieu luc.
drop function if exists public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
  uuid,
  uuid,
  uuid[],
  text
);

create or replace function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
  p_nam_hoc_id uuid,
  p_cap_hoc public.cap_hoc,
  p_nguoi_dung_id uuid,
  p_tieu_chi_ids uuid[],
  p_vai_tro_trong_tieu_chi text default 'phu_trach_nhap_lieu'
)
returns void
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_tieu_chi_id uuid;
begin
  if v_co_so_id is null or public.fn_current_nguoi_dung_id() is null then
    raise exception using errcode = '42501', message = 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;
  if not public.fn_can_manage_assignment(v_co_so_id) then
    raise exception using errcode = '42501', message = 'Chỉ Hiệu trưởng hoặc Chủ tịch hội đồng mới được phân công tiêu chí.';
  end if;
  if p_vai_tro_trong_tieu_chi not in ('phu_trach_nhap_lieu', 'ra_soat', 'tong_hop') then
    raise exception using errcode = '22023', message = 'Vai trò trong phân công không hợp lệ.';
  end if;
  if not exists (
    select 1 from public.nam_hoc school_year
    join public.co_so_giao_duc school on school.id = school_year.co_so_id
    where school_year.id = p_nam_hoc_id and school_year.co_so_id = v_co_so_id
      and p_cap_hoc = any(school.cap_hoc)
  ) then
    raise exception using errcode = '22023', message = 'Năm học hoặc cấp học không thuộc đơn vị hiện tại.';
  end if;
  if not exists (
    select 1 from public.nguoi_dung app_user
    where app_user.id = p_nguoi_dung_id
      and app_user.co_so_id = v_co_so_id
      and app_user.trang_thai = 'active'
      and exists (
        select 1 from public.nguoi_dung_vai_tro user_role
        join public.vai_tro role on role.id = user_role.vai_tro_id
        where user_role.nguoi_dung_id = app_user.id
          and user_role.co_so_id = v_co_so_id
          and role.ma in ('MEMBER', 'TEACHER')
      )
  ) then
    raise exception using errcode = '22023', message = 'Chỉ được phân công tài khoản đang hoạt động có vai trò Ủy viên/Tổ trưởng hoặc Giáo viên.';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_tieu_chi_ids, array[]::uuid[])) selected(tieu_chi_id)
    where selected.tieu_chi_id is null
      or not public.fn_tieu_chi_thuoc_nam_hoc(p_nam_hoc_id, selected.tieu_chi_id)
  ) then
    raise exception using errcode = '22023', message = 'Tiêu chí phân công không thuộc phiên bản bộ tiêu chuẩn của năm học.';
  end if;

  delete from public.phan_cong_tieu_chi assignment
  where assignment.co_so_id = v_co_so_id
    and assignment.nam_hoc_id = p_nam_hoc_id
    and assignment.cap_hoc = p_cap_hoc
    and assignment.nguoi_dung_id = p_nguoi_dung_id;

  foreach v_tieu_chi_id in array coalesce(p_tieu_chi_ids, array[]::uuid[]) loop
    insert into public.phan_cong_tieu_chi(
      co_so_id, nam_hoc_id, cap_hoc, nguoi_dung_id, tieu_chi_id,
      vai_tro_trong_tieu_chi, vai_tro_phan_cong, created_by, can_ra_soat
    ) values (
      v_co_so_id, p_nam_hoc_id, p_cap_hoc, p_nguoi_dung_id, v_tieu_chi_id,
      p_vai_tro_trong_tieu_chi, p_vai_tro_trong_tieu_chi,
      public.fn_current_nguoi_dung_id(), false
    )
    on conflict on constraint uq_phan_cong_nam_nguoi_tieu_chi_cap
    do update set vai_tro_trong_tieu_chi = excluded.vai_tro_trong_tieu_chi,
      vai_tro_phan_cong = excluded.vai_tro_phan_cong,
      can_ra_soat = false,
      updated_at = now();
  end loop;

  perform public.fn_log_audit(
    'ASSIGNMENT_UPDATED', 'phan_cong_tieu_chi', p_nguoi_dung_id, null,
    jsonb_build_object(
      'nam_hoc_id', p_nam_hoc_id,
      'cap_hoc', p_cap_hoc,
      'criterion_count', cardinality(coalesce(p_tieu_chi_ids, array[]::uuid[])),
      'vai_tro_trong_tieu_chi', p_vai_tro_trong_tieu_chi
    )
  );
end;
$$;

revoke all on function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
  uuid, public.cap_hoc, uuid, uuid[], text
) from public, anon, authenticated;
grant execute on function public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
  uuid, public.cap_hoc, uuid, uuid[], text
) to authenticated;

commit;
