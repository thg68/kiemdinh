begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(13);

insert into auth.users(id, email, aud, role, created_at, updated_at)
select
  ('34000000-0000-0000-0000-' || lpad(value::text, 12, '0'))::uuid,
  'sprint12-role-' || value || '@test.local',
  'authenticated',
  'authenticated',
  now(),
  now()
from generate_series(1, 7) value;

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '34000000-0000-0000-0000-000000000001',
  'Sprint 12 Pilot School',
  'SPRINT12-034',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id)
select
  '34000000-0000-0000-0000-000000000011',
  '34000000-0000-0000-0000-000000000001',
  '2094-2095',
  '2094-08-01',
  '2095-05-31',
  'dang_hoat_dong',
  btc.id
from public.bo_tieu_chuan btc
where btc.loai_hinh = 'mam_non' and btc.trang_thai = 'dang_ap_dung'
order by btc.version desc
limit 1;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
select
  ('34000000-0000-0000-0001-' || lpad(value::text, 12, '0'))::uuid,
  ('34000000-0000-0000-0000-' || lpad(value::text, 12, '0'))::uuid,
  '34000000-0000-0000-0000-000000000001',
  'Sprint 12 Role ' || value,
  'sprint12-role-' || value || '@test.local'
from generate_series(1, 7) value;

with role_order(ma, ordinal) as (
  values
    ('PRINCIPAL', 1),
    ('SYSTEM_ADMIN', 2),
    ('SELF_ASSESSMENT_CHAIR', 3),
    ('SECRETARY', 4),
    ('MEMBER', 5),
    ('TEACHER', 6),
    ('VIEWER', 7)
)
insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  ('34000000-0000-0000-0001-' || lpad(role_order.ordinal::text, 12, '0'))::uuid,
  vt.id,
  '34000000-0000-0000-0000-000000000001'
from role_order
join public.vai_tro vt on vt.ma = role_order.ma;

set local role authenticated;
select set_config('request.jwt.claim.sub', '34000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  not (public.fn_kiem_tra_du_lieu_thi_diem(
    '34000000-0000-0000-0000-000000000011',
    'mam_non'
  ) ->> 'ready')::boolean,
  'Cong thi diem chan nam hoc chua du 100 minh chung'
);

reset role;

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, trang_thai_xac_minh, nguoi_tai_len,
  nguoi_xac_minh, ngay_xac_minh
)
select
  ('34000000-0000-0000-0002-' || lpad(value::text, 12, '0'))::uuid,
  '34000000-0000-0000-0000-000000000001',
  '34000000-0000-0000-0000-000000000011',
  'MC.PILOT.' || lpad(value::text, 3, '0'),
  'Minh chung thi diem ' || value,
  'da_xac_minh',
  '34000000-0000-0000-0001-000000000001',
  '34000000-0000-0000-0001-000000000001',
  now()
from generate_series(1, 100) value;

with criteria as (
  select id, row_number() over (order by ma) ordinal
  from public.v_tieu_chi_nam_hoc
  where co_so_id = '34000000-0000-0000-0000-000000000001'
    and nam_hoc_id = '34000000-0000-0000-0000-000000000011'
)
insert into public.minh_chung_tieu_chi(minh_chung_id, tieu_chi_id, la_tieu_chi_goc)
select
  ('34000000-0000-0000-0002-' || lpad(criteria.ordinal::text, 12, '0'))::uuid,
  criteria.id,
  true
from criteria;

insert into public.tu_danh_gia(
  co_so_id, nam_hoc_id, tieu_chi_id, cap_hoc, mo_ta_muc_1, muc_dat, nguoi_nhap
)
select
  vtc.co_so_id,
  vtc.nam_hoc_id,
  vtc.id,
  'mam_non',
  'Noi dung thi diem ' || vtc.ma,
  0,
  '34000000-0000-0000-0001-000000000001'
from public.v_tieu_chi_nam_hoc vtc
where vtc.co_so_id = '34000000-0000-0000-0000-000000000001'
  and vtc.nam_hoc_id = '34000000-0000-0000-0000-000000000011';

set local role authenticated;
select set_config('request.jwt.claim.sub', '34000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  (public.fn_kiem_tra_du_lieu_thi_diem(
    '34000000-0000-0000-0000-000000000011',
    'mam_non'
  ) ->> 'ready')::boolean,
  'Cong thi diem dat khi co 100 minh chung, 15 tieu chi va 7 vai tro'
);
select is(
  (public.fn_kiem_tra_du_lieu_thi_diem(
    '34000000-0000-0000-0000-000000000011',
    'mam_non'
  ) ->> 'evidence_count')::integer,
  100,
  'Cong thi diem dem dung 100 minh chung that'
);
select is(
  (public.fn_kiem_tra_du_lieu_thi_diem(
    '34000000-0000-0000-0000-000000000011',
    'mam_non'
  ) ->> 'criteria_with_evidence')::integer,
  15,
  'Cong thi diem xac nhan du 15 tieu chi co minh chung'
);

