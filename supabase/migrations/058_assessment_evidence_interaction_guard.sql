begin;

create or replace function public.fn_gan_co_du_lieu_demo()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_row jsonb := to_jsonb(new);
begin
  if tg_table_name = 'tu_danh_gia' then
    new.la_du_lieu_demo := position(
      '[DEMO]' in upper(
        coalesce(v_row ->> 'mo_ta_muc_1', '') || ' ' ||
        coalesce(v_row ->> 'mo_ta_muc_2', '')
      )
    ) > 0;
  elsif position('[DEMO]' in upper(v_row::text)) > 0 then
    new.la_du_lieu_demo := true;
  end if;

  return new;
end;
$$;

create or replace function public.fn_guard_tu_danh_gia_workflow()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.trang_thai is distinct from new.trang_thai
    and coalesce(current_setting('app.assessment_status_transition', true), '') <> 'allowed'
  then
    raise exception using
      errcode = '55000',
      message = 'Trang thai tu danh gia chi duoc thay doi qua quy trinh duyet.';
  end if;

  if old.trang_thai is distinct from new.trang_thai
    and new.trang_thai = 'da_duyet'::public.trang_thai_tu_danh_gia
    and (
      new.la_du_lieu_demo
      or exists (
        select 1
        from public.tu_danh_gia_minh_chung scoped_link
        join public.minh_chung evidence
          on evidence.id = scoped_link.minh_chung_id
          and evidence.co_so_id = scoped_link.co_so_id
          and evidence.nam_hoc_id = scoped_link.nam_hoc_id
        where scoped_link.tu_danh_gia_id = new.id
          and evidence.la_du_lieu_demo
      )
    )
  then
    raise exception using
      errcode = '23514',
      message = 'Khong the chot muc khi ban tu danh gia hoac minh chung con la du lieu thu.';
  end if;

  if old.trang_thai in (
      'cho_duyet'::public.trang_thai_tu_danh_gia,
      'da_duyet'::public.trang_thai_tu_danh_gia
    )
    and (
      old.mo_ta_muc_1 is distinct from new.mo_ta_muc_1
      or old.dat_muc_1 is distinct from new.dat_muc_1
      or old.mo_ta_muc_2 is distinct from new.mo_ta_muc_2
      or old.dat_muc_2 is distinct from new.dat_muc_2
      or old.muc_dat is distinct from new.muc_dat
      or old.tieu_chi_id is distinct from new.tieu_chi_id
      or old.cap_hoc is distinct from new.cap_hoc
      or old.nam_hoc_id is distinct from new.nam_hoc_id
      or old.co_so_id is distinct from new.co_so_id
    )
  then
    raise exception using
      errcode = '55000',
      message = 'Ban tu danh gia dang cho duyet hoac da duyet, khong the sua noi dung.';
  end if;

  return new;
end;
$$;

revoke all on function public.fn_guard_tu_danh_gia_workflow()
from public, anon, authenticated;
revoke all on function public.fn_gan_co_du_lieu_demo()
from public, anon, authenticated;

comment on function public.fn_guard_tu_danh_gia_workflow() is
  'Bao ve state machine tu danh gia va chan chot muc khi con du lieu thu.';
comment on function public.fn_gan_co_du_lieu_demo() is
  'Gan co du lieu thu; rieng tu danh gia duoc tinh lai sau khi thay noi dung that.';

commit;
