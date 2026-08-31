begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '14000000-0000-0000-0000-000000000101',
  'Sprint 14 Versioned Evidence School',
  'SPRINT14-EVIDENCE',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.bo_tieu_chuan(
  id, ma_van_ban, ten, ngay_hieu_luc, loai_hinh, version, trang_thai
)
values
  (
    '14000000-0000-0000-0000-000000000111',
    'SPRINT14/TEST',
    'Bo tieu chuan Sprint 14 V1',
    '2097-07-01',
    'mam_non',
    1,
    'ngung_ap_dung'
  ),
  (
    '14000000-0000-0000-0000-000000000112',
    'SPRINT14/TEST',
    'Bo tieu chuan Sprint 14 V2',
    '2098-07-01',
    'mam_non',
    2,
    'dang_ap_dung'
  );

insert into public.tieu_chuan(id, bo_id, so_thu_tu, ten)
values
  (
    '14000000-0000-0000-0000-000000000121',
    '14000000-0000-0000-0000-000000000111',
    1,
    'Tieu chuan Sprint 14 V1'
  ),
  (
    '14000000-0000-0000-0000-000000000122',
    '14000000-0000-0000-0000-000000000112',
    1,
    'Tieu chuan Sprint 14 V2'
  );

insert into public.tieu_chi(
  id, tieu_chuan_id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, thu_tu
)
values
  (
    '14000000-0000-0000-0000-000000000131',
    '14000000-0000-0000-0000-000000000121',
    '1.1',
    'Tieu chi 1.1 Sprint 14 V1',
    false,
    'mam_non',
    1
  ),
  (
    '14000000-0000-0000-0000-000000000132',
    '14000000-0000-0000-0000-000000000122',
    '1.1',
    'Tieu chi 1.1 Sprint 14 V2',
    false,
    'mam_non',
    1
  );

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
values
  (
    '14000000-0000-0000-0000-000000000141',
    '14000000-0000-0000-0000-000000000101',
    '2097-2098',
    '2097-08-01',
    '2098-07-31',
    'luu_tru',
    '14000000-0000-0000-0000-000000000111'
  ),
  (
    '14000000-0000-0000-0000-000000000142',
    '14000000-0000-0000-0000-000000000101',
    '2098-2099',
    '2098-08-01',
    '2099-07-31',
    'dang_hoat_dong',
    '14000000-0000-0000-0000-000000000112'
  );

create temporary table sprint14_actor(
  actor_code text primary key,
  auth_id uuid not null,
  user_id uuid not null,
  role_code text not null
);

insert into sprint14_actor(actor_code, auth_id, user_id, role_code)
values
  (
    'PRINCIPAL',
    '14000000-0000-0000-0000-000000000201',
    '14000000-0000-0000-0000-000000000301',
    'PRINCIPAL'
  ),
  (
    'TEACHER',
    '14000000-0000-0000-0000-000000000202',
    '14000000-0000-0000-0000-000000000302',
    'TEACHER'
  );

insert into auth.users(id, email, aud, role, created_at, updated_at)
select
  auth_id,
  lower(actor_code) || '@sprint14.test',
  'authenticated',
  'authenticated',
  now(),
  now()
from sprint14_actor
on conflict (id) do nothing;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
select
  user_id,
  auth_id,
  '14000000-0000-0000-0000-000000000101',
  actor_code,
  lower(actor_code) || '@sprint14.test'
from sprint14_actor;

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  actor.user_id,
  role.id,
  '14000000-0000-0000-0000-000000000101'
from sprint14_actor actor
join public.vai_tro role on role.ma = actor.role_code;

create function pg_temp.exec_as(p_auth_id uuid, p_sql text)
returns bigint
language plpgsql
as $$
declare
  v_row_count bigint;
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  execute p_sql;
  get diagnostics v_row_count = row_count;
  execute 'reset role';
  return v_row_count;
exception when others then
  execute 'reset role';
  raise;
