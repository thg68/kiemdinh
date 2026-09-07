begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
select plan(6);

select is(
  (select ten from public.vai_tro where ma = 'SELF_ASSESSMENT_CHAIR'),
  'Chủ tịch Hội đồng TĐG',
  'Tên Chủ tịch Hội đồng khớp Phụ lục B'
);

select is(
  (select ten from public.vai_tro where ma = 'SECRETARY'),
  'Thư ký Hội đồng',
  'Tên Thư ký Hội đồng khớp Phụ lục B'
);

select is(
  (select ten from public.vai_tro where ma = 'MEMBER'),
  'Ủy viên / Tổ trưởng',
  'Tên Ủy viên / Tổ trưởng khớp Phụ lục B'
);

select is(
  (select ten from public.vai_tro where ma = 'VIEWER'),
  'Khách (chỉ đọc)',
  'Tên Khách chỉ đọc khớp Phụ lục B'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conname = 'nguoi_dung_vai_tro_nguoi_dung_id_co_so_id_fkey'
      and constraint_record.contype = 'f'
      and constraint_record.conrelid = 'public.nguoi_dung_vai_tro'::regclass
  ),
  'Quan hệ tenant-safe dùng để nhúng vai trò tồn tại'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conname = 'nguoi_dung_vai_tro_nguoi_dung_id_fkey'
      and constraint_record.contype = 'f'
      and constraint_record.conrelid = 'public.nguoi_dung_vai_tro'::regclass
  ),
  'Quan hệ cũ cùng tồn tại nên client phải chỉ rõ khóa ngoại'
);

select * from finish();
rollback;
