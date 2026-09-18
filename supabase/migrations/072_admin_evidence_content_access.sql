begin;

create or replace function public.fn_admin_co_the_doc_tep_minh_chung(
  p_storage_path text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p_storage_path is not null
    and public.fn_has_role('SYSTEM_ADMIN')
    and exists (
      select 1
      from public.minh_chung evidence
      where evidence.storage_path = p_storage_path
        and evidence.deleted_at is null
    )
$$;

revoke all on function public.fn_admin_co_the_doc_tep_minh_chung(text)
from public, anon, authenticated;
grant execute on function public.fn_admin_co_the_doc_tep_minh_chung(text)
to authenticated;

create or replace function public.fn_admin_mo_minh_chung(
  p_minh_chung_id uuid
)
returns table (
  id uuid,
  co_so_id uuid,
  storage_path text,
  duong_dan text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := public.fn_require_system_admin();
  v_evidence record;
begin
  if p_minh_chung_id is null then
    raise exception using errcode = '22023', message = 'Mã minh chứng không hợp lệ.';
  end if;

  select
    evidence.id,
    evidence.co_so_id,
    evidence.storage_path,
    evidence.duong_dan
  into v_evidence
  from public.minh_chung evidence
  where evidence.id = p_minh_chung_id
    and evidence.deleted_at is null;

  if v_evidence.id is null then
    raise exception using errcode = 'P0002', message = 'Không tìm thấy minh chứng.';
  end if;

  insert into public.nhat_ky_truy_cap(
    co_so_id,
    nguoi_dung_id,
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    du_lieu_moi
  ) values (
    v_evidence.co_so_id,
    v_actor_id,
    'ADMIN_EVIDENCE_CONTENT_OPENED',
    'minh_chung',
    v_evidence.id,
    jsonb_build_object(
      'co_tep', v_evidence.storage_path is not null,
      'co_lien_ket', v_evidence.duong_dan is not null
    )
  );

  return query
  select
    v_evidence.id::uuid,
    v_evidence.co_so_id::uuid,
    v_evidence.storage_path::text,
    v_evidence.duong_dan::text;
end;
$$;

revoke all on function public.fn_admin_mo_minh_chung(uuid)
from public, anon, authenticated;
grant execute on function public.fn_admin_mo_minh_chung(uuid)
to authenticated;

do $$
begin
  if exists (
    select 1
    from information_schema.schemata
    where schema_name = 'storage'
  ) then
    drop policy if exists "evidence_storage_select_system_admin" on storage.objects;
    create policy "evidence_storage_select_system_admin" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'evidence'
      and public.fn_admin_co_the_doc_tep_minh_chung(name)
    );
  end if;
end;
$$;

comment on function public.fn_admin_co_the_doc_tep_minh_chung(text) is
  'Cho phép Storage phát liên kết tạm tới tệp minh chứng khi người gọi có vai trò Quản trị hệ thống.';

comment on function public.fn_admin_mo_minh_chung(uuid) is
  'Trả tham chiếu nội dung cho Quản trị hệ thống và ghi nhật ký mỗi lần yêu cầu mở minh chứng.';

commit;
