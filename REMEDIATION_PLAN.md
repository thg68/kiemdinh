# Ke hoach khac phuc sau kiem toan

Tai lieu nay chuyen cac finding trong `AUDIT_REPORT.md` thanh thu tu thuc thi. Ke hoach uu tien tinh dung nghiep vu va tinh toan ven du lieu truoc, sau do moi toi trai nghiem va don dep ky thuat.

## 1. Nguyen tac khong duoc pha vo khi sua

- Khong sao chep tep hoac cap ma minh chung moi khi tai su dung cho tieu chi/cap hoc khac.
- Bo tieu chuan va noi dung muc van nam trong du lieu co phien ban, khong hardcode vao TypeScript.
- Moi bang nghiep vu tiep tuc co `co_so_id`, `nam_hoc_id` va RLS tai CSDL.
- Khong cho dat muc khi thieu mo ta hoac minh chung hop le.
- Khong gui du lieu Do, JWT, signed URL hay noi dung nhay cam vao log/canh bao.
- Moi thay doi schema phai co migration tien, migration du lieu, kiem tra bat bien va phuong an rollback/restore.
- Khong danh dau production ready khi test E2E vai tro con bi skip.

## 2. Trang thai thuc thi cap nhat ngay 2026-09-05

| Pham vi | Trang thai | Bang chung chinh |
|---|---|---|
| R-001 den R-013 | Hoan tat tai local | Migration `039` den `046`, unit test va pgTAP bao phu snapshot, scope cap hoc, metadata, approval, idempotency va source seal. |
| R-014 | Hoan tat tren staging | Runner tu provision tenant UAT va 7 vai tro; role gate Playwright chay that tren Cloudflare staging dat 20/20, khong skip. |
| R-015 den R-021 | Hoan tat tai local | Capability registry, scope-keyed loader, CRUD/archive, aggregate/search, observability va audit mutation-only da co test. |
| R-022 | Hoan tat tren staging | Recovery dung token hash va phien Supabase that, cap nhat mat khau va ket thuc phien thanh cong trong role gate. |
| R-023 | Hoan tat theo adapter dang dung | Bo global `middleware.ts`/Node `proxy.ts`; moi API route tu sinh request ID tai route boundary. `next build` va OpenNext preview deu dat. |
| R-024 | Hoan tat tai local | Capability matrix va runbook bootstrap SYSTEM_ADMIN mot lan co audit; dry-run local da dat. |

Bang chung xac minh gan nhat:

- ESLint: dat, khong co warning/error.
- Unit test: 30 file, 149 test dat.
- pgTAP/RLS: 30 file, 382 assertion dat.
- Next.js production build: dat.
- OpenNext Cloudflare preview: khoi dong thanh cong tai Worker local; `/api/health/live` tra HTTP 200 va request ID header/body khop nhau.
- Secret scan: khong phat hien khoa/JWT/private key hardcode; cac ket qua `service_role` chi la ten bien va huong dan cam luu secret.

Release gate con mo: dien tap backup/restore va UAT xuat/kiem hash Mau 1 voi du lieu truong pilot. E2E vai tro tren Supabase staging da dat; hai bang chung van hanh con lai chua co nen chua danh dau production-ready 9/10.

### Cap nhat van hanh ngay 2026-09-06

- Da ap dung migration `039` den `053` tren Supabase staging va production; migration history hai moi truong dong bo `001` den `053`.
- Da tao backup production truoc migration tai `.tmp/remediation-backups/production-20260906-001733/` gom `schema.sql` va `data.sql`; ca hai dump co dau ket thuc hop le. SHA-256: `schema.sql` = `F8B3F493B33E6575E254411658812F04D5BA9C964189D2B864DB51F17E09189B`, `data.sql` = `8B71250113DC9C7C488BC6E8EFAD94B05A33CE85C5C311936F1523FF4C1D2322`.
- pgTAP local va staging: 32 file, 398 assertion dat. Hai test hau kiem production cho assignment conflict va table grants: 16 assertion dat.
- Lint schema `public` tren staging va production: dat, khong co loi.
- ESLint: dat. Unit test: 30 file, 149 test dat; test route bao cao bo sung dat 14/14. Typecheck rieng: dat.
- Next.js production artifact da tao thanh cong voi mot build worker de phu hop may build Windows 8 GB RAM; artifact khoi dong duoc va `/`, `/api/health`, `/api/health/live` cung bon route bi anh huong deu tra HTTP 200.
- Health production tai domain chinh va Workers domain: HTTP 200, `application=ok`, `supabaseAuth=ok`.
- Cloudflare staging role gate: 20/20 test dat voi 7 vai tro, capability/RLS, bon trang nghiep vu, recovery that va API report tra dung 403.
- Da deploy staging version `8082477e-b9ca-4d92-a97f-f06fbf62a048` va production version `cfbdccea-c074-4ceb-bbd7-680c4f367a86`; health staging, production Workers va domain chinh deu HTTP 200.

