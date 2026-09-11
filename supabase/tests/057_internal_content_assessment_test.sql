begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select has_table('public', 'noi_ham', 'Co bang noi ham');
select has_table('public', 'menh_de_trang_thai', 'Co bang menh de trang thai');
select has_table('public', 'lua_chon_noi_ham', 'Co bang lua chon noi ham');
select has_function(
  'public',
  'fn_luu_phieu_noi_ham_atomic',
  array['uuid', 'cap_hoc', 'uuid', 'jsonb'],
  'Co RPC luu Phieu noi ham atomic'
);

select ok(
  not exists (
    select 1
    from public.noi_ham content
    where not exists (
      select 1
      from public.menh_de_trang_thai proposition
      where proposition.noi_ham_id = content.id
        and proposition.la_khong_dat
    )
  ),
  'Moi noi ham khoi tao deu co menh de chua dat'
);

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '57000000-0000-0000-0000-000000000101',
  'Internal Content Test School',
  'INTERNAL-CONTENT-TEST',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into public.nam_hoc(
  id, co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai,
  bo_tieu_chuan_id
)
select
  '57000000-0000-0000-0000-000000000111',
  '57000000-0000-0000-0000-000000000101',
  '2097-2098',
  '2097-08-01',
  '2098-07-31',
  'dang_hoat_dong',
  standard_set.id
from public.bo_tieu_chuan standard_set
where standard_set.loai_hinh = 'mam_non'
  and standard_set.trang_thai = 'dang_ap_dung'
order by standard_set.version desc
limit 1;

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '57000000-0000-0000-0000-000000000201',
  'principal@internal-content.test',
  'authenticated',
  'authenticated',
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '57000000-0000-0000-0000-000000000301',
  '57000000-0000-0000-0000-000000000201',
  '57000000-0000-0000-0000-000000000101',
  'Hieu truong test Phieu noi ham',
  'principal@internal-content.test'
);

insert into public.nguoi_dung_vai_tro(nguoi_dung_id, vai_tro_id, co_so_id)
select
  '57000000-0000-0000-0000-000000000301',
  role.id,
  '57000000-0000-0000-0000-000000000101'
from public.vai_tro role
where role.ma = 'PRINCIPAL';

insert into public.minh_chung(
  id, co_so_id, nam_hoc_id, ma, ten, trang_thai_xac_minh,
  nguoi_tai_len, nguoi_xac_minh, ngay_xac_minh
)
values
  (
    '57000000-0000-0000-0000-000000000401',
    '57000000-0000-0000-0000-000000000101',
    '57000000-0000-0000-0000-000000000111',
    'MC.1.1.97',
    'Minh chung Muc 1',
    'da_xac_minh',
    '57000000-0000-0000-0000-000000000301',
    '57000000-0000-0000-0000-000000000301',
    now()
  ),
  (
    '57000000-0000-0000-0000-000000000402',
    '57000000-0000-0000-0000-000000000101',
    '57000000-0000-0000-0000-000000000111',
    'MC.1.1.98',
    'Minh chung Muc 2',
    'da_xac_minh',
    '57000000-0000-0000-0000-000000000301',
    '57000000-0000-0000-0000-000000000301',
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '57000000-0000-0000-0000-000000000201',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    select public.fn_luu_phieu_noi_ham_atomic(
      '57000000-0000-0000-0000-000000000111',
      'mam_non',
      (
        select criterion.id
        from public.v_tieu_chi_nam_hoc criterion
        where criterion.co_so_id = '57000000-0000-0000-0000-000000000101'
          and criterion.nam_hoc_id = '57000000-0000-0000-0000-000000000111'
          and criterion.ma = '1.1'
      ),
      (
        select jsonb_build_array(
          jsonb_build_object(
            'noi_ham_id', content.id,
            'menh_de_id', proposition.id,
            'mo_ta_thuc_te', 'Nha truong da ban hanh ke hoach nam hoc.',
            'minh_chung_ids', jsonb_build_array('57000000-0000-0000-0000-000000000401')
          )
        )
        from public.v_noi_ham_tieu_chi content
        join public.menh_de_trang_thai proposition
          on proposition.noi_ham_id = content.id
          and proposition.loai = 'dap_ung'
        join public.v_tieu_chi_nam_hoc criterion
          on criterion.id = content.tieu_chi_id
        where criterion.co_so_id = '57000000-0000-0000-0000-000000000101'
          and criterion.nam_hoc_id = '57000000-0000-0000-0000-000000000111'
          and criterion.ma = '1.1'
          and content.muc = 1
      )
    )
  $$,
  'Luu noi ham Muc 1 qua RPC'
);

