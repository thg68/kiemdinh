begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);

select has_column('public', 'bao_cao', 'nguoi_gui_duyet', 'Có người gửi duyệt');
select has_column('public', 'bao_cao', 'ngay_gui_duyet', 'Có thời điểm gửi duyệt');
select has_column('public', 'bao_cao', 'ly_do_tra_lai', 'Có lý do trả lại');

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values (
  '59000000-0000-0000-0000-000000000001',
  'Truong kiem thu luong duyet bao cao',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id)
select
  '59000000-0000-0000-0000-000000000002',
  '59000000-0000-0000-0000-000000000001',
  '2099-2100', '2099-08-01', '2100-07-31', 'dang_hoat_dong', standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
order by standard_set.version desc
limit 1;

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '59000000-0000-0000-0000-000000000003',
  'principal-059@example.test', 'authenticated', 'authenticated', now(), now()
);

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '59000000-0000-0000-0000-000000000004',
  '59000000-0000-0000-0000-000000000003',
  '59000000-0000-0000-0000-000000000001',
  'Hieu truong kiem thu', 'principal-059@example.test'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '59000000-0000-0000-0000-000000000004', role.id,
  '59000000-0000-0000-0000-000000000001'
from public.vai_tro role where role.ma = 'PRINCIPAL';

insert into public.bao_cao(
  id, co_so_id, nam_hoc_id, cap_hoc, loai_bao_cao, version, trang_thai, nguoi_tao
) values (
  '59000000-0000-0000-0000-000000000005',
  '59000000-0000-0000-0000-000000000001',
  '59000000-0000-0000-0000-000000000002',
  'mam_non', 'mau_1_tu_danh_gia', 1, 'nhap',
  '59000000-0000-0000-0000-000000000004'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '59000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    '59000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia',
    'cho_duyet', null, null, null, null, null, '{}'::jsonb,
    '59000000-0000-0000-0000-000000000005', null, null
  )$$,
  '23502',
  'Ban gui duyet phai co tep niem phong va metadata toan ven.',
  'Không gửi duyệt khi chưa có tệp niêm phong'
);

select throws_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    '59000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia',
    'da_phe_duyet', null, null, null, null, null, '{}'::jsonb,
    '59000000-0000-0000-0000-000000000005', null, null
  )$$,
  '55000',
  'Chi bao cao dang cho duyet moi duoc phe duyet.',
  'Không phê duyệt trực tiếp từ bản nháp'
);

set local role postgres;
update public.bao_cao
set trang_thai = 'cho_duyet',
    nguoi_gui_duyet = '59000000-0000-0000-0000-000000000004',
    ngay_gui_duyet = now()
where id = '59000000-0000-0000-0000-000000000005';

set local role authenticated;
select set_config('request.jwt.claim.sub', '59000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    '59000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia',
    'tra_lai', null, null, null, null, null, '{}'::jsonb,
    '59000000-0000-0000-0000-000000000005', null, 'Sai'
  )$$,
  '22023',
  'Ly do tra lai phai co it nhat 5 ky tu.',
  'Bắt buộc lý do trả lại đủ rõ'
);

select lives_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    '59000000-0000-0000-0000-000000000002', 'mam_non', 'mau_1_tu_danh_gia',
    'tra_lai', null, null, null, null, null, '{}'::jsonb,
    '59000000-0000-0000-0000-000000000005', null, 'Bo sung minh chung con hieu luc.'
  )$$,
  'Người duyệt có thể trả lại kèm lý do'
);

select is(
  (select trang_thai from public.bao_cao where id = '59000000-0000-0000-0000-000000000005'),
  'tra_lai',
  'Báo cáo chuyển sang trạng thái trả lại'
);

select is(
  (select ly_do_tra_lai from public.bao_cao where id = '59000000-0000-0000-0000-000000000005'),
  'Bo sung minh chung con hieu luc.',
  'Lưu đúng lý do trả lại'
);

select * from finish();
rollback;
