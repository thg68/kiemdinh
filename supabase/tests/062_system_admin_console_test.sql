begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_column(
  'public',
  'minh_chung',
  'can_kiem_tra_ky_thuat',
  'Minh chung co co theo doi ky thuat rieng'
);

select ok(
  has_function_privilege('authenticated', 'public.fn_admin_tong_quan()', 'execute')
    and not has_function_privilege('anon', 'public.fn_admin_tong_quan()', 'execute'),
  'Chi phien da dang nhap co the di toi cong kiem tra quyen admin'
);

select ok(
  not has_function_privilege('authenticated', 'public.fn_require_system_admin()', 'execute'),
  'Ham guard noi bo khong duoc expose cho client'
);

insert into public.co_so_giao_duc(
  id, ten, ma_truong, loai_hinh, cap_hoc, trang_thai, tinh_thanh
)
values
  (
    '64000000-0000-0000-0000-000000000101',
    'Admin Console Tenant A',
    'ADMIN-CONSOLE-A',
    'mam_non',
    array['mam_non']::public.cap_hoc[],
    'active',
    'Quảng Ninh'
  ),
  (
    '64000000-0000-0000-0000-000000000102',
    'Admin Console Tenant B',
    'ADMIN-CONSOLE-B',
    'mam_non',
    array['mam_non']::public.cap_hoc[],
    'active',
    'Quảng Ninh'
  );

insert into auth.users(id, email, aud, role, email_confirmed_at, created_at, updated_at)
values
  (
    '64000000-0000-0000-0000-000000000201',
    'system-admin-a@test.local',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
  ),
  (
    '64000000-0000-0000-0000-000000000202',
    'system-admin-b@test.local',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
  ),
  (
    '64000000-0000-0000-0000-000000000203',
    'teacher-admin-console@test.local',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
  );

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values
  (
    '64000000-0000-0000-0000-000000000301',
    '64000000-0000-0000-0000-000000000201',
    '64000000-0000-0000-0000-000000000101',
    'System Admin A',
    'system-admin-a@test.local'
  ),
  (
    '64000000-0000-0000-0000-000000000302',
    '64000000-0000-0000-0000-000000000202',
    '64000000-0000-0000-0000-000000000102',
    'System Admin B',
    'system-admin-b@test.local'
  ),
  (
    '64000000-0000-0000-0000-000000000303',
    '64000000-0000-0000-0000-000000000203',
    '64000000-0000-0000-0000-000000000102',
    'Teacher Console',
    'teacher-admin-console@test.local'
  );

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select fixture.nguoi_dung_id, role.id, fixture.co_so_id
from (
  values
    (
      '64000000-0000-0000-0000-000000000301'::uuid,
      'SYSTEM_ADMIN'::text,
      '64000000-0000-0000-0000-000000000101'::uuid
    ),
    (
      '64000000-0000-0000-0000-000000000302'::uuid,
      'SYSTEM_ADMIN'::text,
      '64000000-0000-0000-0000-000000000102'::uuid
    ),
    (
      '64000000-0000-0000-0000-000000000303'::uuid,
      'TEACHER'::text,
      '64000000-0000-0000-0000-000000000102'::uuid
    )
) fixture(nguoi_dung_id, role_code, co_so_id)
join public.vai_tro role on role.ma = fixture.role_code;

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  '64000000-0000-0000-0000-000000000401',
  '64000000-0000-0000-0000-000000000102',
  '2098-2099',
  '2098-08-01',
  '2099-07-31',
  'dang_hoat_dong',
  standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
order by standard_set.version desc
limit 1;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '64000000-0000-0000-0000-000000000203', true);

select throws_ok(
  $$ select * from public.fn_admin_tong_quan() $$,
  '42501',
  'Tai khoan khong co quyen quan tri he thong.',
  'Nguoi dung thuong khong doc duoc tong quan admin'
);

select throws_ok(
  $$ select * from public.fn_admin_danh_sach_co_so(null, null, null, 25, 0) $$,
  '42501',
  'Tai khoan khong co quyen quan tri he thong.',
  'Nguoi dung thuong khong doc duoc danh sach co so admin'
);

set local role postgres;
select set_config('request.jwt.claim.sub', '64000000-0000-0000-0000-000000000201', true);

insert into public.minh_chung(
  id,
  co_so_id,
  nam_hoc_id,
  ma,
  ten,
  loai_tep,
  duong_dan,
  hash_tep,
  kich_thuoc,
  nguoi_tai_len,
  trang_thai_xac_minh
)
values (
  '64000000-0000-0000-0000-000000000501',
  '64000000-0000-0000-0000-000000000102',
  '64000000-0000-0000-0000-000000000401',
  'MC.ADMIN.01',
  'Noi dung nhay cam khong duoc tra ve',
  'application/pdf',
  'https://private.test/signed-url',
  repeat('a', 64),
  4096,
  '64000000-0000-0000-0000-000000000303',
  'da_xac_minh'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '64000000-0000-0000-0000-000000000201', true);

