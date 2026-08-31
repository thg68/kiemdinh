-- Sprint 15: hardening kho tệp minh chứng và đối chiếu object trước khi cấp mã.

do $$
begin
  if exists (
    select 1
    from information_schema.schemata
    where schema_name = 'storage'
  ) then
    insert into storage.buckets(
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types
    )
    values (
      'evidence',
      'evidence',
      false,
      26214400,
      array[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/webp',
        'text/csv',
        'text/plain'
      ]::text[]
    )
    on conflict (id) do update set
      public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end;
$$;

alter table public.minh_chung
  drop constraint if exists ck_minh_chung_ten_hop_le,
  drop constraint if exists ck_minh_chung_hash_sha256,
  drop constraint if exists ck_minh_chung_kich_thuoc_tep,
  drop constraint if exists ck_minh_chung_thu_tu_ngay;

-- NOT VALID không chặn triển khai nếu dữ liệu lịch sử cần làm sạch, nhưng mọi
-- bản ghi mới và mọi bản ghi được cập nhật đều phải tuân thủ ngay.
alter table public.minh_chung
  add constraint ck_minh_chung_ten_hop_le
    check (
      char_length(btrim(ten)) between 1 and 255
      and ten !~ '[[:cntrl:]]'
    ) not valid,
  add constraint ck_minh_chung_hash_sha256
    check (
      hash_tep is null
      or hash_tep ~ '^[0-9a-f]{64}$'
    ) not valid,
  add constraint ck_minh_chung_kich_thuoc_tep
    check (
      kich_thuoc is null
      or kich_thuoc between 1 and 26214400
    ) not valid,
  add constraint ck_minh_chung_thu_tu_ngay
    check (
      ngay_ban_hanh is null
      or ngay_het_gia_tri is null
      or ngay_het_gia_tri >= ngay_ban_hanh
    ) not valid;

