begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '41000000-0000-0000-0000-000000000101',
  'Remediation Multi Level School',
  'REMEDIATION-MULTI-LEVEL',
  'pho_thong',
  array['tieu_hoc', 'thcs']::public.cap_hoc[]
);

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai,
  bo_tieu_chuan_id
)
select
  '41000000-0000-0000-0000-000000000111',
  '41000000-0000-0000-0000-000000000101',
  '2098-2099',
  '2098-08-01',
  '2099-07-31',
  'dang_hoat_dong',
  standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'pho_thong'
  and standard_set.trang_thai = 'dang_ap_dung'
order by standard_set.version desc
limit 1;

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '41000000-0000-0000-0000-000000000201',
  'principal@assessment-scope.test',
  'authenticated',
  'authenticated',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '41000000-0000-0000-0000-000000000301',
  '41000000-0000-0000-0000-000000000201',
  '41000000-0000-0000-0000-000000000101',
  'Hieu truong truong nhieu cap',
  'principal@assessment-scope.test'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '41000000-0000-0000-0000-000000000301',
  role.id,
  '41000000-0000-0000-0000-000000000101'
from public.vai_tro role
where role.ma = 'PRINCIPAL';

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, trang_thai_xac_minh,
  nguoi_tai_len, nguoi_xac_minh, ngay_xac_minh
)
values
  (
    '41000000-0000-0000-0000-000000000401',
    '41000000-0000-0000-0000-000000000101',
    '41000000-0000-0000-0000-000000000111',
    'MC.1.2.91',
    'Minh chung rieng cho cap Tieu hoc',
    'da_xac_minh',
    '41000000-0000-0000-0000-000000000301',
    '41000000-0000-0000-0000-000000000301',
    now()
  ),
  (
    '41000000-0000-0000-0000-000000000402',
    '41000000-0000-0000-0000-000000000101',
    '41000000-0000-0000-0000-000000000111',
    'MC.1.2.92',
    'Minh chung rieng cho cap THCS',
    'da_xac_minh',
    '41000000-0000-0000-0000-000000000301',
    '41000000-0000-0000-0000-000000000301',
    now()
  );

-- Mỗi minh chứng vẫn có đúng một tiêu chí gốc để giữ mã duy nhất. Tiêu chí
-- 1.1 sẽ được thêm như một quan hệ dùng lại khi lưu tự đánh giá.
insert into public.minh_chung_tieu_chi(
  minh_chung_id, tieu_chi_id, la_tieu_chi_goc, created_by
)
select
  evidence.id,
  criterion.id,
  true,
  '41000000-0000-0000-0000-000000000301'
from public.minh_chung evidence
cross join lateral (
  select year_criterion.id
  from public.v_tieu_chi_nam_hoc year_criterion
  where year_criterion.co_so_id = evidence.co_so_id
    and year_criterion.nam_hoc_id = evidence.nam_hoc_id
    and year_criterion.ma = '1.2'
  limit 1
) criterion
where evidence.id in (
  '41000000-0000-0000-0000-000000000401',
  '41000000-0000-0000-0000-000000000402'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '41000000-0000-0000-0000-000000000201',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    select public.fn_luu_tu_danh_gia_atomic(
      '41000000-0000-0000-0000-000000000111',
      'tieu_hoc',
      (
        select criterion.id
        from public.v_tieu_chi_nam_hoc criterion
        where criterion.co_so_id = '41000000-0000-0000-0000-000000000101'
          and criterion.nam_hoc_id = '41000000-0000-0000-0000-000000000111'
          and criterion.ma = '1.1'
      ),
      'Hien trang cap Tieu hoc',
      '',
      1::smallint,
      array['41000000-0000-0000-0000-000000000401']::uuid[]
    )
  $$,
  'Luu cap Tieu hoc voi minh chung rieng'
);

select lives_ok(
  $$
    select public.fn_luu_tu_danh_gia_atomic(
      '41000000-0000-0000-0000-000000000111',
      'thcs',
      (
        select criterion.id
        from public.v_tieu_chi_nam_hoc criterion
        where criterion.co_so_id = '41000000-0000-0000-0000-000000000101'
          and criterion.nam_hoc_id = '41000000-0000-0000-0000-000000000111'
          and criterion.ma = '1.1'
      ),
      'Hien trang cap THCS',
      '',
      1::smallint,
      array['41000000-0000-0000-0000-000000000402']::uuid[]
    )
  $$,
  'Luu cap THCS khong thay doi lua chon cua cap Tieu hoc'
);

select is(
  (
    select count(*)
    from public.tu_danh_gia_minh_chung scoped_link
    join public.tu_danh_gia assessment
      on assessment.id = scoped_link.tu_danh_gia_id
    where assessment.cap_hoc = 'tieu_hoc'
      and scoped_link.minh_chung_id = '41000000-0000-0000-0000-000000000401'
  ),
  1::bigint,
  'Cap Tieu hoc van giu dung minh chung da chon'
);

select is(
  (
    select count(*)
    from public.tu_danh_gia_minh_chung scoped_link
    join public.tu_danh_gia assessment
      on assessment.id = scoped_link.tu_danh_gia_id
    where assessment.cap_hoc = 'thcs'
      and scoped_link.minh_chung_id = '41000000-0000-0000-0000-000000000402'
  ),
  1::bigint,
  'Cap THCS giu dung minh chung da chon'
);

select is(
  (
    select count(*)
    from public.tu_danh_gia_minh_chung scoped_link
    join public.tu_danh_gia assessment
      on assessment.id = scoped_link.tu_danh_gia_id
    where (
      assessment.cap_hoc = 'tieu_hoc'
      and scoped_link.minh_chung_id = '41000000-0000-0000-0000-000000000402'
    ) or (
      assessment.cap_hoc = 'thcs'
      and scoped_link.minh_chung_id = '41000000-0000-0000-0000-000000000401'
    )
  ),
  0::bigint,
  'Khong tron minh chung giua hai cap hoc'
);

select is(
  (
    select count(*)
    from public.minh_chung_tieu_chi global_link
    join public.v_tieu_chi_nam_hoc criterion
      on criterion.id = global_link.tieu_chi_id
    where criterion.co_so_id = '41000000-0000-0000-0000-000000000101'
      and criterion.nam_hoc_id = '41000000-0000-0000-0000-000000000111'
      and criterion.ma = '1.1'
      and global_link.minh_chung_id in (
        '41000000-0000-0000-0000-000000000401',
        '41000000-0000-0000-0000-000000000402'
      )
  ),
  2::bigint,
  'Ma tran dung lai giu ca hai quan he ma khong nhan ban minh chung'
);

select is(
  (
    select count(*)
    from public.minh_chung
    where id in (
      '41000000-0000-0000-0000-000000000401',
      '41000000-0000-0000-0000-000000000402'
    )
  ),
  2::bigint,
  'Moi minh chung van chi co mot ban ghi va mot ma duy nhat'
);

select * from finish();
rollback;
