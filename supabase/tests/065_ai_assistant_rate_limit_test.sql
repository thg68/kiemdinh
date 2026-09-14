begin;
\ir _bootstrap.pgtap

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(2);

select matches(
  pg_get_constraintdef(oid),
  'ai_generate',
  'Ràng buộc bộ đếm chấp nhận tác vụ AI'
)
from pg_constraint
where conname = 'gioi_han_api_hanh_dong_check'
  and conrelid = 'public.gioi_han_api'::regclass;

insert into public.co_so_giao_duc(id, ten, ma_truong, loai_hinh, cap_hoc)
values (
  '68000000-0000-0000-0000-000000000101',
  'Trường kiểm thử AI',
  'AI-RATE-LIMIT',
  'mam_non',
  array['mam_non']::public.cap_hoc[]
);

insert into auth.users(id, email, aud, role, created_at, updated_at)
values (
  '68000000-0000-0000-0000-000000000201',
  'ai-rate-limit@example.test',
  'authenticated',
  'authenticated',
  now(),
  now()
);

insert into public.nguoi_dung(id, auth_user_id, co_so_id, ho_ten, email)
values (
  '68000000-0000-0000-0000-000000000301',
  '68000000-0000-0000-0000-000000000201',
  '68000000-0000-0000-0000-000000000101',
  'Người dùng AI',
  'ai-rate-limit@example.test'
);

select set_config('request.jwt.claim.sub', '68000000-0000-0000-0000-000000000201', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(
  (select duoc_phep from public.fn_kiem_tra_gioi_han_api('ai_generate')),
  true,
  'Lượt tạo bản nháp AI đầu tiên được phép'
);

set local role postgres;
select * from finish();
rollback;
