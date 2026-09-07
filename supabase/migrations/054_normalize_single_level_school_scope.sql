begin;

create temporary table school_scope_fix on commit drop as
select
  school.id as co_so_id,
  case school.loai_hinh
    when 'mam_non' then 'mam_non'::public.cap_hoc
    when 'gdtx' then 'gdtx'::public.cap_hoc
  end as target_cap_hoc
from public.co_so_giao_duc school
where school.loai_hinh in ('mam_non', 'gdtx')
  and not public.fn_cap_hoc_hop_loai_hinh(school.loai_hinh, school.cap_hoc);

update public.tu_danh_gia assessment
set cap_hoc = scope.target_cap_hoc
from school_scope_fix scope
where assessment.co_so_id = scope.co_so_id
  and assessment.cap_hoc is distinct from scope.target_cap_hoc;

update public.nhan_xet_tieu_chuan standard_note
set cap_hoc = scope.target_cap_hoc
from school_scope_fix scope
where standard_note.co_so_id = scope.co_so_id
  and standard_note.cap_hoc is distinct from scope.target_cap_hoc;

update public.noi_dung_mau_2 report_content
set cap_hoc = scope.target_cap_hoc
from school_scope_fix scope
where report_content.co_so_id = scope.co_so_id
  and report_content.cap_hoc is distinct from scope.target_cap_hoc;

update public.phan_cong_tieu_chi assignment
set cap_hoc = scope.target_cap_hoc
from school_scope_fix scope
where assignment.co_so_id = scope.co_so_id
  and assignment.cap_hoc is distinct from scope.target_cap_hoc;

update public.so_lieu_dinh_luong metric
set cap_hoc = scope.target_cap_hoc
from school_scope_fix scope
where metric.co_so_id = scope.co_so_id
  and metric.cap_hoc is distinct from scope.target_cap_hoc;

update public.bao_cao report
set cap_hoc = scope.target_cap_hoc
from school_scope_fix scope
where report.co_so_id = scope.co_so_id
  and report.cap_hoc is not null
  and report.cap_hoc is distinct from scope.target_cap_hoc;

update public.co_so_giao_duc school
set cap_hoc = array[scope.target_cap_hoc]::public.cap_hoc[]
from school_scope_fix scope
where school.id = scope.co_so_id;

alter table public.co_so_giao_duc
  validate constraint chk_co_so_cap_hoc_hop_loai_hinh;
alter table public.co_so_giao_duc
  validate constraint chk_co_so_ten_khong_rong;
alter table public.nam_hoc
  validate constraint chk_nam_hoc_ten_hop_le;
alter table public.nam_hoc
  validate constraint chk_nam_hoc_thoi_gian_hop_le;
alter table public.nguoi_dung
  validate constraint chk_nguoi_dung_ho_ten_khong_rong;
alter table public.minh_chung
  validate constraint ck_minh_chung_hash_sha256;
alter table public.minh_chung
  validate constraint ck_minh_chung_kich_thuoc_tep;
alter table public.minh_chung
  validate constraint ck_minh_chung_ten_hop_le;
alter table public.minh_chung
  validate constraint ck_minh_chung_thu_tu_ngay;
alter table public.van_ban_lien_quan
  validate constraint ck_van_ban_duong_dan_http;
alter table public.van_ban_lien_quan
  validate constraint ck_van_ban_thu_tu_hieu_luc;
alter table public.thanh_vien_hoi_dong
  validate constraint fk_thanh_vien_hoi_dong_scope;
alter table public.thanh_vien_hoi_dong
  validate constraint fk_thanh_vien_nguoi_dung_scope;

commit;
