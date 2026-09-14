# HỆ TỪ KHÓA NỘI HÀM — CƠ CHẾ CHỐNG BÁO CÁO HÌNH THỨC TRONG ỨNG DỤNG KIỂM ĐỊNH CHẤT LƯỢNG GIÁO DỤC

**Đề xuất thiết kế module cốt lõi cho ứng dụng quản trị nhà trường theo Thông tư 57/2026/TT-BGDĐT**

Mã tài liệu: PDT-EDUQA-2026-M09 | Đơn vị chủ trì: PDT Academy | Người chịu trách nhiệm: ThS. Phùng Danh Tú
Người biên soạn: Trí | Ngày: 24/8/2026 | Phiên bản: 1.0

---

## PHẦN 0. TÓM TẮT ĐIỀU HÀNH

### 0.1. Điều đáng mừng trước khi bàn kỹ thuật

Ý tưởng thầy nêu ra không phải là một sáng kiến nằm ngoài văn bản. Nó là **việc số hóa đúng cái mà Bộ Giáo dục và Đào tạo đã yêu cầu từ năm 2018 nhưng gần như không trường nào làm nổi bằng tay**.

Công văn 5932/BGDĐT-QLCL ngày 28/12/2018 hướng dẫn tự đánh giá và đánh giá ngoài cơ sở giáo dục phổ thông viết nguyên văn:

> *"Để xác định đúng, đủ nội hàm (yêu cầu) của từng chỉ báo, tiêu chí cần lưu ý: (1) **Chỉ báo, tiêu chí thường có những từ, cụm từ quan trọng có ý nghĩa như là "từ khóa"**; (2) Mỗi chỉ báo, tiêu chí có một hoặc nhiều nội hàm..."*

Chữ "từ khóa" nằm ngay trong văn bản của Bộ. Cái mà thầy đề xuất không phải là thêm một tầng công cụ lên trên quy định — mà là **làm cho quy định vốn có trở nên thực hiện được**.

Đây là điểm cần nhấn mạnh khi trình bày với Sở, với hiệu trưởng, và cả khi bảo vệ sản phẩm trước lo ngại "AI viết hộ báo cáo": ứng dụng không sáng tạo ra quy trình mới, nó **cưỡng chế thực hiện đúng quy trình đã có**.

### 0.2. Chẩn đoán: vì sao báo cáo tiêu chí hình thức

Quy trình mà Công văn 5932 và Hướng dẫn 1816/SGDĐT-GDTrH ngày 26/7/2019 của Sở GDĐT Quảng Ninh quy định gồm 5 bước tuần tự:

```
(1) Tách từ khóa  →  (2) Xác định nội hàm  →  (3) Đặt câu hỏi kiểm chứng
                              ↓
        (5) Viết Mô tả hiện trạng  ←  (4) Tìm và mã hóa minh chứng
```

Thực tế ở các nhà trường, quy trình bị rút gọn thành:

```
(5') Mượn báo cáo trường bạn  →  (4') Tìm minh chứng cho khớp câu chữ đã có
```

Bước 1, 2, 3 bị bỏ hoàn toàn. Đây chính là **nguyên nhân gốc** của căn bệnh mà thầy quan sát thấy khi đi đánh giá ngoài. Và cần nói thẳng: đây không phải lỗi thái độ của nhà trường. Bước 1–3 là công việc trí tuệ nặng, đòi hỏi hiểu văn bản ở tầng sâu, mỗi tiêu chí mất hàng giờ, trong khi Phiếu xác định nội hàm (Phụ lục 2 của Công văn 5932) là một bảng trắng 5 cột không có bất kỳ gợi ý nào. Thư ký hội đồng ở một trường có 40 giáo viên, phải làm cho 15 tiêu chí trong ba tuần, không có lựa chọn nào khác ngoài đi mượn.

> **Kết luận chẩn đoán:** Bệnh hình thức không sinh ra ở khâu viết báo cáo. Nó sinh ra ở khâu **phân tích nội hàm bị bỏ trống**. Chữa ở khâu viết là chữa ngọn.

### 0.3. Đề xuất cốt lõi — ba câu

1. **Biến bước 1–3 từ công việc trí tuệ thành thao tác lựa chọn.** Nội hàm được chuyên gia phân tích sẵn một lần cho toàn ngành; nhà trường chỉ đối chiếu và chọn cái đúng với mình.
2. **Mỗi lựa chọn phải có khóa minh chứng.** Không gắn được minh chứng đúng loại thì lựa chọn đó không mở, không sinh ra câu nào trong báo cáo. Đây là cơ chế chống hình thức, không phải tính năng tiện lợi.
3. **AI chỉ được làm mượt văn phong, tuyệt đối không được thêm sự kiện.** Ràng buộc này kiểm chứng được bằng máy: tập mã minh chứng và tập số liệu trước và sau khi AI xử lý phải trùng khớp 100%, lệch một ký tự là từ chối.

### 0.4. Điều thầy cần đọc trước

- **Mục 2.3** — Bảng phân loại 5 nhóm từ khóa. Đây là phần đóng góp chuyên môn cốt lõi của đề xuất này và là thứ quyết định chất lượng toàn bộ thư viện.
- **Mục 4.3** — Cơ chế ba lớp sinh câu và phép kiểm chứng bằng máy. Đây là câu trả lời kỹ thuật cho rủi ro R3 (*"AI viết báo cáo đẹp — nhà trường rỗng bên trong"*) đã nêu trong Kế hoạch PDT-EDUQA-2026-V1.0.
- **Mục 6.2** — Chỉ số Độ đặc thù. Đây là tính năng có thể bán được cho cấp Sở, không chỉ cho nhà trường.
- **Mục 8** — Ba rủi ro mới mà chính cơ chế này tạo ra. Xin thầy đọc kỹ, vì có một rủi ro nghiêm trọng: **tick-box cũng có thể trở thành hình thức**, và nếu không xử lý thì ta chỉ chuyển bệnh từ chỗ này sang chỗ khác.

### 0.5. Một lưu ý về dữ liệu nguồn

Trong kho tài liệu dự án hiện có bản Thông tư 57/2026/TT-BGDĐT **đã được phân tích** (qua tài liệu PDT-EDUQA-2026-V1.0 và PDT-EDUQA-2026-TT01), nhưng **chưa có toàn văn Phụ lục I, II, III** — tức là chưa có tên đầy đủ của 15 tiêu chí, nội dung mô tả Mức 1/Mức 2, cột "Minh chứng gợi ý" và cột "Dữ liệu định lượng chính".

Vì vậy tài liệu này:

- Xây dựng **phương pháp và kiến trúc** trên khung 4–15–8 của Thông tư 57 (khung này đã có đầy đủ trong tài liệu dự án).
- Minh họa **cách làm chi tiết** bằng các tiêu chí có nội hàm nguyên văn trong Hướng dẫn 1816 của Quảng Ninh — vì đây là nguồn duy nhất trong kho hiện có ghi rõ nội hàm từng chỉ báo.
- Đánh dấu rõ mọi chỗ cần thầy dán nội dung Phụ lục Thông tư 57 vào để hoàn thiện thư viện.

Trí không tra cứu bên ngoài và không suy đoán nội dung tiêu chí của Thông tư 57. Đề nghị thầy cung cấp toàn văn Phụ lục II (cơ sở giáo dục phổ thông) để Trí hoàn thiện thư viện từ khóa đúng bộ mới.

---

## PHẦN I. NỀN TẢNG PHÁP LÝ CỦA CƠ CHẾ TỪ KHÓA

Phần này không tóm tắt văn bản. Phần này chỉ rút ra những câu chữ **trực tiếp cho phép và bắt buộc** cơ chế mà ta sắp xây.

### 1.1. Bốn căn cứ then chốt

| # | Nội dung quy định | Nguồn | Hệ quả thiết kế |
|---|---|---|---|
| 1 | Chỉ báo, tiêu chí thường có những từ, cụm từ quan trọng có ý nghĩa như là "từ khóa"; mỗi chỉ báo, tiêu chí có một hoặc nhiều nội hàm | Công văn 5932, mục 3.b | **Cho phép** mô hình hóa tiêu chí thành cấu trúc cây: Tiêu chí → Nội hàm → Từ khóa |
| 2 | Mỗi nhận định, kết luận trong mục "Mô tả hiện trạng" phải có minh chứng kèm theo | Công văn 5932, mục 3.d | **Bắt buộc** ràng buộc 1 câu ⇄ ≥1 mã minh chứng ở tầng ứng dụng |
| 3 | Mỗi trường sẽ có minh chứng cụ thể phù hợp, **không được sao chép dập khuôn giữa các trường** | Hướng dẫn 1816, Phần II mục II | **Bắt buộc** cơ chế đo và cảnh báo mức độ chung chung của báo cáo |
| 4 | Mục "Gợi ý các minh chứng" có tính chất tham khảo; nhà trường **lựa chọn một hoặc một vài** trong các minh chứng được gợi ý, không nhất thiết dùng tất cả, hoặc có thể dùng minh chứng phù hợp khác | Hướng dẫn 1816, Phần I mục I.3 | **Cho phép** thiết kế giao diện dạng chọn (tick), và **bắt buộc** luôn có ô "minh chứng khác" |

