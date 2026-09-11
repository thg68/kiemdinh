import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ExcelJS from "exceljs";

const expectedHeaders = [
  "Mã trường học",
  "Tên trường học",
  "Loại hình đào tạo",
  "Loại hình trường",
  "Nhóm cấp học",
  "Phường xã",
];

function clean(value) {
  return String(value ?? "").replaceAll("\0", "").trim();
}

function sqlText(value) {
  return `'${clean(value).replaceAll("'", "''")}'`;
}

function schoolScope(schoolType) {
  const levels = new Set(clean(schoolType).split("-").map((value) => value.trim()));

  if (levels.has("GDTX")) {
    return { schoolKind: "gdtx", levels: ["gdtx"] };
  }

  if (levels.size === 1 && levels.has("MN")) {
    return { schoolKind: "mam_non", levels: ["mam_non"] };
  }

  const mappedLevels = [
    levels.has("TH") ? "tieu_hoc" : null,
    levels.has("THCS") ? "thcs" : null,
    levels.has("THPT") ? "thpt" : null,
  ].filter(Boolean);

  if (mappedLevels.length === 0) {
    throw new Error(`Không ánh xạ được loại hình trường: ${schoolType}`);
  }

  return { schoolKind: "pho_thong", levels: mappedLevels };
}

async function main() {
  const inputPath = path.resolve(process.argv[2] ?? "");
  const outputPath = path.resolve(
    process.argv[3] ?? "supabase/migrations/062_seed_quang_ninh_moet_schools.sql",
  );

  if (!process.argv[2]) {
    throw new Error("Hãy truyền đường dẫn file danh sách trường MOET.");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputPath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("Workbook không có worksheet dữ liệu.");
  }

  const headers = worksheet.getRow(1).values.slice(1, 7).map(clean);
  if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`Tiêu đề file không đúng định dạng: ${headers.join(" | ")}`);
  }

  const schools = [];
  const schoolCodes = new Set();

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const [code, name, educationType, schoolType, levelGroup, ward] = worksheet
      .getRow(rowNumber)
      .values.slice(1, 7)
      .map(clean);

    if (![code, name, educationType, schoolType, levelGroup, ward].some(Boolean)) continue;
    if (![code, name, educationType, schoolType, levelGroup, ward].every(Boolean)) {
      throw new Error(`Dòng ${rowNumber} thiếu dữ liệu bắt buộc.`);
    }
    if (!/^[0-9A-Z]{6,12}$/i.test(code)) {
      throw new Error(`Dòng ${rowNumber} có mã trường không hợp lệ: ${code}`);
    }
    if (schoolCodes.has(code)) {
      throw new Error(`Mã trường bị trùng: ${code}`);
    }

    schoolCodes.add(code);
    const scope = schoolScope(schoolType);
    schools.push({
      code,
      educationType,
      isPublic: educationType !== "Tư thục",
      levelGroup,
      levels: scope.levels,
      name,
      schoolKind: scope.schoolKind,
      schoolType,
      ward,
    });
  }

  if (schools.length !== 347) {
    throw new Error(`Số trường không đúng kỳ vọng: ${schools.length}/347.`);
  }

  const values = schools.map((school) => {
    const levels = `array[${school.levels.map(sqlText).join(", ")}]::public.cap_hoc[]`;
    return `    (${[
      sqlText(school.code),
      sqlText(school.name),
      sqlText(school.educationType),
      sqlText(school.schoolType),
      sqlText(school.levelGroup),
      sqlText(school.ward),
      sqlText(school.schoolKind),
      levels,
      school.isPublic ? "true" : "false",
    ].join(", ")})`;
  });

  const sql = `-- Generated from "danh sach ma truong moet.xlsx" on 2026-09-08.
-- Source rows are treated strictly as data; 347 unique Quang Ninh school codes were validated.
begin;

with source(
  ma_truong, ten, loai_hinh_dao_tao, loai_hinh_truong, nhom_cap_hoc,
  phuong_xa, loai_hinh, cap_hoc, cong_lap
) as (
  values
${values.join(",\n")}
)
insert into public.co_so_giao_duc(
  ma_truong, ten, loai_hinh, cap_hoc, cong_lap, dia_chi, co_quan_quan_ly,
  tinh_thanh, phuong_xa, loai_hinh_dao_tao, loai_hinh_truong,
  nguon_danh_muc, cho_phep_tu_dang_ky
)
select
  source.ma_truong,
  source.ten,
  source.loai_hinh::public.loai_hinh_co_so,
  source.cap_hoc,
  source.cong_lap,
  source.phuong_xa || ', Quảng Ninh',
  'Sở Giáo dục và Đào tạo Quảng Ninh',
  'Quảng Ninh',
  source.phuong_xa,
  source.loai_hinh_dao_tao,
  source.loai_hinh_truong,
  'MOET',
  true
from source
on conflict (ma_truong) do update
set ten = excluded.ten,
    cong_lap = excluded.cong_lap,
    dia_chi = excluded.dia_chi,
    co_quan_quan_ly = excluded.co_quan_quan_ly,
    tinh_thanh = excluded.tinh_thanh,
    phuong_xa = excluded.phuong_xa,
    loai_hinh_dao_tao = excluded.loai_hinh_dao_tao,
    loai_hinh_truong = excluded.loai_hinh_truong,
    nguon_danh_muc = excluded.nguon_danh_muc,
    cho_phep_tu_dang_ky = true,
    loai_hinh = case
      when not exists (
        select 1 from public.nam_hoc school_year
        where school_year.co_so_id = co_so_giao_duc.id
      ) then excluded.loai_hinh
      else co_so_giao_duc.loai_hinh
    end,
    cap_hoc = case
      when not exists (
        select 1 from public.nam_hoc school_year
        where school_year.co_so_id = co_so_giao_duc.id
      ) then excluded.cap_hoc
      else co_so_giao_duc.cap_hoc
    end,
    updated_at = now();

insert into public.nam_hoc(
  co_so_id, ten, ngay_bat_dau, ngay_ket_thuc, trang_thai, bo_tieu_chuan_id
)
select
  school.id,
  '2026-2027',
  '2026-09-01'::date,
  '2027-05-31'::date,
  case
    when exists (
      select 1 from public.nam_hoc active_year
      where active_year.co_so_id = school.id
        and active_year.trang_thai = 'dang_hoat_dong'
    ) then 'chuan_bi'::public.trang_thai_nam_hoc
    else 'dang_hoat_dong'::public.trang_thai_nam_hoc
  end,
  standard_set.id
from public.co_so_giao_duc school
join lateral (
  select standard.id
  from public.bo_tieu_chuan standard
  where standard.loai_hinh = school.loai_hinh
    and standard.trang_thai = 'dang_ap_dung'
    and (standard.ngay_hieu_luc is null or standard.ngay_hieu_luc <= '2027-05-31'::date)
  order by standard.ngay_hieu_luc desc nulls last, standard.version desc, standard.created_at desc
  limit 1
) standard_set on true
where school.cho_phep_tu_dang_ky
  and school.tinh_thanh = 'Quảng Ninh'
on conflict (co_so_id, ten) do nothing;

commit;
`;

  await fs.writeFile(outputPath, sql, "utf8");
  process.stdout.write(`Đã tạo ${outputPath} với ${schools.length} trường.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
