-- Cho phep staging giu lai dong sai loai de nguoi dung xem day du loi truoc khi commit.
alter table public.dong_import
  drop constraint if exists dong_import_loai_dong_check;

alter table public.dong_import
  add constraint dong_import_loai_dong_check
  check (loai_dong in ('evidence', 'assessment', 'standard_note', 'plan', 'unknown'));
