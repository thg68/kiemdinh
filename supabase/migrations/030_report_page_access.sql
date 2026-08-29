begin;

-- RLS chỉ được đánh giá sau khi role PostgreSQL có quyền thao tác trên bảng.
-- Chỉ cấp các quyền mà màn hình và API xuất báo cáo thực sự sử dụng.
grant select on table
  public.bao_cao,
  public.nhan_xet_tieu_chuan,
  public.tu_danh_gia,
  public.minh_chung_tieu_chi,
  public.ke_hoach_cai_tien,
  public.hoi_dong_tu_danh_gia,
  public.thanh_vien_hoi_dong
to authenticated;

grant insert, update on table public.nhan_xet_tieu_chuan to authenticated;

-- Khôi phục mapping chuẩn nếu dữ liệu quyền production từng bị chỉnh lệch.
with role_permission(role_code, permission_code) as (
  values
    ('PRINCIPAL', 'report.read'),
    ('PRINCIPAL', 'report.export'),
    ('PRINCIPAL', 'report.approve'),
    ('SELF_ASSESSMENT_CHAIR', 'report.read'),
    ('SELF_ASSESSMENT_CHAIR', 'report.export'),
    ('SELF_ASSESSMENT_CHAIR', 'report.approve'),
    ('SECRETARY', 'report.read'),
    ('SECRETARY', 'report.export'),
    ('VIEWER', 'report.read')
)
insert into public.vai_tro_quyen(vai_tro_id, quyen_id)
select vt.id, q.id
from role_permission rp
join public.vai_tro vt on vt.ma = rp.role_code
join public.quyen q on q.ma = rp.permission_code
on conflict (vai_tro_id, quyen_id) do nothing;

commit;
