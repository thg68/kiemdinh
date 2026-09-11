begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(25);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values ('00000000-0000-0000-0000-000000020001', 'sprint9@transaction.test', 'authenticated', 'authenticated', now(), now());

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values ('00000000-0000-0000-0000-000000020010', 'Sprint 9 Transaction School', 'SPRINT9-020', 'mam_non', array['mam_non']::public.cap_hoc[]);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id)
select '00000000-0000-0000-0000-000000020011', '00000000-0000-0000-0000-000000020010',
  '2098-2099', '2098-08-01', '2099-05-31', 'dang_hoat_dong', btc.id
from public.bo_tieu_chuan btc
where btc.loai_hinh = 'mam_non' and btc.trang_thai = 'dang_ap_dung'
order by btc.version desc limit 1;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values ('00000000-0000-0000-0000-000000020012', '00000000-0000-0000-0000-000000020001', '00000000-0000-0000-0000-000000020010', 'Sprint 9 Principal', 'sprint9@transaction.test');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '00000000-0000-0000-0000-000000020012', vt.id, '00000000-0000-0000-0000-000000020010'
from public.vai_tro vt where vt.ma = 'PRINCIPAL';

select is(
  (select count(*) from public.nguoi_dung_vai_tro where nguoi_dung_id = '00000000-0000-0000-0000-000000020012'),
  1::bigint,
  'Tao fixture tenant giao dich voi vai tro Hieu truong'
);

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, trang_thai_xac_minh, nguoi_tai_len, nguoi_xac_minh, ngay_xac_minh
)
select
  '00000000-0000-0000-0000-000000020101', nd.co_so_id, nh.id, 'MC.1.1.90', 'Minh chung atomic',
  'da_xac_minh', nd.id, nd.id, now()
from public.nguoi_dung nd
join public.nam_hoc nh on nh.co_so_id = nd.co_so_id and nh.ten = '2098-2099'
where nd.auth_user_id = '00000000-0000-0000-0000-000000020001';

insert into public.minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, la_tieu_chi_goc)
select '00000000-0000-0000-0000-000000020101', vtc.id, true
from public.v_tieu_chi_nam_hoc vtc
join public.nguoi_dung nd on nd.co_so_id = vtc.co_so_id
where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and vtc.nam_hoc_id = (
  select id from public.nam_hoc where co_so_id = nd.co_so_id and ten = '2098-2099'
) and vtc.ma = '1.1';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000020001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.fn_luu_tu_danh_gia_atomic(
    (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
    'mam_non',
    (select vtc.id from public.v_tieu_chi_nam_hoc vtc join public.nguoi_dung nd on nd.co_so_id = vtc.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and vtc.ma = '1.1'),
    'Hien trang muc 1 co minh chung', '', 1::smallint,
    array['00000000-0000-0000-0000-000000020101']::uuid[]
  )$$,
  'Luu tu danh gia va gan minh chung trong mot transaction'
);

select is(
  (select muc_dat from public.tu_danh_gia where mo_ta_muc_1 = 'Hien trang muc 1 co minh chung'),
  1::smallint,
  'Transaction luu dung muc tu danh gia'
);

select ok(
  exists (select 1 from public.nhat_ky_truy_cap where hanh_dong = 'ASSESSMENT_SAVED_ATOMIC'),
  'Transaction ghi audit actor va thay doi'
);

select throws_ok(
  $$select public.fn_luu_tu_danh_gia_atomic(
    (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
    'mam_non',
    (select vtc.id from public.v_tieu_chi_nam_hoc vtc join public.nguoi_dung nd on nd.co_so_id = vtc.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and vtc.ma = '1.1'),
    'Noi dung khong duoc commit', '', 1::smallint,
    array['00000000-0000-0000-0000-000000020999']::uuid[]
  )$$,
  'P0001', 'Co minh chung khong thuoc don vi hoac nam hoc hien tai.',
  'Minh chung khong hop le lam ca transaction rollback'
);

select is(
  (select mo_ta_muc_1 from public.tu_danh_gia where muc_dat = 1 limit 1),
  'Hien trang muc 1 co minh chung',
  'Noi dung cu con nguyen sau rollback'
);

select throws_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
    'mam_non', 'mau_1_tu_danh_gia', 'da_phe_duyet',
    (select nd.co_so_id::text || '/missing/report.docx' from public.nguoi_dung nd
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001'),
    'report.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 10,
    repeat('a', 64), '{}'::jsonb
  )$$,
  '22023', 'Thao tac duyet phai chi ro ban bao cao cho duyet.',
  'Cong phe duyet DB buoc chi ro dung ban bao cao da xuat'
);