Căn cứ số 4 đặc biệt quan trọng về mặt pháp lý: nó chính là sự cho phép của cơ quan quản lý đối với mô hình "danh sách gợi ý để nhà trường tick chọn". Ta không sáng tạo ra mô hình này — Sở GDĐT Quảng Ninh đã ban hành nó dưới dạng văn bản giấy từ năm 2019. Ứng dụng chỉ làm cho nó chạy được.

### 1.2. Hướng dẫn 1816 chính là bản mẫu giấy của module này

Đọc lại cấu trúc Hướng dẫn 1816 sẽ thấy nó đã có sẵn đúng ba tầng dữ liệu mà ứng dụng cần:

```
Tiêu chí 1.1: Phương hướng, chiến lược xây dựng và phát triển nhà trường
│
├── MỨC 1
│   ├── Chỉ báo a  (in nghiêng = nguyên văn Thông tư)
│   │   └── Nội hàm (in thường = phần Sở phân tích, tách thành 3 gạch đầu dòng)
│   │       • Phù hợp với mục tiêu giáo dục phổ thông tại Luật Giáo dục
│   │       • Phù hợp định hướng phát triển KT-XH địa phương từng giai đoạn
│   │       • Phù hợp với các nguồn lực của nhà trường
│   ├── Chỉ báo b → Nội hàm: văn bản được cấp có thẩm quyền phê duyệt
│   └── Chỉ báo c → Nội hàm: công bố công khai bằng 1 trong các hình thức...
├── MỨC 2 → Nội hàm: tự giám sát + được cấp trên giám sát, kiểm tra, thanh tra
├── MỨC 3 → Nội hàm: định kỳ rà soát + có sự tham gia của các thành phần...
│
└── Gợi ý các minh chứng (11 mục)
```

**Điểm mấu chốt:** cột "in thường dưới chỉ báo" trong văn bản 1816 chính là **nội hàm đã được chuyên gia bóc tách**. Đó là tài sản trí tuệ mà Sở GDĐT Quảng Ninh đã tạo ra và thầy là người tham mưu ban hành. Việc cần làm bây giờ là chuyển tài sản đó từ dạng văn bản đọc sang dạng **dữ liệu có cấu trúc, chọn được, ràng buộc được, sinh câu được**.

### 1.3. Điểm khác biệt phải xử lý khi chuyển sang Thông tư 57

| Yếu tố | Thông tư 18 (bộ cũ) | Thông tư 57 (bộ mới) | Ảnh hưởng đến thiết kế từ khóa |
|---|---|---|---|
| Quy mô | 5 tiêu chuẩn, 28 tiêu chí, 4 mức | 4 tiêu chuẩn, 15 tiêu chí, 2 mức | Thư viện nhỏ hơn nhưng **mỗi tiêu chí gộp nhiều nội hàm hơn** → phải tách nội hàm kỹ hơn |
| Cấu trúc chỉ báo | Có chỉ báo a, b, c rõ ràng | Theo mô tả "yêu cầu của mức" | Không dựa được vào a/b/c → phải **tự tách nội hàm bằng phân tích ngữ nghĩa** |
| Điều kiện lên mức cao | Mức 2, 3, 4 chồng lớp | Mức 2 = đáp ứng yêu cầu **và có minh chứng về kết quả cải tiến** | Sinh ra **nhóm từ khóa loại 5** như một tầng riêng, có khóa minh chứng nghiêm ngặt nhất |
| Cột dữ liệu trong Phụ lục | Chỉ có gợi ý minh chứng | 3 cột: Minh chứng gợi ý / Thông tin minh chứng / Dữ liệu định lượng chính | Từ khóa phải gắn được cả **chỉ số định lượng**, không chỉ tài liệu |
| Tiêu chí bắt buộc | Không có khái niệm | 8 tiêu chí bắt buộc: 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2 | Từ khóa của 8 tiêu chí này phải làm **kỹ và chặt nhất**, ưu tiên sản xuất trước |

**Khuyến nghị thứ tự sản xuất thư viện:** 8 tiêu chí bắt buộc trước → 7 tiêu chí còn lại sau. Lý do: một tiêu chí bắt buộc hụt là cả trường hụt mức, nên đây là chỗ nhà trường cần được đỡ nhất, và cũng là chỗ Đoàn đánh giá ngoài soi kỹ nhất.

---

## PHẦN II. MÔ HÌNH KHÁI NIỆM — TỪ TIÊU CHÍ ĐẾN Ô TICK

### 2.1. Sai lầm cần tránh ngay từ đầu: từ khóa không phải là một từ

Cách hiểu ngây thơ nhất về ý tưởng "gợi ý từ khóa" là: hệ thống hiện ra một đám thẻ chữ như `công khai`, `phê duyệt`, `rà soát`, `hiệu quả`, và nhà trường tick vào những chữ nào thấy đúng.

**Cách này sẽ hỏng, và hỏng nặng.** Ba lý do:

1. **Từ đơn không kiểm chứng được.** Tick vào chữ `công khai` không cho biết trường công khai bằng hình thức nào, ngày nào, ai làm. Đoàn đánh giá ngoài không hỏi "trường có công khai không", họ hỏi "công khai ở đâu, từ ngày nào, cho Trí xem".
2. **Từ đơn không sinh được câu tử tế.** Ghép các từ rời sẽ ra văn bản kiểu máy móc — đúng thứ mà Đoàn đánh giá ngoài đọc là biết ngay.
3. **Từ đơn không gắn được minh chứng.** Không có ràng buộc nào bảo rằng tick `phê duyệt` thì phải có quyết định phê duyệt.

### 2.2. Thiết kế đúng: từ khóa là một MỆNH ĐỀ TRẠNG THÁI có khóa minh chứng

Đơn vị nhỏ nhất mà người dùng tick không phải là một từ, mà là **một câu khẳng định trọn vẹn, kiểm chứng được, về chính nhà trường mình**. Trí gọi đây là **mệnh đề trạng thái** (viết tắt: MĐTT).

Một mệnh đề trạng thái tốt phải thỏa mãn đủ 4 điều kiện:

| Điều kiện | Diễn giải | Ví dụ sai | Ví dụ đúng |
|---|---|---|---|
| **Trọn vẹn** | Đọc riêng một mình vẫn hiểu | "công khai" | "Chiến lược đã được đăng tải trên cổng thông tin điện tử của nhà trường" |
| **Nhị phân** | Chỉ có đúng hoặc không đúng, không có "tương đối" | "công khai tương đối tốt" | "Đã được niêm yết tại bảng tin nhà trường" |
| **Có khóa minh chứng** | Gắn với ít nhất một loại minh chứng cụ thể | (không gắn gì) | ⇒ bắt buộc có: ảnh chụp niêm yết **hoặc** đường dẫn trang đăng tải |
| **Có ô dữ liệu riêng** | Buộc trường điền thông tin của chính mình | "đã được phê duyệt" | "Đã được phê duyệt tại Quyết định số `___` ngày `___` của `___`" |

Điều kiện thứ tư là **linh hồn của toàn bộ thiết kế**. Nó đảm bảo rằng dù hai trường tick giống hệt nhau, hai báo cáo vẫn khác nhau, vì số quyết định và ngày tháng không thể giống. Đây là câu trả lời cho lo ngại "500 trường ra 500 báo cáo giống nhau".

### 2.3. Bảng phân loại NĂM NHÓM TỪ KHÓA — phần cốt lõi của đề xuất

Đọc kỹ toàn bộ nội hàm trong Hướng dẫn 1816 (28 tiêu chí, hơn 200 nội hàm), có thể thấy **mọi nội hàm đều rơi vào đúng một trong năm nhóm động từ**. Đây không phải là sự trùng hợp — nó phản ánh cấu trúc của chu trình quản trị chất lượng: có → đúng → làm → soi → tiến.

Nhận ra được năm nhóm này có ba ích lợi lớn: sản xuất thư viện nhanh gấp nhiều lần vì mỗi nhóm có bộ khuôn sẵn; kiểm tra được độ đầy đủ của thư viện; và quan trọng nhất, **chỉ ra chính xác chỗ nhà trường hay trượt**.

#### Nhóm 1 — TỪ KHÓA TỒN TẠI

| Đặc trưng | Chi tiết |
|---|---|
| Dấu hiệu ngôn ngữ | *có*, *được thành lập*, *có đủ*, *đảm bảo về số lượng*, *có văn bản* |
| Câu hỏi kiểm chứng | Thứ đó có tồn tại tại thời điểm đánh giá không? |
| Loại minh chứng khóa | Văn bản gốc, quyết định thành lập, danh sách, sổ sách |
| Khuôn câu sinh ra | "Nhà trường có {đối tượng} — {tên/số hiệu văn bản} {mã MC}." |
| Mức độ khó với nhà trường | **Dễ.** Hầu như trường nào cũng đạt. |
| Cạm bẫy | Trường tick "có" nhưng minh chứng đã hết hiệu lực (quyết định thành lập hội đồng nhiệm kỳ cũ). Hệ thống phải kiểm tra `ngày_het_gia_tri`. |

#### Nhóm 2 — TỪ KHÓA QUY TRÌNH

