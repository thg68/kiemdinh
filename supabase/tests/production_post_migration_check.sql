-- Hau kiem chi doc sau khi ap dung migration phien ban len production.

select
  (select count(*) from public.nam_hoc where bo_tieu_chuan_id is null)
    as years_without_standard,
  (
    select count(*)
    from public.nam_hoc nh
    join public.co_so_giao_duc cs on cs.id = nh.co_so_id
    join public.bo_tieu_chuan btc on btc.id = nh.bo_tieu_chuan_id
    where cs.loai_hinh <> btc.loai_hinh
  ) as year_standard_type_mismatches,
  (
    select count(*)
    from public.minh_chung_tieu_chi mctc
    join public.minh_chung mc on mc.id = mctc.minh_chung_id
    where not public.fn_tieu_chi_thuoc_nam_hoc(mc.nam_hoc_id, mctc.tieu_chi_id)
  ) as cross_version_evidence_links,
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'fn_khoi_tao_co_so_va_nam_hoc'
  ) as initial_setup_functions,
  (select count(*) from public.v_tieu_chi_nam_hoc) as bound_criterion_rows;