set local role postgres;

insert into public.nam_hoc(co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id)
select nh.co_so_id, '2099-2100', '2099-08-01', '2100-05-31', 'chuan_bi', nh.bo_tieu_chuan_id
from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000020001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.fn_dat_nam_hoc_dang_hoat_dong(
    (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2099-2100')
  )$$,
  'Chuyen nam hoc dang hoat dong bang mot RPC'
);

select is(
  (select count(*) from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
    where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.trang_thai = 'dang_hoat_dong'),
  1::bigint,
  'Moi tenant chi co dung mot nam hoc dang hoat dong'
);

select is(
  (select nh.trang_thai from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
    where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2099-2100'),
  'dang_hoat_dong',
  'Nam hoc duoc chon tro thanh dang hoat dong'
);

set local role postgres;

insert into public.minh_chung(co_so_id, nam_hoc_id, ma, ten, trang_thai_xac_minh, nguoi_tai_len, nguoi_xac_minh, ngay_xac_minh)
select vtc.co_so_id, vtc.nam_hoc_id, 'MC.' || vtc.ma || '.90', 'Minh chung ' || vtc.ma,
  'da_xac_minh', nd.id, nd.id, now()
from public.v_tieu_chi_nam_hoc vtc
join public.nguoi_dung nd on nd.co_so_id = vtc.co_so_id
join public.nam_hoc nh on nh.id = vtc.nam_hoc_id and nh.ten = '2098-2099'
where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and vtc.ma <> '1.1';

insert into public.minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, la_tieu_chi_goc)
select mc.id, vtc.id, true
from public.v_tieu_chi_nam_hoc vtc
join public.minh_chung mc on mc.co_so_id = vtc.co_so_id and mc.nam_hoc_id = vtc.nam_hoc_id and mc.ma = 'MC.' || vtc.ma || '.90'
join public.nam_hoc nh on nh.id = vtc.nam_hoc_id and nh.ten = '2098-2099'
where vtc.ma <> '1.1';

insert into public.tu_danh_gia(co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc, mo_ta_muc_1, dat_muc_1, muc_dat, nguoi_nhap)
select vtc.co_so_id, vtc.nam_hoc_id, vtc.id, 'mam_non'::public.cap_hoc, 'Hien trang co minh chung ' || vtc.ma, false, 0, nd.id
from public.v_tieu_chi_nam_hoc vtc
join public.nguoi_dung nd on nd.co_so_id = vtc.co_so_id
join public.nam_hoc nh on nh.id = vtc.nam_hoc_id and nh.ten = '2098-2099'
where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and vtc.ma <> '1.1';

insert into public.tu_danh_gia_minh_chung(
  co_so_id, nam_hoc_id, tu_danh_gia_id, minh_chung_id, created_by
)
select tdg.co_so_id, tdg.nam_hoc_id, tdg.id, mc.id, nd.id
from public.tu_danh_gia tdg
join public.v_tieu_chi_nam_hoc vtc
  on vtc.id = tdg.tieu_chi_id
  and vtc.nam_hoc_id = tdg.nam_hoc_id
join public.minh_chung mc
  on mc.co_so_id = tdg.co_so_id
  and mc.nam_hoc_id = tdg.nam_hoc_id
  and mc.ma = 'MC.' || vtc.ma || '.90'
join public.nguoi_dung nd
  on nd.co_so_id = tdg.co_so_id
  and nd.auth_user_id = '00000000-0000-0000-0000-000000020001'
