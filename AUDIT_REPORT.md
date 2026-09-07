# Bao cao kiem toan logic toan du an

Ngay kiem toan: 04/09/2026  
Pham vi: toan bo 22 trang, 11 tep API route, luong xac thuc, phan quyen, Supabase/PostgreSQL, Storage, xuat bao cao va bo kiem thu.  
Nguyen tac: chi ghi nhan van de co bang chung trong ma nguon. Noi dung chua the ket luan bang phan tich tinh duoc danh dau **Can kiem chung runtime** hoac **Can chu san pham xac nhan**.

## 1. Ket luan dieu hanh

Du an da co nen mong tot hon mot ban thu nghiem thong thuong: engine tinh muc ro rang, cac rang buoc danh gia quan trong duoc dua xuong PostgreSQL, RLS co bo test rieng, xuat bao cao da co cac dinh dang chinh, va build production thanh cong. Ket qua kiem thu hien tai la 123/123 unit/integration test va 306 phep kiem tra RLS deu dat.

Tuy nhien, du an **chua nen duoc coi la san sang van hanh chinh thuc** vi con hai loi P0:

1. Ban ghi bao cao da phe duyet la bat bien trong PostgreSQL, nhung tep trong Storage van co the bi ghi de hoac xoa boi mot so vai tro hop le.
2. Quan he minh chung - tieu chi khong gan voi `cap_hoc`, trong khi tu danh gia lai gan voi `cap_hoc`. O truong nhieu cap, viec luu mot cap co the thay doi tap minh chung cua cap khac va bao cao co the lay sai minh chung.

Khong co bang chung cho thay engine 4-15-8 dang tinh sai. Rui ro lon nhat nam o **pham vi du lieu**, **tinh bat bien cua snapshot**, va **tinh nhat quan cua trang thai client khi doi nam/cap hoc**.

## 2. Project Map

### 2.1 Kien truc

- Frontend: Next.js 16.3.1 App Router, React 19, TypeScript, Tailwind CSS.
- Backend: Next.js route handlers cho xuat tep, signed URL, finalize minh chung, quan sat he thong va health check.
- Du lieu: PostgreSQL qua Supabase, 38 migration; nghiep vu ghi quan trong dung RPC `security definer` va RLS.
- Xac thuc: Supabase Auth; ho so noi bo tai `nguoi_dung`; vai tro nhieu-nhieu qua `nguoi_dung_vai_tro`.
- Luu tep: Supabase Storage voi bucket rieng tu va signed URL co thoi han.
- Trien khai: OpenNext tren Cloudflare Workers.
- Trang thai chia se: khong co global state store; cac workspace tu tai `co_so_id`, nam hoc, cap hoc va quyen tu Supabase. `ApplicationShell` loc menu theo vai tro.

### 2.2 Vai tro va mo hinh quyen

He thong khai bao bay vai tro: `SYSTEM_ADMIN`, `PRINCIPAL`, `SELF_ASSESSMENT_CHAIR`, `SECRETARY`, `MEMBER`, `TEACHER`, `VIEWER` tai `lib/auth/navigation.ts:30-43` va cac migration phan quyen.

- `SYSTEM_ADMIN`: quan ly du lieu tham chieu va ho tro tao don vi.
- `PRINCIPAL`: quan ly toan don vi, phe duyet.
- `SELF_ASSESSMENT_CHAIR`: phan cong, chot noi dung/muc.
- `SECRETARY`: tong hop, bao cao, minh chung.
- `MEMBER`: lam viec tren tieu chi duoc phan cong.
- `TEACHER`: nop minh chung trong pham vi duoc giao.
- `VIEWER`: xem bao cao da phe duyet.

Menu chi la lop trai nghiem nguoi dung. Quyen du lieu that duoc ky vong thuc thi bang RLS/RPC trong CSDL. Hien tai chua co route guard tap trung cho trang, xem Finding F-017.

### 2.3 Thuc the du lieu chinh

- Nen tang: `co_so_giao_duc`, `nam_hoc`, `nguoi_dung`, `vai_tro`, `nguoi_dung_vai_tro`, `quyen`, `vai_tro_quyen`, `nhat_ky_truy_cap`.
- Bo tieu chuan co phien ban: `bo_tieu_chuan`, `tieu_chuan`, `tieu_chi`, `muc_tieu_chi`, `minh_chung_goi_y`, `chi_so_dinh_luong`.
- Nghiep vu: `minh_chung`, `minh_chung_tieu_chi`, `tu_danh_gia`, `lich_su_tu_danh_gia`, `ke_hoach_cai_tien`, `so_lieu_dinh_luong`, `phan_cong_tieu_chi`.
- Hoi dong/bao cao: `hoi_dong_tu_danh_gia`, `thanh_vien_hoi_dong`, `bao_cao`, `nhan_xet_tieu_chuan`, `noi_dung_mau_2`.
- Ho tro van hanh: `van_ban_lien_quan`, `dot_import`, `dong_import`, `loi_moi_thanh_vien`, `gioi_han_api`.
- View nghiep vu: `v_tieu_chi_nam_hoc`, `v_minh_chung_hop_le_danh_gia`.

### 2.4 Luong nghiep vu chinh