Cap nhat ket thuc ngay 2026-09-06:

- Da dien tap restore tren PostgreSQL co lap theo `supabase/runbooks/RESTORE-DRILL.md`. So hang cua 11 bang trong yeu khop nguon; migration phat sinh ap dung thanh cong; khong ghi secret vao bang chung.
- Da tao backup production truoc migration `054` tai `.tmp/remediation-backups/production-pre-054-20260906-193930/`. SHA-256: `schema.sql` = `1817F05C8A8335FBAC46C690A0C7CD3C581E5B3A1F367EC5E4D6F220A866052B`, `data.sql` = `68DC08C6AE6FA268DD7A38B27F24262CDFBC0E4DB02B721B1EDAF02058DB80FA`.
- Restore drill phat hien du lieu production cu co don vi `mam_non` mang `cap_hoc = gdtx`. Migration `054_normalize_single_level_school_scope.sql` da chuan hoa cac bang theo scope va validate 13 constraint ton dong.
- Migration `054` da ap dung staging va production. Hau kiem production: 0 don vi mot cap sai scope, 0 ban tu danh gia sai scope; domain chinh va Workers health deu HTTP 200.
- pgTAP local va staging: 34 file, 409 assertion dat. Cloudflare staging role gate: 20/20 test dat.

Gate duy nhat con mo: UAT xuat va kiem hash Mau 1 bang du lieu that cua truong pilot. Ban sao production hien chi co 1 minh chung khong gan nhan demo tren moi nam hoc va 0 mo ta Muc 1/Muc 2 that, nen khong du dieu kien nghiep vu de dong gate. Khong tao du lieu gia de hop thuc hoa ket qua nay.

## 3. Phase 1 - P0 Critical

### R-001. Khoa bat bien tep bao cao da phe duyet

- Finding: F-001.
- Root cause: trigger chi khoa hang `bao_cao`; Storage UPDATE/DELETE khong biet object nao da thanh snapshot chinh thuc.
- Files/modules: `supabase/migrations/015_security_and_report_snapshot.sql`, migration moi, `components/reports/approved-report-detail.tsx`, test RLS Storage.
- Proposed solution: tao helper DB kiem tra `storage.objects.name` co duoc hang `bao_cao.trang_thai = 'da_phe_duyet'` tham chieu; policy UPDATE/DELETE phai tu choi cac object do. Duong dan moi phai append-only theo `co_so_id/nam_hoc_id/report_id/version/hash`. Khi xem/tai, server co the stream va doi chieu SHA-256 hoac cung cap endpoint verify rieng.
- Dependencies: khong co; lam truoc moi thay doi bao cao khac.
- Fix risk: High. Policy sai co the khoa nham export dang nhap hoac mo quyen cross-tenant. Can backup metadata va test local truoc.
- Validation: tao report nhap -> cho phep thay object theo rule; phe duyet -> thu UPDATE/DELETE bang PRINCIPAL va `report.export`, deu phai bi tu choi; SELECT/signed URL van hoat dong; tai byte ve tinh SHA-256 trung `bao_cao.sha256`; tenant khac khong doc duoc.

### R-002. Tach pham vi minh chung theo ban tu danh gia/cap hoc

