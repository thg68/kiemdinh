# Quy tắc nghiệp vụ — tài liệu cài đặt

PDT-EDUQA-2026-M09 · Phụ lục kỹ thuật cho lập trình viên

Tài liệu này mô tả chính xác cái phải cài. Phần "vì sao" nằm ở `01-DAC-TA-HE-TU-KHOA.md`; ở đây chỉ có quy tắc và mã giả.

---

## 1. Bốn khóa cứng

Cả bốn khóa **phải cài ở tầng cơ sở dữ liệu**, không chỉ ở giao diện. Xem `02-SCHEMA-CSDL.sql`, hàm `fn_tinh_trang_thai_khoa` và trigger `tg_chan_tick`.

### K1 — Khóa minh chứng

```
Mệnh đề mở  ⟺  số minh chứng ĐÃ GẮN, ĐÚNG LOẠI, CÒN HIỆU LỰC  ≥  so_luong_mc_toi_thieu
```

Ba điều kiện, thiếu một là không mở:

| Điều kiện | Kiểm thế nào | Bỏ qua thì hỏng gì |
|---|---|---|
| Đã gắn | có bản ghi trong `lua_chon_minh_chung` | — |
| Đúng loại | `minh_chung.loai_mc_id` nằm trong `menh_de_loai_mc` của mệnh đề | Người dùng gắn tệp bất kỳ cho qua khóa — **cơ chế sụp đổ** |
| Còn hiệu lực | `ngay_het_gia_tri is null or >= current_date` | Trường dùng quyết định nhiệm kỳ cũ |

Với loại minh chứng có `phai_do_cap_tren_ban_hanh = true`, kiểm thêm: `minh_chung.co_quan_ban_hanh` phải khác tên nhà trường. Đây là chỗ bắt lỗi phổ biến nhất — trường tự ban hành chiến lược rồi coi như đã được phê duyệt.

### K2 — Khóa dữ liệu riêng

```
Mệnh đề mở  ⟺  mọi khóa trong truong_du_lieu đều có giá trị không rỗng trong du_lieu_nhap
```

Đây là thứ chống đồng phục hóa báo cáo. Hai trường tick giống hệt nhau vẫn ra hai đoạn văn khác nhau vì số quyết định và ngày tháng không thể giống.

Giao diện phải **tô cảnh báo đúng ô còn trống**, không hiện thông báo chung chung.

### K3 — Khóa tuần tự

```
Mệnh đề thuộc Mức 2 chỉ mở khi mọi nội hàm BẮT BUỘC của Mức 1 (cùng tiêu chí)
đã có ít nhất một mệnh đề không mang cờ KHÔNG ĐẠT được chọn.
```

Đúng quy định đánh giá tuần tự của Thông tư 57: chỉ xem xét mức tiếp theo khi mức trước đã đạt. Hàm `fn_muc_1_da_du` trong tệp SQL.

### K4 — Khóa cải tiến (nghiêm ngặt nhất)

```
Mệnh đề có nhom_tu_khoa = 5 chỉ mở khi:
   K1 và K2 đã thỏa
   VÀ có đủ cặp {giá trị trước, mốc trước, giá trị sau, mốc sau}
   VÀ giá trị trước ≠ giá trị sau
   VÀ mốc trước ≠ mốc sau
   VÀ cả hai giá trị đều chứa số
```

**Đây là cơ chế chặn việc đề xuất Mức 2 bằng lời khen.** Thông tư 57 quy định Mức 2 là "đáp ứng yêu cầu **và có minh chứng về kết quả cải tiến chất lượng**" — tức là phải chứng minh đã thay đổi và thay đổi có kết quả, không phải làm tốt hơn Mức 1.

Nếu cài lỏng khóa này, toàn bộ giá trị của sản phẩm mất. Đừng thỏa hiệp vì người dùng kêu khó.

---

## 2. Năm nhóm từ khóa

Mọi nội hàm rơi vào đúng một nhóm. Nhóm quyết định: câu hỏi kiểm chứng, loại minh chứng khóa, khuôn câu sinh ra.

