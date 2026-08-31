begin;

-- Table grants chi cho phep request di toi RLS. Cac policy theo co_so_id va vai tro
-- hien co van la lop quyet dinh cuoi cung cho tung dong du lieu.
grant insert, update, delete on table
  public.ke_hoach_cai_tien,
  public.hoi_dong_tu_danh_gia,
  public.thanh_vien_hoi_dong,
  public.van_ban_lien_quan
to authenticated;

-- Khong cho phien chua dang nhap thuc hien bat ky mutation nao tren du lieu noi bo.
revoke insert, update, delete on table
  public.ke_hoach_cai_tien,
  public.hoi_dong_tu_danh_gia,
  public.thanh_vien_hoi_dong,
  public.van_ban_lien_quan
from anon;

commit;