- Finding: F-002.
- Root cause: `minh_chung_tieu_chi` dang vua lam ma tran tai su dung chung, vua bi dung nhu tap evidence cua mot ban tu danh gia theo cap.
- Files/modules: migration moi cho `tu_danh_gia_minh_chung`; `fn_luu_tu_danh_gia_atomic`; trigger danh gia; `v_minh_chung_hop_le_danh_gia`; `components/assessment/assessment-workspace.tsx`; `lib/reports/data.ts`; readiness RPC; export tests.
- Proposed solution: giu `minh_chung_tieu_chi` de bieu dien mot ma minh chung co the phuc vu nhieu tieu chi. Them bang `tu_danh_gia_minh_chung(tu_danh_gia_id, minh_chung_id, created_at, created_by)` voi UNIQUE cap; RLS ke thua tenant/year tu hai bang cha. RPC phai upsert `tu_danh_gia` truoc, sau do thay tap lien ket theo dung `tu_danh_gia_id` trong cung transaction. Trigger va report lay ma tu bang scope moi.
- Dependencies: chot schema truoc R-003, R-004, R-005, R-007, R-008, R-010 va R-011.
- Fix risk: Critical. Migration sai co the gan evidence cu vao nhieu cap mot cach vo can cu. Khong tu suy dien voi hang nhieu cap mo ho.
- Validation: tren du lieu sao luu, xac dinh record mot cap va nhieu cap; record mo ho duoc danh sach review thay vi tu gan. Tao hai cap cung tieu chi, gan tap A/B khac nhau, luu cap A khong doi B; report moi cap chi co dung ma; test RLS cross-tenant; trigger van chan thieu evidence; cung mot `minh_chung.id/ma` duoc tai su dung, khong duplicate object.

### Gate Phase 1

Chi chuyen Phase 2 khi:

- Migration moi chay va rollback tren ban sao staging.
- Tat ca unit/RLS test cu van dat.
- Co test moi cho Storage snapshot bat bien.
- Co test moi cho hai cap hoc dung tap minh chung khac nhau.
- Xuat Mau 1 tu du lieu staging, tai lai va verify hash thanh cong.

## 4. Phase 2 - P1 High

### R-003. Rang buoc metadata don vi va cap hoc

- Finding: F-015.
- Root cause: UI va RPC khong dung ma tran loai hinh-cap hoc chung.
- Files/modules: `components/settings/school-year-setup.tsx`, schema validation dung chung, migration constraint/RPC onboarding.
- Proposed solution: dinh nghia allowlist nghiep vu trong DB va schema TypeScript tuong ung; bat buoc ten don vi/nam hoc/nguoi phu trach khong rong; `cap_hoc` khong rong va phu hop `loai_hinh`.
- Dependencies: lam som de cac workflow multi-cap phia sau co metadata dang tin.
- Fix risk: Medium. Don vi cu co metadata khong hop le can report du lieu va ke hoach chinh sua truoc khi bat constraint.
- Validation: test moi cap hop le; test rong, trung, cap sai loai hinh o UI va RPC truc tiep; du lieu cu duoc quet truoc migration.

### R-004. Buoc trang bo tieu chuan vao phien ban nam hoc

- Finding: F-009.
- Root cause: trang chon version moi nhat theo loai hinh thay vi version da gan nam hoc.
- Files/modules: `components/standards/standards-workspace.tsx`, `v_tieu_chi_nam_hoc`, app context nam hoc.
- Proposed solution: buoc nguoi dung chon/nhan nam hoc dang hoat dong, tai tieu chi qua view nam hoc, hien ro van ban/version/trang thai.
- Dependencies: R-003 de scope don vi/cap hop le.
- Fix risk: Low. Can bao dam nam hoc cu chua gan version co empty/error state ro.
- Validation: tao hai version, gan version cu cho nam hoc A va version moi cho B; doi nam hien dung 15 tieu chi/noi dung tung bo; draft khong tu dong thay bo dang dung.

### R-005. Sua tong hop dashboard va What-if nhieu cap

- Findings: F-003, F-004.
- Root cause: frontend chi giu ket qua cap dang xem va tai su dung no cho moi cap.
- Files/modules: `components/dashboard/dashboard-workspace.tsx`, `components/assessment/assessment-workspace.tsx`, `lib/assessment/level-engine.ts` adapters.
- Proposed solution: tai ket qua theo tung cap thanh map bat bien; tinh tung cap bang engine hien co; goi `xacDinhMucToanTruong` voi dung tap. What-if chi clone/sua mot criterion cua cap duoc chon va khong luu DB.
- Dependencies: R-002, R-003, R-004.
- Fix risk: Medium. Khong thay doi engine cot loi; chi thay adapter du lieu va hien thi.
- Validation: hai cap lan luot Muc 2/Muc 1 cho toan truong Muc 1; cap B khong dat cho toan truong khong dat; bat/tat What-if tra dung ket qua ban dau; refresh khong luu gia dinh.

