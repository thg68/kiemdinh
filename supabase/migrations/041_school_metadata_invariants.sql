-- R-003: dùng một ma trận loại hình-cấp học tại CSDL để bảo vệ metadata tenant.
create or replace function public.fn_cap_hoc_hop_loai_hinh(
  p_loai_hinh public.loai_hinh_co_so,
  p_cap_hoc public.cap_hoc[]
)
returns boolean
language sql
immutable
set search_path = pg_catalog, public
as $$
  select case
    when coalesce(cardinality(p_cap_hoc), 0) = 0 then false
    when cardinality(p_cap_hoc) <> (select count(distinct cap) from unnest(p_cap_hoc) cap) then false
    when p_loai_hinh = 'mam_non' then p_cap_hoc = array['mam_non']::public.cap_hoc[]
    when p_loai_hinh = 'gdtx' then p_cap_hoc = array['gdtx']::public.cap_hoc[]
    when p_loai_hinh = 'pho_thong' then not exists (
      select 1 from unnest(p_cap_hoc) cap
      where cap <> all(array['tieu_hoc', 'thcs', 'thpt']::public.cap_hoc[])
    )
    else false
  end;
$$;

alter table public.co_so_giao_duc
  add constraint chk_co_so_ten_khong_rong check (btrim(ten) <> '') not valid,
  add constraint chk_co_so_cap_hoc_hop_loai_hinh check (public.fn_cap_hoc_hop_loai_hinh(loai_hinh, cap_hoc)) not valid;

alter table public.nam_hoc
  add constraint chk_nam_hoc_ten_hop_le check (
    ten ~ '^[0-9]{4}-[0-9]{4}$'
    and case
      when ten ~ '^[0-9]{4}-[0-9]{4}$'
        then substring(ten from 6 for 4)::integer = substring(ten from 1 for 4)::integer + 1
      else false
    end
  ) not valid,
  add constraint chk_nam_hoc_thoi_gian_hop_le check (ngay_ket_thuc > ngay_bat_dau) not valid;

alter table public.nguoi_dung
  add constraint chk_nguoi_dung_ho_ten_khong_rong check (btrim(ho_ten) <> '') not valid;

create or replace view public.v_co_so_metadata_can_ra_soat
with (security_invoker = true)
as
select id, ten, loai_hinh, cap_hoc,
  array_remove(array[
    case when btrim(ten) = '' then 'ten_co_so_rong' end,
    case when not public.fn_cap_hoc_hop_loai_hinh(loai_hinh, cap_hoc) then 'cap_hoc_khong_hop_loai_hinh' end
  ], null) as loi
from public.co_so_giao_duc
where btrim(ten) = '' or not public.fn_cap_hoc_hop_loai_hinh(loai_hinh, cap_hoc);

create or replace function public.fn_quan_tri_tao_co_so_va_nam_hoc(
  p_ten_co_so text,
  p_ma_truong text,
  p_loai_hinh public.loai_hinh_co_so,
  p_cap_hoc public.cap_hoc[],
  p_nam_hoc_ten varchar,
  p_ngay_bat_dau date,
  p_ngay_ket_thuc date,
  p_email_hieu_truong text,
  p_ho_ten_hieu_truong text
)
returns table (co_so_id uuid, nam_hoc_id uuid, loi_moi_id uuid)
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_email text := lower(trim(p_email_hieu_truong));
  v_bo_tieu_chuan_id uuid;
  v_vai_tro_id uuid;
