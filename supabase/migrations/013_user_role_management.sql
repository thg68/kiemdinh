-- Quan ly nguoi dung va vai tro trong don vi.
-- Chi Hieu truong trong co so hien tai duoc moi/giam vai tro nguoi dung.

create or replace function fn_user_role_labels(p_nguoi_dung_id uuid default null)
returns table (ma text, ten text)
language sql
stable
security definer
set search_path = public
as $$
  select vt.ma::text, vt.ten::text
  from nguoi_dung nd
  join nguoi_dung_vai_tro ndvt on ndvt.nguoi_dung_id = nd.id
  join vai_tro vt on vt.id = ndvt.vai_tro_id
  where nd.id = coalesce(p_nguoi_dung_id, fn_current_nguoi_dung_id())
    and nd.co_so_id = fn_current_co_so_id()
  order by vt.ten
$$;

create or replace function fn_can_manage_users(p_co_so_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_co_so_id = fn_current_co_so_id()
    and (
      fn_has_role('PRINCIPAL', p_co_so_id)
      or fn_has_role('SYSTEM_ADMIN')
    )
$$;

create or replace function fn_allowed_assignable_role(p_role text)
returns boolean
language sql
immutable
as $$
  select p_role in (
    'SELF_ASSESSMENT_CHAIR',
    'SECRETARY',
    'MEMBER',
    'TEACHER',
    'VIEWER'
  )
$$;

create or replace function fn_moi_nguoi_dung_vao_co_so(
  p_email text,
  p_ho_ten text,
  p_vai_tro_ma text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_auth_user_id uuid;
  v_nguoi_dung_id uuid;
  v_vai_tro_id uuid;
begin
  if v_co_so_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not fn_can_manage_users(v_co_so_id) then
    raise exception 'Chi Hieu truong moi duoc quan ly nguoi dung trong don vi.';
  end if;

  if not fn_allowed_assignable_role(p_vai_tro_ma) then
    raise exception 'Vai tro nay khong duoc gan tu man hinh don vi.';
  end if;

  select id into v_auth_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_auth_user_id is null then
    raise exception 'Chua tim thay tai khoan Auth voi email %. Hay yeu cau nguoi dung tao tai khoan truoc.', p_email;
  end if;

  if exists (
    select 1
    from nguoi_dung
    where auth_user_id = v_auth_user_id
      and co_so_id <> v_co_so_id
  ) then
    raise exception 'Tai khoan nay da thuoc mot co so giao duc khac.';
  end if;

  insert into nguoi_dung(auth_user_id, co_so_id, ho_ten, email, trang_thai)
  values (
    v_auth_user_id,
    v_co_so_id,
    coalesce(nullif(trim(p_ho_ten), ''), p_email),
    lower(trim(p_email)),
    'active'
  )
  on conflict (auth_user_id) do update
    set ho_ten = coalesce(nullif(trim(p_ho_ten), ''), nguoi_dung.ho_ten),
        email = lower(trim(p_email)),
        trang_thai = 'active',
        updated_at = now()
    where nguoi_dung.co_so_id = v_co_so_id
  returning id into v_nguoi_dung_id;

  select id into v_vai_tro_id
  from vai_tro
  where ma = p_vai_tro_ma;

  insert into nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id, created_by)
  values (v_nguoi_dung_id, v_vai_tro_id, v_co_so_id, fn_current_nguoi_dung_id())
  on conflict (nguoi_dung_id, vai_tro_id, co_so_id) do nothing;

  perform fn_log_audit(
    'USER_ROLE_ASSIGNED',
    'nguoi_dung',
    v_nguoi_dung_id,
    null,
    jsonb_build_object('email', lower(trim(p_email)), 'vai_tro', p_vai_tro_ma)
  );

  return v_nguoi_dung_id;
end;
$$;

create or replace function fn_cap_nhat_vai_tro_nguoi_dung(
  p_nguoi_dung_id uuid,
  p_vai_tro_mas text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_co_so_id uuid := fn_current_co_so_id();
  v_role text;
  v_target_current_user boolean;
begin
  if v_co_so_id is null then
    raise exception 'Ban can dang nhap va thuoc mot co so giao duc.';
  end if;

  if not fn_can_manage_users(v_co_so_id) then
    raise exception 'Chi Hieu truong moi duoc cap nhat vai tro nguoi dung.';
  end if;

  if not exists (
    select 1 from nguoi_dung
    where id = p_nguoi_dung_id
      and co_so_id = v_co_so_id
  ) then
    raise exception 'Nguoi dung khong thuoc don vi hien tai.';
  end if;

  foreach v_role in array p_vai_tro_mas loop
    if not fn_allowed_assignable_role(v_role) then
      raise exception 'Vai tro % khong duoc gan tu man hinh don vi.', v_role;
    end if;
  end loop;

  v_target_current_user := p_nguoi_dung_id = fn_current_nguoi_dung_id();

  if v_target_current_user then
    raise exception 'Khong cap nhat vai tro cua chinh minh tu man hinh nay de tranh khoa quyen quan tri.';
  end if;

  delete from nguoi_dung_vai_tro ndvt
  using vai_tro vt
  where ndvt.vai_tro_id = vt.id
    and ndvt.nguoi_dung_id = p_nguoi_dung_id
    and ndvt.co_so_id = v_co_so_id
    and fn_allowed_assignable_role(vt.ma);

  insert into nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id, created_by)
  select p_nguoi_dung_id, vt.id, v_co_so_id, fn_current_nguoi_dung_id()
  from vai_tro vt
  where vt.ma = any(p_vai_tro_mas)
  on conflict (nguoi_dung_id, vai_tro_id, co_so_id) do nothing;

  perform fn_log_audit(
    'USER_ROLES_UPDATED',
    'nguoi_dung',
    p_nguoi_dung_id,
    null,
    jsonb_build_object('vai_tro_mas', p_vai_tro_mas)
  );
end;
$$;

revoke all on function fn_user_role_labels(uuid) from public;
grant execute on function fn_user_role_labels(uuid) to authenticated;

revoke all on function fn_can_manage_users(uuid) from public;
grant execute on function fn_can_manage_users(uuid) to authenticated;

revoke all on function fn_moi_nguoi_dung_vao_co_so(text, text, text) from public;
grant execute on function fn_moi_nguoi_dung_vao_co_so(text, text, text) to authenticated;

revoke all on function fn_cap_nhat_vai_tro_nguoi_dung(uuid, text[]) from public;
grant execute on function fn_cap_nhat_vai_tro_nguoi_dung(uuid, text[]) to authenticated;