### R-006. Sua pham vi cap hoc va CTA cua Viec cua toi

- Finding: F-005.
- Root cause: lookup chi theo `tieu_chi_id` va action khong dua tren capability.
- Files/modules: `components/tasks/my-work-workspace.tsx`, assignment query/view, capability map.
- Proposed solution: khoa ket qua theo `nam_hoc_id + cap_hoc + tieu_chi_id`; hien cap hoc tren task; MEMBER mo tu danh gia dung scope, TEACHER mo luong nop/tai su dung minh chung.
- Dependencies: R-002, R-004; capability map chi tiet co the duoc hoan thien o R-017.
- Fix risk: Medium. Can chot neu mot phan cong ap dung cho tat ca cap hay tung cap; neu schema hien tai thieu cap, them ro rang thay vi suy dien.
- Validation: mot nguoi co cung tieu chi o hai cap thay hai ket qua dung; TEACHER khong bi dua vao route bi cam; direct DB van bi RLS bao ve.

### R-007. Chuan hoa loader scope cho Tu danh gia

- Finding: F-006.
- Root cause: request bat dong bo khong gan scope key.
- Files/modules: `components/assessment/assessment-workspace.tsx`, hook loader dung chung neu can.
- Proposed solution: tao scope key `co_so_id:nam_hoc_id:cap_hoc`; moi request mang generation/token; bo response khong con khop; clear form va hien loading khi scope doi.
- Dependencies: R-002 va R-005.
- Fix risk: Low-Medium. De gay nhap nhay neu reset khong co skeleton on dinh.
- Validation: gia lap response cap A cham hon B, doi A->B nhanh; UI cuoi cung chi hien B; khong cho save trong luc scope chua load; test network failure va retry.

### R-008. Bien luong duyet tu danh gia thanh state machine co revision va evidence

- Findings: F-007, F-008.
- Root cause: RPC nhan transition tuy y, khong expected revision; UI row thieu nam va evidence.
- Files/modules: `components/assessment/assessment-approval-workspace.tsx`, `supabase/migrations/014_role_scope_workflows.sql` hoac migration thay the, lich su tu danh gia, signed URL.
- Proposed solution: DTO hang gom tenant/year/cap/criterion/revision; RPC chi cho `cho_duyet -> da_phe_duyet` hoac `cho_duyet -> tra_lai`, dung `updated_at/version` trong WHERE va advisory/row lock. Man duyet tai tap evidence cua R-002, trang thai xac minh, hieu luc va lien ket xem tep.
- Dependencies: R-002, R-004, R-007.
- Fix risk: High. Migration transition co the anh huong record cu; can map trang thai va audit truoc.
- Validation: draft -> approved bi tu choi; hai tab cung duyet thi tab sau nhan 409; doi nam khi request dang tai khong gui sai year; evidence het han chan duyet; principal/chair thanh cong, role khac 403/RLS deny.

### R-009. Rang buoc thanh vien hoi dong cung tenant

- Finding: F-014.
- Root cause: FK chi tham chieu ID global.
- Files/modules: migration cho `thanh_vien_hoi_dong`, RPC/UI council, RLS tests.
- Proposed solution: dung trigger bat bien security-definer an toan hoac composite key co `co_so_id`; thanh vien phai active va cung co_so voi hoi dong. Neu bang con chua co `co_so_id`, can nhac them cot duoc derive/guard de RLS ro hon.
- Dependencies: R-003.
- Fix risk: Medium-High. Can quet record cross-tenant truoc constraint; khong tu dong xoa.
- Validation: insert/update same-tenant active dat; cross-tenant/inactive bi tu choi o RPC va SQL; SELECT van dung theo RLS.

### R-010. Tim kiem/pagination toan kho khi dung lai minh chung