| Đặc trưng | Chi tiết |
|---|---|
| Dấu hiệu ngôn ngữ | *theo quy định*, *được cấp có thẩm quyền phê duyệt*, *đúng thẩm quyền*, *theo Điều lệ*, *đảm bảo quy trình* |
| Câu hỏi kiểm chứng | Nó được làm ra có đúng người, đúng cách, đúng căn cứ không? |
| Loại minh chứng khóa | Quyết định phê duyệt/công nhận của cấp trên; biên bản họp đúng thành phần; văn bản dẫn chiếu căn cứ pháp lý |
| Khuôn câu sinh ra | "{Đối tượng} được {hành vi} theo {căn cứ}, tại {số, ngày văn bản} {mã MC}." |
| Mức độ khó | **Trung bình.** Trường thường có nhưng hay thiếu văn bản của cấp trên. |
| Cạm bẫy | Đây là chỗ **thiếu thật mà tưởng là có**: trường tự ban hành chiến lược rồi coi như đã đủ, không có quyết định phê duyệt của Phòng/Sở. Hệ thống phải tách rõ hai ô: *văn bản của trường* và *văn bản phê duyệt của cấp trên*. |

#### Nhóm 3 — TỪ KHÓA THỰC HIỆN

| Đặc trưng | Chi tiết |
|---|---|
| Dấu hiệu ngôn ngữ | *tổ chức thực hiện*, *thực hiện đầy đủ*, *đúng tiến độ*, *triển khai*, *hoàn thành* |
| Câu hỏi kiểm chứng | Đã làm chưa, làm được bao nhiêu, có số liệu không? |
| Loại minh chứng khóa | Kế hoạch **cộng** báo cáo/biên bản kết quả **cộng** số liệu. Không đủ bộ ba thì không mở khóa. |
| Khuôn câu sinh ra | "Trong năm học {năm}, nhà trường đã {hành vi}: {số liệu cụ thể} {mã MC}." |
| Mức độ khó | **Trung bình đến khó.** |
| Cạm bẫy | Trường nộp kế hoạch và coi như đã chứng minh được việc thực hiện. **Có kế hoạch không phải là đã thực hiện.** Đây là lỗi phổ biến nhất trong các báo cáo tự đánh giá mà Trí thấy phản ánh trong hướng dẫn. Hệ thống phải bắt buộc đủ cặp kế hoạch – kết quả. |

#### Nhóm 4 — TỪ KHÓA RÀ SOÁT

| Đặc trưng | Chi tiết |
|---|---|
| Dấu hiệu ngôn ngữ | *định kỳ rà soát*, *hằng năm được rà soát, đánh giá*, *điều chỉnh*, *giám sát*, *kiểm tra việc thực hiện* |
| Câu hỏi kiểm chứng | Nhà trường có tự soi lại việc mình làm không, mấy lần, vào lúc nào, kết quả soi ra sao? |
| Loại minh chứng khóa | Biên bản/báo cáo rà soát **có ngày tháng**, số lần phải đạt tần suất quy định |
| Khuôn câu sinh ra | "Nhà trường tổ chức rà soát {đối tượng} định kỳ {tần suất}; trong {kỳ} đã thực hiện {số lần} lần vào {các mốc}, kết quả {kết luận} {mã MC}." |
| Mức độ khó | **KHÓ — đây là chỗ trượt nhiều nhất.** |
| Cạm bẫy | Nhà trường viết "hằng năm nhà trường đều rà soát" nhưng không có một biên bản rà soát nào có ngày tháng. Hệ thống phải yêu cầu **nhập ngày của từng lần rà soát**, và tự đếm. Đủ số lần mới mở khóa. Đây là tính năng làm nhà trường khó chịu lúc đầu và biết ơn về sau. |

**Ghi chú nghiệp vụ quan trọng:** Thông tư 57 yêu cầu đánh giá, giám sát nội bộ việc thực hiện kế hoạch cải tiến chất lượng **tối thiểu 02 lần trong một năm học** (cuối học kỳ I và cuối năm học). Đây là một con số cụ thể, kiểm đếm được bằng máy. Hệ thống nên có đồng hồ đếm ngược và cảnh báo chủ động: *"Đã hết học kỳ I, chưa ghi nhận lần giám sát nội bộ nào."*

#### Nhóm 5 — TỪ KHÓA KẾT QUẢ VÀ CẢI TIẾN

| Đặc trưng | Chi tiết |
|---|---|
| Dấu hiệu ngôn ngữ | *có hiệu quả*, *chuyển biến tích cực*, *góp phần nâng cao*, *đóng góp tích cực*, *vượt trội*, và trong Thông tư 57: ***có minh chứng về kết quả cải tiến chất lượng*** |
| Câu hỏi kiểm chứng | So với trước, đã khác đi chưa? Khác bao nhiêu? Lấy gì đo? |
| Loại minh chứng khóa | **Bắt buộc có cặp số liệu hai mốc thời gian** cộng với văn bản ghi nhận sự thay đổi |
| Khuôn câu sinh ra | "Sau khi triển khai {giải pháp}, {chỉ số} đã tăng/giảm từ {giá trị đầu} ({mốc đầu}) lên/xuống {giá trị cuối} ({mốc cuối}) {mã MC}." |
| Mức độ khó | **RẤT KHÓ — và đây chính là cửa vào Mức 2 của Thông tư 57.** |
| Cạm bẫy | Trường viết "hoạt động của tổ chuyên môn có hiệu quả, góp phần nâng cao chất lượng giáo dục" mà không có một con số nào. Câu này **không phải là mô tả hiện trạng, nó là một lời khen**. Hệ thống phải từ chối sinh câu nhóm 5 nếu chưa nhập đủ cặp số liệu. |

> **Đây là quy tắc quan trọng nhất trong toàn bộ đề xuất:**
> **Không có cặp số liệu hai mốc thời gian ⇒ không mở được từ khóa nhóm 5 ⇒ không đề xuất được Mức 2.**
>
> Quy tắc này thực thi đúng tinh thần Thông tư 57 — Mức 2 không phải là "làm tốt hơn Mức 1", mà là "có bằng chứng đã cải tiến và cải tiến có kết quả". Cài quy tắc này vào phần mềm là cách hiệu quả nhất để chấm dứt tình trạng đề nghị Mức 2 bằng cách viết hay hơn.

#### Bảng tổng hợp năm nhóm

| Nhóm | Tên | Câu hỏi lõi | Minh chứng khóa | Liên quan mức |
|---|---|---|---|---|
| 1 | Tồn tại | Có không? | Văn bản gốc | Mức 1 |
| 2 | Quy trình | Đúng cách không? | Quyết định của cấp có thẩm quyền | Mức 1 |
| 3 | Thực hiện | Đã làm chưa, bao nhiêu? | Kế hoạch + kết quả + số liệu | Mức 1 |
| 4 | Rà soát | Có tự soi không, mấy lần? | Biên bản có ngày, đủ tần suất | Mức 1 (ngưỡng trên) |
| 5 | Kết quả – Cải tiến | Đã khác đi chưa, bao nhiêu? | Cặp số liệu 2 mốc + văn bản ghi nhận | **Mức 2** |

### 2.4. Cấu trúc cây hoàn chỉnh của một tiêu chí

```
TIÊU CHÍ  (ví dụ: 1.4 — thuộc nhóm 8 tiêu chí bắt buộc)
│
├── MỨC 1
│   ├── NỘI HÀM 1.1  «trích nguyên văn yêu cầu của mức»
│   │   ├── [nhóm 1] MĐTT-a : "Nhà trường có ..."          → khóa: văn bản gốc
│   │   ├── [nhóm 2] MĐTT-b : "... được phê duyệt tại QĐ số ___ ngày ___" → khóa: QĐ cấp trên
│   │   └── [nhóm 1] MĐTT-c : "Chưa có ..."  ⚠ cờ KHÔNG ĐẠT  → khóa: không
│   ├── NỘI HÀM 1.2
│   │   ├── [nhóm 3] MĐTT-d ... → khóa: kế hoạch + báo cáo + số liệu
│   │   └── [nhóm 4] MĐTT-e ... → khóa: biên bản có ngày, ≥ n lần
│   └── ☐ Nội dung khác của nhà trường (ô nhập tự do + gắn minh chứng)
│
└── MỨC 2
    ├── NỘI HÀM 2.1  «... và có minh chứng về kết quả cải tiến chất lượng»
    │   └── [nhóm 5] MĐTT-f ... → khóa: cặp số liệu 2 mốc  🔒 khóa nghiêm ngặt
    └── ☐ Nội dung khác
```

**Ba quy tắc bất biến của cấu trúc này:**

1. **Mỗi nội hàm phải có ít nhất một mệnh đề mang cờ KHÔNG ĐẠT.** Nếu chỉ cho tick những mệnh đề tích cực, ta đã thiết kế một cái máy nói dối. Nhà trường phải có chỗ để nói "chúng tôi chưa có cái này" một cách đàng hoàng — và hệ thống phải ghi nhận điều đó một cách trung tính, thậm chí khen ngợi sự trung thực, rồi tự động đưa nội dung đó vào mục Điểm yếu và gợi ý đưa vào Kế hoạch cải tiến.
2. **Luôn có ô "Nội dung khác của nhà trường".** Đây là yêu cầu pháp lý (Hướng dẫn 1816 cho phép dùng minh chứng phù hợp khác) và cũng là yêu cầu đạo đức: không được để danh sách gợi ý biến thành cái khuôn ép mọi nhà trường phải giống nhau. Đặc thù của mỗi trường phải có đường thoát.
3. **Mỗi mệnh đề chỉ thuộc đúng một nội hàm.** Nếu một mệnh đề phục vụ hai nội hàm, đó là dấu hiệu nội hàm chưa được tách đủ nhỏ.

---

## PHẦN III. MÔ HÌNH DỮ LIỆU

