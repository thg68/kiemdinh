begin;
\ir _bootstrap.pgtap
create extension if not exists pgtap;
select plan(5);

insert into public.co_so_giao_duc(id, ten, loai_hinh, cap_hoc)
values ('00000000-0000-0000-0000-000000046001', 'Don vi tim kiem minh chung', 'mam_non', array['mam_non']::public.cap_hoc[]);
insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, bo_tieu_chuan_id)
select '00000000-0000-0000-0000-000000046002', '00000000-0000-0000-0000-000000046001', '2099-2100', '2099-08-01', '2100-06-30', standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
order by standard_set.version desc limit 1;
insert into auth.users(id, email) values ('00000000-0000-0000-0000-000000046003', 'principal-046@example.test');
insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values ('00000000-0000-0000-0000-000000046004', '00000000-0000-0000-0000-000000046003', '00000000-0000-0000-0000-000000046001', 'Hieu truong tim kiem', 'principal-046@example.test');
insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '00000000-0000-0000-0000-000000046004', role.id, '00000000-0000-0000-0000-000000046001'
from public.vai_tro role where role.ma = 'PRINCIPAL';

insert into public.minh_chung(co_so_id, nam_hoc_id, ma, ten, loai_tep, duong_dan, nguoi_tai_len, created_at)
select
  '00000000-0000-0000-0000-000000046001',
  '00000000-0000-0000-0000-000000046002',
  format('MC.1.1.%s', series_no + 100),
  format('Minh chung thu %s', series_no),
  'text/html',
  format('https://example.test/evidence/%s', series_no),
  '00000000-0000-0000-0000-000000046004',
  now() - make_interval(secs => series_no)
from generate_series(1, 150) series_no;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000046003', true);

create temporary table result_046_first as
select public.fn_tao_minh_chung_idempotent(
  '00000000-0000-4000-8000-000000046010',
  '00000000-0000-0000-0000-000000046002',
  array[(select id from public.v_tieu_chi_nam_hoc where nam_hoc_id = '00000000-0000-0000-0000-000000046002' and ma = '1.1')],
  (select id from public.v_tieu_chi_nam_hoc where nam_hoc_id = '00000000-0000-0000-0000-000000046002' and ma = '1.1'),
  'Minh chung finalize idempotent', 'text/html', 'https://example.test/idempotent', null, null, null, null, null
) as payload;
grant select on result_046_first to authenticated;

select ok((select (payload ->> 'created')::boolean from result_046_first), 'Lan dau tao minh chung moi');

create temporary table result_046_second as
select public.fn_tao_minh_chung_idempotent(
  '00000000-0000-4000-8000-000000046010',
  '00000000-0000-0000-0000-000000046002',
  array[(select id from public.v_tieu_chi_nam_hoc where nam_hoc_id = '00000000-0000-0000-0000-000000046002' and ma = '1.1')],
  (select id from public.v_tieu_chi_nam_hoc where nam_hoc_id = '00000000-0000-0000-0000-000000046002' and ma = '1.1'),
  'Ten thay doi khong duoc tao moi', 'text/html', 'https://example.test/changed', null, null, null, null, null
) as payload;
grant select on result_046_second to authenticated;

select isnt((select (payload ->> 'created')::boolean from result_046_second), true, 'Retry khong tao minh chung moi');
select is(
  (select payload ->> 'id' from result_046_first),
  (select payload ->> 'id' from result_046_second),
  'Retry tra lai dung ID da commit'
);
select is(
  (select count(*) from public.minh_chung where finalize_key = '00000000-0000-4000-8000-000000046010'),
  1::bigint,
  'Mot request key chi co mot ban ghi'
);
select is(
  (select count(*) from public.fn_tim_minh_chung_de_dung_lai('00000000-0000-0000-0000-000000046002', 'thu 150', 25, 0)),
  1::bigint,
  'Tim thay minh chung nam ngoai 100 ban ghi dau'
);

select * from finish();
rollback;