1. Quan tri tao don vi va nam hoc, moi nguoi dung, gan vai tro va phan cong tieu chi.
2. Nguoi dung tai len hoac dan lien ket minh chung, cap mot ma duy nhat, gan N-N voi tieu chi.
3. Nguoi co tham quyen xac minh minh chung; chi minh chung hop le moi neo cho tu danh gia/bao cao.
4. Thanh vien nhap mo ta Muc 1/Muc 2 va gan minh chung; RPC luu atomic va trigger kiem tra dieu kien dat.
5. Hoi dong duyet noi dung; engine tong hop muc theo 4-15-8 va lay muc thap nhat voi truong nhieu cap.
6. Ke hoach cai tien va nhan xet tieu chuan bo sung du lieu cho Mau 1/Mau 2.
7. He thong sinh DOCX/XLSX/ZIP/JSON; bao cao chinh thuc duoc tai len Storage va phe duyet thanh snapshot.
8. Khach co quyen chi doc xem bao cao da phe duyet qua signed URL.

### 2.5 Quy tac nghiep vu cot loi da xac minh trong ma

- 8 tieu chi bat buoc va 7 tieu chi con lai duoc tinh theo dieu kien Muc 1/Muc 2 tai `lib/assessment/level-engine.ts:43-60,142-190`.
- Truong nhieu cap lay muc thap nhat tai `lib/assessment/level-engine.ts:206-244`.
- Khong dat Muc 2 khi Muc 1 chua dat; khong dat neu thieu mo ta/minh chung hop le; trigger active tai `supabase/migrations/018_standard_versioning.sql:309-350`.
- Minh chung co mot ma va co the dung cho nhieu tieu chi qua `minh_chung_tieu_chi`.
- Du lieu tieu chuan duoc gan theo phien ban nam hoc qua `v_tieu_chi_nam_hoc`.
- Bao cao da phe duyet khong duoc sua/xoa ban ghi tai `supabase/migrations/020_write_flow_report_transactions.sql:452-474`.

## 3. Ket qua kiem chung

| Hang muc | Ket qua | Ghi chu |
|---|---:|---|
| `npm test` | Dat | 26 tep, 123/123 test dat trong 37,41 giay. Co warning `--localstorage-file` tu worker test. |
| `npm run lint` | Dat | Khong co loi lint. |
| `npm run typecheck` | Dat | Khong co loi TypeScript. |
| `npm run build` | Dat | Next.js production build thanh cong; canh bao `middleware.ts` da deprecated tren Next 16. |
| `npm run test:rls` | Dat | 18 tep, 306 phep kiem tra RLS dat tren Supabase local. |
| `npm run test:e2e` | Dat mot phan | 6 test dat, 12 test bi skip. Cac luong vai tro va pilot data chua duoc chay do thieu credential/release gate. |
| Tim marker viec dang do | Khong thay | Khong tim thay marker cong viec dang de lai trong ma nguon. |

## 4. Master Findings Table

