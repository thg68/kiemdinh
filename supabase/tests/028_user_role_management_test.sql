begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(5);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values
  ('28000000-0000-0000-0000-000000000001'::uuid, 'Tenant 28 A', 'T28-A', 'mam_non', array['mam_non']::cap_hoc[]),
  ('28000000-0000-0000-0000-000000000002'::uuid, 'Tenant 28 B', 'T28-B', 'mam_non', array['mam_non']::cap_hoc[]);

insert into auth.users(id, email, aud, role, email_confirmed_at, created_at, updated_at)
values
  ('28000000-0000-0000-0000-000000000101'::uuid, 'principal28@test.local', 'authenticated', 'authenticated', now(), now(), now()),
  ('28000000-0000-0000-0000-000000000102'::uuid, 'teacher28@test.local', 'authenticated', 'authenticated', now(), now(), now()),
  ('28000000-0000-0000-0000-000000000103'::uuid, 'principal28b@test.local', 'authenticated', 'authenticated', now(), now(), now());

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values
  ('28000000-0000-0000-0000-000000000201'::uuid, '28000000-0000-0000-0000-000000000101'::uuid, '28000000-0000-0000-0000-000000000001'::uuid, 'Principal A', 'principal28@test.local'),
  ('28000000-0000-0000-0000-000000000202'::uuid, '28000000-0000-0000-0000-000000000102'::uuid, '28000000-0000-0000-0000-000000000001'::uuid, 'Teacher A', 'teacher28@test.local'),
  ('28000000-0000-0000-0000-000000000203'::uuid, '28000000-0000-0000-0000-000000000103'::uuid, '28000000-0000-0000-0000-000000000002'::uuid, 'Principal B', 'principal28b@test.local');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '28000000-0000-0000-0000-000000000201'::uuid, id, '28000000-0000-0000-0000-000000000001'::uuid from public.vai_tro where ma = 'PRINCIPAL'
union all
select '28000000-0000-0000-0000-000000000202'::uuid, id, '28000000-0000-0000-0000-000000000001'::uuid from public.vai_tro where ma = 'TEACHER'
union all
select '28000000-0000-0000-0000-000000000203'::uuid, id, '28000000-0000-0000-0000-000000000002'::uuid from public.vai_tro where ma = 'PRINCIPAL';

insert into public.loi_moi_thanh_vien(id, co_so_id, email, ho_ten, vai_tro_id, nguoi_moi_id)
select '28000000-0000-0000-0000-000000000301'::uuid, '28000000-0000-0000-0000-000000000001'::uuid,
  'invite-a@test.local', 'Invite A', id, '28000000-0000-0000-0000-000000000201'::uuid
from public.vai_tro where ma = 'TEACHER'
union all
select '28000000-0000-0000-0000-000000000302'::uuid, '28000000-0000-0000-0000-000000000002'::uuid,
  'invite-b@test.local', 'Invite B', id, '28000000-0000-0000-0000-000000000203'::uuid
from public.vai_tro where ma = 'TEACHER';

create function pg_temp.set_actor(p_auth_id uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end;
$$;

select pg_temp.set_actor('28000000-0000-0000-0000-000000000101'::uuid);
select is((select count(*) from public.fn_danh_sach_loi_moi_cua_co_so()), 1::bigint, 'Principal sees pending invitations in own tenant');
select is((select email from public.fn_danh_sach_loi_moi_cua_co_so() limit 1), 'invite-a@test.local', 'Principal does not see another tenant invitation');

select pg_temp.set_actor('28000000-0000-0000-0000-000000000102'::uuid);
select is((select count(*) from public.fn_danh_sach_loi_moi_cua_co_so()), 0::bigint, 'Teacher cannot list managed invitations');
select throws_ok(
  $$select public.fn_huy_loi_moi_thanh_vien('28000000-0000-0000-0000-000000000301'::uuid)$$,
  'Bạn không có quyền hủy lời mời thành viên.',
  'Teacher cannot cancel an invitation'
);

select pg_temp.set_actor('28000000-0000-0000-0000-000000000101'::uuid);
select lives_ok(
  $$select public.fn_huy_loi_moi_thanh_vien('28000000-0000-0000-0000-000000000301'::uuid)$$,
  'Principal can cancel an invitation'
);

select * from finish();
rollback;
