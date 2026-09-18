begin;

-- Keep school codes unique regardless of letter case or surrounding whitespace.
-- Existing codes need manual reconciliation if they collide after normalization.
do $$
declare
  v_duplicate_code text;
begin
  select pg_catalog.lower(pg_catalog.btrim(school.ma_truong))
  into v_duplicate_code
  from public.co_so_giao_duc school
  where school.ma_truong is not null
  group by pg_catalog.lower(pg_catalog.btrim(school.ma_truong))
  having count(*) > 1
  limit 1;

  if v_duplicate_code is not null then
    raise exception using
      errcode = '23505',
      message = 'Danh mục hiện có mã trường trùng sau khi chuẩn hóa.',
      detail = 'Mã: ' || v_duplicate_code || '. Hãy xử lý bản ghi trùng trước khi áp dụng migration 075.';
  end if;
end;
$$;

create unique index if not exists uq_co_so_ma_truong_normalized
  on public.co_so_giao_duc (pg_catalog.lower(pg_catalog.btrim(ma_truong)))
  where ma_truong is not null;

create or replace function public.fn_admin_thong_tin_nhap_danh_muc(
  p_ma_truong text[] default '{}'::text[]
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public.fn_require_system_admin();

  if p_ma_truong is null or cardinality(p_ma_truong) > 2000 then
    raise exception using errcode = '22023', message = 'Danh sách mã trường vượt quá giới hạn 2000 dòng.';
  end if;

  return pg_catalog.jsonb_build_object(
    'provinces', coalesce((
      select pg_catalog.jsonb_agg(province.ten order by province.ten)
      from public.danh_muc_tinh_thanh province
    ), '[]'::jsonb),
    'existingCodes', coalesce((
      select pg_catalog.jsonb_agg(distinct pg_catalog.lower(pg_catalog.btrim(school.ma_truong)))
      from pg_catalog.unnest(p_ma_truong) as input(code)
      join public.co_so_giao_duc school
        on pg_catalog.lower(pg_catalog.btrim(school.ma_truong))
          = pg_catalog.lower(pg_catalog.btrim(input.code))
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.fn_admin_nhap_danh_muc_co_so(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_item jsonb;
  v_ma_truong text;
  v_ten text;
  v_tinh_thanh text;
  v_phuong_xa text;
  v_dia_chi text;
  v_loai_hinh text;
  v_cap_hoc public.cap_hoc[];
  v_cong_lap boolean;
  v_created_id uuid;
  v_created_ids uuid[] := '{}'::uuid[];
  v_seen_codes text[] := '{}'::text[];
  v_created integer := 0;
  v_skipped integer := 0;
begin
  if p_rows is null or pg_catalog.jsonb_typeof(p_rows) <> 'array'
    or pg_catalog.jsonb_array_length(p_rows) < 1
    or pg_catalog.jsonb_array_length(p_rows) > 2000 then
    raise exception using errcode = '22023', message = 'Danh sách nhập phải có từ 1 đến 2000 trường.';
  end if;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_rows) as source(value) loop
    if pg_catalog.jsonb_typeof(v_item) <> 'object' then
      raise exception using errcode = '22023', message = 'Dòng nhập không hợp lệ.';
    end if;

    v_ma_truong := nullif(pg_catalog.btrim(v_item ->> 'ma_truong'), '');
    v_ten := nullif(pg_catalog.btrim(v_item ->> 'ten'), '');
    v_tinh_thanh := nullif(pg_catalog.btrim(v_item ->> 'tinh_thanh'), '');
    v_phuong_xa := nullif(pg_catalog.btrim(v_item ->> 'phuong_xa'), '');
    v_dia_chi := nullif(pg_catalog.btrim(v_item ->> 'dia_chi'), '');
    v_loai_hinh := v_item ->> 'loai_hinh';

    if v_ma_truong is null or pg_catalog.char_length(v_ma_truong) > 100
      or v_ten is null or pg_catalog.char_length(v_ten) > 255
      or v_tinh_thanh is null or pg_catalog.char_length(v_tinh_thanh) > 100
      or pg_catalog.char_length(coalesce(v_phuong_xa, '')) > 150
      or pg_catalog.char_length(coalesce(v_dia_chi, '')) > 500
      or v_loai_hinh not in ('mam_non', 'pho_thong', 'gdtx')
      or v_loai_hinh is null then
      raise exception using errcode = '22023', message = 'Thông tin cơ sở giáo dục không hợp lệ.';
    end if;

    if pg_catalog.lower(v_ma_truong) = any(v_seen_codes) then
      raise exception using errcode = '22023', message = 'Tệp chứa mã trường lặp lại.';
    end if;
    v_seen_codes := pg_catalog.array_append(v_seen_codes, pg_catalog.lower(v_ma_truong));

    if not exists (
      select 1 from public.danh_muc_tinh_thanh province
      where province.ten = v_tinh_thanh
    ) then
      raise exception using errcode = '22023', message = 'Tỉnh/thành không có trong danh mục hiện hành.';
    end if;

    if pg_catalog.jsonb_typeof(v_item -> 'cap_hoc') <> 'array' then
      raise exception using errcode = '22023', message = 'Cấp học phải là danh sách.';
    end if;
    select pg_catalog.array_agg(level_text::public.cap_hoc)
    into v_cap_hoc
    from pg_catalog.jsonb_array_elements_text(v_item -> 'cap_hoc') as levels(level_text);

    if not public.fn_cap_hoc_hop_loai_hinh(
      v_loai_hinh::public.loai_hinh_co_so, v_cap_hoc
    ) then
      raise exception using errcode = '22023', message = 'Cấp học không phù hợp với loại hình.';
    end if;

    if v_item ? 'cong_lap' and pg_catalog.jsonb_typeof(v_item -> 'cong_lap') not in ('boolean', 'null') then
      raise exception using errcode = '22023', message = 'Giá trị công lập không hợp lệ.';
    end if;
    v_cong_lap := case when pg_catalog.jsonb_typeof(v_item -> 'cong_lap') = 'boolean'
      then (v_item ->> 'cong_lap')::boolean else null end;

    v_created_id := null;
    insert into public.co_so_giao_duc (
      ma_truong, ten, tinh_thanh, phuong_xa, dia_chi,
      loai_hinh, cap_hoc, cong_lap, trang_thai,
      nguon_danh_muc, cho_phep_tu_dang_ky
    ) values (
      v_ma_truong, v_ten, v_tinh_thanh, v_phuong_xa, v_dia_chi,
      v_loai_hinh::public.loai_hinh_co_so, v_cap_hoc, v_cong_lap, 'inactive',
      'excel_quan_tri', false
    )
    on conflict (pg_catalog.lower(pg_catalog.btrim(ma_truong))) where ma_truong is not null do nothing
    returning id into v_created_id;

    if v_created_id is null then
      v_skipped := v_skipped + 1;
    else
      v_created := v_created + 1;
      v_created_ids := pg_catalog.array_append(v_created_ids, v_created_id);
    end if;
  end loop;

  if v_created > 0 then
    insert into public.nhat_ky_truy_cap (
      nguoi_dung_id, hanh_dong, doi_tuong, du_lieu_moi
    ) values (
      v_actor_id, 'ADMIN_SCHOOL_DIRECTORY_IMPORTED', 'co_so_giao_duc',
      pg_catalog.jsonb_build_object(
        'created', v_created,
        'skipped', v_skipped,
        'school_ids', pg_catalog.to_jsonb(v_created_ids)
      )
    );
  end if;

  return pg_catalog.jsonb_build_object('created', v_created, 'skipped', v_skipped);
end;
$$;

revoke all on function public.fn_admin_thong_tin_nhap_danh_muc(text[]) from public, anon, authenticated;
grant execute on function public.fn_admin_thong_tin_nhap_danh_muc(text[]) to authenticated;
revoke all on function public.fn_admin_nhap_danh_muc_co_so(jsonb) from public, anon, authenticated;
grant execute on function public.fn_admin_nhap_danh_muc_co_so(jsonb) to authenticated;

comment on function public.fn_admin_nhap_danh_muc_co_so(jsonb) is
  'Quản trị hệ thống nhập danh mục trường từ Excel; chỉ tạo mã mới ở trạng thái chờ duyệt, không tạo năm học.';

commit;
