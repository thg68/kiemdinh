-- =====================================================================
-- PHIẾU NỘI HÀM TIÊU CHÍ — LƯỢC ĐỒ CƠ SỞ DỮ LIỆU
-- Ứng dụng kiểm định chất lượng giáo dục theo Thông tư 57/2026/TT-BGDĐT
-- PDT Academy · PDT-EDUQA-2026-M09 · PostgreSQL 15+
--
-- Tệp này BỔ SUNG cho lược đồ nền đã có (co_so_giao_duc, nam_hoc,
-- nguoi_dung, minh_chung, tu_danh_gia, ...). Nếu dự án chưa có các bảng
-- đó, xem phần A để tạo bản tối thiểu.
--
-- ĐỌC KÈM: docs/03-QUY-TAC-NGHIEP-VU.md (bốn khóa cứng K1–K4)
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- PHẦN A. BẢNG NỀN TỐI THIỂU (bỏ qua nếu dự án đã có)
-- =====================================================================

create table if not exists co_so_giao_duc (
  id            uuid primary key default gen_random_uuid(),
  ten           text not null,
  ma_truong     text unique,
  loai_hinh     text not null check (loai_hinh in ('mam_non','pho_thong','gdtx')),
  cap_hoc       text[] not null default '{}',
  cong_lap      boolean not null default true,
  dia_chi       text,
  co_quan_quan_ly text,
  created_at    timestamptz not null default now()
);

create table if not exists nam_hoc (
  id          uuid primary key default gen_random_uuid(),
  ten         text not null unique,              -- '2026-2027'
  ngay_bat_dau date,
  ngay_ket_thuc date,
  trang_thai  text not null default 'dang_mo'
);

create table if not exists nguoi_dung (
  id         uuid primary key default gen_random_uuid(),
  ho_ten     text not null,
  email      text unique not null,
  co_so_id   uuid references co_so_giao_duc(id) on delete cascade,
  vai_tro    text[] not null default '{}',
  trang_thai text not null default 'hoat_dong'
);

-- =====================================================================
-- PHẦN B. BỘ TIÊU CHUẨN — DỮ LIỆU THAM CHIẾU CÓ PHIÊN BẢN
-- Ràng buộc bất biến số 1: KHÔNG cứng hóa 15 tiêu chí vào mã nguồn.
-- =====================================================================

create table bo_tieu_chuan (
  id            uuid primary key default gen_random_uuid(),
  ma_van_ban    text not null,                   -- '57/2026/TT-BGDĐT'
  ten           text not null,
  ngay_hieu_luc date not null,
  loai_hinh     text not null check (loai_hinh in ('mam_non','pho_thong','gdtx')),
  -- Quy ước mã minh chứng KHÁC NHAU giữa các bộ. Sai là Đoàn thẩm định
  -- nhận ra ngay. TT57: 'MC.{tieu_chuan}.{tieu_chi}.{stt}'
  --                CV5932: '[H{hop}-{tieu_chi}-{stt}]'
  quy_uoc_ma_minh_chung text not null default 'MC.{tieu_chuan}.{tieu_chi}.{stt}',
  trang_thai    text not null default 'hieu_luc'
                check (trang_thai in ('du_thao','hieu_luc','het_hieu_luc')),
  unique (ma_van_ban, loai_hinh)
);

create table tieu_chuan (
  id        uuid primary key default gen_random_uuid(),
  bo_id     uuid not null references bo_tieu_chuan(id) on delete cascade,
  so_thu_tu smallint not null,
  ten       text not null,
  unique (bo_id, so_thu_tu)
);

create table tieu_chi (
  id             uuid primary key default gen_random_uuid(),
  tieu_chuan_id  uuid not null references tieu_chuan(id) on delete cascade,
  ma             text not null,                  -- '1.3'
  ten            text not null,
  -- 8 tiêu chí bắt buộc của TT57: 1.3 1.4 2.1 2.2 3.1 3.2 4.1 4.2
  -- Chỉ cần MỘT tiêu chí bắt buộc không đạt là cả trường không đạt mức đó.
  la_bat_buoc    boolean not null default false,
  so_thu_tu      smallint not null,
  unique (tieu_chuan_id, ma)
);