end;
$$;

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bo_dem_ma_minh_chung'
      and column_name = 'ma_tieu_chi'
      and is_nullable = 'NO'
  ),
  'Bo dem dung ma tieu chi logic, khong phu thuoc UUID phien ban'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bo_dem_ma_minh_chung'
      and column_name = 'tieu_chi_id'
  ),
  'Bo dem khong con khoa theo UUID tieu chi'
);

select is(
  (
    select string_agg(attribute.attname, ',' order by key_column.ordinality)
    from pg_catalog.pg_constraint constraint_row
    cross join lateral unnest(constraint_row.conkey) with ordinality as key_column(attnum, ordinality)
    join pg_catalog.pg_attribute attribute
      on attribute.attrelid = constraint_row.conrelid
      and attribute.attnum = key_column.attnum
    where constraint_row.conrelid = 'public.bo_dem_ma_minh_chung'::regclass
      and constraint_row.contype = 'p'
  ),
  'co_so_id,ma_tieu_chi',
  'Khoa chinh bo dem la co_so_id va ma_tieu_chi'
);

select lives_ok(
  $test$
    select pg_temp.exec_as(
      '14000000-0000-0000-0000-000000000201',
      $sql$
        select public.fn_tao_minh_chung(
          '14000000-0000-0000-0000-000000000141',
          array['14000000-0000-0000-0000-000000000131'::uuid],
          '14000000-0000-0000-0000-000000000131',
          'Minh chung V1',
          'text/html',
          'https://example.test/sprint14-v1',
          null,
          null,
          null,
          '2097-09-01',
          null
        )
      $sql$
    )
  $test$,
  'Tao duoc minh chung dau tien tren phien ban V1'
);

select lives_ok(
  $test$
    select pg_temp.exec_as(
      '14000000-0000-0000-0000-000000000201',
      $sql$
        select public.fn_tao_minh_chung(
          '14000000-0000-0000-0000-000000000142',
          array['14000000-0000-0000-0000-000000000132'::uuid],
          '14000000-0000-0000-0000-000000000132',
          'Minh chung V2',
          'text/html',
          'https://example.test/sprint14-v2',
          null,
          null,
          null,
          '2098-09-01',
          null
        )
      $sql$
    )
  $test$,
  'Doi UUID tieu chi o V2 khong lam trung ma minh chung'
);

select is(
  (
    select ma
    from public.minh_chung
    where co_so_id = '14000000-0000-0000-0000-000000000101'
      and nam_hoc_id = '14000000-0000-0000-0000-000000000141'
  ),
  'MC.1.1.01',
  'Minh chung V1 nhan ma dau tien cua tieu chi 1.1'
);

select is(
  (
    select ma
    from public.minh_chung
    where co_so_id = '14000000-0000-0000-0000-000000000101'
      and nam_hoc_id = '14000000-0000-0000-0000-000000000142'
      and ten = 'Minh chung V2'
  ),
  'MC.1.1.02',
  'Minh chung V2 tiep tuc day so cua cung ma tieu chi 1.1'
);

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, duong_dan, trang_thai_xac_minh
)
values (
  '14000000-0000-0000-0000-000000000401',
  '14000000-0000-0000-0000-000000000101',
  '14000000-0000-0000-0000-000000000142',
  'MC.1.1.08',
  'Minh chung lich su da import',
  'https://example.test/sprint14-imported',
  'cho_xac_minh'
);

select lives_ok(
  $test$
    select pg_temp.exec_as(
      '14000000-0000-0000-0000-000000000201',
      $sql$
        select public.fn_tao_minh_chung(
          '14000000-0000-0000-0000-000000000142',
          array['14000000-0000-0000-0000-000000000132'::uuid],
          '14000000-0000-0000-0000-000000000132',
          'Minh chung sau import',
          'text/html',
          'https://example.test/sprint14-after-import',
          null,
          null,
          null,
          '2098-10-01',
          null
        )
      $sql$
    )
  $test$,
  'Bo dem tu doi chieu ma lich su de tranh va cham sau import'
);