- Finding: F-012.
- Root cause: `.limit(100)` dung nhu tap du lieu day du.
- Files/modules: `components/evidence/evidence-workspace.tsx`, query/RPC search minh chung, pagination component.
- Proposed solution: combobox mo theo nhu cau, debounce, server-side search ma/ten, cursor hoac range 25; record da chon duoc pin va tai theo ID.
- Dependencies: R-002 de lookup gan vao dung assessment scope.
- Fix risk: Low-Medium. Can escape PostgREST filter cung R-021.
- Validation: seed 150 minh chung; tim record cu nhat theo ma va ten; chon lai khong sinh ma/tep moi; keyboard/mobile; query loi co error state.

### R-011. Finalize minh chung idempotent

- Finding: F-013.
- Root cause: upload va DB commit la hai buoc khong co idempotency/reconciliation.
- Files/modules: `app/api/minh-chung/finalize/route.ts`, evidence uploader, migration idempotency key, cleanup job/API.
- Proposed solution: client sinh UUID request key truoc upload; server luu UNIQUE key va tra lai record cu khi retry; response gom trang thai commit. Sau fetch error, client hoi status bang key truoc khi cleanup/bao loi.
- Dependencies: R-002 de finalize va linkage co ranh gioi ro; co the lam song song R-010.
- Fix risk: Medium. Can xu ly object cu khong co key va tranh key bi tai su dung cross-tenant.
- Validation: cat response sau DB commit, retry cung key chi co mot `minh_chung`, mot ma va mot object; retry key khac voi cung hash theo rule hien hanh; tenant khac khong lookup duoc key.

### R-012. Seal revision nguon khi phe duyet report

- Finding: F-010.
- Root cause: readiness hien tai va byte da sinh khong chung mot revision.
- Files/modules: report collector/generator, `bao_cao`, RPC `fn_luu_trang_thai_bao_cao`, export metadata, audit.
- Proposed solution: tinh source manifest canonical gom ID/revision cua assessment, evidence, notes, council, plan va standard version. Server luu `source_digest` luc export; phe duyet tai tinh trong transaction va tu choi 409 neu khac. Sau phe duyet ap dung R-001.
- Dependencies: R-001, R-002, R-004, R-008.
- Fix risk: High. Canonicalization khong on dinh co the tao false mismatch; phai sap xep va serialize quy tac.
- Validation: export khong sua du lieu thi approve dat; sua mot mo ta/evidence/member sau export thi approve bi tu choi va yeu cau xuat lai; thu hai request phe duyet cung version khong tao snapshot trung; hash byte va source digest deu truy vet duoc.

### R-013. Chan cap hoc khong thuoc don vi tai API report

- Finding: F-011.
- Root cause: schema chi xac nhan enum.
- Files/modules: `lib/reports/routes.ts`, `lib/reports/data.ts`, route tests cua nam endpoint export.
- Proposed solution: collector xac minh nam thuoc tenant va cap nam trong `school.cap_hoc`; tra 422 voi `code` on dinh, khong suy luan tu message.
- Dependencies: R-003.
- Fix risk: Low.
- Validation: moi cap hop le xuat duoc; enum hop le nhung khong thuoc don vi tra 422; year tenant khac 404/403 theo chinh sach; ca nam endpoint cung hanh vi.

### R-014. Bat buoc E2E vai tro tren staging

- Finding: F-016.
- Root cause: credential va du lieu release gate khong duoc provision trong CI.
- Files/modules: `e2e/helpers/auth.ts`, role/pilot specs, CI workflow, Supabase staging seed co idempotency.
- Proposed solution: tao tai khoan cho bay role trong tenant staging rieng, secret CI, reset fixture truoc suite; tren release branch, thieu bien phai fail som thay vi skip. Khong dung production credential.
- Dependencies: sau R-001 den R-013 de gate phan anh luong moi.
- Fix risk: Medium. Fixture phai cach ly va khong chua du lieu nhay cam.
- Validation: CI bao 18/18 chay, khong skip; test direct URL/action/RLS tung role; pilot gate dung dataset da danh dau; report snapshot verify hash.

### Gate Phase 2

- Khong con P0/P1 mo.
- E2E staging chay day du, khong skip.
- Mot truong hai cap hoan thanh tu danh gia, duyet, xuat va xem lai Mau 1 dung tap evidence tung cap.
- Khong co duplicate evidence/report khi retry hoac thao tac dong thoi.