| Nhóm | Tên | Dấu hiệu trong văn bản | Minh chứng khóa | Kiểm tra thêm |
|---|---|---|---|---|
| 1 | Tồn tại | *có*, *được thành lập*, *có đủ* | văn bản gốc | hạn hiệu lực |
| 2 | Quy trình | *theo quy định*, *cấp có thẩm quyền phê duyệt* | quyết định của cấp trên | cơ quan ban hành ≠ nhà trường |
| 3 | Thực hiện | *tổ chức thực hiện*, *đầy đủ*, *đúng tiến độ* | kế hoạch **+** kết quả **+** số liệu | đủ bộ ba, thiếu một là không mở |
| 4 | Rà soát | *định kỳ rà soát*, *giám sát*, *hằng năm đánh giá* | biên bản **có ngày tháng** | **đếm số lần**, so với tần suất quy định |
| 5 | Cải tiến | *chuyển biến tích cực*, *có minh chứng về kết quả cải tiến* | cặp số liệu hai mốc | khóa K4 |

**Nhóm 4 là chỗ nhà trường trượt nhiều nhất.** Không cho nhập "định kỳ hằng năm"; bắt nhập ngày của **từng lần** và hệ thống tự đếm. Thông tư 57 yêu cầu giám sát nội bộ **tối thiểu 2 lần/năm học** (cuối học kỳ I và cuối năm học) — con số này kiểm đếm được bằng máy, nên phải có đồng hồ đếm ngược và cảnh báo chủ động: *"Đã hết học kỳ I, chưa ghi nhận lần giám sát nội bộ nào."*

---

## 3. Thuật toán sinh báo cáo — bốn lớp

```
Nhà trường tick + nhập dữ liệu riêng + gắn minh chứng
                    │
   LỚP 1 — GHÉP KHUNG            thuần toán, KHÔNG có AI
                    │
   LỚP 2 — KIỂM RÀNG BUỘC        thuần toán, KHÔNG có AI
        │ thiếu → DỪNG, để trống ô, hiện cảnh báo cụ thể
        │ đủ ↓
   LỚP 3 — LÀM MƯỢT VĂN PHONG    chỗ DUY NHẤT có AI
                    │
   LỚP 4 — SO KHỚP TỰ ĐỘNG       thuần toán, KHÔNG có AI
        │ lệch → hủy bản AI, dùng bản Lớp 1
                    ↓
   Con người đọc, sửa, ký duyệt — bản cuối luôn thuộc về con người
```

**Ứng dụng không có nút "AI viết báo cáo". Ứng dụng có nút "sinh báo cáo từ những gì nhà trường đã khai và đã chứng minh."** Sự khác biệt câu chữ này phản ánh một khác biệt thật về kiến trúc, và nó là thứ bảo vệ sản phẩm trước Hội đồng thẩm định.

### Lớp 1 — ghép khung

```
HÀM ghep_mo_ta_hien_trang(tieu_chi, muc, nam_hoc, cap_hoc):
  doan = []
  VỚI MỖI noi_ham THEO so_thu_tu:
      cac_menh_de = các mệnh đề đã tick VÀ đã mở khóa thuộc nội hàm này
      NẾU rỗng:
          ghi cảnh báo "Nội hàm «...» chưa được khai"
          BỎ QUA — KHÔNG BỊA
      VỚI MỖI menh_de:
          mau = chọn ngẫu nhiên 1 trong mau_cau[]     // tránh đồng phục hóa
          cau = điền slot {ten_bien} từ du_lieu_nhap
          cau = cau + " " + chuỗi mã minh chứng đã gắn
          doan.thêm(cau)
  TRẢ VỀ doan, mỗi nội hàm một xuống dòng
```

Chọn ngẫu nhiên mẫu câu nhưng **ghi nhớ theo từng cơ sở** để một trường không dùng lẫn lộn nhiều văn phong giữa các lần sinh.

### Quy ước trình bày mã minh chứng

- Mã đặt **sau** nhận định.
- Nhiều mã cho một nhận định: đặt liền nhau, cách nhau bằng dấu chấm phẩy — đúng hướng dẫn Công văn 5932.
- **Hai bộ tiêu chuẩn dùng hai quy ước khác nhau.** Đọc `bo_tieu_chuan.quy_uoc_ma_minh_chung` để xuất đúng dạng:
  - Thông tư 57: `MC.(tiêu chuẩn).(tiêu chí).(số thứ tự)` → `MC.1.3.01`
  - Công văn 5932: `[H(hộp)-(tiêu chí)-(số thứ tự)]` → `[H1-1.1-01]`

