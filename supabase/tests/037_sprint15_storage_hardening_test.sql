begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select is(
  (select public from storage.buckets where id = 'evidence'),
  false,
  'Bucket minh chung luon la private'
);

select is(
  (select file_size_limit from storage.buckets where id = 'evidence'),
  26214400::bigint,
  'Bucket minh chung gioi han 25 MiB'
);

select ok(
  (
    select allowed_mime_types @> array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ]::text[]
    from storage.buckets
    where id = 'evidence'
  ),
  'Bucket chi cho phep cac MIME minh chung da duyet'
);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '15000000-0000-0000-0000-000000000101',
  'Sprint 15 Storage School',
  'SPRINT15-STORAGE',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.bo_tieu_chuan(
  id, ma_van_ban, ten, ngay_hieu_luc, loai_hinh, version, trang_thai
)
values (
  '15000000-0000-0000-0000-000000000111',
  'SPRINT15/TEST',
  'Bo tieu chuan Sprint 15',
  '2099-07-01',
  'mam_non',
  1,
  'dang_ap_dung'
);

insert into public.tieu_chuan(id, bo_id, so_thu_tu, ten)
values (
  '15000000-0000-0000-0000-000000000121',
  '15000000-0000-0000-0000-000000000111',
  1,
  'Tieu chuan Sprint 15'
);

insert into public.tieu_chi(
  id, tieu_chuan_id, ma, ten, la_bat_buoc, loai_hinh_ap_dung, thu_tu
)
values (
  '15000000-0000-0000-0000-000000000131',
  '15000000-0000-0000-0000-000000000121',
  '1.1',
  'Tieu chi Sprint 15',
  false,
  'mam_non',
  1
);

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
values (
  '15000000-0000-0000-0000-000000000141',
  '15000000-0000-0000-0000-000000000101',
  '2099-2100',
  '2099-08-01',
  '2100-07-31',
  'dang_hoat_dong',
  '15000000-0000-0000-0000-000000000111'
);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '15000000-0000-0000-0000-000000000201',
  'principal@sprint15.test',
  'authenticated',
  'authenticated',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.nguoi_dung(
  id, auth_user_id, co_so_id, ho_ten, email
)
values (
  '15000000-0000-0000-0000-000000000301',
  '15000000-0000-0000-0000-000000000201',
  '15000000-0000-0000-0000-000000000101',
  'Principal Sprint 15',
  'principal@sprint15.test'
);

insert into public.nguoi_dung_vai_tro(
  nguoi_dung_id, vai_tro_id, co_so_id
)
select
  '15000000-0000-0000-0000-000000000301',
  role.id,
  '15000000-0000-0000-0000-000000000101'
from public.vai_tro role
where role.ma = 'PRINCIPAL';

create function pg_temp.exec_as(p_sql text)
returns bigint
language plpgsql
as $$
declare
  v_row_count bigint;
begin
  perform set_config(
    'request.jwt.claim.sub',
    '15000000-0000-0000-0000-000000000201',
    true
  );
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

insert into storage.objects(
  id, bucket_id, name, owner_id, metadata, user_metadata, created_at
)
values
  (
    '15000000-0000-0000-0000-000000000401',
    'evidence',
    '15000000-0000-0000-0000-000000000101/15000000-0000-0000-0000-000000000141/valid.pdf',
    '15000000-0000-0000-0000-000000000201',
    jsonb_build_object('size', 18, 'mimetype', 'application/pdf'),
    jsonb_build_object('sha256', repeat('a', 64)),
    now() - interval '5 minutes'
  ),
  (
    '15000000-0000-0000-0000-000000000402',
    'evidence',
    '15000000-0000-0000-0000-000000000101/15000000-0000-0000-0000-000000000141/mismatch.pdf',
    '15000000-0000-0000-0000-000000000201',
    jsonb_build_object('size', 19, 'mimetype', 'application/pdf'),
    jsonb_build_object('sha256', repeat('b', 64)),
    now() - interval '5 minutes'
  ),
  (
    '15000000-0000-0000-0000-000000000403',
    'evidence',
    '15000000-0000-0000-0000-000000000101/15000000-0000-0000-0000-000000000141/old-orphan.pdf',
    '15000000-0000-0000-0000-000000000201',
    jsonb_build_object('size', 20, 'mimetype', 'application/pdf'),
    jsonb_build_object('sha256', repeat('c', 64)),
    now() - interval '2 hours'
  ),
  (
    '15000000-0000-0000-0000-000000000404',
    'evidence',
    '15000000-0000-0000-0000-000000000101/15000000-0000-0000-0000-000000000141/recent-pending.pdf',
    '15000000-0000-0000-0000-000000000201',
    jsonb_build_object('size', 21, 'mimetype', 'application/pdf'),
    jsonb_build_object('sha256', repeat('d', 64)),
    now() - interval '5 minutes'
  );