## 5. Phase 3 - P2 Medium

### R-015. Capability guard tap trung

- Findings: F-017, F-018, F-020, F-026.
- Root cause: navigation, action va DB permission duoc dien giai rieng.
- Files/modules: `lib/auth/navigation.ts`, `ApplicationShell`, server layouts/pages, verification/report action bars, login redirect.
- Proposed solution: tao capability registry theo route/action; server-side guard cho page, UI dung cung registry de hien CTA; RLS/RPC van la nguon enforcement. Login resolve route dau tien duoc phep.
- Dependencies: R-008 va R-014 de test role day du.
- Fix risk: Medium-High. Map sai co the khoa nham vai tro; rollout tren staging theo role matrix.
- Validation: ma tran bay role x 22 route x action; URL truc tiep cho 403/redirect; khong co trang blank; DB deny van dung khi goi truc tiep.

### R-016. Loader scope dung chung cho cac workspace con lai

- Findings: F-022, F-023, F-025, F-027.
- Root cause: effect bat dong bo khong co identity scope.
- Files/modules: council, improvement, report export, approved reports, shared app context.
- Proposed solution: hook nho quan ly `scopeKey`, generation, pending/error/data va reset; khong tao framework state moi neu hook don gian du.
- Dependencies: R-007 lam mau tham chieu.
- Fix risk: Medium.
- Validation: test response dao thu tu cho tung trang; doi nam/cap luc save; refresh/back-forward; payload luon khop scope UI.

### R-017. Hoan thien CRUD va invariant du lieu van hanh

- Findings: F-024, F-028, F-029.
- Root cause: entity co schema day du nhung workflow chi co create/status; assignment target validation chua xuong DB.
- Files/modules: improvement plan, related documents, settings assignment RPC, audit/RLS tests.
- Proposed solution: edit va archive/soft-delete co audit; validate URL/date; assignment chi cho active member va allowlist role. Quyet dinh xoa hay archive phai duoc ghi trong rule nghiep vu.
- Dependencies: R-015 capability map.
- Fix risk: Medium.
- Validation: create/edit/archive/restore theo vai tro; refresh giu dung state; invalid URL/date/role/inactive/cross-tenant bi DB tu choi.

### R-018. Search, aggregation va error contract

- Findings: F-019, F-021.
- Root cause: aggregation/search phia client va loi truy van phu bi an.
- Files/modules: evidence health/list/detail, RPC aggregate/search, API error model.
- Proposed solution: aggregate tai DB voi pham vi/quyen ro; dung parameterized search/RPC; gom va hien loi moi request; metric restricted co nhan pham vi.
- Dependencies: R-015, R-010.
- Fix risk: Medium.
- Validation: ky tu `,()"'` khong lam hong search; role restricted khong thay tong so gia; query phu fail hien retry; SQL plan dung index.

### R-019. Bao ve observability va mo rong readiness

- Findings: F-030, F-031.
- Root cause: endpoint alert tin same-origin; health probe chi cham Auth.
- Files/modules: observability routes, request context, rate limiter, health route, alert tests.
- Proposed solution: schema su kien allowlist, rate limit, session/challenge hoac server-originated signal; redact payload. Tach `/api/health` liveness va readiness, probe Auth/DB/Storage voi timeout ngan.
- Dependencies: co the song song R-015; phai giu quy tac khong log du lieu Do/JWT/signed URL.
- Fix risk: Medium. Probe qua nang co the gay tai/false alert.
- Validation: spam bi 429; spoof origin khong du; event hop le den sink da redact; gia lap Auth/DB/Storage hong cho component readiness dung ma khong ro secret.

### R-020. Dong bo hop dong audit

- Finding: F-032.
- Root cause: chinh sach chuyen sang mutation-only nhung copy, mapping va caller read cu con lai.
- Files/modules: audit workspace/page, evidence detail/health/signed URL, audit code catalog.
- Proposed solution: xoa read-log RPC call; tao catalog ma hanh dong -> nhan/mo ta tieng Viet; UI khong humanize chuoi DB tuy y; test chi ghi create/update/verify/approve theo rule.
- Dependencies: R-015 de capability trang nhat ky ro rang.
- Fix risk: Low.
- Validation: doc/xem/tai khong tao log; tao/sua/xac minh/phe duyet tao dung mot log; moi code hien tieng Viet; du lieu nhay cam khong nam trong metadata.