join public.nam_hoc nh
  on nh.id = tdg.nam_hoc_id
  and nh.ten = '2098-2099'
where tdg.cap_hoc = 'mam_non'
  and vtc.ma <> '1.1';

update public.tu_danh_gia tdg
set dat_muc_1 = true,
    muc_dat = 1
from public.nam_hoc nh,
     public.nguoi_dung nd
where nh.id = tdg.nam_hoc_id
  and nh.ten = '2098-2099'
  and nd.co_so_id = tdg.co_so_id
  and nd.auth_user_id = '00000000-0000-0000-0000-000000020001'
  and tdg.cap_hoc = 'mam_non'
  and tdg.muc_dat = 0;

insert into public.nhan_xet_tieu_chuan(co_so_id, nam_hoc_id, tieu_chuan_id, cap_hoc, diem_manh_noi_bat, han_che_trong_tam, dinh_huong_cai_tien, nguoi_cap_nhat)
select distinct vtc.co_so_id, vtc.nam_hoc_id, vtc.tieu_chuan_id, 'mam_non'::public.cap_hoc, 'Diem manh', 'Han che', 'Dinh huong', nd.id
from public.v_tieu_chi_nam_hoc vtc
join public.nguoi_dung nd on nd.co_so_id = vtc.co_so_id
join public.nam_hoc nh on nh.id = vtc.nam_hoc_id and nh.ten = '2098-2099'
where nd.auth_user_id = '00000000-0000-0000-0000-000000020001';

insert into public.hoi_dong_tu_danh_gia(id, co_so_id, nam_hoc_id, ten)
select '00000000-0000-0000-0000-000000020201', nh.co_so_id, nh.id, 'Hoi dong Sprint 9'
from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099';

insert into public.thanh_vien_hoi_dong(hoi_dong_id, nguoi_dung_id, vai_tro_hoi_dong)
select '00000000-0000-0000-0000-000000020201', id, 'chu_tich'
from public.nguoi_dung where auth_user_id = '00000000-0000-0000-0000-000000020001';

insert into storage.objects(bucket_id, name)
select 'reports', nd.co_so_id || '/' || nh.id || '/mau_1_tu_danh_gia/snapshots/v1.docx'
from public.nguoi_dung nd join public.nam_hoc nh on nh.co_so_id = nd.co_so_id and nh.ten = '2098-2099'
where nd.auth_user_id = '00000000-0000-0000-0000-000000020001';
insert into storage.objects(bucket_id, name)
select 'reports', nd.co_so_id || '/' || nh.id || '/mau_1_tu_danh_gia/snapshots/v2.docx'
from public.nguoi_dung nd join public.nam_hoc nh on nh.co_so_id = nd.co_so_id and nh.ten = '2098-2099'
where nd.auth_user_id = '00000000-0000-0000-0000-000000020001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000020001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  (public.fn_kiem_tra_san_sang_bao_cao(
    (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
    'mam_non', 'mau_1_tu_danh_gia'
  ) ->> 'ready')::boolean,
  'Readiness DB xac nhan du du lieu that'
);

select lives_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
    'mam_non', 'mau_1_tu_danh_gia', 'cho_duyet',
    (select nd.co_so_id || '/' || nh.id || '/mau_1_tu_danh_gia/snapshots/v1.docx'
      from public.nguoi_dung nd join public.nam_hoc nh on nh.co_so_id = nd.co_so_id and nh.ten = '2098-2099'
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001'),
    'Mau-1-v1.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024,
    repeat('a', 64), '{"schema_version":"1.0"}'::jsonb, null,
    (public.fn_lay_niem_phong_nguon_bao_cao(
      (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
        where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
      'mam_non', 'mau_1_tu_danh_gia'
    ) ->> 'digest')
  )$$,
  'Niem phong nguon cua snapshot v1'
);

