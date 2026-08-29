begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(4);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values
  ('27000000-0000-0000-0000-000000000001', 'Tenant 27 A', 'T27-A', 'mam_non', array['mam_non']::cap_hoc[]),
  ('27000000-0000-0000-0000-000000000002', 'Tenant 27 B', 'T27-B', 'mam_non', array['mam_non']::cap_hoc[]);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values
  ('27000000-0000-0000-0000-000000000011', '27000000-0000-0000-0000-000000000001', '2097-2098', '2097-08-01', '2098-07-31', 'dang_hoat_dong'),
  ('27000000-0000-0000-0000-000000000012', '27000000-0000-0000-0000-000000000002', '2097-2098', '2097-08-01', '2098-07-31', 'dang_hoat_dong');

insert into auth.users(id, email, aud, role, created_at, updated_at)
values
  ('27000000-0000-0000-0000-000000000101', 'viewer27@test.local', 'authenticated', 'authenticated', now(), now()),
  ('27000000-0000-0000-0000-000000000102', 'principal27@test.local', 'authenticated', 'authenticated', now(), now());

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values
  ('27000000-0000-0000-0000-000000000201', '27000000-0000-0000-0000-000000000101', '27000000-0000-0000-0000-000000000001', 'Viewer 27', 'viewer27@test.local'),
  ('27000000-0000-0000-0000-000000000202', '27000000-0000-0000-0000-000000000102', '27000000-0000-0000-0000-000000000001', 'Principal 27', 'principal27@test.local');

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select '27000000-0000-0000-0000-000000000201'::uuid, id, '27000000-0000-0000-0000-000000000001'::uuid
from public.vai_tro where ma = 'VIEWER'
union all
select '27000000-0000-0000-0000-000000000202'::uuid, id, '27000000-0000-0000-0000-000000000001'::uuid
from public.vai_tro where ma = 'PRINCIPAL';

alter table public.bao_cao disable trigger user;
insert into public.bao_cao(
  id, co_so_id, nam_hoc_id, cap_hoc, loai_bao_cao, version, trang_thai,
  storage_path, ten_tep_goc, mime_type, kich_thuoc, sha256, nguoi_tao
)
values
  (
    '27000000-0000-0000-0000-000000000301',
    '27000000-0000-0000-0000-000000000001',
    '27000000-0000-0000-0000-000000000011',
    'mam_non', 'mau_1_tu_danh_gia', 1, 'nhap',
    '27000000-0000-0000-0000-000000000001/27000000-0000-0000-0000-000000000011/draft.docx',
    'draft.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    10, repeat('a', 64), '27000000-0000-0000-0000-000000000202'
  ),
  (
    '27000000-0000-0000-0000-000000000302',
    '27000000-0000-0000-0000-000000000001',
    '27000000-0000-0000-0000-000000000011',
    'mam_non', 'mau_1_tu_danh_gia', 2, 'da_phe_duyet',
    '27000000-0000-0000-0000-000000000001/27000000-0000-0000-0000-000000000011/approved.docx',
    'approved.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    10, repeat('b', 64), '27000000-0000-0000-0000-000000000202'
  );
alter table public.bao_cao enable trigger user;

create function pg_temp.can_read_file_as(p_auth_id uuid, p_path text)
returns boolean
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', p_auth_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  return public.fn_can_read_report_file(p_path);
end;
$$;

select is(
  pg_temp.can_read_file_as(
    '27000000-0000-0000-0000-000000000101',
    '27000000-0000-0000-0000-000000000001/27000000-0000-0000-0000-000000000011/approved.docx'
  ),
  true,
  'Viewer reads an approved snapshot in own tenant'
);

select is(
  pg_temp.can_read_file_as(
    '27000000-0000-0000-0000-000000000101',
    '27000000-0000-0000-0000-000000000001/27000000-0000-0000-0000-000000000011/draft.docx'
  ),
  false,
  'Viewer cannot read a draft snapshot'
);

select is(
  pg_temp.can_read_file_as(
    '27000000-0000-0000-0000-000000000102',
    '27000000-0000-0000-0000-000000000001/27000000-0000-0000-0000-000000000011/draft.docx'
  ),
  true,
  'Principal can read a draft snapshot in own tenant'
);

select is(
  pg_temp.can_read_file_as(
    '27000000-0000-0000-0000-000000000101',
    '27000000-0000-0000-0000-000000000002/27000000-0000-0000-0000-000000000012/approved.docx'
  ),
  false,
  'Viewer cannot read another tenant path'
);

select * from finish();
rollback;