### R-021. Chot rule phe duyet artifact va quyen hoi dong

- Findings: F-038, F-039.
- Root cause: dac ta chua du ro cho artifact bo tro va pham vi SECRETARY.
- Files/modules: readiness RPC, report UI, permission catalog/RLS council, docs Phu luc B.
- Proposed solution: to chuc mot buoi quyet dinh nghiep vu ngan; ghi decision record. Neu JSON/XLSX/ZIP chi la export bo tro, khong dua vao workflow phe duyet chinh thuc. Neu Secretary khong duoc phan cong hoi dong, tach permission `council.manage_members` khoi management chung.
- Dependencies: quyet dinh truoc khi sua R-015/R-017 phan lien quan.
- Fix risk: Low ve ky thuat, High neu tu suy dien sai; vi vay bat buoc owner sign-off.
- Validation: bang transition/quyen duoc duyet; test tung artifact va vai tro trung bang; docs/UI/RLS cung mot ket qua.

## 6. Phase 4 - P3 Low

### R-022. Cung co auth edge cases

- Findings: F-033, F-034.
- Root cause: recovery dua URL heuristic; logout bo qua error.
- Proposed solution: dua recovery vao Supabase auth event/session that; xu ly link het han/da dung. Logout co pending/error va xoa client state dung thu tu.
- Dependencies: R-014 co tai khoan E2E.
- Fix risk: Low-Medium.
- Validation: E2E email recovery hop le, het han, da dung; logout online/offline; back button khong mo lai du lieu protected.

### R-023. Cap nhat Next.js request entry point

- Finding: F-035.
- Root cause: `middleware.ts` deprecated tren Next.js 16.
- Implemented solution: Next.js 16 `proxy.ts` chay Node runtime nhung OpenNext Cloudflare 1.20.2 khong ho tro Node middleware. Vi vay bo request entry point toan cuc va sinh request ID moi tai tung API route qua `getRequestContext`; khong tin `x-request-id` do client gui. Cach nay giu truy vet API ma khong dua adapter vao duong runtime khong ho tro.
- Dependencies: sau R-019 de tranh sua hai lan request pipeline.
- Fix risk: Low-Medium tren OpenNext/Cloudflare.
- Validation: local build, OpenNext preview va deploy staging; moi API response co request ID; route static/dynamic khong doi.

### R-024. Dong bo tai lieu quyen va bootstrap production

- Findings: F-036, F-037.
- Root cause: tai lieu viet tay mau thuan va quy trinh admin dau tien nam ngoai repo/khong ro.
- Proposed solution: chot capability matrix, cap nhat tai lieu; viet runbook bootstrap SYSTEM_ADMIN mot lan co audit, thu hoi quyen bootstrap sau dung. Khong dua password/service role key vao git.
- Dependencies: R-015, R-021.
- Fix risk: Low neu chay staging truoc; thao tac production can two-person review.
- Validation: nguoi van hanh moi lam theo runbook tren staging; tao duoc admin dau tien; audit co dau vet; secret scan sach; tai lieu khop test role.

## 7. Thu tu thuc thi de xuat

1. R-001.
2. R-002.
3. R-003.
4. R-004.
5. R-005 va R-006.
6. R-007.
7. R-008.
8. R-009.
9. R-010 va R-011.
10. R-012.
11. R-013.
12. R-014 va gate P1.
13. R-021 de chot rule con mo.
14. R-015 va R-016.
15. R-017 va R-018.
16. R-019 va R-020.
17. R-022, R-023, R-024.

## 8. Chien luoc migration va rollout

### 7.1 Truoc migration

- Tao backup co kiem chung restore cua PostgreSQL va inventory Storage.
- Chay query phat hien lien ket evidence mo ho theo cap, thanh vien hoi dong cross-tenant, metadata don vi/cap khong hop le.
- Dong bang phe duyet report trong cua so migration neu can; khong khoa upload minh chung lau hon can thiet.

### 7.2 Staging