select is(
  (
    select assessment.muc_dat
    from public.tu_danh_gia assessment
    join public.v_tieu_chi_nam_hoc criterion on criterion.id = assessment.tieu_chi_id
    where assessment.co_so_id = '57000000-0000-0000-0000-000000000101'
      and assessment.nam_hoc_id = '57000000-0000-0000-0000-000000000111'
      and assessment.cap_hoc = 'mam_non'
      and criterion.ma = '1.1'
  ),
  1::smallint,
  'Muc 1 chi dat khi co mo ta va minh chung hop le'
);

select lives_ok(
  $$
    select public.fn_luu_phieu_noi_ham_atomic(
      '57000000-0000-0000-0000-000000000111',
      'mam_non',
      (
        select criterion.id
        from public.v_tieu_chi_nam_hoc criterion
        where criterion.co_so_id = '57000000-0000-0000-0000-000000000101'
          and criterion.nam_hoc_id = '57000000-0000-0000-0000-000000000111'
          and criterion.ma = '1.1'
      ),
      (
        select jsonb_agg(
          jsonb_build_object(
            'noi_ham_id', content.id,
            'menh_de_id', proposition.id,
            'mo_ta_thuc_te', case content.muc
              when 1 then 'Nha truong da ban hanh ke hoach nam hoc.'
              else 'Nha truong da ra soat va dieu chinh ke hoach.'
            end,
            'minh_chung_ids', jsonb_build_array(case content.muc
              when 1 then '57000000-0000-0000-0000-000000000401'
              else '57000000-0000-0000-0000-000000000402'
            end)
          ) order by content.muc
        )
        from public.v_noi_ham_tieu_chi content
        join public.menh_de_trang_thai proposition
          on proposition.noi_ham_id = content.id
          and proposition.loai = 'dap_ung'
        join public.v_tieu_chi_nam_hoc criterion
          on criterion.id = content.tieu_chi_id
        where criterion.co_so_id = '57000000-0000-0000-0000-000000000101'
          and criterion.nam_hoc_id = '57000000-0000-0000-0000-000000000111'
          and criterion.ma = '1.1'
      )
    )
  $$,
  'Luu du hai Muc trong mot transaction'
);

select is(
  (
    select assessment.muc_dat
    from public.tu_danh_gia assessment
    join public.v_tieu_chi_nam_hoc criterion on criterion.id = assessment.tieu_chi_id
    where assessment.co_so_id = '57000000-0000-0000-0000-000000000101'
      and assessment.nam_hoc_id = '57000000-0000-0000-0000-000000000111'
      and assessment.cap_hoc = 'mam_non'
      and criterion.ma = '1.1'
  ),
  2::smallint,
  'Muc 2 chi dat sau khi Muc 1 da du dieu kien'
);

select is(
  (
    select count(*)
    from public.lua_chon_noi_ham selection
    join public.tu_danh_gia assessment on assessment.id = selection.tu_danh_gia_id
    where assessment.co_so_id = '57000000-0000-0000-0000-000000000101'
      and assessment.nam_hoc_id = '57000000-0000-0000-0000-000000000111'
      and assessment.cap_hoc = 'mam_non'
  ),
  2::bigint,
  'Moi noi ham co dung mot lua chon da luu'
);

select is(
  (
    select count(*)
    from public.lua_chon_noi_ham_minh_chung link
    join public.lua_chon_noi_ham selection on selection.id = link.lua_chon_id
    join public.tu_danh_gia assessment on assessment.id = selection.tu_danh_gia_id
    where assessment.co_so_id = '57000000-0000-0000-0000-000000000101'
      and assessment.nam_hoc_id = '57000000-0000-0000-0000-000000000111'
      and assessment.cap_hoc = 'mam_non'
  ),
  2::bigint,
  'Minh chung duoc truy vet den tung noi ham'
);

select ok(
  not has_table_privilege('authenticated', 'public.lua_chon_noi_ham', 'INSERT'),
  'Client khong co quyen ghi truc tiep lua chon noi ham'
);

select * from finish();
rollback;

