# Bản đồ giao diện — demo ↔ dữ liệu ↔ ứng dụng thật

PDT-EDUQA-2026-M09 · Đọc kèm khi mở `index.html`

---

## 1. Bố cục ba cột

```
┌──────────────────┬────────────────────────────┬──────────────────┐
│ CỘT TRÁI         │ CỘT GIỮA — vùng làm việc   │ CỘT PHẢI         │
│                  │                            │                  │
│ Cây tiêu chí     │ Nội hàm 1 «trích nguyên    │ Xem trước đoạn   │
│ ✓ 1.1  Đủ        │  văn quy định»             │ văn đang được    │
│ ⚠ 1.2  Thiếu MC  │                            │ sinh ra          │
│ ● 1.3  Đang làm  │ ☑ Mệnh đề a   [nhóm 1]     │ (cập nhật ngay   │
│ ○ 1.4  Chưa      │   → đã gắn MC.1.3.01 ✓     │  khi tick)       │
│                  │ ☑ Mệnh đề b   [nhóm 2]     │ ─────────────    │
│ ─────────────    │   → QĐ số [___] ngày [___] │ Cảnh báo:        │
│ Độ đặc thù       │   → ⚠ chưa gắn minh chứng  │ • Nội hàm 2 chưa │
│ 6/15 tiêu chí    │ ☐ Mệnh đề c   [nhóm 4]     │   khai           │
│ 3/8 bắt buộc     │ ☐ Chưa có — cần cải tiến   │ • Mệnh đề b thiếu│
│                  │ ☐ Nội dung khác...         │   minh chứng     │
└──────────────────┴────────────────────────────┴──────────────────┘
```

Điểm gãy đáp ứng trong demo: `1240px` (cột phải xuống dưới), `860px` (một cột).

---

## 2. Bảy quyết định giao diện — và lý do

| # | Quyết định | Lý do |
|---|---|---|
| 1 | **Trích dẫn nguyên văn quy định luôn hiển thị ngay trên các ô tick**, không giấu vào "xem thêm" | Người dùng phải đọc yêu cầu trước khi chọn. Đây là chỗ dạy người dùng hiểu nội hàm — mục tiêu sâu xa nhất của sản phẩm |
| 2 | **Nhãn nhóm từ khóa hiển thị công khai** (nhóm 1–5, mỗi nhóm một màu) | Sau vài lần dùng, tổ trưởng tự nhận ra "trường mình luôn trống nhóm 4 và nhóm 5". Đó là khoảnh khắc học được nhiều nhất |
| 3 | **Xem trước cập nhật tức thì** | Cảm giác "mình vừa viết được một câu báo cáo" là động lực mạnh hơn mọi hướng dẫn |
| 4 | **Ô chưa mở khóa hiển thị mờ kèm lý do cụ thể**, không ẩn đi | "Cần gắn 1 quyết định phê duyệt của cấp có thẩm quyền để mở" — người dùng biết chính xác phải đi tìm gì. Đây là chỗ ứng dụng dạy nghề cho nhà trường |
| 5 | **Mệnh đề KHÔNG ĐẠT trình bày trung tính** — không màu đỏ, không biểu tượng cảnh báo, kèm dòng "Ghi nhận trung thực" | Nếu tick vào ô "chưa có" mà bị phần mềm nhìn như phạm lỗi, người dùng sẽ không bao giờ tick nữa — và ta mất toàn bộ giá trị chẩn đoán |
| 6 | **Hiện tên người tick ngay cạnh mỗi ô đã chọn** | Không phải để giám sát, mà để mỗi lựa chọn thành hành vi có trách nhiệm. Người đứng đầu chịu trách nhiệm pháp lý — trách nhiệm đó cần có địa chỉ ở từng dòng |
| 7 | **Không có nút "chọn tất cả"** | Có chủ đích. Nút đó hủy hoại toàn bộ ý nghĩa của module |

Quyết định 5, 6, 7 là **ràng buộc sản phẩm**, không phải gợi ý thẩm mỹ. Đừng bỏ khi rút gọn phạm vi.

---

## 3. Bảng đối chiếu: demo ↔ ứng dụng thật

| Trong demo | Trong ứng dụng thật |
|---|---|
| Hằng số `DATA` trong `index.html` | Truy vấn `bo_tieu_chuan → tieu_chuan → tieu_chi → noi_ham → menh_de_trang_thai` |
| Đối tượng `S` trong bộ nhớ | Bảng `lua_chon_tu_danh_gia` + `lua_chon_minh_chung` |
| Nút **Gắn minh chứng** (mô phỏng, gắn ngay) | Hộp thoại chọn tệp từ kho minh chứng, lọc theo `menh_de_loai_mc`, kiểm hiệu lực và trùng lặp |
| `mcCode()` sinh mã từ chỉ số mảng | `fn_sinh_ma_minh_chung()`, chỉ cấp mã ở tiêu chí gốc |
| `unlocked()` kiểm 2 điều kiện | `fn_tinh_trang_thai_khoa()` kiểm 3 điều kiện (thêm: đúng loại, còn hiệu lực) + K3 + K4 |
| `runAI()` biến đổi chuỗi cục bộ | Gọi mô hình ngôn ngữ với prompt ở `03-QUY-TAC-NGHIEP-VU.md` mục 3 |
| Phép so khớp Lớp 4 trong `runAI()` | **Giữ nguyên logic**, chuyển sang máy chủ; không để chạy ở trình duyệt |
| Không có đăng nhập | RLS theo `co_so_id`, ghi `nguoi_chon_id` |
| Không có lưu trữ | Lưu sau mỗi thay đổi, có nhật ký thay đổi mức |

