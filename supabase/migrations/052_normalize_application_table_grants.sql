begin;

-- Hosted Supabase projects can start with broader table defaults than the
-- local stack. Normalize all application tables before granting the small
-- set of direct CRUD flows used by the UI.
revoke insert, update, delete, truncate, references, trigger, maintain
on all tables in schema public
from public, anon, authenticated;

grant insert, update, delete on table
  public.hoi_dong_tu_danh_gia,
  public.ke_hoach_cai_tien,
  public.thanh_vien_hoi_dong,
  public.van_ban_lien_quan
to authenticated;

grant insert, update on table
  public.nhan_xet_tieu_chuan,
  public.noi_dung_mau_2
to authenticated;

-- New tables must opt into app-role privileges explicitly in their migration.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;

commit;
