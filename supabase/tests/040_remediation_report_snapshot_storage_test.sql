begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '40000000-0000-0000-0000-000000000101',
  'Remediation Report School',
  'REMEDIATION-REPORT',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai)
values (
  '40000000-0000-0000-0000-000000000111',
  '40000000-0000-0000-0000-000000000101',
  '2098-2099',
  '2098-08-01',
  '2099-07-31',
  'dang_hoat_dong'
);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '40000000-0000-0000-0000-000000000201',
  'principal@report-remediation.test',
  'authenticated',
  'authenticated',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '40000000-0000-0000-0000-000000000301',
  '40000000-0000-0000-0000-000000000201',
  '40000000-0000-0000-0000-000000000101',
  'Hieu truong kiem thu snapshot',
  'principal@report-remediation.test'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '40000000-0000-0000-0000-000000000301',
  role.id,
  '40000000-0000-0000-0000-000000000101'
from public.vai_tro role
where role.ma = 'PRINCIPAL';

insert into storage.objects(
  id, bucket_id, name, owner_id, metadata, created_at
)
values
  (
    '40000000-0000-0000-0000-000000000401',
    'reports',
    '40000000-0000-0000-0000-000000000101/40000000-0000-0000-0000-000000000111/mau_1_tu_danh_gia/snapshots/draft.docx',
    '40000000-0000-0000-0000-000000000201',
    jsonb_build_object('size', 10, 'mimetype', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    now()
  ),
  (
    '40000000-0000-0000-0000-000000000402',
    'reports',
    '40000000-0000-0000-0000-000000000101/40000000-0000-0000-0000-000000000111/mau_1_tu_danh_gia/snapshots/approved.docx',
    '40000000-0000-0000-0000-000000000201',
    jsonb_build_object('size', 10, 'mimetype', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    now()
  );

alter table public.bao_cao disable trigger user;

insert into public.bao_cao(
  id, co_so_id, nam_hoc_id, cap_hoc, loai_bao_cao, version, trang_thai,
  storage_path, ten_tep_goc, mime_type, kich_thuoc, sha256, nguoi_tao,
  nguoi_phe_duyet, ngay_phe_duyet
)
values
  (
    '40000000-0000-0000-0000-000000000501',
    '40000000-0000-0000-0000-000000000101',
    '40000000-0000-0000-0000-000000000111',
    'mam_non',
    'mau_1_tu_danh_gia',
    1,
    'nhap',
    '40000000-0000-0000-0000-000000000101/40000000-0000-0000-0000-000000000111/mau_1_tu_danh_gia/snapshots/draft.docx',
    'draft.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    10,
    repeat('a', 64),
    '40000000-0000-0000-0000-000000000301',
    null,
    null
  ),
  (
    '40000000-0000-0000-0000-000000000502',
    '40000000-0000-0000-0000-000000000101',
    '40000000-0000-0000-0000-000000000111',
    'mam_non',
    'mau_1_tu_danh_gia',
    2,
    'da_phe_duyet',
    '40000000-0000-0000-0000-000000000101/40000000-0000-0000-0000-000000000111/mau_1_tu_danh_gia/snapshots/approved.docx',
    'approved.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    10,
    repeat('b', 64),
    '40000000-0000-0000-0000-000000000301',
    '40000000-0000-0000-0000-000000000301',
    now()
  );

alter table public.bao_cao enable trigger user;

create function pg_temp.exec_as_principal(p_sql text)
returns bigint
language plpgsql
as $$
declare
  v_row_count bigint;
begin
  perform set_config(
    'request.jwt.claim.sub',
    '40000000-0000-0000-0000-000000000201',
    true
  );
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  execute p_sql;
  get diagnostics v_row_count = row_count;
  execute 'set local role postgres';
  return v_row_count;
exception when others then
  execute 'set local role postgres';
  raise;
end;
$$;

create function pg_temp.can_delete_as_principal(p_storage_path text)
returns boolean
language plpgsql
as $$
declare
  v_allowed boolean;
begin
  perform set_config(
    'request.jwt.claim.sub',
    '40000000-0000-0000-0000-000000000201',
    true
  );
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  select public.fn_can_delete_report_file(p_storage_path)
  into v_allowed;
  execute 'set local role postgres';
  return v_allowed;
exception when others then
  execute 'set local role postgres';
  raise;
end;
$$;

select is(
  pg_temp.exec_as_principal(
    $sql$
      update storage.objects
      set metadata = metadata || '{"remediation":"updated"}'::jsonb
      where bucket_id = 'reports'
        and name like '%/draft.docx'
    $sql$
  ),
  1::bigint,
  'Van cho phep sua object cua bao cao chua phe duyet'
);

select is(
  pg_temp.exec_as_principal(
    $sql$
      update storage.objects
      set metadata = metadata || '{"remediation":"tampered"}'::jsonb
      where bucket_id = 'reports'
        and name like '%/approved.docx'
    $sql$
  ),
  0::bigint,
  'Khong cho phep sua object cua bao cao da phe duyet'
);

select is(
  pg_temp.can_delete_as_principal(
    '40000000-0000-0000-0000-000000000101/40000000-0000-0000-0000-000000000111/mau_1_tu_danh_gia/snapshots/approved.docx'
  ),
  false,
  'Khong cho phep xoa object cua bao cao da phe duyet'
);

select is(
  pg_temp.can_delete_as_principal(
    '40000000-0000-0000-0000-000000000101/40000000-0000-0000-0000-000000000111/mau_1_tu_danh_gia/snapshots/draft.docx'
  ),
  true,
  'Van cho phep Hieu truong xoa object cua bao cao chua phe duyet'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'reports_storage_delete'
      and qual like '%fn_can_delete_report_file%'
  ),
  'Policy xoa reports bat buoc goi ham khoa snapshot da phe duyet'
);

select ok(
  exists (
    select 1
    from storage.objects
    where bucket_id = 'reports'
      and name like '%/approved.docx'
  ),
  'Object da phe duyet van con nguyen sau cac thu nghiem sua va xoa'
);

select * from finish();
rollback;
