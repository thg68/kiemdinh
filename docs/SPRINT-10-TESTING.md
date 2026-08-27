# Sprint 10 - Kiem thu hoi quy va cong chat luong

## Muc tieu

Sprint 10 dua cac quy tac quan trong nhat vao cong kiem tra tu dong: engine tinh muc, RLS da don vi, API signed URL/bao cao, file xuat va cac luong nguoi dung theo vai tro.

## Lenh chay

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Kiem thu RLS can Docker Desktop hoac Docker Engine:

```bash
npx supabase start
npx supabase db reset
npm run test:rls
```

Kiem thu E2E staging can ba tai khoan rieng, khong dung tai khoan that cua nha truong:

```text
E2E_BASE_URL
E2E_PRINCIPAL_EMAIL / E2E_PRINCIPAL_PASSWORD
E2E_SECRETARY_EMAIL / E2E_SECRETARY_PASSWORD
E2E_TEACHER_EMAIL / E2E_TEACHER_PASSWORD
E2E_YEAR_ID
E2E_CAP_HOC
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Sau do chay `npm run test:e2e`. Tren may ca nhan, test theo vai tro se bo qua neu chua co tai khoan. Tren CI, thieu secret se lam cong E2E that bai de tranh phe duyet nham.

## Pham vi bao ve

- `supabase/tests/026_sprint10_role_matrix_test.sql`: 7 vai tro x 12 quyen, tu choi quyen cheo tenant va tan cong bang UUID biet truoc tren minh chung, bao cao, nhat ky.
- `app/api/minh-chung/[id]/signed-url/route.test.ts`: token, RLS, Storage private, thoi han URL va audit bat buoc.
- `lib/reports/routes.test.ts`: ma loi 401/403, tham so bat buoc va header tai file khong cache.
- `lib/reports/artifacts.test.ts`: tao va doc nguoc DOCX/XLSX; kiem tra muc bat buoc, ma minh chung va canh bao du lieu rong.
- `lib/reports/export.test.ts`: mo lai ZIP, kiem tra danh muc va ten tep theo ma minh chung.
- `e2e/role-journeys.spec.ts`: Hieu truong, Thu ky, Giao vien; gom luong nghiep vu va mot duong dan bi tu choi theo quyen.

## Nguong coverage

- Engine tinh muc: toi thieu 90% statements/branches/functions/lines.
- Route bao cao: toi thieu 90% statements/branches/functions/lines.
- Nhom ma cot loi duoc dua vao coverage: toi thieu 75% tong the.
- RLS khong danh gia bang line coverage TypeScript; cong tuong duong la toan bo pgTAP phai pass tren PostgreSQL that.

## Quy tac CI

Pull request chi duoc phep hop nhat khi ba job `application`, `database-security`, `e2e-staging` deu thanh cong. Khong bo qua RLS, khong dung service role cho luong nguoi dung, va khong ghi secret vao repository.