create or replace function public.fn_tao_minh_chung(
  p_nam_hoc_id uuid,
  p_tieu_chi_ids uuid[],
  p_tieu_chi_goc_id uuid,
  p_ten text,
  p_loai_tep varchar,
  p_duong_dan text,
  p_storage_path text,
  p_hash_tep varchar,
  p_kich_thuoc bigint,
  p_ngay_ban_hanh date,
  p_ngay_het_gia_tri date
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_nguoi_dung_id uuid := public.fn_current_nguoi_dung_id();
  v_ma varchar;
  v_minh_chung_id uuid;
  v_tieu_chi_id uuid;
  v_ten text := btrim(coalesce(p_ten, ''));
  v_duong_dan text := nullif(btrim(coalesce(p_duong_dan, '')), '');
  v_storage_path text := nullif(btrim(coalesce(p_storage_path, '')), '');
  v_file_name text;
  v_object storage.objects%rowtype;
  v_object_size_text text;
  v_object_size bigint;
  v_object_mime text;
  v_hash text := lower(nullif(btrim(coalesce(p_hash_tep, '')), ''));
  v_metadata_hash text;
begin
  if auth.uid() is null or v_co_so_id is null or v_nguoi_dung_id is null then
    raise exception 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;

  if char_length(v_ten) not between 1 and 255
    or v_ten ~ '[[:cntrl:]]'
  then
    raise exception 'Tên minh chứng phải có từ 1 đến 255 ký tự hợp lệ.';
  end if;

  if (v_storage_path is null) = (v_duong_dan is null) then
    raise exception 'Chỉ chọn một nguồn: tệp minh chứng hoặc liên kết điện tử.';
  end if;

  if p_ngay_ban_hanh is not null
    and p_ngay_het_gia_tri is not null
    and p_ngay_het_gia_tri < p_ngay_ban_hanh
  then
    raise exception 'Ngày hết giá trị không được trước ngày ban hành.';
  end if;

  if p_tieu_chi_ids is null or array_length(p_tieu_chi_ids, 1) is null then
    raise exception 'Hãy chọn ít nhất một tiêu chí.';
  end if;

  if p_tieu_chi_goc_id is null or p_tieu_chi_goc_id <> all(p_tieu_chi_ids) then
    raise exception 'Tiêu chí gốc phải nằm trong danh sách tiêu chí đã chọn.';
  end if;

  if not exists (
    select 1
    from public.nam_hoc school_year
    where school_year.id = p_nam_hoc_id
      and school_year.co_so_id = v_co_so_id
  ) then
    raise exception 'Năm học không thuộc cơ sở giáo dục hiện tại.';
  end if;

  if exists (
    select 1
    from unnest(p_tieu_chi_ids) selected(tieu_chi_id)
    where selected.tieu_chi_id is null
      or not public.fn_tieu_chi_thuoc_nam_hoc(
        p_nam_hoc_id,
        selected.tieu_chi_id
      )
  ) then
    raise exception 'Tiêu chí đã chọn không thuộc phiên bản bộ tiêu chuẩn của năm học.';
  end if;

  if not public.fn_user_has_tenant_evidence_role(
    v_co_so_id,
    'evidence.create'
  ) then
    if public.fn_has_role('MEMBER', v_co_so_id)
      or public.fn_has_role('TEACHER', v_co_so_id)
    then
      foreach v_tieu_chi_id in array p_tieu_chi_ids loop
        if not public.fn_is_assigned_to_criterion(
          v_tieu_chi_id,
          p_nam_hoc_id
        ) then
          raise exception 'Bạn chưa được phân công tiêu chí này.';
        end if;
      end loop;
    else
      raise exception 'Bạn không có quyền tạo minh chứng.';
    end if;
  end if;

  if v_storage_path is not null then
    if cardinality(storage.foldername(v_storage_path)) <> 2
      or (storage.foldername(v_storage_path))[1] <> v_co_so_id::text
      or (storage.foldername(v_storage_path))[2] <> p_nam_hoc_id::text
    then
      raise exception 'Đường dẫn tệp không thuộc cơ sở giáo dục và năm học hiện tại.';
    end if;

    v_file_name := regexp_replace(v_storage_path, '^.*/', '');

    if v_file_name !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,179}$' then
      raise exception 'Tên object trong kho lưu trữ không hợp lệ.';
    end if;

    select object_row.*
    into v_object
    from storage.objects object_row
    where object_row.bucket_id = 'evidence'
      and object_row.name = v_storage_path
    for update;

    if v_object.id is null then
      raise exception 'Không tìm thấy tệp đã tải lên trong kho lưu trữ.';
    end if;

    if coalesce(v_object.owner_id, v_object.owner::text)
      is distinct from auth.uid()::text
    then
      raise exception 'Tệp đã tải lên không thuộc phiên người dùng hiện tại.';
    end if;

    if exists (
      select 1
      from public.minh_chung evidence
      where evidence.storage_path = v_storage_path
    ) then
      raise exception 'Tệp đã được dùng cho một mã minh chứng khác.';
    end if;

    v_object_size_text := coalesce(
      v_object.metadata ->> 'size',
      v_object.metadata ->> 'contentLength'
    );

    if v_object_size_text is null
      or v_object_size_text !~ '^[0-9]+$'
    then
      raise exception 'Kho lưu trữ không cung cấp kích thước tệp hợp lệ.';
    end if;

    v_object_size := v_object_size_text::bigint;

    if v_object_size not between 1 and 26214400 then
      raise exception 'Tệp minh chứng phải có dung lượng từ 1 byte đến 25 MB.';
    end if;

    if p_kich_thuoc is null or p_kich_thuoc <> v_object_size then
      raise exception 'Kích thước tệp không khớp với kho lưu trữ.';
    end if;

    v_object_mime := lower(btrim(coalesce(
      v_object.metadata ->> 'mimetype',
      v_object.metadata ->> 'contentType',
      ''
    )));

    if v_object_mime <> all(array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/csv',
      'text/plain'
    ]::text[]) then
      raise exception 'Loại tệp trong kho lưu trữ không được phép.';
    end if;

    if lower(btrim(coalesce(p_loai_tep, ''))) <> v_object_mime then
      raise exception 'Loại tệp không khớp với kho lưu trữ.';
    end if;

    if v_hash is null or v_hash !~ '^[0-9a-f]{64}$' then
      raise exception 'Hash SHA-256 của tệp không hợp lệ.';
    end if;

    v_metadata_hash := lower(btrim(coalesce(
      v_object.user_metadata ->> 'sha256',
      ''
    )));

    if v_metadata_hash <> v_hash then
      raise exception 'Hash SHA-256 không khớp với metadata của object.';
    end if;
  else
    if char_length(v_duong_dan) > 2048
      or v_duong_dan !~* '^https?://'
      or v_duong_dan ~ '[[:cntrl:]]'
    then
      raise exception 'Liên kết điện tử không hợp lệ.';
    end if;

    if v_hash is not null or p_kich_thuoc is not null then
      raise exception 'Minh chứng liên kết không được gửi metadata của tệp.';
    end if;

    v_object_mime := 'text/html';
  end if;

  -- Chỉ sinh mã sau khi toàn bộ dữ liệu và object đã được kiểm tra, tránh làm
  -- tăng bộ đếm khi một upload chưa thể hoàn tất.
  v_ma := public.fn_sinh_ma_minh_chung(
    p_tieu_chi_goc_id,
    v_co_so_id
  );

  insert into public.minh_chung(
    co_so_id,
    nam_hoc_id,
    ma,
    ten,
    loai_tep,
    duong_dan,
    storage_path,
    hash_tep,
    kich_thuoc,
    ngay_ban_hanh,
    ngay_het_gia_tri,
    nguoi_tai_len
  )
  values (
    v_co_so_id,
    p_nam_hoc_id,
    v_ma,
    v_ten,
    v_object_mime,
    v_duong_dan,
    v_storage_path,
    case when v_storage_path is not null then v_hash else null end,
    case when v_storage_path is not null then v_object_size else null end,
    p_ngay_ban_hanh,
    p_ngay_het_gia_tri,
    v_nguoi_dung_id
  )
  returning id into v_minh_chung_id;

  foreach v_tieu_chi_id in array p_tieu_chi_ids loop
    insert into public.minh_chung_tieu_chi(
      minh_chung_id,
      tieu_chi_id,
      la_tieu_chi_goc,
      created_by
    )
    values (
      v_minh_chung_id,
      v_tieu_chi_id,
      v_tieu_chi_id = p_tieu_chi_goc_id,
      v_nguoi_dung_id
    )
    on conflict (minh_chung_id, tieu_chi_id) do nothing;
  end loop;

  perform public.fn_log_audit(
    'EVIDENCE_CREATED',
    'minh_chung',
    v_minh_chung_id,
    null,
    jsonb_build_object(
      'ma',
      v_ma,
      'storage_verified',
      v_storage_path is not null,
      'tieu_chi_ids',
      p_tieu_chi_ids
    )
  );

  return v_minh_chung_id;