-- Nội hàm: yêu cầu nhỏ nhất, độc lập, kiểm chứng được, bóc từ mô tả mức.
create table noi_ham (
  id              uuid primary key default gen_random_uuid(),
  tieu_chi_id     uuid not null references tieu_chi(id) on delete cascade,
  muc             smallint not null check (muc in (1,2)),
  so_thu_tu       smallint not null,             -- quyết định thứ tự câu trong đoạn
  -- NGUYÊN VĂN đoạn quy định. Không được sửa một chữ.
  -- Khi thông tư đổi, so sánh trường này giữa hai phiên bản sẽ chỉ ra
  -- chính xác nội hàm nào bị ảnh hưởng, thay vì rà lại 600 mệnh đề bằng tay.
  trich_dan_goc   text not null,
  noi_dung_noi_ham text not null,                -- phần chuyên gia diễn giải
  bat_buoc        boolean not null default true, -- thiếu thì cả chỉ báo không đạt
  unique (tieu_chi_id, muc, so_thu_tu)
);

-- Từ điển loại minh chứng — CƠ SỞ CỦA KHÓA K1.
-- Không phân loại minh chứng khi tải lên thì khóa K1 vô nghĩa.
create table loai_minh_chung (
  id                   uuid primary key default gen_random_uuid(),
  ma                   text unique not null,     -- 'QD_PHE_DUYET_CAP_TREN'
  ten                  text not null,
  mo_ta                text,
  yeu_cau_ngay_thang   boolean not null default true,
  yeu_cau_so_lieu      boolean not null default false,
  co_han_hieu_luc      boolean not null default false,
  canh_bao_truoc_ngay  smallint,                 -- ví dụ 60 ngày với hồ sơ PCCC
  noi_thu_thap         text,
  -- true = do NGƯỜI KHÁC ban hành, không phải nhà trường tự ban hành.
  -- Đây là chỗ bắt lỗi "thiếu thật mà tưởng là có" phổ biến nhất.
  phai_do_cap_tren_ban_hanh boolean not null default false,
  du_lieu_do           boolean not null default false  -- dữ liệu cá nhân nhạy cảm
);

-- Mệnh đề trạng thái: chính là Ô TICK người dùng nhìn thấy.
-- KHÔNG phải một từ khóa rời. Phải là câu khẳng định trọn vẹn, nhị phân,
-- có khóa minh chứng, có ô dữ liệu riêng của trường.
create table menh_de_trang_thai (
  id          uuid primary key default gen_random_uuid(),
  noi_ham_id  uuid not null references noi_ham(id) on delete cascade,
  -- Năm nhóm từ khóa. Mọi nội hàm đều rơi vào đúng một nhóm.
  --  1 Tồn tại   — "có", "được thành lập"        → văn bản gốc
  --  2 Quy trình — "theo quy định", "phê duyệt"  → quyết định của cấp trên
  --  3 Thực hiện — "tổ chức thực hiện", "đầy đủ" → kế hoạch + kết quả + số liệu
  --  4 Rà soát   — "định kỳ rà soát", "giám sát" → biên bản CÓ NGÀY, đủ tần suất
  --  5 Cải tiến  — "có minh chứng về kết quả cải tiến" → CẶP SỐ LIỆU 2 MỐC
  nhom_tu_khoa smallint not null check (nhom_tu_khoa between 1 and 5),
  tu_khoa_hien_thi text[] not null default '{}', -- cụm từ tô đậm trên giao diện
  noi_dung    text not null,
  -- Mỗi nội hàm PHẢI có ít nhất một mệnh đề mang cờ này. Không có chỗ để
  -- nói "chúng tôi chưa có" thì hệ thống là một cái máy nói dối.
  la_co_khong_dat boolean not null default false,
  -- 3–5 biến thể khuôn câu, chọn ngẫu nhiên để tránh 500 trường ra 500
  -- báo cáo giống hệt nhau. Chứa slot dạng {ten_bien}.
  mau_cau     text[] not null check (array_length(mau_cau,1) >= 1),
  -- Định nghĩa ô nhập bắt buộc: [{"k":"so_qd","l":"Số quyết định","p":"318/QĐ-PGDĐT"}]
  -- Đây là thứ chống đồng phục hóa báo cáo — số văn bản mỗi trường mỗi khác.
  truong_du_lieu jsonb not null default '[]'::jsonb,
  so_luong_mc_toi_thieu smallint not null default 1,
  ghi_chu_chuyen_mon text,                       -- hiện dưới dạng gợi ý trên giao diện
  so_thu_tu   smallint not null default 1,
  -- Mệnh đề dùng chung toàn hệ thống thì để NULL.
  -- Trường tự tạo mệnh đề riêng thì điền co_so_id (xem ghi chú cuối tệp).
  co_so_id    uuid references co_so_giao_duc(id) on delete cascade,
  constraint mdtt_khong_dat_thi_khong_can_mc
    check (not la_co_khong_dat or so_luong_mc_toi_thieu = 0)
);

