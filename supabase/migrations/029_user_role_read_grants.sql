begin;

-- RLS chỉ được đánh giá sau khi role PostgreSQL có quyền SELECT trên bảng.
-- Chỉ cấp các quyền đọc tối thiểu mà màn hình Người dùng và phân quyền cần dùng.
grant select on table
  public.co_so_giao_duc,
  public.nam_hoc,
  public.nguoi_dung,
  public.nguoi_dung_vai_tro,
  public.vai_tro,
  public.phan_cong_tieu_chi
to authenticated;

commit;