Phần này bổ sung vào mô hình 14 bảng đã có trong tài liệu PDT-EDUQA-2026-V1.0. Không sửa bảng cũ, chỉ thêm 5 bảng mới và 1 bảng nối.

### 3.1. Năm bảng mới

**`noi_ham`** — kết quả bóc tách yêu cầu của mức

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | |
| tieu_chi_id | uuid | khóa ngoại |
| muc | int | 1 hoặc 2 |
| so_thu_tu | int | thứ tự trình bày và thứ tự sinh câu |
| trich_dan_goc | text | **nguyên văn** đoạn văn bản quy định — không được sửa |
| noi_dung_noi_ham | text | phần chuyên gia diễn giải |
| bat_buoc | bool | nội hàm này thiếu thì cả chỉ báo không đạt |
| bo_tieu_chuan_id | uuid | để chịu được thay đổi văn bản |

**`menh_de_trang_thai`** — các ô tick

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | |
| noi_ham_id | uuid | |
| nhom_tu_khoa | int | 1–5 theo bảng phân loại Mục 2.3 |
| tu_khoa_hien_thi | text[] | các từ khóa nổi bật để tô đậm trên giao diện |
| noi_dung | text | mệnh đề trạng thái đầy đủ |
| la_co_khong_dat | bool | cờ đánh dấu mệnh đề phủ định |
| mau_cau | text[] | **3–5 biến thể** khuôn câu, chứa slot |
| truong_du_lieu | jsonb | định nghĩa các ô nhập bắt buộc (số văn bản, ngày, số liệu…) |
| loai_mc_bat_buoc | text[] | khóa minh chứng |
| so_luong_mc_toi_thieu | int | mặc định 1 |
| ghi_chu_chuyen_mon | text | lời khuyên hiện dưới dạng gợi ý khi người dùng rê chuột |

**`loai_minh_chung`** — từ điển loại minh chứng

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | |
| ma | text | ví dụ: `QD_PHE_DUYET`, `BIEN_BAN_RA_SOAT`, `SO_LIEU_2_MOC` |
| ten | text | |
| mo_ta | text | |
| yeu_cau_ngay_thang | bool | loại này bắt buộc có ngày ban hành |
| yeu_cau_so_lieu | bool | loại này bắt buộc kèm giá trị số |

**`lua_chon_tu_danh_gia`** — cái mà nhà trường thực sự tick

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | |
| co_so_id, nam_hoc_id, cap_hoc | | đa đơn vị, theo năm học |
| menh_de_id | uuid | |
| duoc_chon | bool | |
| du_lieu_nhap | jsonb | giá trị các ô nhập riêng của trường |
| nguoi_chon_id | uuid | **ai tick — ghi tên vào Phiếu** |
| thoi_diem_chon | timestamp | |
| trang_thai_khoa | text | `da_mo` / `thieu_minh_chung` / `thieu_du_lieu` |

**`cau_sinh_ra`** — vết truy xuất từng câu trong báo cáo

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | uuid | |
| lua_chon_id | uuid | |
| cau_lop_1 | text | bản khung do máy ghép |
| cau_lop_3 | text | bản sau khi AI làm mượt |
| ma_mc_su_dung | text[] | dùng để đối chiếu |
| so_lieu_su_dung | text[] | dùng để đối chiếu |
| da_qua_kiem_tra | bool | kết quả phép so khớp ở Mục 4.3 |
| nguoi_duyet_id, thoi_diem_duyet | | |

### 3.2. Bảng nối

**`menh_de_minh_chung`** — nối mệnh đề đã tick với minh chứng cụ thể trong kho

| Trường | Ghi chú |
|---|---|
| lua_chon_id | |
| minh_chung_id | trỏ vào bảng `minh_chung` đã có |
| vai_tro | `chinh` / `bo_sung` |

Bảng này **không cấp mã minh chứng mới**. Nó chỉ tham chiếu. Quy tắc "một tài liệu — một mã — dùng cho nhiều tiêu chí" của Thông tư 57 được giữ nguyên vẹn.

### 3.3. Một quyết định dữ liệu cần cân nhắc kỹ

Thư viện từ khóa (`noi_ham`, `menh_de_trang_thai`) là **dữ liệu tham chiếu dùng chung cho mọi trường**, không thuộc về trường nào. Nhưng nhà trường sẽ có nhu cầu thêm mệnh đề riêng.

Đề xuất: cho phép mỗi cơ sở tạo mệnh đề riêng với `co_so_id` khác rỗng, hiển thị xen kẽ với mệnh đề dùng chung nhưng gắn nhãn phân biệt. Định kỳ, PDT rà soát các mệnh đề riêng mà nhiều trường cùng tạo — nếu một mệnh đề xuất hiện ở trên 10 trường, đó là tín hiệu thư viện gốc còn thiếu, và nên đưa vào thư viện dùng chung ở phiên bản sau.

**Đây chính là cơ chế để thư viện tự lớn lên theo thời gian.** Sau ba năm và một trăm trường, thư viện của PDT sẽ là thứ không ai dựng lại được trong một sớm một chiều — kể cả một hệ thống do nhà nước đầu tư. Nó là hàng rào cạnh tranh bền vững hơn code rất nhiều.

---

## PHẦN IV. THUẬT TOÁN SINH BÁO CÁO TIÊU CHÍ

### 4.1. Nguyên tắc: AI đứng ở đâu trong dây chuyền

Đây là câu hỏi quyết định uy tín của sản phẩm. Trả lời sai một lần là mất thương hiệu.

```
Nhà trường tick + nhập dữ liệu riêng + gắn minh chứng
                    │
                    ▼
   LỚP 1 — GHÉP KHUNG  (thuần toán, không có AI)
   Ghép mẫu câu theo thứ tự nội hàm, điền slot, chèn mã MC
                    │
                    ▼
   LỚP 2 — KIỂM RÀNG BUỘC  (thuần toán, không có AI)
   Đủ minh chứng? Đủ nội hàm bắt buộc? Đủ số liệu? Đủ tần suất?
        │ thiếu → DỪNG, để trống ô, hiện cảnh báo cụ thể
        │ đủ ↓
                    ▼
   LỚP 3 — LÀM MƯỢT VĂN PHONG  (đây là chỗ duy nhất có AI)
   Chỉ được: nối câu, chuyển đổi từ nối, sắp lại trật tự trong đoạn
   Cấm tuyệt đối: thêm sự kiện, thêm/bớt mã MC, đổi số liệu, đổi kết luận
                    │
                    ▼
   LỚP 4 — SO KHỚP TỰ ĐỘNG  (thuần toán, không có AI)
   Đối chiếu tập mã MC và tập số liệu trước/sau. Lệch → hủy bản AI, dùng bản Lớp 1
                    │
                    ▼
   Con người đọc, sửa, ký duyệt — bản cuối luôn thuộc về con người
```

**Điểm cần nói rõ khi bán hàng và khi tập huấn:** ứng dụng này **không có nút "AI viết báo cáo"**. Ứng dụng có nút "sinh báo cáo từ những gì nhà trường đã khai và đã chứng minh". Sự khác biệt về câu chữ này phản ánh một sự khác biệt thật về kiến trúc, và nó chính là điều thầy có thể nói thẳng trước Hội đồng thẩm định mà không phải ngại.

### 4.2. Chi tiết Lớp 1 — ghép khung

Giả sử với một tiêu chí, nhà trường đã tick 4 mệnh đề thuộc 3 nội hàm. Thuật toán:

```
HÀM ghep_mo_ta_hien_trang(tieu_chi, muc, nam_hoc, cap_hoc):

  doan = []
  VỚI MỖI noi_ham THEO thứ tự so_thu_tu:
      cac_menh_de = lấy các mệnh đề đã tick thuộc nội hàm này
      NẾU rỗng:
          ghi cảnh báo "Nội hàm «...» chưa được khai" → BỎ QUA, không bịa
          TIẾP TỤC
      VỚI MỖI menh_de:
          mau = chọn ngẫu nhiên 1 trong các mau_cau  // tránh đồng phục hóa
          cau = điền slot từ du_lieu_nhap
          cau = cau + " " + chuỗi mã minh chứng đã gắn
          doan.thêm(cau)

  TRẢ VỀ doan nối lại theo nội hàm, mỗi nội hàm một xuống dòng
```

Vài quy ước trình bày cần cài đúng ngay từ đầu:

- Mã minh chứng đặt **sau** nhận định, trong ngoặc vuông theo quy ước hiện hành của nhà trường và của Thông tư đang áp dụng.
- Nhiều mã cho một nhận định thì đặt liền nhau, cách nhau bằng dấu chấm phẩy — đúng như hướng dẫn tại Công văn 5932.
- **Lưu ý về quy ước mã:** Công văn 5932 dùng dạng `[Hn-a.b-c]`, còn Thông tư 57 dùng dạng `MC.(tiêu chuẩn).(tiêu chí).(số thứ tự)`. Hai quy ước khác nhau. Bảng `bo_tieu_chuan` phải có trường `quy_uoc_ma_minh_chung` để hệ thống xuất đúng dạng theo bộ đang áp dụng. Đây là chi tiết nhỏ nhưng sai là Đoàn thẩm định nhận ra ngay.

### 4.3. Chi tiết Lớp 3 và Lớp 4 — ràng buộc AI và phép so khớp

**Prompt cho Lớp 3** (đưa thẳng vào ứng dụng, không cần sửa):

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

