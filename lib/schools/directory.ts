export type RegistrationSchool = {
  id: string;
  ma_truong: string;
  ten: string;
  loai_hinh: "mam_non" | "pho_thong" | "gdtx";
  cap_hoc: string[];
  cong_lap: boolean;
  dia_chi: string | null;
  phuong_xa: string | null;
  loai_hinh_dao_tao: string | null;
  loai_hinh_truong: string | null;
};

export function normalizeSchoolSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .trim();
}

export function filterRegistrationSchools(
  schools: RegistrationSchool[],
  query: string,
  limit = 10,
) {
  const normalizedQuery = normalizeSchoolSearch(query);

  if (!normalizedQuery) {
    return schools.slice(0, limit);
  }

  const words = normalizedQuery.split(/\s+/).filter(Boolean);

  return schools
    .filter((school) => {
      const searchable = normalizeSchoolSearch(
        [school.ten, school.ma_truong, school.phuong_xa, school.dia_chi]
          .filter(Boolean)
          .join(" "),
      );

      return words.every((word) => searchable.includes(word));
    })
    .slice(0, limit);
}

export function schoolTypeLabel(school: RegistrationSchool) {
  const schoolTypeLabels: Record<string, string> = {
    MN: "Mầm non",
    TH: "Tiểu học",
    THCS: "THCS",
    THPT: "THPT",
    "TH-THCS": "Tiểu học – THCS",
    "THCS-THPT": "THCS – THPT",
    "TH-THCS-THPT": "Tiểu học – THCS – THPT",
    GDTX: "GDTX",
  };
  const ownership = school.cong_lap ? "Công lập" : "Tư thục";
  const schoolType = school.loai_hinh_truong
    ? schoolTypeLabels[school.loai_hinh_truong] ?? school.loai_hinh_truong
    : null;

  return schoolType ? `${schoolType} · ${ownership}` : ownership;
}