- Ap migration tren Supabase staging truoc production.
- Nap ban sao da an danh hoac fixture gan voi hinh thai du lieu that: 100+ minh chung, hai cap hoc, report da phe duyet, role day du.
- Chay unit, lint, typecheck, build, RLS va E2E 18/18.
- Chay thu OpenNext preview va Cloudflare staging Worker.

### 7.3 Production

- Deploy DB theo huong backward-compatible truoc, sau do deploy app doc/ghi schema moi.
- Chay smoke test bang tenant noi bo, khong dung du lieu Do.
- Theo doi 409/422/Storage/report-export alerts va request ID.
- Chi mo lai phe duyet khi hash snapshot, source digest va luong hai cap deu dat.

## 9. Diem suc khoe logic tai thoi diem audit

| Category | Score | Notes |
|---|---:|---|
| Page logic | 6.0/10 | 22/22 trang co luong that, nhung nhieu trang con sai scope, stale response hoac CRUD thieu. |
| Business logic | 6.2/10 | Engine 4-15-8 tot; mo hinh evidence theo cap va approval transition con loi nghiem trong. |
| Frontend <-> Backend integration | 7.0/10 | Contract chinh da noi; mot so UI action/redirect/quyen va retry chua dong bo. |
| Data integrity | 5.2/10 | RLS tot, nhung snapshot Storage va cross-cap/cross-tenant invariant la P0/P1. |
| Authentication / Authorization | 7.4/10 | DB enforcement co test rong; route/action guard va observability endpoint con thieu. |
| State management | 5.4/10 | Nhieu workspace co race khi doi nam/cap. |
| Edge-case handling | 6.1/10 | Co empty/error o nhieu luong; idempotency, concurrency, 100+ record va recovery chua day du. |
| Test coverage | 7.2/10 | 123 test va 306 RLS assertions dat; 12 E2E quan trong bi skip. |
| **Overall Logic Health** | **6.3/10** | Chua production-ready cho bao cao chinh thuc/truong nhieu cap. |

## 10. Top 10 van de quan trong nhat

1. F-001.
2. F-002.
3. F-010.
4. F-007.
5. F-003.
6. F-004.
7. F-009.
8. F-014.
9. F-015.
10. F-016.

## 11. Phan loai tinh nang tai thoi diem audit

### Chua hoan thien

- F-008: duyet tu danh gia chua co evidence viewer.
- F-012: dung lai evidence chua tim duoc toan kho.
- F-017: route capability guard.
- F-020, F-027: pagination danh sach dai.
- F-024: sua/archive ke hoach cai tien.
- F-026: report action theo quyen va tra lai.
- F-028: sua/archive van ban lien quan.
- F-031: readiness probe day du.
- F-037: bootstrap production co runbook.

### Bi hong hoan toan trong mot so boi canh

- Khong co route nao hong voi moi nguoi dung/moi dataset.
- F-002 lam **luong tu danh gia/bao cao truong nhieu cap** khong the dam bao dung, nen boi canh nay duoc coi la broken.
- F-001 lam **cam ket snapshot da phe duyet bat bien** bi broken du DB row van khoa.

### Hoat dong nhung mang rui ro logic

- F-003, F-004, F-005: ket qua/CTA theo cap.
- F-006, F-022, F-023, F-025, F-027: stale state khi doi scope.
- F-007, F-010: phe duyet dong thoi/revision.
- F-013: retry finalize.
- F-019, F-021: metric/error query phu.
- F-030, F-033: observability/recovery edge cases.

## 12. Ky vong sau khac phuc

Neu R-001 den R-024 duoc hoan thanh va tat ca gate staging dat, muc tieu hop ly la **9.0/10**:

- Bao cao da phe duyet bat bien ca DB va byte Storage.
- Truong nhieu cap co evidence, engine, What-if va export tach dung scope.
- Moi transition quan trong co revision/concurrency guard va audit.
- UI, route guard va RLS cung dung mot capability matrix.
- Danh sach lon, retry, network cham va doi scope duoc test.
- CI release chay day du role journey, khong skip.

Muc 10/10 khong nen la muc tieu tinh. Sau khi dat 9.0, tiep tuc do incident, performance va phan hoi truong pilot de quyet dinh phan viec tiep theo, thay vi them kien truc khong co bang chung nhu cau.
