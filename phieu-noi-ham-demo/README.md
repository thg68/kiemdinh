# Phiếu nội hàm tiêu chí — gói bàn giao cho lập trình viên

**Cơ chế từ khóa nội hàm cho ứng dụng kiểm định chất lượng giáo dục theo Thông tư 57/2026/TT-BGDĐT**

PDT Academy · ThS. Phùng Danh Tú · Mã tài liệu: PDT-EDUQA-2026-M09
Bản demo gốc: https://claude.ai/code/artifact/25f88fb0-88f2-4801-a2d1-b59813ca8885

---

## Đọc gì trước

| Bạn là | Đọc theo thứ tự |
|---|---|
| Lập trình viên bắt tay vào code | README này → `docs/03-QUY-TAC-NGHIEP-VU.md` → `docs/02-SCHEMA-CSDL.sql` → mở `index.html` |
| Người thiết kế giao diện | README này → mở `index.html` → `docs/04-BAN-DO-UI.md` |
| Người phụ trách nội dung chuyên môn | `THU-VIEN-TU-KHOA-NOI-HAM-MAU.xlsx` → `docs/01-DAC-TA-HE-TU-KHOA.md` phần VII |
| Người quyết định phạm vi | `docs/01-DAC-TA-HE-TU-KHOA.md` phần 0 và phần VIII |

**Mở `index.html` bằng trình duyệt là chạy được ngay** — không cần cài gì, không cần máy chủ. Hãy nghịch nó khoảng 5 phút trước khi đọc tài liệu; hiểu cơ chế bằng tay nhanh hơn đọc chữ.

Ba việc nên thử trong bản demo:

1. Ở tiêu chí 1.1, bấm **Gắn minh chứng** rồi điền các ô — ô tick mới mở ra được. Đó là cơ chế khóa.
2. Chuyển sang tiêu chí 1.4, xem mệnh đề gắn nhãn **khóa nghiêm ngặt** ở Mức 2 — nó đòi cặp số liệu hai mốc thời gian.
3. Tick vài ô rồi bấm **Làm mượt văn phong**; sau đó bật ô **Mô phỏng AI tự thêm lời đánh giá** và bấm lại — xem lớp kiểm tra từ chối bản biên tập.

---

## Vấn đề đang giải

Khi tự đánh giá, nhà trường phải viết mục "Mô tả hiện trạng" cho từng tiêu chí. Quy trình đúng theo Công văn 5932/BGDĐT-QLCL gồm 5 bước:

```
(1) Tách từ khóa → (2) Xác định nội hàm → (3) Đặt câu hỏi kiểm chứng
                            ↓
     (5) Viết mô tả hiện trạng ← (4) Tìm và mã hóa minh chứng
```

Thực tế nhà trường bỏ bước 1–3 và bắt đầu từ bước 5 bằng cách mượn báo cáo trường khác. Kết quả là báo cáo hình thức, không bám minh chứng thật.

**Ứng dụng này không làm cho việc viết báo cáo nhanh hơn. Nó làm cho việc viết báo cáo mà không có căn cứ trở nên bất khả thi.** Mọi quyết định kỹ thuật trong gói này đều phục vụ mục tiêu đó — nếu một tính năng làm cho việc khai khống dễ hơn, tính năng đó sai.

---

## Cơ chế trong 6 câu

1. Mỗi **tiêu chí** được bóc thành nhiều **nội hàm** (yêu cầu nhỏ nhất, độc lập, kiểm chứng được).
2. Mỗi nội hàm có 3–5 **mệnh đề trạng thái** — câu khẳng định trọn vẹn về nhà trường, là cái mà người dùng tick.
3. Mỗi mệnh đề có **khóa minh chứng** (phải gắn đúng loại tài liệu) và **ô dữ liệu riêng** (số văn bản, ngày, số liệu). Chưa đủ hai thứ đó thì ô tick không mở.
4. Tick xong, hệ thống **ghép mẫu câu** thành đoạn văn có mã minh chứng — thuần toán, không có AI.
5. AI chỉ được **làm mượt văn phong** ở lớp sau cùng, và bị kiểm tra bằng máy: mã minh chứng và số liệu trước/sau phải trùng khớp 100%.
6. Mọi nội hàm chưa khai được và mọi mệnh đề "chưa có" tự động thành **Điểm yếu** và sinh dòng nháp trong **Kế hoạch cải tiến**.