-- Loại minh chứng mà một mệnh đề đòi hỏi (khóa K1).
create table menh_de_loai_mc (
  menh_de_id  uuid not null references menh_de_trang_thai(id) on delete cascade,
  loai_mc_id  uuid not null references loai_minh_chung(id) on delete restrict,
  primary key (menh_de_id, loai_mc_id)
);

-- =====================================================================
-- PHẦN C. NGHIỆP VỤ — DỮ LIỆU CỦA TỪNG TRƯỜNG
-- =====================================================================

-- Minh chứng là THỰC THỂ ĐỘC LẬP. Một tệp — một mã — dùng cho mọi tiêu chí.
create table minh_chung (
  id            uuid primary key default gen_random_uuid(),
  co_so_id      uuid not null references co_so_giao_duc(id) on delete cascade,
  nam_hoc_id    uuid references nam_hoc(id),
  ma            text not null,                   -- 'MC.1.3.01'
  ten           text not null,
  loai_mc_id    uuid not null references loai_minh_chung(id),  -- BẮT BUỘC, không cho NULL
  duong_dan     text,
  hash_tep      text,                            -- phát hiện trùng lặp
  so_van_ban    text,
  ngay_ban_hanh date,
  ngay_het_gia_tri date,
  co_quan_ban_hanh text,
  nguoi_tai_len_id uuid references nguoi_dung(id),
  trang_thai_xac_minh text not null default 'chua_xac_minh',
  created_at    timestamptz not null default now(),
  unique (co_so_id, ma)
);

-- BẢNG NỐI N–N — TRÁI TIM CỦA HỆ THỐNG.
-- Ràng buộc bất biến số 2. Sai chỗ này thì đến năm thứ hai dữ liệu hỗn loạn
-- không cứu được. Tuyệt đối KHÔNG nhân bản tệp theo tiêu chí.
create table minh_chung_tieu_chi (
  minh_chung_id  uuid not null references minh_chung(id) on delete cascade,
  tieu_chi_id    uuid not null references tieu_chi(id) on delete cascade,
  muc            smallint check (muc in (1,2)),
  -- Tiêu chí GỐC là nơi minh chứng xuất hiện lần đầu và được cấp mã.
  -- Các tiêu chí sau chỉ THAM CHIẾU mã đó, không cấp mã mới.
  la_tieu_chi_goc boolean not null default false,
  primary key (minh_chung_id, tieu_chi_id)
);

-- Chỉ được có đúng một tiêu chí gốc cho mỗi minh chứng.
create unique index minh_chung_mot_tieu_chi_goc
  on minh_chung_tieu_chi (minh_chung_id) where la_tieu_chi_goc;