select is(
  (
    select ma
    from public.minh_chung
    where co_so_id = '14000000-0000-0000-0000-000000000101'
      and ten = 'Minh chung sau import'
  ),
  'MC.1.1.09',
  'Ma moi tiep tuc sau so lon nhat da co trong kho'
);

select is(
  (
    select count(*)
    from public.bo_dem_ma_minh_chung
    where co_so_id = '14000000-0000-0000-0000-000000000101'
      and ma_tieu_chi = '1.1'
  ),
  1::bigint,
  'Moi co so chi co mot bo dem cho ma tieu chi 1.1 qua moi phien ban'
);

select is(
  (
    select so_tiep_theo
    from public.bo_dem_ma_minh_chung
    where co_so_id = '14000000-0000-0000-0000-000000000101'
      and ma_tieu_chi = '1.1'
  ),
  10,
  'Bo dem luu dung so tiep theo sau khi doi chieu kho minh chung'
);

select throws_ok(
  $test$
    select pg_temp.exec_as(
      '14000000-0000-0000-0000-000000000201',
      $sql$
        select public.fn_tao_minh_chung(
          '14000000-0000-0000-0000-000000000142',
          array['14000000-0000-0000-0000-000000000131'::uuid],
          '14000000-0000-0000-0000-000000000131',
          'Sai phien ban',
          'text/html',
          'https://example.test/sprint14-invalid',
          null,
          null,
          null,
          '2098-11-01',
          null
        )
      $sql$
    )
  $test$,
  'P0001',
  'Tiêu chí đã chọn không thuộc phiên bản bộ tiêu chuẩn của năm học.',
  'RPC tao minh chung tu choi UUID tieu chi cua phien ban khac'
);

select throws_ok(
  $test$
    select pg_temp.exec_as(
      '14000000-0000-0000-0000-000000000201',
      $sql$
        select public.fn_gan_minh_chung_tieu_chi(
          (
            select id
            from public.minh_chung
            where co_so_id = '14000000-0000-0000-0000-000000000101'
              and ten = 'Minh chung V2'
          ),
          array['14000000-0000-0000-0000-000000000131'::uuid]
        )
      $sql$
    )
  $test$,
  'P0001',
  'Tiêu chí đã chọn không thuộc phiên bản bộ tiêu chuẩn của năm học.',
  'RPC gan minh chung tu choi UUID tieu chi cua phien ban khac'
);

select lives_ok(
  $test$
    select pg_temp.exec_as(
      '14000000-0000-0000-0000-000000000201',
      $sql$
        select public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
          '14000000-0000-0000-0000-000000000142',
          '14000000-0000-0000-0000-000000000302',
          array['14000000-0000-0000-0000-000000000132'::uuid],
          'phu_trach_nhap_lieu'
        )
      $sql$
    )
  $test$,
  'Hieu truong phan cong duoc tieu chi dung phien ban'
);

select throws_ok(
  $test$
    select pg_temp.exec_as(
      '14000000-0000-0000-0000-000000000201',
      $sql$
        select public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
          '14000000-0000-0000-0000-000000000142',
          '14000000-0000-0000-0000-000000000302',
          array['14000000-0000-0000-0000-000000000131'::uuid],
          'phu_trach_nhap_lieu'
        )
      $sql$
    )
  $test$,
  'P0001',
  'Tiêu chí phân công không thuộc phiên bản bộ tiêu chuẩn của năm học.',
  'RPC phan cong tu choi UUID tieu chi cua phien ban khac'
);

select is(
  (
    select count(*)
    from public.phan_cong_tieu_chi
    where co_so_id = '14000000-0000-0000-0000-000000000101'
      and nam_hoc_id = '14000000-0000-0000-0000-000000000142'
      and nguoi_dung_id = '14000000-0000-0000-0000-000000000302'
      and tieu_chi_id = '14000000-0000-0000-0000-000000000132'
  ),
  1::bigint,
  'Phan cong hop le cu van duoc giu nguyen khi yeu cau moi sai phien ban'
);

select * from finish();
rollback;