---

## Nội dung gói

```
phieu-noi-ham-demo/
├── README.md                          ← bạn đang đọc
├── index.html                         ← demo chạy được, mở trực tiếp bằng trình duyệt
├── docs/
│   ├── 01-DAC-TA-HE-TU-KHOA.md        ← tài liệu đặc tả đầy đủ (29 trang)
│   ├── 02-SCHEMA-CSDL.sql             ← DDL PostgreSQL: 6 bảng, ràng buộc, RLS, hàm sinh mã
│   ├── 03-QUY-TAC-NGHIEP-VU.md        ← 4 khóa cứng, thuật toán 4 lớp, prompt AI, phép so khớp
│   └── 04-BAN-DO-UI.md                ← bản đồ giao diện ↔ dữ liệu, cái gì trong demo là mô phỏng
├── data/
│   ├── tu-khoa.mau.json               ← dữ liệu demo tách khỏi HTML, import thẳng được
│   ├── tu-khoa.schema.json            ← JSON Schema mô tả cấu trúc thư viện từ khóa
│   └── loai-minh-chung.json           ← từ điển 20 loại minh chứng và quy tắc kiểm tra
└── THU-VIEN-TU-KHOA-NOI-HAM-MAU.xlsx  ← bảng để chuyên gia điền nội dung, 22 mệnh đề mẫu
```

---

## Công nghệ đề xuất

| Lớp | Lựa chọn | Ghi chú |
|---|---|---|
| Cơ sở dữ liệu | PostgreSQL (Supabase) | `docs/02-SCHEMA-CSDL.sql` chạy thẳng được |
| Xác thực, lưu tệp | Supabase Auth + Storage | signed URL, không dùng liên kết công khai vĩnh viễn |
| Giao diện | Next.js (App Router) + TypeScript + Tailwind | Demo viết bằng JS thuần để dễ đọc; khi code thật nên tách component |
| Sinh tài liệu | `docx` (Node) hoặc `python-docx` | Xuất Mẫu 1, Mẫu 2 theo Thông tư 57 |
| AI | Chỉ dùng ở Lớp 3, xem `docs/03` | Không có endpoint nào cho phép AI sinh nội dung khi chưa có minh chứng |

Đây là đề xuất, không bắt buộc. Điều **bắt buộc** là 5 ràng buộc bất biến ở mục dưới.

---

## Năm ràng buộc bất biến — không được vi phạm dù đổi công nghệ gì

1. **Bộ tiêu chuẩn, nội hàm, mệnh đề nằm trong bảng dữ liệu có phiên bản.** Tuyệt đối không cứng hóa 15 tiêu chí vào mã nguồn. Thông tư sẽ thay đổi.
2. **Minh chứng và tiêu chí là quan hệ nhiều–nhiều.** Một tệp có một mã duy nhất, dùng lại cho mọi tiêu chí phù hợp. **Không bao giờ nhân bản tệp theo tiêu chí.** Đây là quy định của Thông tư 57, không phải sở thích thiết kế.
3. **Bốn khóa cứng cài ở tầng cơ sở dữ liệu, không chỉ ẩn nút trên giao diện.** Ẩn nút là trang trí, không phải ràng buộc.
4. **Không có endpoint nào sinh nội dung báo cáo khi chưa có minh chứng.** Nếu có, sản phẩm sẽ bị gắn nhãn "công cụ làm đẹp hồ sơ" và mất uy tín vĩnh viễn.
5. **Dữ liệu cá nhân của học sinh không được gửi ra bất kỳ dịch vụ bên ngoài nào**, kể cả API của AI. Hồ sơ tư vấn tâm lý, hồ sơ bạo lực học đường, hồ sơ trẻ khuyết tật chỉ lưu **chỉ mục** (có tồn tại, ai giữ, ở đâu, ngày nào), không lưu nội dung.