select is(
  (
    select count(*)
    from public.minh_chung evidence
    where evidence.id = '64000000-0000-0000-0000-000000000501'
  ),
  0::bigint,
  'SYSTEM_ADMIN khong doc truc tiep bang minh chung qua RLS'
);

select ok(
  exists (
    select 1
    from public.fn_admin_danh_sach_co_so(null, null, null, 100, 0) school
    where school.id = '64000000-0000-0000-0000-000000000102'
  ),
  'Admin thay co so khac trong danh sach toan he thong'
);

select ok(
  exists (
    select 1
    from public.fn_admin_danh_sach_nguoi_tham_gia(null, null, 'TEACHER', null, 100, 0) participant
    where participant.id = '64000000-0000-0000-0000-000000000303'
      and participant.vai_tro_mas = array['TEACHER']::text[]
  ),
  'Danh sach nguoi tham gia loc va tra vai tro dung'
);

select ok(
  exists (
    select 1
    from public.fn_admin_danh_sach_minh_chung('MC.ADMIN.01', null, null, 25, 0) evidence
    where evidence.id = '64000000-0000-0000-0000-000000000501'
      and evidence.co_so_ten = 'Admin Console Tenant B'
      and evidence.co_lien_ket
  ),
  'Admin doc duoc metadata ky thuat qua RPC rieng'
);

select ok(
  not exists (
    select 1
    from public.fn_admin_danh_sach_minh_chung(null, null, null, 25, 0) evidence
    cross join lateral jsonb_object_keys(to_jsonb(evidence)) field_name
    where field_name in ('ten', 'duong_dan', 'storage_path', 'hash_tep', 'ghi_chu')
  ),
  'Payload metadata khong chua truong noi dung, duong dan, hash hoac ghi chu nghiep vu'
);

select lives_ok(
  $$ select public.fn_admin_danh_dau_minh_chung(
       '64000000-0000-0000-0000-000000000501',
       true,
       'Can doi chieu ket noi kho tep'
     ) $$,
  'Admin co the danh dau van de ky thuat ma khong doi trang thai xac minh'
);

select lives_ok(
  $$ select public.fn_admin_cap_nhat_trang_thai_nguoi_dung(
       '64000000-0000-0000-0000-000000000303',
       'locked'
     ) $$,
  'Admin co the khoa tai khoan nguoi dung thuong'
);

select throws_ok(
  $$ select public.fn_admin_cap_nhat_trang_thai_nguoi_dung(
       '64000000-0000-0000-0000-000000000301',
       'locked'
     ) $$,
  '42501',
  'Khong the thay doi trang thai tai khoan cua chinh minh.',
  'Admin khong the tu khoa chinh minh'
);

select throws_ok(
  $$ select public.fn_admin_cap_nhat_trang_thai_nguoi_dung(
       '64000000-0000-0000-0000-000000000302',
       'locked'
     ) $$,
  '42501',
  'Khong thay doi quan tri he thong tu danh sach nguoi tham gia.',
  'Admin khong the khoa quan tri he thong khac tu danh sach thanh vien'
);

select lives_ok(
  $$ select public.fn_admin_cap_nhat_trang_thai_co_so(
       '64000000-0000-0000-0000-000000000102',
       'inactive'
     ) $$,
  'Admin co the tam ngung co so giao duc'
);

set local role postgres;

select is(
  (
    select app_user.trang_thai::text
    from public.nguoi_dung app_user
    where app_user.id = '64000000-0000-0000-0000-000000000303'
  ),
  'locked',
  'Trang thai nguoi dung duoc luu vao CSDL'
);

select is(
  (
    select evidence.trang_thai_xac_minh::text
    from public.minh_chung evidence
    where evidence.id = '64000000-0000-0000-0000-000000000501'
  ),
  'da_xac_minh',
  'Danh dau ky thuat khong thay doi quyet dinh xac minh nghiep vu'
);

select ok(
  not exists (
    select 1
    from public.nhat_ky_truy_cap audit
    cross join lateral jsonb_each(coalesce(audit.du_lieu_moi, '{}'::jsonb)) field
    where audit.doi_tuong_id = '64000000-0000-0000-0000-000000000501'
      and field.key in ('ten', 'duong_dan', 'storage_path', 'hash_tep', 'ghi_chu')
  ),
  'Audit trigger khong ghi du lieu Do cua minh chung'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '64000000-0000-0000-0000-000000000201', true);

select ok(
  not exists (
    select 1
    from public.fn_admin_nhat_ky(100, 0) audit
    cross join lateral jsonb_object_keys(to_jsonb(audit)) field_name
    where field_name in ('du_lieu_cu', 'du_lieu_moi', 'jwt', 'signed_url')
  ),
  'Nhat ky admin khong tra payload, JWT hoac signed URL'
);

select * from finish();
rollback;