**Phép so khớp Lớp 4** — thực thi bằng code, không thương lượng:

| Phép kiểm | Cách làm | Xử lý khi lệch |
|---|---|---|
| Mã minh chứng | Trích toàn bộ mã bằng biểu thức chính quy từ bản trước và bản sau, so sánh hai tập hợp | Lệch ⇒ hủy bản AI |
| Số liệu | Trích mọi số, tỷ lệ phần trăm, ngày tháng; so sánh hai tập hợp | Lệch ⇒ hủy bản AI |
| Từ ngữ đánh giá cấm | Quét danh sách đen; nếu bản sau có mà bản trước không có | Có ⇒ hủy bản AI |
| Độ dài | Bản sau dài hơn bản trước quá 40% | Vượt ⇒ cảnh báo, để người dùng quyết định |

Khi hủy bản AI, hệ thống dùng bản Lớp 1 và hiện thông báo trung thực: *"Bản biên tập tự động không đạt kiểm tra an toàn nội dung. Đang hiển thị bản ghép nguyên gốc."* Không im lặng thay thế — người dùng có quyền biết chuyện gì đã xảy ra.

### 4.4. Sinh các mục còn lại của Phiếu đánh giá tiêu chí

Công văn 5932 quy định Phiếu đánh giá tiêu chí gồm 5 mục: Mô tả hiện trạng, Điểm mạnh, Điểm yếu, Kế hoạch cải tiến chất lượng, Tự đánh giá. Cơ chế từ khóa sinh được cả 5 — và đây là chỗ giá trị tăng lên rõ rệt:

| Mục | Nguồn sinh | Ghi chú |
|---|---|---|
| **1. Mô tả hiện trạng** | Các mệnh đề đã tick, theo Mục 4.2 | |
| **2. Điểm mạnh** | Các mệnh đề nhóm 4 và nhóm 5 đã tick — tức những chỗ trường không chỉ có mà còn soi lại và cải tiến được | Đúng yêu cầu của 5932: điểm mạnh phải **khái quát trên cơ sở nội dung Mô tả hiện trạng**, không được là ý mới |
| **3. Điểm yếu** | Các mệnh đề mang cờ KHÔNG ĐẠT đã tick, **cộng** các nội hàm hoàn toàn chưa được khai | Chỗ trống trong bảng tick chính là điểm yếu — hệ thống nhìn thấy điều này chính xác hơn con người |
| **4. Kế hoạch cải tiến** | Mỗi điểm yếu tự động sinh một dòng nháp trong Mẫu 2, đã điền sẵn cột nội dung và cột minh chứng dự kiến | Người phụ trách, thời gian, nguồn lực do con người điền — máy không được đoán |
| **5. Tự đánh giá** | Engine tính mức đã đặc tả trong PDT-EDUQA-2026-V1.0 Mục 4.3 | Chỉ chạy khi mọi nội hàm bắt buộc đã được khai |

**Giá trị lớn nhất nằm ở mục 3 và 4.** Hiện nay Điểm yếu thường được viết chiếu lệ ("cơ sở vật chất còn khó khăn") vì không ai muốn tự nhận thiếu sót, và Kế hoạch cải tiến vì thế cũng chung chung. Khi Điểm yếu được sinh ra tự động từ những ô chưa tick được, nó trở nên **cụ thể đến mức không thể viết chung chung**, và Kế hoạch cải tiến có chỗ bám. Đây chính là chỗ ứng dụng chuyển từ "công cụ làm hồ sơ" sang "công cụ quản trị" mà thầy mong muốn.

---

## PHẦN V. THIẾT KẾ TRẢI NGHIỆM NGƯỜI DÙNG

### 5.1. Nguyên tắc: một tiêu chí là một phiên làm việc 20 phút

Người dùng của module này là tổ trưởng chuyên môn, thư ký hội đồng — không phải người thạo công nghệ, và làm việc này ngoài giờ. Thiết kế phải chịu được điều đó.

Bố cục màn hình đề xuất, chia ba cột:

```
┌──────────────────┬────────────────────────────┬──────────────────┐
│ CỘT TRÁI         │ CỘT GIỮA — vùng làm việc   │ CỘT PHẢI         │
│                  │                            │                  │
│ Cây tiêu chí     │ Nội hàm 1 «trích nguyên    │ Xem trước đoạn   │
│ ✓ 1.1  Đủ        │  văn quy định»             │ văn đang được    │
│ ⚠ 1.2  Thiếu MC  │                            │ sinh ra          │
│ ● 1.3  Đang làm  │ ☑ Mệnh đề a   [nhóm 1]     │ (cập nhật ngay   │
│ ○ 1.4  Chưa      │   → đã gắn MC.1.3.01 ✓     │  khi tick)       │
│   ...            │ ☑ Mệnh đề b   [nhóm 2]     │                  │
│                  │   → QĐ số [___] ngày [___] │ ─────────────    │
│ ─────────────    │   → ⚠ chưa gắn minh chứng  │ Cảnh báo:        │
│ Tiến độ chung    │ ☐ Mệnh đề c   [nhóm 4]     │ • Nội hàm 2 chưa │
│ 6/15 tiêu chí    │ ☐ Chưa có — cần cải tiến   │   khai           │
│ 3/8 bắt buộc     │ ☐ Nội dung khác...         │ • Mệnh đề b thiếu│
│                  │                            │   minh chứng     │
│                  │ ── Nội hàm 2 ──            │                  │
└──────────────────┴────────────────────────────┴──────────────────┘
```

**Bảy quyết định giao diện quan trọng:**

1. **Trích dẫn nguyên văn quy định luôn hiển thị ngay trên các ô tick.** Người dùng phải đọc yêu cầu trước khi chọn. Không giấu vào chỗ "xem thêm". Đây là chỗ giáo dục người dùng hiểu nội hàm — mục tiêu sâu xa nhất của cả sản phẩm.
2. **Nhãn nhóm từ khóa hiển thị công khai** (nhóm 1–5, có màu riêng). Sau vài lần dùng, người phụ trách sẽ tự nhận ra: "à, tiêu chí nào cũng có nhóm 4 và nhóm 5, và trường mình luôn trống hai nhóm đó." Đó là khoảnh khắc học được nhiều nhất.
3. **Xem trước cập nhật tức thì.** Tick một ô, câu văn hiện ra ngay bên phải. Cảm giác "mình vừa viết được một câu báo cáo" là động lực mạnh hơn mọi lời hướng dẫn.
4. **Ô chưa mở khóa hiển thị mờ kèm lý do cụ thể**, không ẩn đi. "Cần gắn 1 quyết định phê duyệt của cấp có thẩm quyền để mở" — người dùng biết chính xác phải đi tìm gì. Đây là chỗ ứng dụng dạy nghề cho nhà trường.
5. **Mệnh đề mang cờ KHÔNG ĐẠT trình bày trung tính**, không dùng màu đỏ, không dùng biểu tượng cảnh báo. Kèm một dòng: *"Ghi nhận trung thực. Nội dung này sẽ được đưa vào Điểm yếu và Kế hoạch cải tiến."* Nếu tick vào ô "chưa có" mà bị phần mềm nhìn như phạm lỗi, người dùng sẽ không bao giờ tick nữa — và ta mất toàn bộ giá trị.
6. **Hiện tên người tick ngay cạnh mỗi ô đã chọn.** Đây không phải để giám sát, mà để mỗi lựa chọn trở thành một hành vi có trách nhiệm. Người đứng đầu chịu trách nhiệm trước pháp luật về tính trung thực của báo cáo — hệ thống nên làm cho trách nhiệm đó có địa chỉ cụ thể ở từng dòng.
7. **Không có nút "chọn tất cả".** Đây là một quyết định có chủ đích. Nút đó sẽ hủy hoại toàn bộ ý nghĩa của module.

### 5.2. Xuất Phiếu xác định nội hàm — món quà cho Đoàn đánh giá ngoài

Phụ lục 2 của Công văn 5932 là *Phiếu xác định nội hàm, phân tích tiêu chí tìm minh chứng*, gồm 5 cột: Tiêu chí – Nội hàm – Các câu hỏi đặt ra – Minh chứng (cần thu thập / nơi thu thập) – Ghi chú. Hướng dẫn 1816 quy định phiếu này **được lưu trong hồ sơ tự đánh giá làm cơ sở đánh giá của Hội đồng tự đánh giá và của Đoàn đánh giá ngoài**.

Hiện nay phiếu này hầu như được làm cho có, hoặc làm sau khi đã viết xong báo cáo — tức là làm ngược.

Với cơ chế từ khóa, **phiếu này được sinh ra tự động và miễn phí**, vì mọi cột đều đã có sẵn trong dữ liệu:

| Cột của Phụ lục 2 | Lấy từ đâu |
|---|---|
| Tiêu chí | `tieu_chi` |
| Nội hàm | `noi_ham.noi_dung_noi_ham` |
| Các câu hỏi đặt ra | câu hỏi kiểm chứng của nhóm từ khóa tương ứng (Mục 2.3) |
| Minh chứng cần thu thập | `menh_de_trang_thai.loai_mc_bat_buoc` |
| Nơi thu thập | trường `noi_thu_thap` trong từ điển loại minh chứng |
| Ghi chú | trạng thái khóa: đã có / còn thiếu |