-- Lựa chọn của nhà trường: cái mà người dùng thực sự tick.
create table lua_chon_tu_danh_gia (
  id           uuid primary key default gen_random_uuid(),
  co_so_id     uuid not null references co_so_giao_duc(id) on delete cascade,
  nam_hoc_id   uuid not null references nam_hoc(id),
  cap_hoc      text,                             -- trường nhiều cấp học đánh giá riêng từng cấp
  menh_de_id   uuid not null references menh_de_trang_thai(id) on delete cascade,
  duoc_chon    boolean not null default false,
  du_lieu_nhap jsonb not null default '{}'::jsonb,
  trang_thai_khoa text not null default 'thieu_minh_chung'
    check (trang_thai_khoa in ('da_mo','thieu_minh_chung','thieu_du_lieu','thieu_ca_hai')),
  -- AI KHÔNG tick hộ. Mỗi tick là một lời khẳng định có chủ thể; tên người
  -- tick hiện công khai trong Phiếu. Người đứng đầu chịu trách nhiệm trước
  -- pháp luật về tính trung thực — trách nhiệm đó cần có địa chỉ ở từng dòng.
  nguoi_chon_id uuid references nguoi_dung(id),
  thoi_diem_chon timestamptz,
  unique (co_so_id, nam_hoc_id, cap_hoc, menh_de_id)
);

-- Minh chứng đã gắn cho một lựa chọn. KHÔNG cấp mã mới, chỉ tham chiếu.
create table lua_chon_minh_chung (
  lua_chon_id   uuid not null references lua_chon_tu_danh_gia(id) on delete cascade,
  minh_chung_id uuid not null references minh_chung(id) on delete restrict,
  vai_tro       text not null default 'chinh' check (vai_tro in ('chinh','bo_sung')),
  primary key (lua_chon_id, minh_chung_id)
);

