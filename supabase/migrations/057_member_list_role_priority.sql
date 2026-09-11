-- Sắp xếp danh sách thành viên theo vai trò ưu tiên trước khi phân trang.

create or replace function public.fn_danh_sach_thanh_vien(
  p_limit integer default 10,
  p_offset integer default 0
)
returns table (
  id uuid,
  ho_ten text,
  email text,
  trang_thai text,
  nguoi_dung_vai_tro jsonb,
  total_count bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with members as (
    select
      app_user.id,
      app_user.ho_ten::text,
      app_user.email::text,
      app_user.trang_thai::text,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'vai_tro',
            jsonb_build_object(
              'id', role.id,
              'ma', role.ma,
              'ten', role.ten
            )
          )
          order by case role.ma
            when 'SYSTEM_ADMIN' then 0
            when 'PRINCIPAL' then 1
            when 'SELF_ASSESSMENT_CHAIR' then 2
            when 'SECRETARY' then 3
            when 'MEMBER' then 4
            when 'TEACHER' then 5
            when 'VIEWER' then 6
            else 99
          end
        ) filter (where role.id is not null),
        '[]'::jsonb
      ) as nguoi_dung_vai_tro,
      coalesce(
        min(case role.ma
          when 'SYSTEM_ADMIN' then 0
          when 'PRINCIPAL' then 1
          when 'SELF_ASSESSMENT_CHAIR' then 2
          when 'SECRETARY' then 3
          when 'MEMBER' then 4
          when 'TEACHER' then 5
          when 'VIEWER' then 6
          else 99
        end),
        99
      ) as role_priority
    from public.nguoi_dung app_user
    left join public.nguoi_dung_vai_tro user_role
      on user_role.nguoi_dung_id = app_user.id
      and user_role.co_so_id = app_user.co_so_id
      and (user_role.valid_from is null or user_role.valid_from <= current_date)
      and (user_role.valid_until is null or user_role.valid_until >= current_date)
    left join public.vai_tro role on role.id = user_role.vai_tro_id
    where app_user.co_so_id = public.fn_current_co_so_id()
    group by app_user.id, app_user.ho_ten, app_user.email, app_user.trang_thai
  )
  select
    members.id,
    members.ho_ten,
    members.email,
    members.trang_thai,
    members.nguoi_dung_vai_tro,
    count(*) over () as total_count
  from members
  order by members.role_priority, members.ho_ten, members.id
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0)
$$;

revoke all on function public.fn_danh_sach_thanh_vien(integer, integer)
from public, anon, authenticated;
grant execute on function public.fn_danh_sach_thanh_vien(integer, integer)
to authenticated;

comment on function public.fn_danh_sach_thanh_vien(integer, integer) is
  'Danh sách thành viên cùng đơn vị, sắp xếp theo vai trò cao nhất trước khi phân trang.';
