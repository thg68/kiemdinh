begin;

alter function public.fn_danh_sach_truong_dang_ky(text, integer) security invoker;

revoke select on table public.co_so_giao_duc from anon;
grant select (
  id,
  ma_truong,
  ten,
  loai_hinh,
  cap_hoc,
  cong_lap,
  dia_chi,
  phuong_xa,
  loai_hinh_dao_tao,
  loai_hinh_truong,
  cho_phep_tu_dang_ky,
  trang_thai,
  tinh_thanh
) on table public.co_so_giao_duc to anon, authenticated;

drop policy if exists co_so_registration_directory_select on public.co_so_giao_duc;
create policy co_so_registration_directory_select
on public.co_so_giao_duc
for select
to anon, authenticated
using (
  cho_phep_tu_dang_ky
  and trang_thai = 'active'
  and tinh_thanh = 'Quảng Ninh'
);

commit;