Sai quy ước là Đoàn thẩm định nhận ra ngay.

### Lớp 3 — prompt cho AI

Đưa thẳng vào ứng dụng, không cần sửa:

```
Bạn là biên tập viên văn bản hành chính giáo dục Việt Nam.

NHIỆM VỤ DUY NHẤT: làm cho đoạn văn dưới đây đọc trôi chảy, đúng văn phong
báo cáo hành chính, tránh lặp từ. KHÔNG làm gì khác.

CẤM TUYỆT ĐỐI:
- Thêm bất kỳ thông tin, sự kiện, nhận định nào không có trong đoạn gốc.
- Thêm, bớt, hoặc sửa bất kỳ mã minh chứng nào.
- Thay đổi bất kỳ con số, ngày tháng, tỷ lệ nào.
- Thêm từ ngữ đánh giá mà đoạn gốc không có: "hiệu quả", "tích cực",
  "nổi bật", "vượt trội", "đáng ghi nhận", "thực chất", "chất lượng cao".
- Thay đổi kết luận đạt hay không đạt.

NẾU đoạn gốc có chỗ chưa đầy đủ hoặc mâu thuẫn: GIỮ NGUYÊN và ghi chú
ở cuối bằng dòng bắt đầu bằng "[LƯU Ý BIÊN TẬP]". Không tự ý bù đắp.

Trả về duy nhất đoạn văn đã biên tập, không giải thích.

ĐOẠN GỐC:
{cau_lop_1}
```

Nhiệt độ sinh vừa phải để có khác biệt tự nhiên ở tầng câu chữ mà không đụng nội dung.

### Lớp 4 — phép so khớp

Thực thi bằng mã, không thương lượng:

| Phép kiểm | Cách làm | Khi lệch |
|---|---|---|
| Mã minh chứng | trích bằng biểu thức chính quy từ bản trước và bản sau, so **tập hợp đã sắp xếp** | hủy bản AI |
| Số liệu | strip mã minh chứng trước, rồi trích mọi số, tỷ lệ, ngày tháng; so tập hợp | hủy bản AI |
| Từ ngữ đánh giá cấm | quét danh sách đen; có trong bản sau mà không có trong bản trước | hủy bản AI |
| Độ dài | bản sau dài hơn bản trước quá 40% | cảnh báo, để người dùng quyết |

Cài đặt tham khảo (xem thêm trong `index.html`, hàm `runAI`):

```js
const BANNED = ["hiệu quả","tích cực","nổi bật","vượt trội",
                "đáng ghi nhận","thực chất","chất lượng cao"];
const codesOf = t => (t.match(/MC\.\d+\.[\d.]+\.\d+/g) || []).sort();
const numsOf  = t => (t.replace(/MC\.\d+\.[\d.]+\.\d+/g," ")
                       .match(/\d+[,.]?\d*/g) || []).sort();
```

**Bẫy đã gặp khi làm demo:** nếu bản trước và bản sau được dựng từ hai khuôn khác nhau (một bản có nhãn "Mức 1:", bản kia không), chữ số trong nhãn sẽ lọt vào tập số liệu và gây báo lỗi giả. Hai bản phải đi qua **cùng một hàm bọc** trước khi so khớp.

Khi hủy bản AI, hiện thông báo trung thực: *"Bản biên tập tự động không đạt kiểm tra an toàn nội dung. Đang hiển thị bản ghép nguyên gốc."* Không im lặng thay thế.

---

## 4. Sinh các mục còn lại của Phiếu đánh giá tiêu chí

Công văn 5932 quy định Phiếu gồm 5 mục. Cả 5 đều sinh được từ cùng nguồn dữ liệu:

| Mục | Nguồn sinh |
|---|---|
| 1. Mô tả hiện trạng | mệnh đề đã tick, theo mục 3 |
| 2. Điểm mạnh | mệnh đề **nhóm 4 và nhóm 5** đã tick — chỗ trường không chỉ có mà còn soi lại và cải tiến được |
| 3. Điểm yếu | mệnh đề mang **cờ KHÔNG ĐẠT** đã tick **+** các nội hàm hoàn toàn chưa được khai |
| 4. Kế hoạch cải tiến | mỗi điểm yếu sinh một dòng nháp trong Mẫu 2, điền sẵn cột nội dung và cột minh chứng dự kiến |
| 5. Tự đánh giá | engine tính mức, chỉ chạy khi mọi nội hàm bắt buộc đã được khai |

**Giá trị lớn nhất ở mục 3 và 4.** Điểm yếu hiện nay thường viết chiếu lệ ("cơ sở vật chất còn khó khăn"). Khi sinh tự động từ những ô chưa tick được, nó cụ thể đến mức không thể viết chung chung — và Kế hoạch cải tiến có chỗ bám.

Người phụ trách, thời gian, nguồn lực trong Mẫu 2 **do con người điền**. Máy không được đoán.

---

## 5. Xuất Phiếu xác định nội hàm (Phụ lục 2 của Công văn 5932)

Sinh tự động và gần như miễn phí, vì mọi cột đã có sẵn:

| Cột Phụ lục 2 | Lấy từ |
|---|---|
| Tiêu chí | `tieu_chi` |
| Nội hàm | `noi_ham.noi_dung_noi_ham` |
| Các câu hỏi đặt ra | câu hỏi kiểm chứng của nhóm từ khóa (bảng ở mục 2) |
| Minh chứng cần thu thập | `menh_de_loai_mc` → `loai_minh_chung.ten` |
| Nơi thu thập | `loai_minh_chung.noi_thu_thap` |
| Ghi chú | `lua_chon_tu_danh_gia.trang_thai_khoa` |

**Hệ quả quan trọng:** phiếu nội hàm và báo cáo tự đánh giá **không thể mâu thuẫn nhau**, vì cùng sinh từ một nguồn. Mâu thuẫn giữa hai tài liệu này là một trong những điều Đoàn đánh giá ngoài hay phát hiện nhất.

---

## 6. Màn hình cho Đoàn đánh giá ngoài — bảng đối chiếu ba chiều

Màn hình chỉ đọc, hiển thị: *nội hàm — câu trong báo cáo — mã minh chứng viện dẫn — trạng thái*.

Ba tình huống hệ thống tự phát hiện:

| Trạng thái | Nghĩa là | Truy vấn |
|---|---|---|
| **Nội hàm rỗng** | có yêu cầu nhưng không câu nào phục vụ | `noi_ham` không có `lua_chon` nào `duoc_chon` |
| **Câu không neo** | có nhận định nhưng không có mã minh chứng | `cau_sinh_ra.ma_mc_su_dung = '{}'` và mệnh đề không mang cờ KHÔNG ĐẠT |
| **Mã treo** | có mã nhưng tệp không tồn tại, hết hiệu lực, sai loại | kiểm `minh_chung.duong_dan`, `ngay_het_gia_tri`, `loai_mc_id` |

**Nội hàm rỗng là lỗi nghiêm trọng nhất và khó phát hiện nhất bằng mắt người**, vì báo cáo vẫn đọc trôi chảy.

Màn hình này **không kết luận thay Đoàn**, chỉ chỉ ra chỗ cần xem. Quyền kết luận thuộc Hội đồng thẩm định và Giám đốc Sở.

---

## 7. Chỉ số Độ đặc thù

Công thức trong `fn_do_dac_thu` (tệp SQL):

| Thành phần | Đo | Trọng số |
|---|---|---|
| Tỷ lệ câu có dữ liệu riêng | câu chứa số văn bản / ngày / số liệu ÷ tổng số câu | 30% |
| Tỷ lệ nội hàm được khai | nội hàm có ≥1 mệnh đề đã tick ÷ tổng nội hàm | 30% |
| Độ phủ nhóm từ khóa | số nhóm có mặt ÷ 5 | 20% |
| Tỷ lệ minh chứng còn hiệu lực | MC còn hiệu lực ÷ tổng MC viện dẫn | 20% |