reset role;

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, trang_thai_xac_minh, nguoi_tai_len
) values (
  '34000000-0000-0000-0003-000000000001',
  '34000000-0000-0000-0000-000000000001',
  '34000000-0000-0000-0000-000000000011',
  'MC.DEMO.001',
  '[DEMO] Minh chung khong duoc xuat',
  'da_xac_minh',
  '34000000-0000-0000-0001-000000000001'
);

select ok(
  (select la_du_lieu_demo from public.minh_chung where id = '34000000-0000-0000-0003-000000000001'),
  'Trigger tu dong danh dau ban ghi mang nhan DEMO'
);
select is(
  (select count(*) from public.v_minh_chung_hop_le_danh_gia
    where id = '34000000-0000-0000-0003-000000000001'),
  0::bigint,
  'View danh gia loai minh chung demo'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '34000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  not (public.fn_kiem_tra_du_lieu_thi_diem(
    '34000000-0000-0000-0000-000000000011',
    'mam_non'
  ) ->> 'ready')::boolean,
  'Cong thi diem khong dat khi con du lieu demo'
);

reset role;

select throws_ok(
  $$insert into public.bao_cao(
    co_so_id, nam_hoc_id, cap_hoc, loai_bao_cao, trang_thai, version
  ) values (
    '34000000-0000-0000-0000-000000000001',
    '34000000-0000-0000-0000-000000000011',
    'mam_non',
    'mau_1_tu_danh_gia',
    'da_phe_duyet',
    1
  )$$,
  'P0001',
  'Bao cao khong the phe duyet khi nam hoc con du lieu demo.',
  'Database chan phe duyet bao cao khi nam hoc con demo'
);

update public.minh_chung set trang_thai_xac_minh = 'tu_choi'
where id = '34000000-0000-0000-0002-000000000002';
update public.minh_chung set ngay_het_gia_tri = '2094-08-02'
where id = '34000000-0000-0000-0002-000000000003';
update public.minh_chung set deleted_at = now()
where id = '34000000-0000-0000-0002-000000000004';

set local role authenticated;
select set_config('request.jwt.claim.sub', '34000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.fn_tao_nam_hoc_ke_thua(
    '2095-2096', '2095-08-01', '2096-05-31',
    '34000000-0000-0000-0000-000000000011', false, null
  )$$,
  'Tao nam hoc moi va ke thua tu danh gia'
);
select is(
  (select count(*) from public.tu_danh_gia tdg
    join public.nam_hoc nh on nh.id = tdg.nam_hoc_id
    where nh.co_so_id = '34000000-0000-0000-0000-000000000001'
      and nh.ten = '2095-2096'
      and tdg.trang_thai = 'ke_thua_cho_cap_nhat'),
  15::bigint,
  'Nam hoc moi co 15 ban ghi ke thua cho cap nhat'
);
select is(
  (select count(*) from public.tu_danh_gia tdg
    join public.nam_hoc nh on nh.id = tdg.nam_hoc_id
    where nh.co_so_id = '34000000-0000-0000-0000-000000000001'
      and nh.ten = '2095-2096'
      and (tdg.muc_dat <> 0 or tdg.dat_muc_1 or tdg.dat_muc_2)),
  0::bigint,
  'Ban ghi ke thua khong tu dong giu muc dat cu'
);
select is(
  (select count(*) from public.minh_chung mc
    join public.nam_hoc nh on nh.id = mc.nam_hoc_id
    where nh.co_so_id = '34000000-0000-0000-0000-000000000001'
      and nh.ten = '2095-2096'),
  0::bigint,
  'Minh chung cu ke ca bi sua, tu choi, het han hay da xoa deu khong tu dong ke thua'
);
select is(
  (select count(*) from public.tu_danh_gia tdg
    join public.nam_hoc nh on nh.id = tdg.nam_hoc_id
    where nh.co_so_id = '34000000-0000-0000-0000-000000000001'
      and nh.ten = '2095-2096'
      and tdg.ke_thua_tu_id is not null),
  15::bigint,
  'Moi ban ghi ke thua truy vet duoc ban ghi nam truoc'
);

select * from finish();
rollback;