| ID | Page / Feature | Workflow | Problem | Expected Behavior | Current Behavior | Root Cause | Severity | Files Involved | Recommended Fix |
|---|---|---|---|---|---|---|---|---|---|
| F-001 | Bao cao da phe duyet | Phe duyet -> luu snapshot -> tai lai | Tep snapshot co the bi ghi de hoac xoa sau phe duyet, trong khi ban ghi DB bi khoa. | Ca metadata va object phai bat bien; tai lai phai dung dung byte da phe duyet. | Policy Storage cho `report.export` UPDATE va `PRINCIPAL` DELETE object. Trigger chi khoa hang `bao_cao`; metadata gate chi kiem tra object ton tai. | Rang buoc bat bien bi chia cat giua PostgreSQL va Storage, khong co policy noi hai phan. | **P0** | `supabase/migrations/015_security_and_report_snapshot.sql:440-459`<br>`supabase/migrations/020_write_flow_report_transactions.sql:452-474`<br>`supabase/migrations/022_report_snapshot_storage_gate.sql:9-24`<br>`components/reports/approved-report-detail.tsx:65-83,139-160` | Cam UPDATE/DELETE object dang duoc ban ghi `da_phe_duyet` tham chieu; dung duong dan append-only; them test Storage RLS va kiem tra SHA-256 khi tai/xem. |
| F-002 | Tu danh gia va bao cao truong nhieu cap | Luu minh chung cho tieu chi theo cap hoc | Tap minh chung cua tu danh gia khong co pham vi `cap_hoc`. Luu cap A co the them/xoa lien ket ma cap B dang dung. | Moi ban ghi tu danh gia theo cap phai co tap minh chung rieng, van tai su dung cung mot ma/tap tin. | `minh_chung_tieu_chi` chi co cap minh chung-tieu chi; RPC nhan `p_cap_hoc` nhung insert/delete lien ket toan cuc; report noi evidence vao tieu chi khong loc cap. | Mo hinh quan he thieu lop gan minh chung voi ban ghi `tu_danh_gia`. | **P0** | `supabase/migrations/001_init.sql:211-220,226-252`<br>`supabase/migrations/020_write_flow_report_transactions.sql:141-149,194-235`<br>`components/assessment/assessment-workspace.tsx:253-303`<br>`lib/reports/data.ts:339-373` | Giu `minh_chung_tieu_chi` lam ma tran tai su dung; them `tu_danh_gia_minh_chung(tu_danh_gia_id, minh_chung_id, ...)`; migrate du lieu, sua RPC/report/readiness/RLS va test hai cap. |
| F-003 | `/dashboard` | Xem muc toan truong | Dashboard gan nhan ket qua toan truong nhung chi tinh cap hoc dau tien. | Tong quan phai tinh moi cap va lay muc thap nhat. | Component loc `tu_danh_gia` theo mot `selectedCapHoc` va goi engine mot cap. | Thieu phep tong hop `xacDinhMucToanTruong` trong luong dashboard. | **P1** | `components/dashboard/dashboard-workspace.tsx:49,69,100-107,185-190` | Tai ket qua tat ca cap thuoc don vi, tinh tung cap va tong hop toan truong; hien ro ket qua tung cap. |
| F-004 | `/tu-danh-gia` What-if | Mo phong muc toan truong | Ket qua What-if toan truong lap lai cung mot tap ket qua cho moi cap. | Chi cap duoc chon thay doi gia dinh; cac cap con lai dung du lieu that rieng. | `capHocList.map` goi ket qua hien tai chung cho moi cap, ngoai cap duoc chon. | State chi giu 15 ket qua cua cap dang xem, khong co snapshot theo cap. | **P1** | `components/assessment/assessment-workspace.tsx:415-420` | Luu/tai `Record<cap_hoc, KetQuaTieuChi[]>`; ap dung gia dinh vao dung cap roi goi engine toan truong. |
| F-005 | `/viec-cua-toi` | Xem tien do phan cong | Ket qua tu danh gia khong duoc tach theo cap; giao vien duoc dan den trang ho khong co quyen. | Moi viec phai hien dung cap hoc va dich den phu hop vai tro. | Query lay moi cap, `.find` chi theo `tieu_chi_id`; lien ket mo `/tu-danh-gia` cho `TEACHER`, trong khi menu/RLS khong cho ho doc/ghi tu danh gia. | Khoa tra cuu thieu `cap_hoc`; mapping action khong dung chung capability model. | **P1** | `components/tasks/my-work-workspace.tsx:108-143,264-270`<br>`lib/auth/navigation.ts:37`<br>`supabase/migrations/010_permission_hardening_appendix_b.sql:25-33,103-126` | Them cap hoc vao assignment/view model; dung cung bo capability de chon CTA theo vai tro; test MEMBER va TEACHER. |
| F-006 | `/tu-danh-gia` | Doi cap hoc nhanh | Response cua cap cu co the ghi de state cap moi. | Chi response gan voi scope hien tai duoc cap nhat giao dien. | Ham tai bat dong bo khong co request token/abort va khong xoa state khi scope doi. | State nam/cap va lifecycle request khong duoc dieu phoi. | **P1** | `components/assessment/assessment-workspace.tsx:121-127,253-303,345-393` | Dung scope key/AbortController; bo qua response het han; reset loading/data theo scope. |
| F-007 | `/tu-danh-gia/cho-duyet` | Duyet tu danh gia | RPC khong rang buoc transition tu `cho_duyet` va khong co optimistic concurrency; UI gui nam dang chon thay vi nam cua hang. | Chi hang dang cho duyet dung nam/cap moi duoc duyet; ban stale bi tu choi. | Principal co the chuyen trang thai tu draft bang RPC truc tiep; lan ghi sau cung thang; doi nam khi danh sach cu con hien co the gui sai `nam_hoc_id`. | Thieu state machine va expected version/`updated_at`; DTO hang thieu `nam_hoc_id`. | **P1** | `components/assessment/assessment-approval-workspace.tsx:21-35,75-117`<br>`supabase/migrations/014_role_scope_workflows.sql:89-152` | Them `nam_hoc_id`, expected revision va transition hop le vao RPC; khoa giao dich; reload khi scope doi; test stale approve va draft -> approved. |
| F-008 | `/tu-danh-gia/cho-duyet` | Kiem tra truoc khi chot | Man duyet khong hien thi danh sach/tep minh chung du thong diep yeu cau doi chieu. | Nguoi duyet xem duoc ma, tieu chi, trang thai, ngay het han va tep signed URL truoc khi chot. | Query/UI chi hien mo ta Muc 1/Muc 2. | Luong duyet chua join bang gan minh chung va Storage. | **P1** | `components/assessment/assessment-approval-workspace.tsx:75-83,181-225` | Tai evidence theo ban tu danh gia; hien chi tiet va signed URL; chan duyet khi evidence khong con hop le. |
| F-009 | `/bo-tieu-chuan` | Xem bo tieu chuan hien hanh | Trang chon bo co version cao nhat theo loai hinh, khong dung bo nam hoc dang hoat dong va khong loc trang thai. | Noi dung phai dung `nam_hoc.bo_tieu_chuan_id` cua scope dang xem. | Query sap xep `version desc limit 1`; mot ban draft/moi hon co the duoc hien. | Trang tham chieu bo qua truc phien ban nam hoc da co trong schema. | **P1** | `components/standards/standards-workspace.tsx:81-135` | Lay bo tieu chuan qua nam hoc dang chon/view `v_tieu_chi_nam_hoc`; hien nhan phien ban va trang thai. |
| F-010 | Xuat va phe duyet bao cao | Sinh tep -> upload -> phe duyet | Du lieu co the thay doi giua luc sinh tep va luc phe duyet; readiness duoc tinh lai nhung khong chung minh tep vua upload phan anh revision hien tai. | Phe duyet phai seal cung mot revision/digest nguon da dung de sinh tep. | Client sinh/upload/hash truoc, sau do RPC chi kiem tra readiness hien tai; khong so sanh source revision. | Thieu snapshot manifest hoac source revision mang tinh giao dich. | **P1** | `components/reports/report-export-workspace.tsx:448-483,531-574`<br>`supabase/migrations/020_write_flow_report_transactions.sql:520-584` | Tao manifest/digest nguon o server; export gan revision; RPC phe duyet tu choi neu revision da doi; bo sung concurrency E2E. |
| F-011 | Cac API xuat bao cao | Chon cap hoc de xuat | API chi validate enum, khong kiem tra cap thuoc `co_so_giao_duc.cap_hoc`. | Chi cap hoc da khai bao cua don vi moi duoc xuat. | Bat ky enum hop le nao cung qua validation va collector van truy van. | Validation request khong ket hop rang buoc tenant metadata. | **P1** | `lib/reports/routes.ts:63-77`<br>`lib/reports/data.ts:196-237` | Sau khi tai school, kiem tra `school.cap_hoc.includes(capHoc)` va tra 422 co ma loi on dinh. |
| F-012 | `/minh-chung`, `/minh-chung/tao` | Dung lai minh chung cu | Danh sach dung lai chi co 100 minh chung moi nhat. | Nguoi dung tim va chon duoc moi minh chung hop le trong kho ma khong tao ban sao. | Query `.limit(100)` va dropdown chi render tap nay. | Truy van dung lai khong co search/pagination phia server. | **P1** | `components/evidence/evidence-workspace.tsx:228-230,668-683` | Tao combobox tim kiem server-side co phan trang; lookup theo ma/ten; luon tai record da chon. |
| F-013 | Finalize minh chung | Upload -> finalize -> don rac khi loi | Neu server da commit nhung response bi mat, client bao that bai; lan thu lai co the tao minh chung trung. | Finalize phai idempotent va client co the truy van ket qua bang request key. | Client co gang xoa object khi fetch loi; policy giu object neu DB da tham chieu, nhung UI khong biet commit da thanh cong. | Giao thuc hai buoc khong co idempotency key/trang thai reconcile. | **P1** | `components/evidence/evidence-workspace.tsx:534-613`<br>`supabase/migrations/036_sprint15_storage_hardening.sql:608-632`<br>`app/api/minh-chung/finalize/route.ts:141` | Gui idempotency key; dat UNIQUE; response/retry tra lai cung record; sau network error truy van status truoc khi bao that bai. |
| F-014 | `/hoi-dong-tu-danh-gia` | Them thanh vien hoi dong | DB cho phep gan `nguoi_dung_id` cua don vi khac vao hoi dong. | Thanh vien phai thuoc cung `co_so_id` voi hoi dong. | FK chi kiem tra nguoi dung ton tai; RLS kiem tra hoi dong dich, khong kiem tra tenant cua thanh vien. | Thieu composite FK/trigger bat bien tenant. | **P1** | `supabase/migrations/001_init.sql:333-341`<br>`supabase/migrations/015_security_and_report_snapshot.sql:253-280` | Them trigger/composite invariant cung don vi; validate trang thai nguoi dung; test insert/update cross-tenant. |
| F-015 | `/thiet-lap` | Tao don vi/nam hoc | Cho phep ten rong, danh sach cap rong hoac cap khong phu hop loai hinh. | Metadata tenant phai co ten, cap hop le va tap cap tuong thich loai hinh. | UI hien moi cap cho moi loai hinh va co the bo chon het; RPC chu yeu trim chuoi. | Validation UI/DB chua co schema nghiep vu chung. | **P1** | `components/settings/school-year-setup.tsx:95-101,565-581`<br>`supabase/migrations/026_member_invitation_onboarding.sql:176-223` | Dinh nghia ma tran loai hinh-cap hoc; validate bang schema dung chung va constraint/RPC DB. |
| F-016 | Kiem thu E2E | Xac minh vai tro va release gate | 12/18 test E2E bi skip, gom cac hanh trinh vai tro va pilot data. | CI production gate phai chay day du tren staging voi du lieu co kiem soat. | Test tu skip khi thieu credential hoac release gate false. | Moi truong CI chua cap bo tai khoan staging/du lieu gate. | **P1** | `e2e/helpers/auth.ts:14-15`<br>`e2e/role-journeys.spec.ts:16-18,77-81`<br>`e2e/responsive-accessibility.spec.ts:38`<br>`e2e/pilot-role-validation.spec.ts:15,19` | Tao fixture/tai khoan staging rieng, secret CI va gate bat buoc; fail thay vi skip tren nhanh release. |
| F-017 | Tat ca trang da dang nhap | Mo URL truc tiep | Khong co route-level capability guard; shell chi an menu va van render `children`. | URL khong thuoc quyen phai redirect/403 truoc khi render workspace. | Nguoi dung co the mo truc tiep moi route; RLS chi la lop cuoi bao ve du lieu. | Phan quyen giao dien chi nam o navigation filter; middleware chi gan request ID cho API. | **P2** | `components/layout/application-shell.tsx:45,51-75,137-184`<br>`middleware.ts:7-24`<br>`lib/auth/navigation.ts:30-43` | Tao capability map dung chung va server/layout guard; giu RLS lam enforcement cuoi. |
| F-018 | `/login` | Dang nhap theo vai tro | Moi tai khoan deu bi day den `/thiet-lap`; copy cu van noi tai khoan moi se tao don vi/nam hoc. | Redirect den trang dau tien duoc phep; dang ky thong thuong phai theo loi moi. | `router.push('/thiet-lap')`; nhieu vai tro khong co quyen trang nay. Luong tu khoi tao cu da bi thu hoi. | Redirect/copy khong cap nhat theo onboarding moi. | **P2** | `components/auth/login-form.tsx:118-140`<br>`app/login/page.tsx:21-23`<br>`lib/auth/navigation.ts:30-43`<br>`supabase/migrations/026_member_invitation_onboarding.sql:255-258`<br>`README.md:54-58` | Resolve landing route tu capability; sua copy theo invite; them test dang nhap tung vai tro. |
| F-019 | `/minh-chung/suc-khoe` | Tong hop suc khoe kho | Vai tro bi RLS gioi han co the thay tong so/toan bo tieu chi sai; loi query bi bo qua. | Chi hien metric co pham vi ro rang hoac gioi han trang cho vai tro quan ly; loi phai co error state. | Component tinh tong tu tap record RLS-filtered va khong kiem tra `error` cua nhieu query. | Aggregation phia client khong biet du lieu da bi gioi han. | **P2** | `components/evidence/evidence-health.tsx:50-140`<br>`components/evidence/evidence-subnav.tsx:11-48` | Dung RPC tong hop co scope/quyen; chan trang theo capability; xu ly tung loi truy van. |
| F-020 | `/minh-chung/xac-minh` | Duyet danh sach lon | Man xac minh tai toan bo record va hien nut hanh dong khong dua tren capability. | Phan trang 25 record va chi hien action khi co quyen. | Query nested khong `.range`; UI luon render nut Tu choi/Xac minh cho record phu hop trang thai. | Trang chua dung pagination/capability chung. | **P2** | `components/evidence/evidence-verification-workspace.tsx:115-147,359-384`<br>`README.md:66-68` | Them server pagination, tong so, URL state; capability gate cho action; test role secretary/teacher. |
| F-021 | `/minh-chung`, `/minh-chung/[id]` | Tim va tai lien ket tieu chi | Chuoi tim kiem duoc noi truc tiep vao PostgREST `.or`; loi query lien ket phu bi bo qua. | Ky tu dac biet khong lam hong filter; bat ky truy van phu nao loi deu hien trang thai ro. | Dau phay/ngoac co the tao filter sai; danh sach/chi tiet co the hien thieu tieu chi ma khong bao loi. | Thieu builder/escape va first-error aggregation. | **P2** | `components/evidence/evidence-workspace.tsx:215-217,241-260`<br>`components/evidence/evidence-detail.tsx:56-63` | Escape/normalize PostgREST search hoac RPC search; kiem tra moi `error`; test ky tu dac biet. |
| F-022 | `/hoi-dong-tu-danh-gia` | Doi nam hoc nhanh | State hoi dong cu co the con lai va bi update duoi nam moi. | Doi nam phai reset/load dung council cua nam do; response cu khong duoc overwrite. | Khong cancellation/request token; `saveCouncil` update theo `council.id` dang giu; ten mac dinh dung active year. | Scope state va entity state bi tach roi. | **P2** | `components/council/council-workspace.tsx:46-158,261-273` | Dung scope-keyed loader; reset entity truoc khi tai; xac minh council nam hien tai tai DB/RPC. |
| F-023 | `/ke-hoach-cai-tien` | Doi nam/cap va luu | Response cu co the ghi de; tieu chi da chon co the thuoc scope truoc. | Moi selection phai thuoc bo tieu chuan cua nam/cap dang xem. | Nhieu effect doc lap khong token/reset; `selectedCriterionId` chi khoi tao khi rong. | Thieu state machine scope dung chung. | **P2** | `components/improvement/improvement-plan-workspace.tsx:110-244,246-319` | Gom loader theo scope; reset selection; validate criterion-year trong RPC; test doi scope nhanh. |
| F-024 | `/ke-hoach-cai-tien` | Quan ly ke hoach | Nguoi dung chi tao va doi trang thai, khong sua/xoa noi dung da nhap. | Vai tro co quyen can chinh sua co kiem soat va soft-delete/audit neu nghiep vu yeu cau. | UI chi INSERT va UPDATE `muc_do_thuc_hien`. | CRUD chua day du so voi entity va luong van hanh. | **P2** | `components/improvement/improvement-plan-workspace.tsx:284-339,469-534` | Them edit form va soft-delete co audit, RLS/RPC; neu chu san pham khong cho xoa thi khoa bang rule ro rang. |
| F-025 | `/bao-cao` | Doi nam/cap, nhap nhan xet | Cac request doc lap co the tra ve lech scope; sau do save ghi du lieu cu vao scope moi. | Giao dien va payload luon cung mot scope key. | Nhieu effect tai truong/nam/nhan xet/bao cao doc lap, khong abort/token/reset. | State nam/cap khong duoc quan ly nhu mot aggregate. | **P2** | `components/reports/report-export-workspace.tsx:206-445`<br>`supabase/migrations/005_report_module.sql:37-50` | Tao loader scope duy nhat; khoa save den khi scope load xong; them version guard cho nhan xet. |
| F-026 | `/bao-cao` | Gui duyet/phe duyet/tra lai | Moi nguoi vao duoc trang deu thay action nhap, gui, phe duyet; UI khong co luong `tra_lai` du handler ho tro. | Action hien theo permission va state machine; co nut tra lai kem ly do. | DB tu choi vai tro sai, nhung UI van cho thao tac; pending state khong gom `tra_lai`. | UI khong dung permission matrix va state transition chung. | **P2** | `components/reports/report-export-workspace.tsx:507,703-780`<br>`supabase/migrations/020_write_flow_report_transactions.sql:523-529` | Capability/state-driven action bar; them return flow va reason; test tat ca vai tro/trang thai. |
| F-027 | `/bao-cao/da-phe-duyet` | Xem lich su snapshot | Danh sach tai tat ca record va co the bi response cu overwrite khi doi scope. | Co phan trang va request scope on dinh. | Khong `.range`, khong request token. | Trang chua dung pagination/loader chung. | **P2** | `components/reports/approved-reports-workspace.tsx:30-71,163-196` | Them pagination URL-based va scope token; test 100+ report. |
| F-028 | `/van-ban-lien-quan` | Quan ly van ban | Chi co tao; khong sua/xoa. DB khong rang buoc protocol URL hoac thu tu ngay. | Du lieu co the duoc cap nhat an toan; link/date hop le. | UI INSERT-only; DB cho chuoi URL bat ky va ngay het hieu luc truoc ngay hieu luc. | CRUD va constraint nghiep vu chua day du. | **P2** | `components/legal/related-documents-workspace.tsx:73-114,200-233`<br>`supabase/migrations/003_hardening.sql:3-17` | Them edit/archive, URL validator, date constraint va audit. |
| F-029 | `/thiet-lap` phan cong | Gan nguoi vao tieu chi | RPC chi kiem tra cung tenant, khong bat buoc nguoi dung active hay vai tro duoc phep. | Chi thanh vien dang hoat dong va role hop le moi duoc phan cong. | Caller truc tiep co the gan `VIEWER`/tai khoan inactive voi chuoi role tuy y. | DB thieu invariant cho assignment target/role. | **P2** | `components/settings/school-year-setup.tsx:234-239,1016-1018`<br>`supabase/migrations/035_sprint14_evidence_code_versioning.sql:406-492` | Validate status va allowlist role trong RPC; FK/enum neu phu hop; test invalid role/inactive. |
| F-030 | API observability | Gui canh bao auth/storage | Endpoint client alert khong xac thuc, chi kiem tra same-origin va khong rate limit. | Chi su kien duoc xac thuc/ky va gioi han tan suat moi duoc day vao kenh canh bao. | Client co the gia `Origin` va goi lap de spam alert. | Same-origin khong phai authentication; thieu rate limit/challenge. | **P2** | `app/api/observability/auth-failure/route.ts:19-58`<br>`app/api/observability/storage-failure/route.ts:21-61`<br>`lib/observability/request-context.ts:25-38` | Rate limit theo IP/session, schema nghiem ngat, token/challenge phu hop; gop su kien va redact. |
| F-031 | `/api/health` | Kiem tra san sang production | Health check chi goi Supabase Auth, khong phat hien DB/PostgREST hay Storage hong. | Readiness phan anh moi dependency bat buoc. | Auth thanh cong co the tra healthy du DB/Storage khong dung duoc. | Probe qua nong. | **P2** | `app/api/health/route.ts:13-69` | Tach liveness/readiness; query DB nhe va probe Storage metadata co timeout; khong ro ri secret. |
| F-032 | `/nhat-ky` va cac luong minh chung | Ghi/hien thi audit | Copy noi doc duoc ghi lai trong khi DB chu dich chi ghi mutation; mapping thieu nhieu ma hanh dong va fallback lo chuoi ky thuat. | Trang chi mo ta hanh dong ghi/phe duyet, moi code co nhan tieng Viet on dinh. | Migration no-op read/export; UI van liet ke nhan read va fallback tu DB code. Mot so caller van goi RPC doc cu. | Hop dong audit thay doi nhung UI/caller tai su dung chua duoc don dong bo. | **P2** | `components/audit/audit-log-workspace.tsx:25-68`<br>`app/nhat-ky/page.tsx:11`<br>`supabase/migrations/031_mutation_only_audit.sql:1-73`<br>`components/evidence/evidence-detail.tsx:65-73`<br>`components/evidence/evidence-health.tsx:129-140`<br>`app/api/minh-chung/[id]/signed-url/route.ts:96-107` | Xoa caller read audit; lap mapping day du cho mutation code; dung metadata hien thi da dich. |
| F-033 | `/quen-mat-khau` | Khoi phuc mat khau | **Can kiem chung runtime:** che do dat mat khau moi duoc suy ra tu query/hash thay vi xac minh recovery session. | Chi cho update password khi Supabase session da duoc trao doi va co recovery event hop le. | Component tu phan loai URL; Supabase client co the tu exchange nhung chua co E2E xac minh. | State machine recovery phu thuoc URL heuristic. | **P3** | `components/auth/password-reset-form.tsx:23-36,70-94` | Lang nghe auth recovery event/session, test link hop le/het han/da dung. |
| F-034 | Dang xuat | Logout | Loi `signOut` bi bo qua va van redirect. | Neu xoa session that bai, UI phai thong bao va/hoac xoa state cuc bo co kiem soat. | `await signOut()` khong kiem tra `error`, sau do redirect. | Thieu xu ly response Supabase. | **P3** | `components/auth/logout-button.tsx:21-30` | Kiem tra error, dat pending state va test offline/expired session. |
| F-035 | Middleware | Request ID | Next.js 16 canh bao convention `middleware.ts` deprecated. | Dung convention `proxy` hien tai de tranh hong o ban nang cap. | Build van dat nhung phat warning. | Ky thuat framework da doi. | **P3** | `middleware.ts:7-24` | Migrate theo tai lieu Next.js trong `node_modules/next/dist/docs`; giu test request ID. |
| F-036 | Tai lieu phan quyen | Huong dan theo vai tro | Tai lieu luong man hinh cho `TEACHER` vao tu danh gia, mau thuan voi nav/RLS va Phu luc B. | Mot ma tran quyen la nguon su that duy nhat cho code/test/docs. | Hai tai lieu noi khac nhau. | Tai lieu duoc duy tri thu cong. | **P3** | `docs/luong-man-hinh-theo-vai-tro.md:31-35`<br>`docs/phan-quyen-phu-luc-b.md:14,20`<br>`lib/auth/navigation.ts:37` | Chot rule voi chu san pham; sinh bang tai lieu/test tu capability map. |
| F-037 | Khoi tao production | Tao SYSTEM_ADMIN dau tien | **Can kiem chung runtime:** repo khong co runbook/bootstrap tong quat cho admin production; seed hien co danh cho UAT. | Co quy trinh mot lan, audit duoc, khong hardcode secret de tao admin dau tien. | RPC tao don vi yeu cau da la SYSTEM_ADMIN; seed staging khong phai quy trinh production. | Thieu bootstrap/runbook van hanh. | **P3** | `supabase/uat/seed_staging_roles.sql:9-30`<br>`supabase/migrations/026_member_invitation_onboarding.sql:196-197` | Viet runbook SQL/CLI co xac minh email, grant mot lan, rotate/xoa quyen bootstrap va ghi audit. |
| F-038 | Cong phe duyet bao cao | Phe duyet cac artifact | **Can chu san pham xac nhan:** gate readiness chung duoc ap cho JSON/XLSX/ZIP nhu Mau 1/Mau 2. | Moi loai artifact chi chiu cac dieu kien phe duyet dung nghiep vu cua no. | Phan chung kiem 15 tieu chi, mo ta, minh chung va hoi dong truoc khi nhanh loai Mau 1/Mau 2. | Rule approval cho artifact ho tro chua duoc dac ta ro. | **P2** | `supabase/migrations/020_write_flow_report_transactions.sql:307-438`<br>`components/reports/report-export-workspace.tsx:507-594` | Chu san pham quyet dinh artifact nao la bao cao chinh thuc; tach readiness theo loai va test tung ma tran. |
| F-039 | Hoi dong TĐG | Phan cong thanh vien | **Can chu san pham xac nhan:** `SECRETARY` duoc DB cho sua hoi dong, trong khi Phu luc B giao phan cong cho Chu tich. | Quyen ghi hoi dong phai trung voi quyet dinh nghiep vu. | Helper management gom `SECRETARY`; policy hoi dong dung helper nay. | Nhom quyen quan ly qua rong cho resource hoi dong. | **P2** | `supabase/migrations/010_permission_hardening_appendix_b.sql:35-46`<br>`supabase/migrations/015_security_and_report_snapshot.sql:67-79`<br>`lib/auth/navigation.ts:39` | Xac nhan rule; neu chi Chair/Principal duoc phan cong, tao permission rieng va thu hep RLS/UI. |