begin
  if not public.fn_has_role('SYSTEM_ADMIN') then
    raise exception using errcode = '42501', message = 'Chỉ Quản trị hệ thống được tạo đơn vị mới.';
  end if;
  if nullif(trim(p_ten_co_so), '') is null then
    raise exception using errcode = '22023', message = 'Tên cơ sở giáo dục không được để trống.';
  end if;
  if nullif(trim(p_ho_ten_hieu_truong), '') is null then
    raise exception using errcode = '22023', message = 'Họ và tên Hiệu trưởng không được để trống.';
  end if;
  if not public.fn_cap_hoc_hop_loai_hinh(p_loai_hinh, p_cap_hoc) then
    raise exception using errcode = '22023', message = 'Cấp học chưa phù hợp với loại hình đơn vị.';
  end if;
  if p_nam_hoc_ten !~ '^[0-9]{4}-[0-9]{4}$' then
    raise exception using errcode = '22023', message = 'Năm học phải có dạng YYYY-YYYY và gồm hai năm liên tiếp.';
  end if;
  if substring(p_nam_hoc_ten from 6 for 4)::integer <> substring(p_nam_hoc_ten from 1 for 4)::integer + 1 then
    raise exception using errcode = '22023', message = 'Năm học phải có dạng YYYY-YYYY và gồm hai năm liên tiếp.';
  end if;
  if p_ngay_ket_thuc <= p_ngay_bat_dau then
    raise exception using errcode = '22023', message = 'Ngày kết thúc năm học phải sau ngày bắt đầu.';
  end if;
  if position('@' in v_email) < 2 then
    raise exception using errcode = '22023', message = 'Email Hiệu trưởng chưa hợp lệ.';
  end if;
  if exists (select 1 from public.nguoi_dung nd where lower(nd.email) = v_email) then
    raise exception using errcode = '23505', message = 'Tài khoản Hiệu trưởng đã thuộc một đơn vị khác.';
  end if;

  select btc.id into v_bo_tieu_chuan_id
  from public.bo_tieu_chuan btc
  where btc.loai_hinh = p_loai_hinh and btc.trang_thai = 'dang_ap_dung'
    and (btc.ngay_hieu_luc is null or btc.ngay_hieu_luc <= p_ngay_ket_thuc)
  order by btc.ngay_hieu_luc desc nulls last, btc.version desc, btc.created_at desc
  limit 1;
  if v_bo_tieu_chuan_id is null then
    raise exception using errcode = 'P0001', message = 'Không tìm thấy bộ tiêu chuẩn phù hợp cho năm học ban đầu.';
  end if;

  insert into public.co_so_giao_duc(ten, ma_truong, loai_hinh, cap_hoc)
  values (trim(p_ten_co_so), nullif(trim(p_ma_truong), ''), p_loai_hinh, p_cap_hoc)
  returning id into co_so_id;

  insert into public.nam_hoc(co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id)
  values (co_so_id, p_nam_hoc_ten, p_ngay_bat_dau, p_ngay_ket_thuc, 'dang_hoat_dong', v_bo_tieu_chuan_id)
  returning id into nam_hoc_id;

  select vt.id into v_vai_tro_id from public.vai_tro vt where vt.ma = 'PRINCIPAL';
  insert into public.loi_moi_thanh_vien(co_so_id, email, ho_ten, vai_tro_id, nguoi_moi_id)
  values (co_so_id, v_email, trim(p_ho_ten_hieu_truong), v_vai_tro_id, public.fn_current_nguoi_dung_id())
  returning id into loi_moi_id;

  -- Nhật ký tạo tenant phải mang co_so_id mới, không dùng tenant hiện tại của quản trị hệ thống.
  insert into public.nhat_ky_truy_cap(
    co_so_id, nguoi_dung_id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu_moi
  ) values (
    co_so_id, public.fn_current_nguoi_dung_id(), 'SCHOOL_CREATED_BY_SYSTEM_ADMIN',
    'co_so_giao_duc', co_so_id,
    jsonb_build_object('email_hieu_truong', v_email, 'nam_hoc_id', nam_hoc_id)
  );
  return next;
end;
$$;

revoke all on function public.fn_cap_hoc_hop_loai_hinh(public.loai_hinh_co_so, public.cap_hoc[]) from public, anon;
grant execute on function public.fn_cap_hoc_hop_loai_hinh(public.loai_hinh_co_so, public.cap_hoc[]) to authenticated;
grant select on public.v_co_so_metadata_can_ra_soat to authenticated;
