begin;
\ir _bootstrap.pgtap
create extension if not exists pgtap;
select plan(8);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values (
  '00000000-0000-0000-0000-000000044001',
  'Truong kiem thu duyet tu danh gia',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  '00000000-0000-0000-0000-000000044002',
  '00000000-0000-0000-0000-000000044001',
  '2099-2100', '2099-08-01', '2100-06-30', 'dang_hoat_dong', standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
order by standard_set.version desc
limit 1;

insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-000000044011', 'principal-044@example.test'),
  ('00000000-0000-0000-0000-000000044012', 'member-044@example.test');

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email) values
  ('00000000-0000-0000-0000-000000044021', '00000000-0000-0000-0000-000000044011', '00000000-0000-0000-0000-000000044001', 'Hieu truong kiem thu', 'principal-044@example.test'),
  ('00000000-0000-0000-0000-000000044022', '00000000-0000-0000-0000-000000044012', '00000000-0000-0000-0000-000000044001', 'Uy vien kiem thu', 'member-044@example.test');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select actor.user_id, role.id, '00000000-0000-0000-0000-000000044001'
from (
  values
    ('00000000-0000-0000-0000-000000044021'::uuid, 'PRINCIPAL'),
    ('00000000-0000-0000-0000-000000044022'::uuid, 'MEMBER')
) actor(user_id, role_code)
join public.vai_tro role on role.ma = actor.role_code;

create temporary table test_044_scope as
select criterion.id as tieu_chi_id
from public.v_tieu_chi_nam_hoc criterion
where criterion.nam_hoc_id = '00000000-0000-0000-0000-000000044002'
  and criterion.ma = '1.1';
grant select on table test_044_scope to authenticated;

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, trang_thai_xac_minh,
  ngay_het_gia_tri, nguoi_tai_len, nguoi_xac_minh, ngay_xac_minh
) values
  ('00000000-0000-0000-0000-000000044031', '00000000-0000-0000-0000-000000044001', '00000000-0000-0000-0000-000000044002', 'MC.1.1.81', 'Minh chung con hieu luc', 'da_xac_minh', '2100-06-30', '00000000-0000-0000-0000-000000044021', '00000000-0000-0000-0000-000000044021', now()),
  ('00000000-0000-0000-0000-000000044032', '00000000-0000-0000-0000-000000044001', '00000000-0000-0000-0000-000000044002', 'MC.1.1.82', 'Minh chung het hieu luc', 'da_xac_minh', '2020-01-01', '00000000-0000-0000-0000-000000044021', '00000000-0000-0000-0000-000000044021', now());

insert into public.minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, la_tieu_chi_goc, created_by)
select evidence_id, scope.tieu_chi_id, true, '00000000-0000-0000-0000-000000044021'
from unnest(array[
  '00000000-0000-0000-0000-000000044031'::uuid,
  '00000000-0000-0000-0000-000000044032'::uuid
]) evidence_id
cross join test_044_scope scope;

insert into public.tu_danh_gia(
  id, co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc,
  mo_ta_muc_1, dat_muc_1, muc_dat, nguoi_nhap, trang_thai
)
select
  '00000000-0000-0000-0000-000000044041',
  '00000000-0000-0000-0000-000000044001',
  '00000000-0000-0000-0000-000000044002',
  scope.tieu_chi_id, 'mam_non', 'Hien trang co minh chung', false, 0,
  '00000000-0000-0000-0000-000000044022', 'nhap'
from test_044_scope scope;

insert into public.tu_danh_gia_minh_chung(
  co_so_id, nam_hoc_id, tu_danh_gia_id, minh_chung_id, created_by
) values (
  '00000000-0000-0000-0000-000000044001',
  '00000000-0000-0000-0000-000000044002',
  '00000000-0000-0000-0000-000000044041',
  '00000000-0000-0000-0000-000000044031',
  '00000000-0000-0000-0000-000000044022'
);

update public.tu_danh_gia
set dat_muc_1 = true, muc_dat = 1
where id = '00000000-0000-0000-0000-000000044041';

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000044011', true);

select throws_ok(
  format(
    'select public.fn_cap_nhat_trang_thai_tu_danh_gia(%L, %L, %L, %L, %L)',
    '00000000-0000-0000-0000-000000044002'::uuid,
    'mam_non'::public.cap_hoc,
    (select tieu_chi_id from test_044_scope),
    'da_duyet'::public.trang_thai_tu_danh_gia,
    (select revision from public.tu_danh_gia where id = '00000000-0000-0000-0000-000000044041')
  ),
  '55000',
  'Chi co the duyet tu trang thai cho duyet.',
  'Khong cho phep chot truc tiep tu ban nhap'
);

select lives_ok(
  format(
    'select public.fn_cap_nhat_trang_thai_tu_danh_gia(%L, %L, %L, %L, %L)',
    '00000000-0000-0000-0000-000000044002'::uuid,
    'mam_non'::public.cap_hoc,
    (select tieu_chi_id from test_044_scope),
    'cho_duyet'::public.trang_thai_tu_danh_gia,
    (select revision from public.tu_danh_gia where id = '00000000-0000-0000-0000-000000044041')
  ),
  'Nguoi co quyen ghi gui duyet thanh cong'
);