## 5. Trang va tinh nang

| Page / Feature | Muc dich | Trang thai | Rui ro | Finding | Ghi chu |
|---|---|---|---|---|---|
| `/` | Landing page cong khai | Working | Low | - | Khong thay loi logic dang ke. |
| `/login` | Dang nhap/dang ky theo loi moi | Partial | Med | F-018, F-030 | Auth co ket noi Supabase; redirect/copy theo role chua dung. |
| `/quen-mat-khau` | Gui link va dat lai mat khau | Partial | Med | F-033 | Can E2E voi recovery link that. |
| `/quyen-rieng-tu` | Cong bo quyen rieng tu | Working | Low | - | Khong thay loi logic dang ke. |
| `/dashboard` | Tong quan muc chat luong | Partial | High | F-003, F-017 | Ket qua toan truong sai voi don vi nhieu cap. |
| `/viec-cua-toi` | Cong viec/phan cong ca nhan | Partial | High | F-005, F-017 | Sai scope cap hoc va CTA TEACHER. |
| `/bo-tieu-chuan` | Xem tieu chuan/yeu cau theo phien ban | Partial | High | F-009, F-017 | Co the hien version khong gan nam hoc. |
| `/minh-chung` | Danh sach, loc, tai su dung minh chung | Partial | High | F-012, F-013, F-017, F-019, F-021 | Luong co ban hoat dong; 100+ record va loi mang con rui ro. |
| `/minh-chung/tao` | Tao minh chung moi | Partial | High | F-012, F-013, F-017 | Finalize chua idempotent. |
| `/minh-chung/[id]` | Xem chi tiet va tep minh chung | Partial | Med | F-017, F-021, F-032 | Co signed URL; loi lien ket phu co the bi an. |
| `/minh-chung/suc-khoe` | Canh bao het han/trung/mo coi/tieu chi rong | Partial | High | F-017, F-019, F-032 | Tong hop co the sai voi user bi han che. |
| `/minh-chung/xac-minh` | Xem chi tiet va xac minh minh chung | Partial | High | F-017, F-020 | Co chi tiet/tep; thieu pagination va action guard. |
| `/tu-danh-gia` | Nhap hien trang, minh chung, Gap Board, What-if | Partial | Critical | F-002, F-004, F-006, F-017 | Don cap co the dung; nhieu cap khong dam bao dung. |
| `/tu-danh-gia/cho-duyet` | Duyet noi dung tu danh gia | Partial | High | F-007, F-008, F-017 | Thieu evidence va concurrency/transition guard. |
| `/ke-hoach-cai-tien` | Lap/theo doi ke hoach cai tien | Partial | High | F-017, F-023, F-024 | Tao/status co; CRUD va scope chua day du. |
| `/hoi-dong-tu-danh-gia` | Lap hoi dong va thanh vien | Partial | High | F-014, F-017, F-022, F-039 | Co cross-tenant invariant gap. |
| `/bao-cao` | Chuan bi, xuat, gui va phe duyet bao cao | Partial | Critical | F-001, F-002, F-010, F-011, F-017, F-025, F-026, F-038 | Chua dat dieu kien snapshot chinh thuc an toan. |
| `/bao-cao/da-phe-duyet` | Danh sach bao cao chinh thuc | Partial | Critical | F-001, F-017, F-027 | DB row khoa nhung object chua bat bien. |
| `/bao-cao/da-phe-duyet/[id]` | Xem/tai snapshot da phe duyet | Partial | Critical | F-001, F-017 | Hien SHA metadata nhung khong rehash byte tai ve. |
| `/van-ban-lien-quan` | Danh muc van ban ngoai TT57 | Partial | Med | F-017, F-028 | Tao duoc; chua cap nhat/archive va constraint. |
| `/nhat-ky` | Xem nhat ky thay doi/phe duyet | Partial | Med | F-017, F-032 | Du lieu mutation co; copy/mapping chua dong bo. |
| `/thiet-lap` | Don vi, nam hoc, nguoi dung, vai tro, phan cong | Partial | High | F-015, F-017, F-029, F-037 | Chuc nang chinh co; bat bien metadata/assignment va bootstrap con thieu. |