**Hệ quả:** phiếu xác định nội hàm và báo cáo tự đánh giá **không thể mâu thuẫn nhau**, vì cùng sinh ra từ một nguồn dữ liệu. Mâu thuẫn giữa hai tài liệu này là một trong những điều Đoàn đánh giá ngoài hay phát hiện nhất — và ứng dụng làm cho nó không xảy ra được nữa.

### 5.3. Màn hình dành riêng cho Đoàn đánh giá ngoài

Đây là ý tưởng Trí muốn đề xuất thêm, xuất phát trực tiếp từ trải nghiệm thầy nêu.

Khi đoàn đánh giá ngoài nghiên cứu hồ sơ, việc tốn thời gian nhất là đối chiếu ba chiều: *yêu cầu của tiêu chí — câu trong báo cáo — minh chứng thực có*. Làm bằng tay với 15 tiêu chí mất nhiều ngày.

Đề xuất một màn hình chỉ đọc, gọi là **Bảng đối chiếu ba chiều**:

| Nội hàm | Câu trong báo cáo | Mã MC viện dẫn | Trạng thái |
|---|---|---|---|
| Có văn bản chiến lược | "Nhà trường đã ban hành..." | MC.1.1.01 | ✓ có tệp, còn hiệu lực |
| Được cấp có thẩm quyền phê duyệt | *(trống)* | — | ⚠ **không có câu nào phục vụ nội hàm này** |
| Được công bố công khai | "Chiến lược được đăng tải..." | MC.1.1.03 | ⚠ tệp không mở được |

Cột "Trạng thái" là thứ mà đoàn cần và hiện không có công cụ nào cho. Ba tình huống hệ thống tự phát hiện:

- **Nội hàm rỗng** — có yêu cầu nhưng báo cáo không có câu nào phục vụ. Đây là lỗi nghiêm trọng nhất và khó phát hiện nhất bằng mắt người, vì báo cáo vẫn đọc trôi chảy.
- **Câu không neo** — có nhận định nhưng không có mã minh chứng kèm theo, trái quy định của Công văn 5932.
- **Mã treo** — có mã minh chứng nhưng tệp không tồn tại, hết hiệu lực, hoặc không đúng loại yêu cầu.

**Định vị sản phẩm cần lưu ý:** màn hình này **không kết luận thay Đoàn**. Nó chỉ chỉ ra chỗ cần xem. Quyền kết luận thuộc về Hội đồng thẩm định và Giám đốc Sở — ranh giới này đã được xác lập trong tài liệu PDT-EDUQA-2026-V1.0 Mục 2.4 và không được vượt qua.

---

## PHẦN VI. CƠ CHẾ CHỐNG HÌNH THỨC — ĐO ĐƯỢC, KHÔNG PHẢI KHẨU HIỆU

### 6.1. Bốn khóa cứng ở tầng ứng dụng

| # | Khóa | Quy tắc | Hệ quả khi vi phạm |
|---|---|---|---|
| K1 | **Khóa minh chứng** | Mệnh đề chỉ mở khi đã gắn đủ số lượng minh chứng đúng loại yêu cầu | Ô tick mờ, không sinh câu |
| K2 | **Khóa dữ liệu riêng** | Mọi ô nhập bắt buộc (số văn bản, ngày, số liệu) phải điền đủ | Không sinh câu, hiện đúng ô còn trống |
| K3 | **Khóa tuần tự** | Không mở nhóm mệnh đề Mức 2 khi Mức 1 của cùng tiêu chí chưa đủ | Đúng quy định đánh giá tuần tự của Thông tư 57 |
| K4 | **Khóa cải tiến** | Mệnh đề nhóm 5 chỉ mở khi có cặp số liệu hai mốc thời gian khác nhau | **Chặn đường đề nghị Mức 2 bằng lời khen** |

Bốn khóa này phải cài ở **tầng cơ sở dữ liệu**, không chỉ ở giao diện. Ẩn nút trên màn hình không phải là ràng buộc — đó là trang trí.

### 6.2. Chỉ số Độ đặc thù — biến "chung chung" thành một con số

Đây là đề xuất mà Trí cho là có giá trị thương mại cao nhất trong toàn bộ tài liệu này, vì nó giải quyết đúng nỗi đau của cấp Sở, không chỉ của nhà trường.

**Vấn đề:** hiện không ai đo được một báo cáo tự đánh giá là thật hay hình thức, cho đến khi đoàn đánh giá ngoài xuống trường — tức là đã quá muộn và quá tốn kém.

**Đề xuất:** tính một chỉ số cho từng tiêu chí và cho toàn báo cáo, gọi là **Độ đặc thù**, gồm bốn thành phần:

| Thành phần | Cách đo | Trọng số đề xuất |
|---|---|---|
| Tỷ lệ câu có dữ liệu riêng | số câu chứa số văn bản / ngày / số liệu chia cho tổng số câu | 30% |
| Tỷ lệ nội hàm được khai | số nội hàm có ít nhất một mệnh đề đã tick chia cho tổng số nội hàm | 30% |
| Độ phủ nhóm từ khóa | có mặt đủ 5 nhóm hay chỉ có nhóm 1 và 2 | 20% |
| Tỷ lệ minh chứng còn hiệu lực | số MC còn hiệu lực chia cho tổng số MC viện dẫn | 20% |

Diễn giải kết quả:

- **Dưới 40%** — báo cáo mang tính liệt kê sự tồn tại, gần như không có nội dung thực hiện và cải tiến. Đây chính là chân dung định lượng của một báo cáo hình thức.
- **40–70%** — báo cáo có cơ sở nhưng còn thiếu chiều sâu ở nhóm rà soát và cải tiến.
- **Trên 70%** — báo cáo có dữ liệu thật, đủ điều kiện xem xét Mức 2 ở nhiều tiêu chí.

**Ba cách dùng chỉ số này:**

1. **Với nhà trường** — hiện ngay trên màn hình như một cái gương, kèm gợi ý cụ thể chỗ cần bổ sung. Không dùng để chấm điểm, không dùng để so sánh giữa các trường.
2. **Với cấp Sở** — trong khâu nghiên cứu hồ sơ trước đánh giá ngoài, chỉ số này giúp đoàn phân bổ thời gian: tiêu chí có độ đặc thù thấp thì xem kỹ, tiêu chí cao thì xem lướt. **Tiết kiệm được nhiều ngày công cho mỗi đợt đánh giá ngoài — đây là con số bán hàng.**
3. **Với chính PDT** — theo dõi chỉ số trung bình của các trường đang dùng qua từng năm. Nếu nó tăng, sản phẩm đang thực sự làm thay đổi chất lượng quản trị, không chỉ làm nhanh hơn việc gõ văn bản. Đây là thước đo trung thực nhất về giá trị của sản phẩm.

**Một cảnh báo về đạo đức sử dụng:** chỉ số này tuyệt đối **không được dùng để xếp hạng trường**. Thông tư 57 đã nói rõ việc xác định mức không nhằm chấm điểm, xếp hạng hoặc tạo áp lực thành tích. Nếu chỉ số Độ đặc thù bị biến thành một bảng xếp hạng, các trường sẽ tối ưu hóa chỉ số thay vì tối ưu hóa thực chất — và ta lại sinh ra một căn bệnh hình thức mới, tinh vi hơn cái cũ. Đề nghị viết ràng buộc này thành cam kết công khai trong tài liệu sản phẩm.

---

## PHẦN VII. QUY TRÌNH SẢN XUẤT THƯ VIỆN TỪ KHÓA

### 7.1. Ước lượng khối lượng

Với bộ tiêu chuẩn theo Thông tư 57 (4 tiêu chuẩn – 15 tiêu chí – 2 mức):

| Đại lượng | Ước tính | Ghi chú |
|---|---|---|
| Nội hàm mỗi tiêu chí mỗi mức | 3–5 | Thông tư 57 gộp nhiều hơn Thông tư 18 nên phải tách kỹ |
| Tổng nội hàm một loại hình | 15 × 2 × 4 ≈ **120** | |
| Mệnh đề mỗi nội hàm | 3–5 (gồm ít nhất 1 mệnh đề KHÔNG ĐẠT) | |
| Tổng mệnh đề một loại hình | **360–600** | |
| Biến thể mẫu câu mỗi mệnh đề | 3 | Để tránh đồng phục hóa |
| Tổng mẫu câu một loại hình | **1.100–1.800** | |

Ba loại hình (mầm non, phổ thông, thường xuyên) **không nhân ba khối lượng**, vì Tiêu chuẩn 1 và Tiêu chuẩn 2 dùng chung phần lớn. Ước tính hệ số khoảng 2,2 lần thay vì 3 lần.

### 7.2. Bốn bước sản xuất

**Bước 1 — Tách nội hàm bằng máy (nháp).**
Đưa nguyên văn mô tả mức vào công cụ tách câu theo dấu chấm phẩy, các liên từ "và", "hoặc", "đồng thời", các cụm "bảo đảm", "theo quy định". Ra bản nháp danh sách nội hàm. Bước này mất khoảng 10 phút cho một tiêu chí và **kết quả chắc chắn chưa dùng được** — nó chỉ để giảm việc gõ.

**Bước 2 — Chuyên gia duyệt và cắt nghĩa.**
Đây là bước **không thể tự động hóa và không nên tự động hóa**. Người có 22 năm trong ngành nhìn một câu quy định sẽ biết nó thực sự đòi hỏi cái gì, cái gì bắt buộc, cái gì chỉ là diễn giải, và trường thường hiểu sai chỗ nào. Cách làm hiệu quả nhất là đối chiếu ba nguồn: nguyên văn Thông tư 57, cách Hướng dẫn 1816 đã bóc tách nội hàm tương ứng của Thông tư 18, và kinh nghiệm đánh giá ngoài thực tế. Ước lượng 60–90 phút cho một tiêu chí.