select throws_ok(
  format(
    'select public.fn_cap_nhat_trang_thai_tu_danh_gia(%L, %L, %L, %L, %L)',
    '00000000-0000-0000-0000-000000044002'::uuid,
    'mam_non'::public.cap_hoc,
    (select tieu_chi_id from test_044_scope),
    'da_duyet'::public.trang_thai_tu_danh_gia,
    1
  ),
  '40001',
  'Ban tu danh gia da thay doi. Hay tai lai du lieu truoc khi thao tac.',
  'Revision cu bi tu choi de tranh ghi de'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000044012', true);
select throws_ok(
  format(
    'select public.fn_cap_nhat_trang_thai_tu_danh_gia(%L, %L, %L, %L, %L)',
    '00000000-0000-0000-0000-000000044002'::uuid,
    'mam_non'::public.cap_hoc,
    (select tieu_chi_id from test_044_scope),
    'da_duyet'::public.trang_thai_tu_danh_gia,
    (select revision from public.tu_danh_gia where id = '00000000-0000-0000-0000-000000044041')
  ),
  '42501',
  'Ban khong co quyen duyet tu danh gia.',
  'Uy vien khong the chot muc'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000044011', true);
select lives_ok(
  format(
    'select public.fn_cap_nhat_trang_thai_tu_danh_gia(%L, %L, %L, %L, %L)',
    '00000000-0000-0000-0000-000000044002'::uuid,
    'mam_non'::public.cap_hoc,
    (select tieu_chi_id from test_044_scope),
    'da_duyet'::public.trang_thai_tu_danh_gia,
    (select revision from public.tu_danh_gia where id = '00000000-0000-0000-0000-000000044041')
  ),
  'Hieu truong chot muc tu hang doi thanh cong'
);

select throws_ok(
  format(
    'select public.fn_luu_tu_danh_gia_atomic(%L, %L, %L, %L, %L, %L, %L)',
    '00000000-0000-0000-0000-000000044002'::uuid,
    'mam_non'::public.cap_hoc,
    (select tieu_chi_id from test_044_scope),
    'Noi dung bi sua sau duyet',
    '',
    1::smallint,
    array['00000000-0000-0000-0000-000000044031']::uuid[]
  ),
  '55000',
  'Ban tu danh gia dang cho duyet hoac da duyet, khong the sua noi dung.',
  'Noi dung da duyet la bat bien'
);

select set_config('request.jwt.claim.sub', '', true);
set local role postgres;

alter table public.tu_danh_gia disable trigger trg_guard_tu_danh_gia_workflow;
alter table public.tu_danh_gia_minh_chung disable trigger trg_guard_tdg_minh_chung_workflow;
update public.tu_danh_gia
set trang_thai = 'nhap', dat_muc_1 = false, muc_dat = 0
where id = '00000000-0000-0000-0000-000000044041';
delete from public.tu_danh_gia_minh_chung
where tu_danh_gia_id = '00000000-0000-0000-0000-000000044041';
insert into public.tu_danh_gia_minh_chung(
  co_so_id, nam_hoc_id, tu_danh_gia_id, minh_chung_id, created_by
) values (
  '00000000-0000-0000-0000-000000044001',
  '00000000-0000-0000-0000-000000044002',
  '00000000-0000-0000-0000-000000044041',
  '00000000-0000-0000-0000-000000044032',
  '00000000-0000-0000-0000-000000044022'
);
alter table public.tu_danh_gia disable trigger trg_tu_danh_gia_has_evidence;
update public.tu_danh_gia set dat_muc_1 = true, muc_dat = 1 where id = '00000000-0000-0000-0000-000000044041';
alter table public.tu_danh_gia enable trigger trg_tu_danh_gia_has_evidence;
alter table public.tu_danh_gia enable trigger trg_guard_tu_danh_gia_workflow;
alter table public.tu_danh_gia_minh_chung enable trigger trg_guard_tdg_minh_chung_workflow;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000044011', true);
select throws_ok(
  format(
    'select public.fn_cap_nhat_trang_thai_tu_danh_gia(%L, %L, %L, %L, %L)',
    '00000000-0000-0000-0000-000000044002'::uuid,
    'mam_non'::public.cap_hoc,
    (select tieu_chi_id from test_044_scope),
    'cho_duyet'::public.trang_thai_tu_danh_gia,
    (select revision from public.tu_danh_gia where id = '00000000-0000-0000-0000-000000044041')
  ),
  '23514',
  'Tat ca minh chung cua ban tu danh gia phai da xac minh va con hieu luc.',
  'Minh chung het han chan gui duyet'
);

select is(
  (select trang_thai::text from public.tu_danh_gia where id = '00000000-0000-0000-0000-000000044041'),
  'nhap',
  'Trang thai khong doi khi duyet that bai'
);

select * from finish();
rollback;