select lives_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
    'mam_non', 'mau_1_tu_danh_gia', 'da_phe_duyet',
    (select nd.co_so_id || '/' || nh.id || '/mau_1_tu_danh_gia/snapshots/v1.docx'
      from public.nguoi_dung nd join public.nam_hoc nh on nh.co_so_id = nd.co_so_id and nh.ten = '2098-2099'
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001'),
    'Mau-1-v1.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024,
    repeat('a', 64), '{"schema_version":"1.0"}'::jsonb,
    (select id from public.bao_cao where trang_thai = 'cho_duyet' order by version desc limit 1),
    (select source_digest from public.bao_cao where trang_thai = 'cho_duyet' order by version desc limit 1)
  )$$,
  'Phe duyet snapshot v1 khi readiness dat'
);

select is((select max(version) from public.bao_cao where trang_thai = 'da_phe_duyet'), 1, 'Snapshot dau tien co version 1');

select throws_ok(
  $$update public.bao_cao set ten_tep_goc = 'ghi-de.docx' where trang_thai = 'da_phe_duyet' and version = 1$$,
  '42501', null,
  'Client khong ghi de truc tiep snapshot da phe duyet'
);

select lives_ok(
  $$select public.fn_luu_trang_thai_bao_cao(
    (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
    'mam_non', 'mau_1_tu_danh_gia', 'da_phe_duyet',
    (select nd.co_so_id || '/' || nh.id || '/mau_1_tu_danh_gia/snapshots/v2.docx'
      from public.nguoi_dung nd join public.nam_hoc nh on nh.co_so_id = nd.co_so_id and nh.ten = '2098-2099'
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001'),
    'Mau-1-v2.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 2048,
    repeat('a', 64), '{"schema_version":"1.0"}'::jsonb,
    (select id from public.bao_cao where trang_thai = 'da_phe_duyet' and version = 1),
    (select source_digest from public.bao_cao where trang_thai = 'da_phe_duyet' and version = 1)
  )$$,
  'Retry phe duyet tra ve dung snapshot cu'
);

select is((select count(*) from public.bao_cao where trang_thai = 'da_phe_duyet'), 1::bigint, 'Retry khong tao snapshot trung lap');
select is((select max(version) from public.bao_cao where trang_thai = 'da_phe_duyet'), 1, 'Retry khong tang version snapshot');

select lives_ok(
  $$select public.fn_tao_dot_import(
    (select nh.id from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
      where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
    'import.xlsx', repeat('c', 64), null
  )$$,
  'Tao dot import staging'
);

select is(
  (select public.fn_tao_dot_import(nh.id, 'import.xlsx', repeat('c', 64), null)
    from public.nam_hoc nh join public.nguoi_dung nd on nd.co_so_id = nh.co_so_id
    where nd.auth_user_id = '00000000-0000-0000-0000-000000020001' and nh.ten = '2098-2099'),
  (select id from public.dot_import where hash_tep = repeat('c', 64)),
  'Cung hash tra lai cung dot import'
);

select lives_ok(
  $$select public.fn_ghi_dong_import(
    (select id from public.dot_import where hash_tep = repeat('c', 64)), 2, 'plan',
    '{"ma_tieu_chi":"1.1","noi_dung":"Ke hoach import","muc_tieu":"Muc tieu"}'::jsonb,
    array[]::text[]
  )$$,
  'Ghi dong hop le vao staging'
);

select ok(
  (public.fn_hoan_tat_staging_import((select id from public.dot_import where hash_tep = repeat('c', 64))) ->> 'ready')::boolean,
  'Dot import chi san sang khi tat ca dong hop le'
);

select lives_ok(
  $$select public.fn_commit_dot_import((select id from public.dot_import where hash_tep = repeat('c', 64)))$$,
  'Commit dot import trong mot transaction'
);

select is(
  (select count(*) from public.ke_hoach_cai_tien where noi_dung = 'Ke hoach import'),
  1::bigint,
  'Commit import sinh dung mot ban ghi nghiep vu'
);

select ok(
  (public.fn_commit_dot_import((select id from public.dot_import where hash_tep = repeat('c', 64))) ->> 'idempotent')::boolean,
  'Commit lai cung dot import la no-op idempotent'
);

select * from finish();
rollback;