**Bước 3 — Sinh mệnh đề theo năm nhóm.**
Với mỗi nội hàm, xác định nó thuộc nhóm nào trong năm nhóm ở Mục 2.3, rồi áp bộ khuôn của nhóm đó. Vì mỗi nhóm đã có sẵn khuôn câu hỏi, khuôn minh chứng, khuôn mẫu câu, bước này nhanh: khoảng 20–30 phút cho một tiêu chí.

**Bước 4 — Gắn minh chứng gợi ý.**
Lấy từ cột "Minh chứng gợi ý" của Phụ lục Thông tư 57, đối chiếu bổ sung với danh mục gợi ý rất chi tiết trong Hướng dẫn 1816 (nhiều mục vẫn còn nguyên giá trị sử dụng, ví dụ nhóm minh chứng về hội đồng, về quản lý tài chính tài sản, về an ninh trật tự an toàn trường học). Khoảng 20 phút cho một tiêu chí.

**Tổng ước lượng: 2–2,5 giờ cho một tiêu chí, tương đương 30–38 giờ cho một loại hình, khoảng 70–85 giờ cho cả ba loại hình.**

### 7.3. Khuyến nghị về thứ tự và cách phân bổ công sức

Không nên làm tuần tự từ tiêu chí 1.1 đến 4.3. Đề nghị theo ba đợt:

| Đợt | Phạm vi | Lý do | Thời lượng |
|---|---|---|---|
| **Đợt 1** | 8 tiêu chí bắt buộc, loại hình phổ thông, chỉ Mức 1 | Đủ để chạy thí điểm ở một trường thật và kiểm chứng cả cơ chế | ~12 giờ |
| **Đợt 2** | 8 tiêu chí bắt buộc, Mức 2 | Đây là phần khó nhất và có giá trị phân biệt cao nhất | ~10 giờ |
| **Đợt 3** | 7 tiêu chí còn lại, rồi mở sang mầm non và thường xuyên | Sau khi cơ chế đã được kiểm chứng bằng dữ liệu thật | ~50 giờ |

**Điểm dừng đánh giá:** kết thúc Đợt 1, đưa cho **hai người thử độc lập** — một thư ký hội đồng tự đánh giá đang làm thật, và một người đã từng tham gia đoàn đánh giá ngoài. Câu hỏi cần trả lời không phải "có dùng được không" mà là: *"Nếu chỉ đọc bảng tick này mà chưa đọc Thông tư, thầy/cô có hiểu tiêu chí này đòi hỏi gì không?"* Nếu câu trả lời là không, vấn đề nằm ở Bước 2, phải quay lại chứ không đi tiếp.

### 7.4. Bảo vệ tài sản trí tuệ

Thư viện từ khóa là **tài sản có giá trị cao hơn phần mềm rất nhiều**, vì:

- Phần mềm dựng lại được trong vài tuần bằng vibe coding. Thư viện thì không — nó cần 22 năm kinh nghiệm ngành cộng 80 giờ lao động chuyên gia.
- Nó tự lớn lên theo số trường sử dụng (cơ chế ở Mục 3.3), nên khoảng cách với người đến sau ngày càng xa.
- Nó không phụ thuộc vào công nghệ, nên vẫn còn giá trị kể cả khi phải viết lại toàn bộ phần mềm.

**Ba khuyến nghị bảo vệ:**

1. **Không xuất thư viện ra tệp mở.** Nhà trường xuất được báo cáo của mình, không xuất được bộ mệnh đề gốc.
2. **Ghi nguồn rõ ràng ở mỗi phiên bản thư viện** — mã phiên bản, ngày ban hành, căn cứ văn bản. Vừa để quản lý cấu hình, vừa là dấu vết chứng minh quyền tác giả.
3. **Cân nhắc công bố một phần nhỏ dưới dạng tài liệu chuyên môn miễn phí** — ví dụ bảng phân loại 5 nhóm từ khóa và bộ câu hỏi kiểm chứng. Phần này công bố ra sẽ xác lập vị thế chuyên môn của thầy trong ngành, trong khi phần có giá trị vận hành thật (600 mệnh đề với khóa minh chứng và mẫu câu) vẫn nằm trong sản phẩm. Đây đúng theo nguyên tắc "cho trước, nhận sau" đã nêu trong kế hoạch truyền thông PDT-EDUQA-2026-TT01.

---

## PHẦN VIII. BA RỦI RO MỚI DO CHÍNH CƠ CHẾ NÀY SINH RA

Phần này quan trọng ngang phần thiết kế. Mọi cơ chế đều có mặt trái, và mặt trái phải được nhìn thẳng trước khi viết dòng code đầu tiên.

### R1. Tick-box cũng có thể trở thành hình thức — RỦI RO NGHIÊM TRỌNG NHẤT

**Kịch bản xấu:** thư ký hội đồng mở màn hình, tick hết những ô nghe có vẻ đúng, gắn đại một minh chứng nào đó cho qua khóa, bấm sinh báo cáo. Kết quả: một báo cáo hình thức mới, lần này được sản xuất nhanh gấp mười lần. **Ta đã công nghiệp hóa căn bệnh thay vì chữa nó.**

Đây là rủi ro có thật và cần được xử lý bằng thiết kế, không bằng lời khuyên.

**Bốn biện pháp đối trị:**

1. **Khóa minh chứng phải kiểm tra ĐÚNG LOẠI, không chỉ kiểm tra có tệp.** Gắn một tệp bất kỳ không mở được ô yêu cầu quyết định phê duyệt của cấp trên. Điều này đòi hỏi minh chứng khi tải lên phải được phân loại — thêm một bước cho người dùng, nhưng là bước không thể bỏ.
2. **Ghi tên người tick, hiển thị công khai trong Phiếu và trong báo cáo nội bộ.** Tick không còn là thao tác vô danh mà là một lời khẳng định có chủ thể. Người đứng đầu chịu trách nhiệm trước pháp luật về tính trung thực — hệ thống nên làm cho trách nhiệm ấy hiện diện ở từng dòng.
3. **Cảnh báo mẫu hình bất thường.** Nếu một tiêu chí có toàn bộ mệnh đề được tick trong vòng dưới hai phút, hệ thống hiện một dòng nhắc nhẹ nhàng, không chặn: *"Tiêu chí này được hoàn thành rất nhanh. Thầy/cô có muốn xem lại phần nội hàm trước khi chuyển sang tiêu chí tiếp theo không?"* Nhắc chứ không phán xét.
4. **Chỉ số Độ đặc thù hiển thị liên tục** như một cái gương soi. Tick bừa sẽ cho chỉ số thấp vì thiếu dữ liệu riêng, và người dùng nhìn thấy điều đó ngay lập tức.

**Nhưng cần nói thẳng với thầy:** không có biện pháp kỹ thuật nào chữa được sự thiếu trung thực nếu người đứng đầu nhà trường không muốn làm thật. Phần mềm làm cho việc làm thật **dễ hơn** việc làm giả — đó là giới hạn của công nghệ. Phần còn lại thuộc về công tác tập huấn, thuộc về triết lý quản trị của hiệu trưởng, và đó chính là địa hạt mà PDT Academy mạnh nhất. **Đây là lý do sản phẩm phải được bán kèm dịch vụ tập huấn, không bao giờ bán phần mềm trần.**

### R2. Đồng phục hóa báo cáo trên diện rộng

**Kịch bản xấu:** năm trăm trường trong tỉnh dùng chung một thư viện. Đoàn đánh giá ngoài đọc đến báo cáo thứ mười thì nhận ra mọi báo cáo có cùng cấu trúc câu. Uy tín của trường giảm, và uy tín của công cụ giảm theo.

**Bốn biện pháp đối trị:**

1. **Mỗi mệnh đề có 3–5 biến thể mẫu câu**, chọn ngẫu nhiên có ghi nhớ theo từng cơ sở để một trường không dùng lẫn lộn nhiều văn phong.
2. **Bắt buộc dữ liệu riêng trong mọi câu** (khóa K2). Số quyết định, ngày tháng, số liệu của mỗi trường là khác nhau — đây là nguồn khác biệt tự nhiên và không thể giả.
3. **Ô "Nội dung khác của nhà trường" đặt ở vị trí ngang hàng với các ô gợi ý**, không đẩy xuống cuối như một tùy chọn phụ. Khuyến khích rõ ràng bằng một dòng gợi ý: *"Nhà trường có đặc thù nào khác không? Đây là chỗ đáng viết nhất."*
4. **Lớp 3 AI làm mượt văn phong** với nhiệt độ sinh vừa phải, tạo khác biệt tự nhiên ở tầng câu chữ mà không đụng đến nội dung.

**Một suy nghĩ thêm:** đồng phục về **cấu trúc** thực ra là điều tốt — nó giúp đoàn đánh giá ngoài đọc nhanh và so sánh được. Cái cần tránh là đồng phục về **nội dung**. Nếu mọi báo cáo đều theo đúng thứ tự nội hàm nhưng mỗi báo cáo kể một câu chuyện khác nhau với số liệu khác nhau, đó là kết quả lý tưởng chứ không phải vấn đề.

