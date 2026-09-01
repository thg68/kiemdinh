begin;

-- Khóa ngắn trong lúc kiểm tra để không có bản ghi mới chen vào giữa bước
-- đối chiếu dữ liệu và bước tạo ràng buộc.
lock table public.hoi_dong_tu_danh_gia in share row exclusive mode;
lock table public.ke_hoach_cai_tien in share row exclusive mode;

do $$
begin
  if exists (
    select 1
    from public.hoi_dong_tu_danh_gia
    group by co_so_id, nam_hoc_id
    having count(*) > 1
  ) then
    raise exception using
      errcode = '23505',
      message = 'Tồn tại nhiều hội đồng trong cùng một đơn vị và năm học. Hãy hợp nhất dữ liệu trước khi áp dụng migration 038.';
  end if;

  if exists (
    select 1
    from public.ke_hoach_cai_tien kh
    join public.nguoi_dung nd on nd.id = kh.phu_trach_id
    where kh.phu_trach_id is not null
      and nd.co_so_id is distinct from kh.co_so_id
  ) then
    raise exception using
      errcode = '23503',
      message = 'Có kế hoạch đang gán người phụ trách thuộc đơn vị khác. Hãy sửa dữ liệu trước khi áp dụng migration 038.';
  end if;
end;
$$;

alter table public.hoi_dong_tu_danh_gia
  add constraint uq_hoi_dong_co_so_nam_hoc
  unique (co_so_id, nam_hoc_id);

alter table public.ke_hoach_cai_tien
  add constraint fk_ke_hoach_phu_trach_cung_co_so
  foreign key (phu_trach_id, co_so_id)
  references public.nguoi_dung(id, co_so_id);

comment on constraint uq_hoi_dong_co_so_nam_hoc
  on public.hoi_dong_tu_danh_gia is
  'Mỗi cơ sở giáo dục chỉ có một hội đồng tự đánh giá trong một năm học.';

comment on constraint fk_ke_hoach_phu_trach_cung_co_so
  on public.ke_hoach_cai_tien is
  'Người phụ trách kế hoạch cải tiến phải thuộc cùng cơ sở giáo dục.';

-- Client chỉ cần SELECT/INSERT/UPDATE/DELETE theo các policy RLS. Ba quyền
-- dưới đây có thể thay đổi cấu trúc hoặc xóa toàn bộ dữ liệu nên luôn bị thu hồi.
do $$
declare
  v_table record;
begin
  for v_table in
    select n.nspname, c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
  loop
    execute pg_catalog.format(
      'revoke truncate, references, trigger on table %I.%I from public, anon, authenticated',
      v_table.nspname,
      v_table.relname
    );
  end loop;
end;
$$;

alter default privileges in schema public
  revoke truncate, references, trigger on tables from public, anon, authenticated;

commit;