**Điều quan trọng nhất:** demo cố ý **không** dùng `localStorage`. Mọi trạng thái mất khi tải lại trang. Đó là chủ ý — không ai được nhầm bản demo với sản phẩm.

---

## 4. Các hàm chính trong `index.html`

Đọc theo thứ tự này sẽ hiểu nhanh nhất:

| Hàm | Dòng khoảng | Việc |
|---|---|---|
| `DATA` | đầu `<script>` | Thư viện từ khóa. Đã tách sang `data/tu-khoa.mau.json` |
| `mcNeeded` / `filled` / `unlocked` | ~ giữa | **Khóa K1 + K2**. Đây là 3 dòng quan trọng nhất của cả tệp |
| `sentence` | tiếp theo | **Lớp 1** — điền slot, ô trống thành nhãn cảnh báo, không bịa |
| `paragraphs` | tiếp theo | Ghép theo thứ tự nội hàm; bỏ qua nội hàm chưa khai |
| `renderBody` | dài nhất | Dựng cột giữa |
| `refreshMd` | sau `renderBody` | Cập nhật tại chỗ khi gõ, để con trỏ không nhảy — **bẫy đã gặp**, xem mục 6 |
| `specificity` / `renderSpec` | tiếp theo | Chỉ số Độ đặc thù |
| `renderPane` | tiếp theo | Ba tab bên phải: Mô tả hiện trạng / Điểm yếu / Phiếu nội hàm |
| `runAI` | gần cuối | **Lớp 3 + Lớp 4**, gồm cả cơ chế mô phỏng phá hoại |

Demo viết bằng JavaScript thuần, không khung, để đọc được không cần cài gì. Khi code thật nên tách component; **giữ nguyên tên hàm nghiệp vụ** để đối chiếu tài liệu dễ hơn.

---

## 5. Hệ màu và ý nghĩa

Màu ở đây **mang thông tin**, không phải trang trí. Giữ nguyên ánh xạ khi làm lại giao diện.

| Vai trò | Biến CSS | Ý nghĩa |
|---|---|---|
| Nhóm 1 Tồn tại | `--g1` xanh lá trầm | |
| Nhóm 2 Quy trình | `--g2` xanh lam | |
| Nhóm 3 Thực hiện | `--g3` vàng đất | |
| Nhóm 4 Rà soát | `--g4` cam gạch | chỗ trượt nhiều nhất |
| Nhóm 5 Cải tiến | `--g5` tím | cửa vào mức cao |
| Khóa chưa mở | `--lock` hổ phách | **cố ý không dùng đỏ** — chưa đủ điều kiện không phải là lỗi |
| Mệnh đề KHÔNG ĐẠT | `--plum` tím mận | **cố ý không dùng đỏ** — trung thực không phải là sai phạm |
| Đã mở khóa | `--ok` xanh lục | |
| Cảnh báo thật | `--warn` đỏ gạch | chỉ dùng cho nội hàm rỗng và tiêu chí bắt buộc chưa đạt |

Giao diện hỗ trợ cả nền sáng và nền tối qua biến CSS ở `:root`, `@media (prefers-color-scheme: dark)` và `[data-theme]`.

Phông chữ: **Be Vietnam Pro** cho giao diện (bộ chữ Việt đầy đủ), **Noto Serif** cho đoạn văn bản báo cáo — để phần xem trước trông giống một văn bản thật, không giống một ô nhập liệu.

---

## 6. Hai bẫy kỹ thuật đã gặp khi làm demo

**Bẫy 1 — con trỏ nhảy khi gõ.** Ban đầu mỗi lần `input` đều dựng lại toàn bộ DOM, khiến ô đang gõ bị tháo khỏi cây và mất tiêu điểm. Cách xử lý: `refreshMd(id)` cập nhật **tại chỗ** trạng thái của đúng mệnh đề đó (bật/tắt checkbox, lớp `.miss` của ô trống, nhãn "đã khai / chưa khai" của nội hàm), chỉ dựng lại cột phải. Khi code thật bằng React/Vue thì vấn đề này tự hết, nhưng logic phân tách vẫn dùng lại được.

**Bẫy 2 — báo lỗi giả ở Lớp 4.** Bản trước và bản sau ban đầu được dựng từ hai khuôn khác nhau: bản sau có nhãn "Mức 1:", bản trước không. Chữ số trong nhãn lọt vào tập số liệu, khiến phép so khớp báo lệch dù AI không đổi gì. Cách xử lý: cả hai bản đi qua **cùng một hàm bọc** trước khi so khớp. Đây là loại lỗi rất dễ tái phát khi thêm định dạng mới — viết kiểm thử tự động cho nó.

---

## 7. Việc nên làm ngay khi bắt đầu code

1. Chạy `docs/02-SCHEMA-CSDL.sql` trên một cơ sở dữ liệu trống.
2. Nạp `data/loai-minh-chung.json` vào bảng `loai_minh_chung`.
3. Nạp `data/tu-khoa.mau.json` vào `noi_ham` + `menh_de_trang_thai` + `menh_de_loai_mc` — viết một script nạp, vì sẽ dùng lại nhiều lần khi chuyên gia bổ sung thư viện.
4. Viết kiểm thử tự động cho `fn_tinh_trang_thai_khoa` với ít nhất 6 tình huống: đủ · thiếu minh chứng · sai loại minh chứng · minh chứng hết hiệu lực · thiếu ô dữ liệu · mệnh đề KHÔNG ĐẠT (luôn mở).
5. Dựng màn hình tick trước, chưa cần AI.

Nếu đến hết bước 5 mà chưa sinh ra được một đoạn Mô tả hiện trạng hoàn chỉnh từ dữ liệu thật, **dừng lại rà soát phạm vi** thay vì đi tiếp.