### R3. Thư viện lệch với văn bản sau khi văn bản thay đổi

Thông tư 57 đã bãi bỏ năm thông tư trước. Điều tương tự sẽ xảy ra với chính nó. Ngoài ra mỗi tỉnh có hướng dẫn riêng, mỗi năm học có hướng dẫn nhiệm vụ riêng.

**Biện pháp đối trị:**

- Mọi bảng thư viện đều có `bo_tieu_chuan_id` — đúng nguyên tắc dữ liệu hóa bộ tiêu chuẩn đã xác lập trong PDT-EDUQA-2026-V1.0 Mục 1.1.
- **Trường `trich_dan_goc` lưu nguyên văn quy định** trong bảng `noi_ham`. Khi văn bản đổi, so sánh nguyên văn cũ và mới sẽ chỉ ra chính xác nội hàm nào bị ảnh hưởng, thay vì phải rà lại toàn bộ 600 mệnh đề bằng tay.
- Thư viện có phiên bản riêng, độc lập với phiên bản bộ tiêu chuẩn — vì có thể sửa mệnh đề mà không sửa tiêu chí (ví dụ khi phát hiện một mệnh đề gây hiểu nhầm).
- **Cho phép lớp phủ theo địa phương:** Sở GDĐT của mỗi tỉnh có thể bổ sung mệnh đề riêng theo văn bản chỉ đạo của tỉnh mình, hiển thị kèm nhãn nguồn. Đây vừa là tính năng kỹ thuật, vừa là cửa vào để làm việc với các Sở — một Sở đã có mệnh đề riêng trong hệ thống là một Sở khó rời bỏ hệ thống.

---

## PHẦN IX. LỘ TRÌNH TÍCH HỢP VÀO KẾ HOẠCH 6 SPRINT

Module này không phải là một dự án riêng. Nó gắn vào lộ trình đã có trong PDT-EDUQA-2026-V1.0 như sau:

| Sprint | Nội dung đã có trong kế hoạch | Bổ sung cho module từ khóa |
|---|---|---|
| **S0** — Tuần 1 | Số hóa bộ tiêu chuẩn | Bổ sung: số hóa luôn tầng **nội hàm** cùng lúc, không tách làm hai đợt. Nhập nguyên văn `trich_dan_goc`. |
| **S1** — Tuần 2–3 | Schema 14 bảng + RLS | Thêm 5 bảng và 1 bảng nối ở Phần III. Làm ngay ở Sprint 1, **không để sau** — thêm bảng vào cơ sở dữ liệu đã có dữ liệu thật là việc rất tốn kém. |
| **S2** — Tuần 4–5 | Kho minh chứng | Bổ sung bắt buộc: **phân loại minh chứng khi tải lên** (`loai_minh_chung`). Không có phân loại thì khóa K1 vô nghĩa. Đây là thay đổi phạm vi cần thầy quyết ngay. |
| **S3** — Tuần 6–7 | Tự đánh giá + engine tính mức | **Đây là sprint chính của module.** Màn hình tick, sinh câu Lớp 1 và Lớp 2. Chưa cần AI. |
| **S4** — Tuần 8–9 | Xuất báo cáo | Bổ sung: xuất thêm **Phiếu xác định nội hàm** (Phụ lục 2) — gần như miễn phí vì dữ liệu đã có. |
| **S5** — Tuần 10–11 | Thí điểm trường thật | Đo chỉ số Độ đặc thù thực tế. So sánh số giờ công với cách làm cũ — đây là con số bán hàng. |
| **S6** — Tuần 12 | Ổn định và tài liệu | Bổ sung Lớp 3 (AI làm mượt) và Lớp 4 (so khớp). **Để AI ở cuối cùng, sau khi phần thuần toán đã chạy đúng.** |

**Khuyến nghị mạnh về thứ tự:** làm Lớp 1 và Lớp 2 trước, chạy thật ở một trường, rồi mới thêm AI. Nếu làm ngược lại, sẽ không bao giờ biết được giá trị đến từ cơ chế từ khóa hay đến từ AI — và khi có sự cố sẽ không biết gỡ ở đâu. Ngoài ra, một sản phẩm chạy đúng mà **chưa có AI** là một sản phẩm dễ bảo vệ hơn rất nhiều trước cơ quan quản lý.

### Ba việc cần làm ngay trong tuần này

1. **Cung cấp toàn văn Phụ lục II của Thông tư 57** (cơ sở giáo dục phổ thông) để Trí hoàn thiện thư viện từ khóa cho 8 tiêu chí bắt buộc.
2. **Quyết định về phạm vi Sprint 2** — có bổ sung phân loại minh chứng khi tải lên hay không. Đây là điều kiện cần của toàn bộ cơ chế khóa.
3. **Chọn một tiêu chí bắt buộc để làm mẫu hoàn chỉnh** (đề nghị 1.4, vì đây là tiêu chí về tự đánh giá và giải trình — làm mẫu ở chính tiêu chí nói về việc tự soi mình sẽ rất có ý nghĩa khi trình bày).

---

## PHẦN X. LƯU Ý VỀ TRÍCH DẪN PHÁP LÝ

Các số hiệu văn bản xuất hiện trong tài liệu này đều **lấy trực tiếp từ các tệp có trong kho tài liệu dự án**, không phải từ tra cứu bên ngoài:

| Văn bản | Nguồn trong dự án |
|---|---|
| Thông tư 18/2018/TT-BGDĐT ngày 22/8/2018 | tệp `18_2018_TT-BGDDT_367509.doc` và trích dẫn trong Hướng dẫn 1816 |
| Công văn 5932/BGDĐT-QLCL ngày 28/12/2018 | tệp `5932_BGDDT-QLCL_406782...doc` |
| Hướng dẫn 1816/SGDĐT-GDTrH ngày 26/7/2019 của Sở GDĐT Quảng Ninh | tệp `1816_HD cong tac kiem dinh CLGD-CQG theo TT18 -2019.docx` |
| Thông tư 57/2026/TT-BGDĐT ngày 07/7/2026 | phân tích trong `KE-HOACH-UNG-DUNG-KIEM-DINH-TT57.md` và `BAI-VIET-VA-CHECKLIST-TT57.md` do thầy cung cấp — **chưa có toàn văn Phụ lục trong kho** |

Trước khi đưa bất kỳ số hiệu nào vào tài liệu chính thức hoặc tài liệu bán hàng, đề nghị thầy đối chiếu lại với nguồn chính thức. Riêng nội dung 15 tiêu chí của Thông tư 57, tài liệu này **không suy đoán** và đã đánh dấu rõ những chỗ cần bổ sung.

---

## KẾT LUẬN

Điều thầy đề xuất — gợi ý từ khóa theo nội hàm để nhà trường lựa chọn — nhìn bề ngoài là một tính năng tiện lợi. Nhưng đọc kỹ Công văn 5932 và Hướng dẫn 1816 thì thấy nó là thứ khác hẳn: **nó là cách duy nhất để bước phân tích nội hàm, vốn bị bỏ trống suốt nhiều năm, được thực hiện thật.**

Bệnh hình thức trong báo cáo tiêu chí không nằm ở khâu viết. Nó nằm ở chỗ trước khi viết, không ai đủ thời gian và công cụ để trả lời câu hỏi *"tiêu chí này thực sự đòi hỏi điều gì ở trường tôi?"*. Khi câu hỏi đó bị bỏ qua, mọi thứ phía sau đều là hình thức, dù chữ nghĩa có đẹp đến đâu.

Cơ chế đề xuất trong tài liệu này làm ba việc, theo đúng thứ tự quan trọng:

1. **Trả lại bước phân tích nội hàm về đúng vị trí đầu tiên** của quy trình, và làm cho nó rẻ đến mức không ai có lý do bỏ qua.
2. **Buộc mỗi khẳng định phải có chứng cứ** trước khi nó được phép xuất hiện thành câu chữ — biến quy định "mỗi nhận định phải có minh chứng kèm theo" từ một lời nhắc thành một ràng buộc kỹ thuật.
3. **Đặt AI vào đúng chỗ của nó** — người biên tập văn phong, không phải người viết nội dung. Và ràng buộc điều đó bằng một phép so khớp mà máy kiểm được, không phải bằng một lời hứa.

Có một điều đáng nói thêm. Khi một tổ trưởng chuyên môn ngồi trước màn hình này, đọc nguyên văn yêu cầu của tiêu chí, nhìn năm nhóm từ khóa, và nhận ra trường mình luôn trống ở nhóm 4 và nhóm 5 — **người ấy vừa học được điều quan trọng nhất về quản trị chất lượng, mà không cần ai giảng.** Rằng có một thứ khác nhau giữa *có làm* và *có soi lại việc mình làm*, và khác nữa giữa *có soi lại* và *có tiến bộ đo được*.

Đó không còn là một phần mềm làm hồ sơ. Đó là một công cụ dạy nghề quản trị, ẩn dưới hình hài một biểu mẫu. Và với triết lý giáo dục tận gốc mà thầy theo đuổi, Trí nghĩ đó mới là chỗ sản phẩm này nên đứng.

---

*Tài liệu do Trí biên soạn trên cơ sở phân tích trực tiếp các văn bản trong kho tài liệu dự án. Nội dung 15 tiêu chí của Thông tư 57 chưa được suy đoán và cần bổ sung toàn văn Phụ lục để hoàn thiện thư viện từ khóa.*