Coverage trang: **22/22**.

## 6. API route

| API | Method | Muc dich | Trang thai | Rui ro/Finding |
|---|---|---|---|---|
| `/api/bao-cao/danh-muc-minh-chung` | GET | Xuat XLSX danh muc | Partial | F-002, F-011, F-038 |
| `/api/bao-cao/export-json` | GET | Xuat JSON nam hoc | Partial | F-002, F-011, F-038 |
| `/api/bao-cao/goi-minh-chung` | GET | Xuat ZIP minh chung | Partial | F-002, F-011, F-038 |
| `/api/bao-cao/mau-1` | GET | Xuat DOCX Mau 1 | Partial | F-002, F-010, F-011 |
| `/api/bao-cao/mau-2` | GET | Xuat DOCX Mau 2 | Partial | F-011 |
| `/api/health` | GET | Liveness/readiness | Partial | F-031 |
| `/api/minh-chung/[id]/signed-url` | POST | Tao signed URL co thoi han | Working | F-032 chi lien quan audit read cu; rate-limit/RLS co test. |
| `/api/minh-chung/finalize` | POST | Chot metadata sau upload | Partial | F-013 |
| `/api/minh-chung/orphans` | GET, DELETE | Liet ke/don object mo coi | Working | Khong thay loi logic dang ke trong pham vi audit. |
| `/api/observability/auth-failure` | POST | Gui canh bao auth bat thuong | Partial | F-030 |
| `/api/observability/storage-failure` | POST | Gui canh bao Storage | Partial | F-030 |

