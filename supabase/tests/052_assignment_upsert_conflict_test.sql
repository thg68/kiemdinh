begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(5);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values (
  '52000000-0000-0000-0000-000000000001',
  'Truong test assignment upsert',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  '52000000-0000-0000-0000-000000000002',
  '52000000-0000-0000-0000-000000000001',
  '2094-2095', '2094-08-01', '2095-07-31', 'dang_hoat_dong', standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
order by standard_set.version desc
limit 1;

insert into auth.users(id, email, aud, role, created_at, updated_at) values
  ('52000000-0000-0000-0000-000000000011', 'principal-052@example.test', 'authenticated', 'authenticated', now(), now()),
  ('52000000-0000-0000-0000-000000000012', 'teacher-052@example.test', 'authenticated', 'authenticated', now(), now());

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email, trang_thai) values
  ('52000000-0000-0000-0000-000000000021', '52000000-0000-0000-0000-000000000011', '52000000-0000-0000-0000-000000000001', 'Hieu truong 052', 'principal-052@example.test', 'active'),
  ('52000000-0000-0000-0000-000000000022', '52000000-0000-0000-0000-000000000012', '52000000-0000-0000-0000-000000000001', 'Giao vien 052', 'teacher-052@example.test', 'active');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select actor.user_id, role.id, '52000000-0000-0000-0000-000000000001'
from (values
  ('52000000-0000-0000-0000-000000000021'::uuid, 'PRINCIPAL'),
  ('52000000-0000-0000-0000-000000000022'::uuid, 'TEACHER')
) actor(user_id, role_code)
join public.vai_tro role on role.ma = actor.role_code;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '52000000-0000-0000-0000-000000000011', true);

select lives_ok(
  $$select public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
    '52000000-0000-0000-0000-000000000002',
    'mam_non',
    '52000000-0000-0000-0000-000000000022',
    array[(
      select criterion.id
      from public.v_tieu_chi_nam_hoc criterion
      where criterion.nam_hoc_id = '52000000-0000-0000-0000-000000000002'
        and criterion.ma = '1.1'
    )],
    'phu_trach_nhap_lieu'
  )$$,
  'RPC tao duoc phan cong co cap hoc va tieu chi that'
);

select lives_ok(
  $$select public.fn_phan_cong_tieu_chi_cho_nguoi_dung(
    '52000000-0000-0000-0000-000000000002',
    'mam_non',
    '52000000-0000-0000-0000-000000000022',
    array[
      (
        select criterion.id
        from public.v_tieu_chi_nam_hoc criterion
        where criterion.nam_hoc_id = '52000000-0000-0000-0000-000000000002'
          and criterion.ma = '1.1'
      ),
      (
        select criterion.id
        from public.v_tieu_chi_nam_hoc criterion
        where criterion.nam_hoc_id = '52000000-0000-0000-0000-000000000002'
          and criterion.ma = '1.1'
      )
    ],
    'ra_soat'
  )$$,
  'RPC xu ly mang tieu chi trung lap ma khong tao xung dot'
);

select is(
  (
    select count(*)
    from public.phan_cong_tieu_chi assignment
    where assignment.co_so_id = '52000000-0000-0000-0000-000000000001'
      and assignment.nam_hoc_id = '52000000-0000-0000-0000-000000000002'
      and assignment.nguoi_dung_id = '52000000-0000-0000-0000-000000000022'
      and assignment.cap_hoc = 'mam_non'
  ),
  1::bigint,
  'Lap lai RPC van chi co mot phan cong trong cung scope'
);

select ok(
  (
    select index.indnullsnotdistinct
    from pg_catalog.pg_index index
    join pg_catalog.pg_class relation on relation.oid = index.indexrelid
    join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'uq_phan_cong_nam_nguoi_tieu_chi_cap'
  ),
  'Unique index coi NULL la mot gia tri de bao ve phan cong cho ra soat'
);

select ok(
  to_regprocedure(
    'public.fn_phan_cong_tieu_chi_cho_nguoi_dung(uuid,uuid,uuid[],text)'
  ) is null,
  'Overload cu thieu cap hoc da duoc loai bo'
);

select * from finish();
rollback;
