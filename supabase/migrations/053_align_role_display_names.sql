update public.vai_tro
set ten = case ma
  when 'SELF_ASSESSMENT_CHAIR' then 'Chủ tịch Hội đồng TĐG'
  when 'SECRETARY' then 'Thư ký Hội đồng'
  when 'MEMBER' then 'Ủy viên / Tổ trưởng'
  when 'VIEWER' then 'Khách (chỉ đọc)'
  else ten
end
where ma in (
  'SELF_ASSESSMENT_CHAIR',
  'SECRETARY',
  'MEMBER',
  'VIEWER'
);
