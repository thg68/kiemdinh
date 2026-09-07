begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
select plan(5);

select ok(
  (
    select constraint_record.convalidated
    from pg_catalog.pg_constraint constraint_record
    where constraint_record.conrelid = 'public.co_so_giao_duc'::regclass
      and constraint_record.conname = 'chk_co_so_cap_hoc_hop_loai_hinh'
  ),
  'Ràng buộc loại hình và cấp học đã được validate'
);

select is(
  (
    select count(*)
    from public.co_so_giao_duc school
    where school.loai_hinh = 'mam_non'
      and school.cap_hoc is distinct from array['mam_non'::public.cap_hoc]
  ),
  0::bigint,
  'Cơ sở mầm non chỉ mang cấp học mầm non'
);

select is(
  (
    select count(*)
    from public.co_so_giao_duc school
    where school.loai_hinh = 'gdtx'
      and school.cap_hoc is distinct from array['gdtx'::public.cap_hoc]
  ),
  0::bigint,
  'Cơ sở GDTX chỉ mang cấp học GDTX'
);

select is(
  (
    select count(*)
    from public.tu_danh_gia assessment
    join public.co_so_giao_duc school on school.id = assessment.co_so_id
    where school.loai_hinh in ('mam_non', 'gdtx')
      and assessment.cap_hoc <> school.cap_hoc[1]
  ),
  0::bigint,
  'Tự đánh giá của cơ sở một cấp đồng bộ với cấp học cơ sở'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_constraint constraint_record
    join pg_catalog.pg_namespace namespace
      on namespace.oid = constraint_record.connamespace
    where namespace.nspname = 'public'
      and constraint_record.conname in (
        'chk_co_so_cap_hoc_hop_loai_hinh',
        'chk_co_so_ten_khong_rong',
        'chk_nam_hoc_ten_hop_le',
        'chk_nam_hoc_thoi_gian_hop_le',
        'chk_nguoi_dung_ho_ten_khong_rong',
        'ck_minh_chung_hash_sha256',
        'ck_minh_chung_kich_thuoc_tep',
        'ck_minh_chung_ten_hop_le',
        'ck_minh_chung_thu_tu_ngay',
        'ck_van_ban_duong_dan_http',
        'ck_van_ban_thu_tu_hieu_luc',
        'fk_thanh_vien_hoi_dong_scope',
        'fk_thanh_vien_nguoi_dung_scope'
      )
      and not constraint_record.convalidated
  ),
  0::bigint,
  'Các constraint dữ liệu lịch sử lõi đều đã được validate'
);

select * from finish();
rollback;
