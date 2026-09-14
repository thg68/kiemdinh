begin;

-- The creator of an assessment/evidence link is historical provenance. A user may
-- later move to another school, so this reference must not require their current
-- school to remain equal to the school where the link was created.
alter table public.tu_danh_gia_minh_chung
  drop constraint if exists fk_tdg_minh_chung_created_by_scope;

alter table public.tu_danh_gia_minh_chung
  add constraint fk_tdg_minh_chung_created_by
  foreign key (created_by)
  references public.nguoi_dung(id)
  on delete restrict;

create or replace function public.fn_admin_cap_nhat_nguoi_tham_gia(
  p_nguoi_dung_id uuid,
  p_co_so_id uuid,
  p_trang_thai text,
  p_la_hieu_truong boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_target public.nguoi_dung%rowtype;
  v_old_school_name text;
  v_new_school_name text;
  v_principal_role_id uuid;
  v_viewer_role_id uuid;
  v_preserved_role_codes text[];
  v_previous_principal_ids uuid[] := '{}'::uuid[];
  v_removed_assignments integer := 0;
  v_removed_council_memberships integer := 0;
  v_released_tasks integer := 0;
  v_is_system_admin boolean := false;
  v_was_principal boolean := false;
  v_school_changed boolean := false;
begin
  if p_nguoi_dung_id is null or p_co_so_id is null or p_trang_thai is null
    or p_la_hieu_truong is null then
    raise exception using errcode = '22023', message = 'Thông tin cài đặt người dùng chưa đầy đủ.';
  end if;

  if p_trang_thai not in ('active', 'inactive', 'locked') then
    raise exception using errcode = '22023', message = 'Trạng thái người dùng không hợp lệ.';
  end if;

  select app_user.*
  into v_target
  from public.nguoi_dung app_user
  where app_user.id = p_nguoi_dung_id
  for update;

  if v_target.id is null then
    raise exception using errcode = 'P0002', message = 'Không tìm thấy người dùng.';
  end if;

  select school.ten
  into v_new_school_name
  from public.co_so_giao_duc school
  where school.id = p_co_so_id
    and school.trang_thai = 'active'
  for update;

  if v_new_school_name is null then
    raise exception using errcode = 'P0002', message = 'Không tìm thấy cơ sở giáo dục đang hoạt động.';
  end if;

  select school.ten
  into v_old_school_name
  from public.co_so_giao_duc school
  where school.id = v_target.co_so_id;

  select exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = v_target.id
      and role.ma = 'SYSTEM_ADMIN'
  ) into v_is_system_admin;

  select exists (
    select 1
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = v_target.id
      and user_role.co_so_id = v_target.co_so_id
      and role.ma = 'PRINCIPAL'
  ) into v_was_principal;

  if v_target.id = v_actor_id and v_target.trang_thai::text <> p_trang_thai then
    raise exception using errcode = '42501', message = 'Không thể thay đổi trạng thái tài khoản của chính mình.';
  end if;

  if v_is_system_admin and v_target.trang_thai::text <> p_trang_thai then
    raise exception using errcode = '42501', message = 'Không thay đổi trạng thái Quản trị hệ thống tại đây.';
  end if;

  if p_la_hieu_truong and p_trang_thai <> 'active' then
    raise exception using errcode = '23514', message = 'Hiệu trưởng phải là tài khoản đang hoạt động.';
  end if;

  select role.id into v_principal_role_id
  from public.vai_tro role
  where role.ma = 'PRINCIPAL';

  select role.id into v_viewer_role_id
  from public.vai_tro role
  where role.ma = 'VIEWER';

  if v_principal_role_id is null or v_viewer_role_id is null then
    raise exception using errcode = 'P0001', message = 'Hệ thống chưa cấu hình đủ vai trò người dùng.';
  end if;

  v_school_changed := v_target.co_so_id <> p_co_so_id;

  if v_school_changed then
    select coalesce(array_agg(distinct role.ma::text), '{}'::text[])
    into v_preserved_role_codes
    from public.nguoi_dung_vai_tro user_role
    join public.vai_tro role on role.id = user_role.vai_tro_id
    where user_role.nguoi_dung_id = v_target.id
      and role.ma in ('SYSTEM_ADMIN', 'TEACHER', 'VIEWER');

    delete from public.phan_cong_tieu_chi assignment
    where assignment.nguoi_dung_id = v_target.id
      and assignment.co_so_id = v_target.co_so_id;
    get diagnostics v_removed_assignments = row_count;

    delete from public.thanh_vien_hoi_dong council_member
    where council_member.nguoi_dung_id = v_target.id
      and council_member.co_so_id = v_target.co_so_id;
    get diagnostics v_removed_council_memberships = row_count;

    update public.ke_hoach_cai_tien plan
    set phu_trach_id = null,
        updated_at = now()
    where plan.phu_trach_id = v_target.id
      and plan.co_so_id = v_target.co_so_id;
    get diagnostics v_released_tasks = row_count;

    delete from public.nguoi_dung_vai_tro user_role
    where user_role.nguoi_dung_id = v_target.id;

    update public.nguoi_dung
    set co_so_id = p_co_so_id,
        updated_at = now()
    where id = v_target.id;

    insert into public.nguoi_dung_vai_tro(
      nguoi_dung_id, vai_tro_id, co_so_id, valid_from, valid_until, created_by
    )
    select
      v_target.id,
      role.id,
      p_co_so_id,
      null,
      null,
      v_actor_id
    from public.vai_tro role
    where role.ma = any(v_preserved_role_codes)
    on conflict (nguoi_dung_id, vai_tro_id, co_so_id) do update
    set valid_from = null,
        valid_until = null,
        created_by = excluded.created_by;

    if not exists (
      select 1
      from public.nguoi_dung_vai_tro user_role
      join public.vai_tro role on role.id = user_role.vai_tro_id
      where user_role.nguoi_dung_id = v_target.id
        and role.ma <> 'SYSTEM_ADMIN'
    ) then
      insert into public.nguoi_dung_vai_tro(
        nguoi_dung_id, vai_tro_id, co_so_id, valid_from, valid_until, created_by
      ) values (
        v_target.id, v_viewer_role_id, p_co_so_id, null, null, v_actor_id
      );
    end if;
  end if;

  update public.nguoi_dung
  set trang_thai = p_trang_thai::public.trang_thai_nguoi_dung,
      updated_at = now()
  where id = v_target.id;

  if p_la_hieu_truong then
    select coalesce(array_agg(user_role.nguoi_dung_id order by user_role.nguoi_dung_id), '{}'::uuid[])
    into v_previous_principal_ids
    from public.nguoi_dung_vai_tro user_role
    where user_role.co_so_id = p_co_so_id
      and user_role.vai_tro_id = v_principal_role_id
      and user_role.nguoi_dung_id <> v_target.id;

    delete from public.nguoi_dung_vai_tro user_role
    where user_role.co_so_id = p_co_so_id
      and user_role.vai_tro_id = v_principal_role_id
      and user_role.nguoi_dung_id <> v_target.id;

    insert into public.nguoi_dung_vai_tro(
      nguoi_dung_id, vai_tro_id, co_so_id, valid_from, valid_until, created_by
    ) values (
      v_target.id, v_principal_role_id, p_co_so_id, null, null, v_actor_id
    )
    on conflict (nguoi_dung_id, vai_tro_id, co_so_id) do update
    set valid_from = null,
        valid_until = null,
        created_by = excluded.created_by;
  else
    delete from public.nguoi_dung_vai_tro user_role
    where user_role.nguoi_dung_id = v_target.id
      and user_role.vai_tro_id = v_principal_role_id;
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
    p_co_so_id,
    v_actor_id,
    'ADMIN_PARTICIPANT_SETTINGS_UPDATED',
    'nguoi_dung',
    v_target.id,
    jsonb_build_object(
      'co_so_id', v_target.co_so_id,
      'co_so_ten', v_old_school_name,
      'trang_thai', v_target.trang_thai::text,
      'la_hieu_truong', v_was_principal
    ),
    jsonb_build_object(
      'co_so_id', p_co_so_id,
      'co_so_ten', v_new_school_name,
      'trang_thai', p_trang_thai,
      'la_hieu_truong', p_la_hieu_truong,
      'phan_cong_da_go', v_removed_assignments,
      'hoi_dong_da_roi', v_removed_council_memberships,
      'nhiem_vu_da_bo_phu_trach', v_released_tasks,
      'hieu_truong_cu_da_thay_the', v_previous_principal_ids
    )
  );
end;
$$;

revoke all on function public.fn_admin_cap_nhat_nguoi_tham_gia(uuid, uuid, text, boolean)
from public, anon, authenticated;
grant execute on function public.fn_admin_cap_nhat_nguoi_tham_gia(uuid, uuid, text, boolean)
to authenticated;

comment on function public.fn_admin_cap_nhat_nguoi_tham_gia(uuid, uuid, text, boolean) is
  'Quản trị hệ thống cập nhật trường, trạng thái và quyền Hiệu trưởng của một người dùng trong một giao dịch.';

comment on constraint fk_tdg_minh_chung_created_by
  on public.tu_danh_gia_minh_chung is
  'Giữ nguyên người đã gắn minh chứng kể cả khi tài khoản được chuyển sang trường khác.';

commit;