Coverage API route file: **11/11**.

## 7. Van de he thong xuyen suot

### 7.1 Pham vi nam hoc/cap hoc/phien ban chua duoc mo hinh hoa nhat quan

F-002, F-003, F-004, F-005, F-009, F-011, F-014, F-015 va F-029 deu den tu viec mot so aggregate dung `co_so_id + nam_hoc_id + cap_hoc`, trong khi quan he phu chi dung mot phan khoa do. Day la nguon sai ket qua nghiep vu nguy hiem hon loi render.

### 7.2 State scope phan manh o client

F-006, F-007, F-022, F-023, F-025 va F-027 lap lai cung mot mau: effect bat dong bo doc lap, khong request token, khong reset entity khi doi scope. Khi mang cham hoac nguoi dung doi nhanh, response cu co the thang.

### 7.3 Capability UI khong dung chung nguon voi RLS

F-005, F-017, F-018, F-020, F-026 va F-039 cho thay menu, CTA va DB permission duoc dien giai o nhieu noi. RLS dang la lop bao ve co gia tri, nhung UI co the dan nguoi dung vao hanh dong chac chan bi tu choi hoac hien nham chuc nang.

### 7.4 Snapshot bi chia cat giua CSDL va Storage

F-001 va F-010 la mot chuoi: DB row co tinh bat bien, nhung byte object va revision nguon chua duoc seal cung nhau. Mot bao cao chinh thuc chi dang tin khi metadata, byte va revision nguon tao thanh mot don vi bat bien.

