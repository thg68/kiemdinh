-- Chi chay tren Supabase staging sau khi tai khoan Auth UAT da duoc tao.
-- Script khong tao mat khau va khong duoc ap dung vao production.

with school as (
  select id
  from public.co_so_giao_duc
  where ma_truong = 'UAT-STAGING-01'
),
auth_admin as (
  select id, email
  from auth.users
  where email = 'uat.system-admin@staging.kdclgd.invalid'
),
upsert_admin as (
  insert into public.nguoi_dung(auth_user_id, co_so_id, ho_ten, email, trang_thai)
  select auth_admin.id, school.id, 'UAT Quan tri he thong', auth_admin.email, 'active'
  from auth_admin
  cross join school
  on conflict (auth_user_id) do update
    set co_so_id = excluded.co_so_id,
        ho_ten = excluded.ho_ten,
        email = excluded.email,
        trang_thai = 'active',
        updated_at = now()
  returning id, co_so_id
)
insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select upsert_admin.id, vt.id, upsert_admin.co_so_id
from upsert_admin
join public.vai_tro vt on vt.ma = 'SYSTEM_ADMIN'
on conflict (nguoi_dung_id, vai_tro_id, co_so_id) do nothing;

with context as (
  select cs.id as co_so_id, nh.id as nam_hoc_id
  from public.co_so_giao_duc cs
  join public.nam_hoc nh
    on nh.co_so_id = cs.id
    and nh.trang_thai = 'dang_hoat_dong'
  where cs.ma_truong = 'UAT-STAGING-01'
),
assignments(email, ma) as (
  values
    ('uat.teacher@staging.kdclgd.invalid', '1.1'),
    ('uat.member@staging.kdclgd.invalid', '1.2')
)
insert into public.phan_cong_tieu_chi(
  co_so_id,
  nam_hoc_id,
  nguoi_dung_id,
  tieu_chi_id,
  vai_tro_trong_tieu_chi,
  vai_tro_phan_cong
)
select
  context.co_so_id,
  context.nam_hoc_id,
  nd.id,
  vtc.id,
  'phu_trach_nhap_lieu',
  'phu_trach_nhap_lieu'
from assignments
cross join context
join public.nguoi_dung nd on lower(nd.email) = lower(assignments.email)
join public.v_tieu_chi_nam_hoc vtc
  on vtc.nam_hoc_id = context.nam_hoc_id
  and vtc.ma = assignments.ma
on conflict (nam_hoc_id, nguoi_dung_id, tieu_chi_id) do update
set vai_tro_trong_tieu_chi = excluded.vai_tro_trong_tieu_chi,
    vai_tro_phan_cong = excluded.vai_tro_phan_cong,
    updated_at = now();

select
  (select count(*) from auth.users where email like 'uat.%@staging.kdclgd.invalid') as auth_accounts,
  (
    select count(*)
    from public.nguoi_dung nd
    where nd.email like 'uat.%@staging.kdclgd.invalid'
  ) as profiles,
  (
    select count(*)
    from public.nguoi_dung_vai_tro ndvt
    join public.nguoi_dung nd on nd.id = ndvt.nguoi_dung_id
    where nd.email like 'uat.%@staging.kdclgd.invalid'
  ) as role_links,
  (
    select count(*)
    from public.phan_cong_tieu_chi pc
    join public.nguoi_dung nd on nd.id = pc.nguoi_dung_id
    where nd.email like 'uat.%@staging.kdclgd.invalid'
  ) as assignments;
