begin;

-- Ngay sinh khong duoc dat trong nguoi_dung: cac thanh vien cung truong co quyen doc bang do.
create table public.nguoi_dung_ho_so_rieng (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  ngay_sinh date,
  updated_at timestamptz not null default now(),
  constraint nguoi_dung_ho_so_rieng_ngay_sinh_hop_le
    check (ngay_sinh is null or ngay_sinh >= date '1900-01-01')
);

alter table public.nguoi_dung_ho_so_rieng enable row level security;

create policy "nguoi_dung_ho_so_rieng_chu_so_huu_doc"
on public.nguoi_dung_ho_so_rieng
for select to authenticated
using (auth_user_id = auth.uid());

create policy "nguoi_dung_ho_so_rieng_chu_so_huu_them"
on public.nguoi_dung_ho_so_rieng
for insert to authenticated
with check (auth_user_id = auth.uid());

create policy "nguoi_dung_ho_so_rieng_chu_so_huu_sua"
on public.nguoi_dung_ho_so_rieng
for update to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

revoke all on public.nguoi_dung_ho_so_rieng from public, anon, authenticated;
grant select on public.nguoi_dung_ho_so_rieng to authenticated;

create or replace function public.fn_ho_so_cua_toi()
returns table (
  nguoi_dung_id uuid,
  ho_ten text,
  email text,
  dien_thoai text,
  ngay_sinh date
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    nd.id,
    nd.ho_ten::text,
    nd.email::text,
    nd.dien_thoai::text,
    private_profile.ngay_sinh
  from public.nguoi_dung nd
  left join public.nguoi_dung_ho_so_rieng private_profile
    on private_profile.auth_user_id = nd.auth_user_id
  where nd.auth_user_id = auth.uid()
    and nd.trang_thai = 'active'
  limit 1
$$;

create or replace function public.fn_cap_nhat_ho_so_cua_toi(
  p_ho_ten text,
  p_dien_thoai text,
  p_ngay_sinh date
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_nguoi_dung_id uuid;
  v_co_so_id uuid;
  v_ho_ten text := btrim(coalesce(p_ho_ten, ''));
  v_dien_thoai text := nullif(btrim(coalesce(p_dien_thoai, '')), '');
begin
  if v_auth_user_id is null then
    raise exception using errcode = '42501', message = 'Bạn cần đăng nhập để sửa hồ sơ.';
  end if;

  if char_length(v_ho_ten) < 2 or char_length(v_ho_ten) > 255 then
    raise exception using errcode = '22023', message = 'Họ tên cần có từ 2 đến 255 ký tự.';
  end if;

  if v_dien_thoai is not null and char_length(v_dien_thoai) > 30 then
    raise exception using errcode = '22023', message = 'Số điện thoại không được quá 30 ký tự.';
  end if;

  if p_ngay_sinh is not null and (
    p_ngay_sinh < date '1900-01-01'
    or p_ngay_sinh > (now() at time zone 'Asia/Ho_Chi_Minh')::date
  ) then
    raise exception using errcode = '22023', message = 'Ngày sinh không hợp lệ.';
  end if;

  update public.nguoi_dung nd
  set ho_ten = v_ho_ten,
      dien_thoai = v_dien_thoai,
      updated_at = now()
  where nd.auth_user_id = v_auth_user_id
    and nd.trang_thai = 'active'
  returning nd.id, nd.co_so_id into v_nguoi_dung_id, v_co_so_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Không tìm thấy hồ sơ đang hoạt động.';
  end if;

  insert into public.nguoi_dung_ho_so_rieng (auth_user_id, ngay_sinh)
  values (v_auth_user_id, p_ngay_sinh)
  on conflict (auth_user_id) do update
    set ngay_sinh = excluded.ngay_sinh,
        updated_at = now();

  -- Chi ghi su kien; khong ghi gia tri cu/moi, dac biet la ngay sinh.
  insert into public.nhat_ky_truy_cap (
    co_so_id, nguoi_dung_id, hanh_dong, doi_tuong, doi_tuong_id
  ) values (
    v_co_so_id, v_nguoi_dung_id, 'USER_PROFILE_UPDATED', 'nguoi_dung', v_nguoi_dung_id
  );
end;
$$;

revoke all on function public.fn_ho_so_cua_toi()
from public, anon, authenticated;
grant execute on function public.fn_ho_so_cua_toi()
to authenticated;

revoke all on function public.fn_cap_nhat_ho_so_cua_toi(text, text, date)
from public, anon, authenticated;
grant execute on function public.fn_cap_nhat_ho_so_cua_toi(text, text, date)
to authenticated;

commit;