### 7.5 Kiem thu manh o don vi/RLS, yeu o hanh trinh release

Unit test va RLS test la diem manh. F-016 cho thay tacit knowledge, nghia la cac gia dinh va cach van hanh chua duoc viet thanh rule tu dong, van nam trong credential va thao tac thu cong cua nguoi trien khai. Do la rui ro khi co nguoi thu hai van hanh du an.

### 7.6 Entropy van hanh

Trong bao cao nay, **entropy** la xu huong he thong tang sai le va phuc tap theo thoi gian neu moi man hinh tu quan ly scope/quyen/trang thai rieng. **Negentropy** la cac co che chu dong dao nguoc xu huong do, nhu capability map dung chung, scope key bat bien, transaction/revision seal va test release bat buoc. Uu tien remediation tap trung vao cac co che chung nay, khong tao them lop abstraction neu no khong xoa duoc mot rui ro cu the.

## 8. Nhung diem da tim kiem va khong xac nhan la loi

- Engine 4-15-8 va quy tac lay muc thap nhat da co implementation/test; khong co bang chung tinh sai.
- Trigger active da chan dat Muc 2 neu Muc 1 chua dat, thieu mo ta hoac thieu minh chung hop le.
- Trang xac minh minh chung da hien tieu chi, thong tin chi tiet va co luong mo tep signed URL; van de cua trang la pagination/capability, khong phai thieu chi tiet.
- Policy xoa evidence object da bao ve object co ban ghi DB tham chieu; F-013 la ambiguous completion/idempotency, khong phai xoa mat tep da commit.
- Cac migration demo cu con trong lich su, nhung migration sau da go bo function demo va co release gate. Khong coi day la loi runtime hien tai.

## 9. Gioi han va viec can kiem chung

- Chua co credential staging de chay 12 E2E test vai tro/pilot; do do cac ket luan UI theo role chu yeu dua tren code va RLS test.
- F-033 can mot recovery email/link that de ket luan.
- F-037 can doi chieu runbook van hanh ben ngoai repo neu dang duoc luu o noi khac.
- F-038 va F-039 can chu san pham xac nhan vi tai lieu nghiep vu chua du ro de chon mot cach dien giai duy nhat.
- Audit khong thay doi ma nguon ung dung theo dung yeu cau. Ke hoach sua nam trong `REMEDIATION_PLAN.md`.
