begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);

insert into auth.users(id, email, email_confirmed_at, aud, role, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000019001', 'system-admin@onboarding.test', now(), 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000019002', 'ordinary@onboarding.test', now(), 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000019003', 'principal@onboarding.test', now(), 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000019004', 'stranger@onboarding.test', now(), 'authenticated', 'authenticated', now(), now()),
  ('00000000-0000-0000-0000-000000019005', 'teacher@onboarding.test', now(), 'authenticated', 'authenticated', now(), now());

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values ('00000000-0000-0000-0000-000000019101', 'System Administration Tenant', 'SYS-ADMIN-019', 'mam_non', array['mam_non']::public.cap_hoc[]);

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values ('00000000-0000-0000-0000-000000019201', '00000000-0000-0000-0000-000000019001', '00000000-0000-0000-0000-000000019101', 'System Administrator', 'system-admin@onboarding.test');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '00000000-0000-0000-0000-000000019201', vt.id, '00000000-0000-0000-0000-000000019101'
from public.vai_tro vt where vt.ma = 'SYSTEM_ADMIN';

select ok(
  not has_function_privilege('authenticated', 'public.fn_khoi_tao_co_so_va_nam_hoc(text,text,public.loai_hinh_co_so,public.cap_hoc[],character varying,date,date,text)', 'EXECUTE'),
  'Tai khoan moi khong con duoc tu tao don vi va tu nhan vai tro Hieu truong'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000019002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$select * from public.fn_quan_tri_tao_co_so_va_nam_hoc(
    'Unauthorized School', 'UNAUTHORIZED-019', 'mam_non', array['mam_non']::public.cap_hoc[],
    '2026-2027', '2026-08-01', '2027-05-31', 'principal@onboarding.test', 'UAT Principal'
  )$$,
  'P0001', 'Chỉ Quản trị hệ thống được tạo đơn vị mới.',
  'Tai khoan thuong khong the dung RPC quan tri de tao don vi'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000019001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select * from public.fn_quan_tri_tao_co_so_va_nam_hoc(
    'UAT Invitation School', 'UAT-INVITATION-019', 'mam_non', array['mam_non']::public.cap_hoc[],
    '2026-2027', '2026-08-01', '2027-05-31', 'principal@onboarding.test', 'UAT Principal'
  )$$,
  'Quan tri he thong tao don vi, nam hoc va loi moi Hieu truong'
);

reset role;

select is(
  (select count(*) from public.nam_hoc nh
   join public.co_so_giao_duc cs on cs.id = nh.co_so_id
   join public.bo_tieu_chuan btc on btc.id = nh.bo_tieu_chuan_id
   where cs.ma_truong = 'UAT-INVITATION-019' and btc.loai_hinh = 'mam_non' and btc.trang_thai = 'dang_ap_dung'),
  1::bigint,
  'Nam hoc ban dau khoa dung phien ban bo tieu chuan'
);

select is(
  (select count(*) from public.loi_moi_thanh_vien lm
   join public.co_so_giao_duc cs on cs.id = lm.co_so_id
   join public.vai_tro vt on vt.id = lm.vai_tro_id
   where cs.ma_truong = 'UAT-INVITATION-019' and lm.email = 'principal@onboarding.test'
     and lm.trang_thai = 'cho_phan_hoi' and vt.ma = 'PRINCIPAL'),
  1::bigint,
  'Tao dung mot loi moi Hieu truong dang cho phan hoi'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000019003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select count(*) from public.fn_danh_sach_loi_moi_cua_toi()), 1::bigint, 'Dung email Hieu truong nhin thay loi moi cua minh');

select lives_ok(
  $$select public.fn_chap_nhan_loi_moi(
    (select lm.id from public.fn_danh_sach_loi_moi_cua_toi() lm limit 1)
  )$$,
  'Hieu truong chap nhan loi moi thanh cong'
);

reset role;

select is(
  (select count(*) from public.nguoi_dung nd
   join public.nguoi_dung_vai_tro ndvt on ndvt.nguoi_dung_id = nd.id
   join public.vai_tro vt on vt.id = ndvt.vai_tro_id
   where nd.auth_user_id = '00000000-0000-0000-0000-000000019003' and vt.ma = 'PRINCIPAL'),
  1::bigint,
  'Chi sau khi chap nhan, tai khoan moi co ho so va vai tro Hieu truong'
);

select is(
  (select count(*) from public.loi_moi_thanh_vien
   where email = 'principal@onboarding.test' and trang_thai = 'da_chap_nhan'
     and auth_user_nhan_id = '00000000-0000-0000-0000-000000019003'),
  1::bigint,
  'Loi moi luu dung trang thai va tai khoan da chap nhan'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000019004', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is((select count(*) from public.fn_danh_sach_loi_moi_cua_toi()), 0::bigint, 'Tai khoan khac khong nhin thay loi moi');

reset role;

select is(
  (select count(*) from public.nguoi_dung where auth_user_id = '00000000-0000-0000-0000-000000019002'),
  0::bigint,
  'Dang ky Auth khong tu dong tao ho so hay gan vai tro'
);

select is(
  (select count(*) from public.v_tieu_chi_nam_hoc vtc
   join public.co_so_giao_duc cs on cs.id = vtc.co_so_id
   where cs.ma_truong = 'UAT-INVITATION-019'),
  15::bigint,
  'Don vi moi doc du 15 tieu chi tu phien ban da khoa'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000019003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.fn_moi_nguoi_dung_vao_co_so('teacher@onboarding.test', 'UAT Teacher', 'TEACHER')$$,
  'Hieu truong gui loi moi Giao vien bang email'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000019005', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select count(*) from public.fn_danh_sach_loi_moi_cua_toi()), 1::bigint, 'Giao vien nhin thay loi moi dung email');

select lives_ok(
  $$select public.fn_chap_nhan_loi_moi((select id from public.fn_danh_sach_loi_moi_cua_toi() limit 1))$$,
  'Giao vien chap nhan loi moi thanh cong'
);

reset role;

select is(
  (select count(*) from public.nguoi_dung nd
   join public.nguoi_dung_vai_tro ndvt on ndvt.nguoi_dung_id = nd.id
   join public.vai_tro vt on vt.id = ndvt.vai_tro_id
   where nd.auth_user_id = '00000000-0000-0000-0000-000000019005' and vt.ma = 'TEACHER'),
  1::bigint,
  'Giao vien chi nhan vai tro sau khi chap nhan loi moi'
);
select * from finish();
rollback;