end;
$$;

create or replace function public.fn_liet_ke_object_minh_chung_mo_coi(
  p_toi_thieu_phut integer default 60
)
returns table(
  storage_path text,
  nam_hoc_id uuid,
  created_at timestamptz,
  kich_thuoc bigint,
  loai_tep text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
begin
  if auth.uid() is null
    or v_co_so_id is null
    or public.fn_current_nguoi_dung_id() is null
  then
    raise exception 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;

  if not public.fn_has_permission('evidence.delete', v_co_so_id) then
    raise exception 'Bạn không có quyền dọn tệp minh chứng tải lỗi.';
  end if;

  if p_toi_thieu_phut not between 15 and 10080 then
    raise exception 'Thời gian chờ phải từ 15 phút đến 7 ngày.';
  end if;

  return query
  select
    object_row.name,
    school_year.id,
    object_row.created_at,
    case
      when coalesce(
        object_row.metadata ->> 'size',
        object_row.metadata ->> 'contentLength'
      ) ~ '^[0-9]+$'
      then coalesce(
        object_row.metadata ->> 'size',
        object_row.metadata ->> 'contentLength'
      )::bigint
      else null
    end,
    lower(coalesce(
      object_row.metadata ->> 'mimetype',
      object_row.metadata ->> 'contentType'
    ))
  from storage.objects object_row
  join public.nam_hoc school_year
    on school_year.id::text = (storage.foldername(object_row.name))[2]
    and school_year.co_so_id = v_co_so_id
  where object_row.bucket_id = 'evidence'
    and cardinality(storage.foldername(object_row.name)) = 2
    and (storage.foldername(object_row.name))[1] = v_co_so_id::text
    and object_row.created_at <= now() - make_interval(mins => p_toi_thieu_phut)
    and not exists (
      select 1
      from public.minh_chung evidence
      where evidence.storage_path = object_row.name
    )
  order by object_row.created_at;
end;
$$;

create or replace function public.fn_ghi_nhat_ky_don_storage_mo_coi(
  p_storage_paths text[]
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_co_so_id uuid := public.fn_current_co_so_id();
  v_storage_path text;
begin
  if auth.uid() is null
    or v_co_so_id is null
    or public.fn_current_nguoi_dung_id() is null
  then
    raise exception 'Bạn cần đăng nhập và thuộc một cơ sở giáo dục.';
  end if;

  if not public.fn_has_permission('evidence.delete', v_co_so_id) then
    raise exception 'Bạn không có quyền dọn tệp minh chứng tải lỗi.';
  end if;

  if p_storage_paths is null
    or cardinality(p_storage_paths) not between 1 and 20
  then
    raise exception 'Mỗi lần chỉ ghi nhận từ 1 đến 20 object đã dọn.';
  end if;

  foreach v_storage_path in array p_storage_paths loop
    if cardinality(storage.foldername(v_storage_path)) <> 2
      or (storage.foldername(v_storage_path))[1] <> v_co_so_id::text
      or not exists (
        select 1
        from public.nam_hoc school_year
        where school_year.id::text = (storage.foldername(v_storage_path))[2]
          and school_year.co_so_id = v_co_so_id
      )
      or exists (
        select 1
        from public.minh_chung evidence
        where evidence.storage_path = v_storage_path
      )
    then
      raise exception 'Danh sách có object không thuộc phạm vi được phép dọn.';
    end if;
  end loop;

  perform public.fn_log_audit(
    'EVIDENCE_ORPHAN_STORAGE_CLEANED',
    'storage.objects',
    null,
    null,
    jsonb_build_object(
      'so_luong',
      cardinality(p_storage_paths),
      'storage_paths',
      to_jsonb(p_storage_paths)
    )
  );
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.schemata
    where schema_name = 'storage'
  ) then
    drop policy if exists "evidence_storage_select" on storage.objects;
    drop policy if exists "evidence_storage_insert" on storage.objects;
    drop policy if exists "evidence_storage_update" on storage.objects;
    drop policy if exists "evidence_storage_delete" on storage.objects;

    create policy "evidence_storage_select" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'evidence'
      and cardinality(storage.foldername(name)) = 2
      and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
      and exists (
        select 1
        from public.nam_hoc school_year
        where school_year.id::text = (storage.foldername(name))[2]
          and school_year.co_so_id = public.fn_current_co_so_id()
      )
      and (
        exists (
          select 1
          from public.minh_chung evidence
          where evidence.storage_path = storage.objects.name
            and evidence.co_so_id = public.fn_current_co_so_id()
            and evidence.nam_hoc_id::text = (storage.foldername(name))[2]
            and public.fn_can_read_minh_chung(evidence.id)
        )
        or (
          owner_id = auth.uid()::text
          and created_at >= now() - interval '30 minutes'
          and public.fn_has_permission(
            'evidence.create',
            public.fn_current_co_so_id()
          )
          and not exists (
            select 1
            from public.minh_chung evidence
            where evidence.storage_path = storage.objects.name
          )
        )
        or (
          public.fn_has_permission(
            'evidence.delete',
            public.fn_current_co_so_id()
          )
          and not exists (
            select 1
            from public.minh_chung evidence
            where evidence.storage_path = storage.objects.name
          )
        )
      )
    );

    create policy "evidence_storage_insert" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'evidence'
      and cardinality(storage.foldername(name)) = 2
      and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
      and exists (
        select 1
        from public.nam_hoc school_year
        where school_year.id::text = (storage.foldername(name))[2]
          and school_year.co_so_id = public.fn_current_co_so_id()
      )
      and public.fn_has_permission(
        'evidence.create',
        public.fn_current_co_so_id()
      )
    );

    create policy "evidence_storage_update" on storage.objects
    for update to authenticated
    using (
      bucket_id = 'evidence'
      and exists (
        select 1
        from public.minh_chung evidence
        where evidence.storage_path = storage.objects.name
          and public.fn_can_write_minh_chung(
            evidence.id,
            'evidence.update'
          )
      )
    )
    with check (
      bucket_id = 'evidence'
      and cardinality(storage.foldername(name)) = 2
      and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
      and exists (
        select 1
        from public.nam_hoc school_year
        where school_year.id::text = (storage.foldername(name))[2]
          and school_year.co_so_id = public.fn_current_co_so_id()
      )
      and exists (
        select 1
        from public.minh_chung evidence
        where evidence.storage_path = storage.objects.name
          and public.fn_can_write_minh_chung(
            evidence.id,
            'evidence.update'
          )
      )
    );

    create policy "evidence_storage_delete" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'evidence'
      and cardinality(storage.foldername(name)) = 2
      and (storage.foldername(name))[1] = public.fn_current_co_so_id()::text
      and exists (
        select 1
        from public.nam_hoc school_year
        where school_year.id::text = (storage.foldername(name))[2]
          and school_year.co_so_id = public.fn_current_co_so_id()
      )
      and not exists (
        select 1
        from public.minh_chung evidence
        where evidence.storage_path = storage.objects.name
      )
      and (
        owner_id = auth.uid()::text
        or public.fn_has_permission(
          'evidence.delete',
          public.fn_current_co_so_id()
        )
      )
    );
  end if;
end;
$$;

revoke all on function public.fn_tao_minh_chung(
  uuid, uuid[], uuid, text, varchar, text, text, varchar, bigint, date, date
) from public, anon;
grant execute on function public.fn_tao_minh_chung(
  uuid, uuid[], uuid, text, varchar, text, text, varchar, bigint, date, date
) to authenticated;

revoke all on function public.fn_liet_ke_object_minh_chung_mo_coi(integer)
from public, anon;
grant execute on function public.fn_liet_ke_object_minh_chung_mo_coi(integer)
to authenticated;

revoke all on function public.fn_ghi_nhat_ky_don_storage_mo_coi(text[])
from public, anon;
grant execute on function public.fn_ghi_nhat_ky_don_storage_mo_coi(text[])
to authenticated;