---

## Thứ tự triển khai đề xuất

| Giai đoạn | Làm gì | Vì sao thứ tự này |
|---|---|---|
| 1 | Schema + nhập thư viện từ khóa + kho minh chứng **có phân loại** | Không phân loại minh chứng thì khóa K1 vô nghĩa và cả cơ chế sụp đổ |
| 2 | Màn hình tick + sinh câu Lớp 1 + kiểm ràng buộc Lớp 2 | Đây là toàn bộ giá trị lõi, **chưa cần AI** |
| 3 | Xuất báo cáo và Phiếu xác định nội hàm | Phiếu nội hàm gần như miễn phí vì dữ liệu đã có sẵn |
| 4 | Chạy thật ở một trường, đo chỉ số Độ đặc thù | Có số liệu thật trước khi thêm AI |
| 5 | Thêm Lớp 3 (AI làm mượt) và Lớp 4 (so khớp) | Để cuối cùng |

**Khuyến nghị mạnh: đừng làm AI trước.** Một sản phẩm chạy đúng mà chưa có AI dễ bảo vệ trước cơ quan quản lý hơn rất nhiều. Nếu làm ngược, khi có sự cố sẽ không biết lỗi nằm ở cơ chế từ khóa hay ở AI.

---

## Điều cần biết về dữ liệu trong gói này

Nội hàm và trích dẫn quy định trong `data/tu-khoa.mau.json` lấy **nguyên văn từ Hướng dẫn 1816/SGDĐT-GDTrH ngày 26/7/2019 của Sở GDĐT Quảng Ninh**, tức là theo bộ tiêu chuẩn cũ của Thông tư 18/2018/TT-BGDĐT. Đây là nguồn duy nhất có sẵn ghi rõ nội hàm từng chỉ báo, dùng để **trình diễn phương pháp**.

Bộ tiêu chuẩn đích là Thông tư 57/2026/TT-BGDĐT: **4 tiêu chuẩn, 15 tiêu chí, 2 mức**, trong đó 8 tiêu chí bắt buộc là **1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2**. Nội dung chi tiết của 15 tiêu chí nằm trong Phụ lục của Thông tư 57 và cần được nhập vào trước khi chạy thật.

Cấu trúc dữ liệu **không đổi** giữa hai bộ tiêu chuẩn — đó chính là lý do bảng `bo_tieu_chuan` có phiên bản. Lập trình viên cứ code theo schema; phần nội dung do chuyên gia nhập sau.

---

## Ba điều đừng làm

1. **Đừng thêm nút "chọn tất cả".** Nút đó hủy hoại toàn bộ ý nghĩa của module.
2. **Đừng tô đỏ mệnh đề "chưa có".** Nếu tick vào ô trung thực mà bị phần mềm nhìn như phạm lỗi, người dùng sẽ không bao giờ tick nữa — và ta mất toàn bộ giá trị chẩn đoán. Trình bày trung tính, kèm dòng "Ghi nhận trung thực, nội dung này sẽ vào Kế hoạch cải tiến".
3. **Đừng dùng chỉ số Độ đặc thù để xếp hạng trường.** Thông tư 57 nói rõ việc xác định mức không nhằm chấm điểm, xếp hạng, tạo áp lực thành tích. Biến chỉ số này thành bảng xếp hạng là sinh ra một căn bệnh hình thức mới, tinh vi hơn cái cũ.

---

*Mọi số hiệu văn bản pháp lý trong gói này lấy từ tài liệu gốc do PDT Academy cung cấp. Trước khi đưa vào sản phẩm chính thức, cần đối chiếu lại với nguồn công bố chính thức.*
