begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(6);

select ok(has_table_privilege('authenticated', 'public.co_so_giao_duc', 'SELECT'), 'Authenticated can read own school before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.nam_hoc', 'SELECT'), 'Authenticated can read school years before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.nguoi_dung', 'SELECT'), 'Authenticated can read tenant users before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.nguoi_dung_vai_tro', 'SELECT'), 'Authenticated can read user roles before RLS filtering');
select ok(has_table_privilege('authenticated', 'public.vai_tro', 'SELECT'), 'Authenticated can read role reference data');
select ok(has_table_privilege('authenticated', 'public.phan_cong_tieu_chi', 'SELECT'), 'Authenticated can read criterion assignments before RLS filtering');

select * from finish();
rollback;