select throws_ok(
  $test$
    select pg_temp.exec_as(
      $sql$
        select public.fn_tao_minh_chung(
          '15000000-0000-0000-0000-000000000141',
          array['15000000-0000-0000-0000-000000000131'::uuid],
          '15000000-0000-0000-0000-000000000131',
          'Minh chung khong co object',
          'application/pdf',
          null,
          '15000000-0000-0000-0000-000000000101/15000000-0000-0000-0000-000000000141/missing.pdf',
          repeat('a', 64),
          18,
          '2099-09-01',
          null
        )
      $sql$
    )
  $test$,
  'P0001',
  'Không tìm thấy tệp đã tải lên trong kho lưu trữ.',
  'Khong tao ban ghi khi object Storage khong ton tai'
);

select throws_ok(
  $test$
    select pg_temp.exec_as(
      $sql$
        select public.fn_tao_minh_chung(
          '15000000-0000-0000-0000-000000000141',
          array['15000000-0000-0000-0000-000000000131'::uuid],
          '15000000-0000-0000-0000-000000000131',
          'Minh chung sai metadata',
          'application/pdf',
          null,
          '15000000-0000-0000-0000-000000000101/15000000-0000-0000-0000-000000000141/mismatch.pdf',
          repeat('b', 64),
          18,
          '2099-09-01',
          null
        )
      $sql$
    )
  $test$,
  'P0001',
  'Kích thước tệp không khớp với kho lưu trữ.',
  'Khong tin kich thuoc do client gui len'
);

select throws_ok(
  $test$
    select pg_temp.exec_as(
      $sql$
        select public.fn_tao_minh_chung(
          '15000000-0000-0000-0000-000000000141',
          array['15000000-0000-0000-0000-000000000131'::uuid],
          '15000000-0000-0000-0000-000000000131',
          'Minh chung sai ngay',
          'text/html',
          'https://example.test/evidence',
          null,
          null,
          null,
          '2100-02-01',
          '2100-01-01'
        )
      $sql$
    )
  $test$,
  'P0001',
  'Ngày hết giá trị không được trước ngày ban hành.',
  'Kiem tra thu tu ngay o tang CSDL'
);

select lives_ok(
  $test$
    select pg_temp.exec_as(
      $sql$
        select public.fn_tao_minh_chung(
          '15000000-0000-0000-0000-000000000141',
          array['15000000-0000-0000-0000-000000000131'::uuid],
          '15000000-0000-0000-0000-000000000131',
          'Minh chung da doi chieu',
          'application/pdf',
          null,
          '15000000-0000-0000-0000-000000000101/15000000-0000-0000-0000-000000000141/valid.pdf',
          repeat('a', 64),
          18,
          '2099-09-01',
          null
        )
      $sql$
    )
  $test$,
  'Tao minh chung khi object va metadata khop'
);

select is(
  (
    select kich_thuoc
    from public.minh_chung
    where ten = 'Minh chung da doi chieu'
  ),
  18::bigint,
  'Ban ghi nghiep vu luu kich thuoc da doi chieu'
);

select is(
  (
    select pg_temp.exec_as(
      $sql$
        select *
        from public.fn_liet_ke_object_minh_chung_mo_coi(60)
      $sql$
    )
  ),
  1::bigint,
  'Chi liet ke object qua thoi gian cho va chua co ban ghi minh chung'
);

select is(
  (
    select pg_temp.exec_as(
      $sql$
        select name
        from storage.objects
        where bucket_id = 'evidence'
          and name like '%/old-orphan.pdf'
      $sql$
    )
  ),
  1::bigint,
  'Nguoi co quyen don duoc SELECT object mo coi truoc khi goi Storage remove'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'evidence_storage_delete'
      and roles @> array['authenticated'::name]
      and qual like '%evidence.delete%'
      and qual like '%minh_chung%'
  ),
  'Policy xoa chi ap dung cho object mo coi va nguoi co quyen'
);

select * from finish();
rollback;