-- Vết truy xuất từng câu trong báo cáo. Đây là thứ cho phép Đoàn đánh giá
-- ngoài đối chiếu ba chiều: nội hàm ↔ câu ↔ mã minh chứng.
create table cau_sinh_ra (
  id            uuid primary key default gen_random_uuid(),
  lua_chon_id   uuid not null references lua_chon_tu_danh_gia(id) on delete cascade,
  cau_lop_1     text not null,                   -- bản máy ghép, thuần toán
  cau_lop_3     text,                            -- bản sau khi AI làm mượt
  ma_mc_su_dung text[] not null default '{}',    -- để so khớp ở Lớp 4
  so_lieu_su_dung text[] not null default '{}',  -- để so khớp ở Lớp 4
  da_qua_kiem_tra boolean not null default false,
  ly_do_tu_choi text[],
  nguoi_duyet_id uuid references nguoi_dung(id),
  thoi_diem_duyet timestamptz,
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- PHẦN D. HÀM NGHIỆP VỤ
-- =====================================================================

-- Sinh mã minh chứng theo quy ước của bộ tiêu chuẩn đang áp dụng.
-- Chỉ gọi khi minh chứng được gắn vào tiêu chí GỐC lần đầu.
create or replace function fn_sinh_ma_minh_chung(
  p_co_so_id uuid, p_tieu_chi_id uuid
) returns text language plpgsql as $$
declare
  v_so_tc smallint; v_ma_tieu_chi text; v_stt int; v_ma text;
begin
  select tc.so_thu_tu, t.ma into v_so_tc, v_ma_tieu_chi
  from tieu_chi t join tieu_chuan tc on tc.id = t.tieu_chuan_id
  where t.id = p_tieu_chi_id;

  select coalesce(max(substring(mc.ma from '(\d+)$')::int), 0) + 1
  into v_stt
  from minh_chung mc
  join minh_chung_tieu_chi mct
    on mct.minh_chung_id = mc.id and mct.la_tieu_chi_goc
  where mc.co_so_id = p_co_so_id and mct.tieu_chi_id = p_tieu_chi_id;

  v_ma := 'MC.' || v_so_tc || '.' || v_ma_tieu_chi || '.' || lpad(v_stt::text, 2, '0');
  return v_ma;
end $$;

-- Tính trạng thái khóa của một lựa chọn (khóa K1 + K2 + K4).
-- Đây là hàm quyết định ô tick có mở được hay không.
create or replace function fn_tinh_trang_thai_khoa(p_lua_chon_id uuid)
returns text language plpgsql as $$
declare
  v_md record; v_so_mc int; v_thieu_du_lieu boolean := false;
  v_truong jsonb; v_gia_tri text;
begin
  select m.*, lc.du_lieu_nhap into v_md
  from lua_chon_tu_danh_gia lc
  join menh_de_trang_thai m on m.id = lc.menh_de_id
  where lc.id = p_lua_chon_id;

  -- Mệnh đề mang cờ KHÔNG ĐẠT luôn mở: nhà trường phải được quyền nói thật.
  if v_md.la_co_khong_dat then return 'da_mo'; end if;

  -- K1: đủ số lượng minh chứng ĐÚNG LOẠI mà mệnh đề yêu cầu
  select count(*) into v_so_mc
  from lua_chon_minh_chung lcmc
  join minh_chung mc on mc.id = lcmc.minh_chung_id
  where lcmc.lua_chon_id = p_lua_chon_id
    and exists (select 1 from menh_de_loai_mc mdl
                where mdl.menh_de_id = v_md.id and mdl.loai_mc_id = mc.loai_mc_id)
    and (mc.ngay_het_gia_tri is null or mc.ngay_het_gia_tri >= current_date);

  -- K2: mọi ô dữ liệu riêng phải được điền
  for v_truong in select * from jsonb_array_elements(v_md.truong_du_lieu) loop
    v_gia_tri := v_md.du_lieu_nhap ->> (v_truong ->> 'k');
    if v_gia_tri is null or btrim(v_gia_tri) = '' then
      v_thieu_du_lieu := true;
    end if;
  end loop;

  if v_so_mc < v_md.so_luong_mc_toi_thieu and v_thieu_du_lieu then return 'thieu_ca_hai'; end if;
  if v_so_mc < v_md.so_luong_mc_toi_thieu then return 'thieu_minh_chung'; end if;
  if v_thieu_du_lieu then return 'thieu_du_lieu'; end if;
  return 'da_mo';
end $$;

-- KHÓA K1/K2/K4: không cho bật duoc_chon khi chưa mở khóa.
-- Cài ở tầng CSDL, không chỉ ẩn nút trên giao diện. Ẩn nút là trang trí.
create or replace function trg_chan_tick_khi_chua_mo_khoa()
returns trigger language plpgsql as $$
begin
  new.trang_thai_khoa := fn_tinh_trang_thai_khoa(new.id);
  if new.duoc_chon and new.trang_thai_khoa <> 'da_mo' then
    raise exception
      'Không thể chọn mệnh đề khi chưa mở khóa (trạng thái: %). Cần bổ sung minh chứng đúng loại hoặc điền đủ ô dữ liệu.',
      new.trang_thai_khoa;
  end if;
  if new.duoc_chon and new.nguoi_chon_id is null then
    raise exception 'Mỗi lựa chọn phải ghi rõ người chọn.';
  end if;
  return new;
end $$;

create trigger tg_chan_tick
  before update on lua_chon_tu_danh_gia
  for each row execute function trg_chan_tick_khi_chua_mo_khoa();

-- KHÓA K3 (đánh giá tuần tự): không mở mệnh đề Mức 2 khi Mức 1 chưa đủ.
create or replace function fn_muc_1_da_du(
  p_co_so_id uuid, p_nam_hoc_id uuid, p_cap_hoc text, p_tieu_chi_id uuid
) returns boolean language sql stable as $$
  select not exists (
    select 1 from noi_ham nh
    where nh.tieu_chi_id = p_tieu_chi_id and nh.muc = 1 and nh.bat_buoc
      and not exists (
        select 1 from menh_de_trang_thai m
        join lua_chon_tu_danh_gia lc on lc.menh_de_id = m.id
        where m.noi_ham_id = nh.id
          and lc.co_so_id = p_co_so_id and lc.nam_hoc_id = p_nam_hoc_id
          and lc.cap_hoc is not distinct from p_cap_hoc
          and lc.duoc_chon and not m.la_co_khong_dat
      )
  );
$$;

-- CHỈ SỐ ĐỘ ĐẶC THÙ — biến "chung chung" thành một con số.
-- KHÔNG được dùng để xếp hạng trường. Xem README, mục "Ba điều đừng làm".
create or replace function fn_do_dac_thu(
  p_co_so_id uuid, p_nam_hoc_id uuid, p_cap_hoc text, p_tieu_chi_id uuid
) returns jsonb language plpgsql stable as $$
declare
  v_nh_tong int; v_nh_khai int; v_cau int; v_cau_du_lieu int;
  v_nhom int; v_mc_tong int; v_mc_hieu_luc int; v_tong numeric;
begin
  select count(*) into v_nh_tong from noi_ham where tieu_chi_id = p_tieu_chi_id;

  select count(distinct nh.id), count(*), count(*) filter (where lc.du_lieu_nhap::text ~ '\d'),
         count(distinct m.nhom_tu_khoa)
  into v_nh_khai, v_cau, v_cau_du_lieu, v_nhom
  from lua_chon_tu_danh_gia lc
  join menh_de_trang_thai m on m.id = lc.menh_de_id
  join noi_ham nh on nh.id = m.noi_ham_id
  where nh.tieu_chi_id = p_tieu_chi_id and lc.duoc_chon
    and lc.co_so_id = p_co_so_id and lc.nam_hoc_id = p_nam_hoc_id
    and lc.cap_hoc is not distinct from p_cap_hoc;

  select count(*), count(*) filter (where mc.ngay_het_gia_tri is null or mc.ngay_het_gia_tri >= current_date)
  into v_mc_tong, v_mc_hieu_luc
  from lua_chon_tu_danh_gia lc
  join lua_chon_minh_chung lcmc on lcmc.lua_chon_id = lc.id
  join minh_chung mc on mc.id = lcmc.minh_chung_id
  join menh_de_trang_thai m on m.id = lc.menh_de_id
  join noi_ham nh on nh.id = m.noi_ham_id
  where nh.tieu_chi_id = p_tieu_chi_id and lc.duoc_chon
    and lc.co_so_id = p_co_so_id and lc.nam_hoc_id = p_nam_hoc_id;

  v_tong :=   0.30 * coalesce(v_cau_du_lieu::numeric / nullif(v_cau,0), 0)
            + 0.30 * coalesce(v_nh_khai::numeric   / nullif(v_nh_tong,0), 0)
            + 0.20 * coalesce(v_nhom::numeric / 5.0, 0)
            + 0.20 * coalesce(v_mc_hieu_luc::numeric / nullif(v_mc_tong,0), 0);

  return jsonb_build_object(
    'tong_diem', round(v_tong * 100),
    'cau_co_du_lieu_rieng', jsonb_build_array(v_cau_du_lieu, v_cau),
    'noi_ham_da_khai',      jsonb_build_array(v_nh_khai, v_nh_tong),
    'nhom_tu_khoa_co_mat',  jsonb_build_array(v_nhom, 5),
    'minh_chung_hieu_luc',  jsonb_build_array(v_mc_hieu_luc, v_mc_tong)
  );
end $$;

-- =====================================================================
-- PHẦN E. BẢO MẬT — RLS ĐA ĐƠN VỊ
-- Phân quyền phải cài ở tầng CSDL. Ẩn nút trên giao diện không phải phân quyền.
-- =====================================================================

alter table minh_chung             enable row level security;
alter table minh_chung_tieu_chi    enable row level security;
alter table lua_chon_tu_danh_gia   enable row level security;
alter table lua_chon_minh_chung    enable row level security;
alter table cau_sinh_ra            enable row level security;

-- Thư viện từ khóa là dữ liệu tham chiếu dùng chung: mọi người đọc được,
-- nhưng chỉ quản trị hệ thống PDT mới ghi được (trừ mệnh đề riêng của trường).
alter table menh_de_trang_thai     enable row level security;

create or replace function fn_co_so_hien_tai() returns uuid
language sql stable as $$
  select co_so_id from nguoi_dung where id = auth.uid()
$$;

create policy p_minh_chung_theo_co_so on minh_chung
  using (co_so_id = fn_co_so_hien_tai())
  with check (co_so_id = fn_co_so_hien_tai());

create policy p_lua_chon_theo_co_so on lua_chon_tu_danh_gia
  using (co_so_id = fn_co_so_hien_tai())
  with check (co_so_id = fn_co_so_hien_tai());

create policy p_menh_de_doc on menh_de_trang_thai
  for select using (co_so_id is null or co_so_id = fn_co_so_hien_tai());

create policy p_menh_de_rieng on menh_de_trang_thai
  for all using (co_so_id = fn_co_so_hien_tai())
  with check (co_so_id = fn_co_so_hien_tai());

-- =====================================================================
-- PHẦN F. CHỈ MỤC
-- =====================================================================

create index ix_noi_ham_tieu_chi     on noi_ham (tieu_chi_id, muc, so_thu_tu);
create index ix_menh_de_noi_ham      on menh_de_trang_thai (noi_ham_id, so_thu_tu);
create index ix_menh_de_nhom         on menh_de_trang_thai (nhom_tu_khoa);
create index ix_mc_co_so_loai        on minh_chung (co_so_id, loai_mc_id);
create index ix_mc_het_han           on minh_chung (ngay_het_gia_tri)
                                     where ngay_het_gia_tri is not null;
create index ix_mc_hash              on minh_chung (co_so_id, hash_tep);
create index ix_lua_chon_tra_cuu     on lua_chon_tu_danh_gia (co_so_id, nam_hoc_id, cap_hoc);
create index ix_mct_tieu_chi         on minh_chung_tieu_chi (tieu_chi_id);

-- =====================================================================
-- PHẦN G. DỮ LIỆU MỒI — KHUNG THÔNG TƯ 57
-- Tên đầy đủ của 15 tiêu chí lấy từ Phụ lục của Thông tư 57, nhập sau.
-- 8 tiêu chí bắt buộc đã đánh dấu sẵn ở đây.
-- =====================================================================

insert into bo_tieu_chuan (ma_van_ban, ten, ngay_hieu_luc, loai_hinh)
values ('57/2026/TT-BGDĐT',
        'Quy định về bảo đảm chất lượng giáo dục và công nhận đạt chuẩn quốc gia',
        '2026-07-07', 'pho_thong');

insert into tieu_chuan (bo_id, so_thu_tu, ten)
select id, x.stt, x.ten from bo_tieu_chuan,
  (values (1,'Quản trị nhà trường và bảo đảm chất lượng'),
          (2,'Phát triển đội ngũ'),
          (3,'Thực hiện chương trình, đổi mới phương pháp giáo dục và phát triển người học'),
          (4,'Điều kiện giáo dục, môi trường an toàn và phối hợp xã hội')
  ) as x(stt,ten)
where ma_van_ban = '57/2026/TT-BGDĐT';

insert into tieu_chi (tieu_chuan_id, ma, ten, la_bat_buoc, so_thu_tu)
select tc.id, x.ma, '(chờ nhập từ Phụ lục Thông tư 57)', x.bb, x.stt
from tieu_chuan tc
join bo_tieu_chuan b on b.id = tc.bo_id and b.ma_van_ban = '57/2026/TT-BGDĐT'
join (values
  (1,'1.1',false,1),(1,'1.2',false,2),(1,'1.3',true,3),(1,'1.4',true,4),
  (2,'2.1',true,1),(2,'2.2',true,2),(2,'2.3',false,3),
  (3,'3.1',true,1),(3,'3.2',true,2),(3,'3.3',false,3),(3,'3.4',false,4),(3,'3.5',false,5),
  (4,'4.1',true,1),(4,'4.2',true,2),(4,'4.3',false,3)
) as x(so_tc,ma,bb,stt) on x.so_tc = tc.so_thu_tu;

-- Từ điển loại minh chứng: nạp từ data/loai-minh-chung.json.

-- =====================================================================
-- GHI CHÚ CUỐI: CƠ CHẾ THƯ VIỆN TỰ LỚN LÊN
--
-- menh_de_trang_thai.co_so_id cho phép mỗi trường tạo mệnh đề riêng.
-- Định kỳ rà soát: nếu một mệnh đề riêng xuất hiện ở trên 10 trường, đó là
-- tín hiệu thư viện gốc còn thiếu — đưa vào thư viện dùng chung ở phiên bản sau.
--
-- Sau ba năm và một trăm trường, thư viện này là thứ không ai dựng lại được
-- trong một sớm một chiều. Nó là hàng rào cạnh tranh bền hơn mã nguồn rất nhiều.
-- =====================================================================
