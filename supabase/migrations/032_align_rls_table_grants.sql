begin;

-- RLS chi duoc danh gia sau khi role PostgreSQL co quyen SELECT tren bang.
-- Chi cap quyen doc cho cac bang da co policy SELECT/ALL danh cho authenticated.
grant select on table
  public.bo_dem_ma_minh_chung,
  public.bo_tieu_chuan,
  public.chi_so_dinh_luong,
  public.lich_su_tu_danh_gia,
  public.minh_chung,
  public.minh_chung_goi_y,
  public.muc_tieu_chi,
  public.quyen,
  public.so_lieu_dinh_luong,
  public.tieu_chi,
  public.tieu_chuan,
  public.vai_tro_quyen,
  public.van_ban_lien_quan
to authenticated;

-- Khach chi doc chi xem bao cao da phe duyet, khong xem tu danh gia noi bo.
delete from public.vai_tro_quyen vtq
using public.vai_tro vt, public.quyen q
where vtq.vai_tro_id = vt.id
  and vtq.quyen_id = q.id
  and vt.ma = 'VIEWER'
  and q.ma = 'assessment.read';

commit;