Diễn giải: **< 40%** báo cáo chỉ liệt kê sự tồn tại · **40–70%** có cơ sở nhưng mỏng ở nhóm rà soát và cải tiến · **> 70%** có dữ liệu thật.

**Ràng buộc đạo đức phải cài vào sản phẩm:** không có API nào trả về bảng xếp hạng các trường theo chỉ số này. Thông tư 57 nói rõ việc xác định mức không nhằm chấm điểm, xếp hạng, tạo áp lực thành tích. Nếu chỉ số bị biến thành bảng xếp hạng, các trường sẽ tối ưu chỉ số thay vì tối ưu thực chất — sinh ra một căn bệnh hình thức mới, tinh vi hơn cái cũ.

---

## 8. Chống rủi ro "tick-box cũng thành hình thức"

Đây là rủi ro nghiêm trọng nhất do chính cơ chế này sinh ra. Kịch bản xấu: thư ký tick hết những ô nghe có vẻ đúng, gắn đại minh chứng cho qua khóa, bấm sinh báo cáo — **ta đã công nghiệp hóa căn bệnh thay vì chữa nó**.

Bốn biện pháp phải cài:

1. **K1 kiểm đúng loại, không chỉ kiểm có tệp.** Kéo theo: minh chứng khi tải lên **bắt buộc phải phân loại**. Đây là thay đổi phạm vi cần quyết sớm, vì nó chạm vào module kho minh chứng.
2. **Ghi tên người tick, hiển thị công khai** trong Phiếu và báo cáo nội bộ. Tick trở thành lời khẳng định có chủ thể.
3. **Cảnh báo mẫu hình bất thường**: một tiêu chí có toàn bộ mệnh đề được tick trong dưới 2 phút → hiện nhắc nhẹ, **không chặn**: *"Tiêu chí này được hoàn thành rất nhanh. Thầy/cô có muốn xem lại phần nội hàm trước khi chuyển sang tiêu chí tiếp theo không?"*
4. **Chỉ số Độ đặc thù hiển thị liên tục** như một cái gương. Tick bừa cho chỉ số thấp ngay lập tức vì thiếu dữ liệu riêng.

Nói thẳng: không biện pháp kỹ thuật nào chữa được sự thiếu trung thực nếu người đứng đầu không muốn làm thật. Phần mềm chỉ làm cho việc làm thật **dễ hơn** việc làm giả.

---

## 9. Bảo mật dữ liệu nhạy cảm

Loại minh chứng có `du_lieu_do = true` (hồ sơ tư vấn tâm lý, bạo lực học đường, trẻ khuyết tật, sự cố an toàn):

- **Chỉ lưu chỉ mục**: có tồn tại, ai giữ, ở đâu, ngày nào. **Không lưu nội dung** trong ứng dụng.
- **Không bao giờ gửi qua bất kỳ API AI nào**, kể cả Lớp 3. Trước khi gọi AI, kiểm và chặn.
- Nhật ký truy cập đầy đủ cho mọi thao tác đọc/ghi.
- Mã hóa tệp khi lưu; liên kết có thời hạn (signed URL), không dùng liên kết công khai vĩnh viễn.

Vẫn đủ để chứng minh tiêu chí, mà giảm hẳn rủi ro pháp lý.

---

## 10. Danh sách kiểm trước khi coi là xong

- [ ] Bốn khóa cài ở tầng CSDL, kiểm chứng bằng 2 tài khoản khác đơn vị
- [ ] Không có endpoint nào sinh nội dung khi chưa có minh chứng
- [ ] Minh chứng bắt buộc phân loại khi tải lên
- [ ] Một tệp chỉ có một mã, dùng cho nhiều tiêu chí, không nhân bản
- [ ] Lớp 4 chạy đúng cả hai chiều: thông qua khi sạch, từ chối khi bản AI đổi số hoặc thêm từ đánh giá
- [ ] Mệnh đề KHÔNG ĐẠT trình bày trung tính, không tô đỏ
- [ ] Không có nút "chọn tất cả"
- [ ] Loại minh chứng `du_lieu_do` không lọt vào bất kỳ lời gọi AI nào
- [ ] Xuất được Phụ lục 2 khớp với báo cáo
- [ ] Bộ tiêu chuẩn nằm trong dữ liệu, không nằm trong mã nguồn
