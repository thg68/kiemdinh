begin;

-- Remove only the four malformed demo accounts. Their audit events remain as
-- system history, while deleting auth.users also cascades to app profiles and roles.
update public.nhat_ky_truy_cap audit
set nguoi_dung_id = null
where audit.nguoi_dung_id in (
  select app_user.id
  from public.nguoi_dung app_user
  where app_user.email in (
    'chu-tich@kiemdinh.local',
    'thu-ky@kiemdinh.local',
    'to-truong@kiemdinh.local',
    'giao-vien@kiemdinh.local'
  )
);

delete from auth.users auth_user
where auth_user.id in (
  select app_user.auth_user_id
  from public.nguoi_dung app_user
  where app_user.email in (
    'chu-tich@kiemdinh.local',
    'thu-ky@kiemdinh.local',
    'to-truong@kiemdinh.local',
    'giao-vien@kiemdinh.local'
  )
);

commit;
