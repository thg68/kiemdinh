import { describe, expect, it } from "vitest";
import {
  filterRegistrationSchools,
  normalizeSchoolSearch,
  type RegistrationSchool,
} from "./directory";

const schools: RegistrationSchool[] = [
  {
    id: "1",
    ma_truong: "2200004001",
    ten: "Trường Quốc tế Singapore",
    loai_hinh: "pho_thong",
    cap_hoc: ["tieu_hoc", "thcs", "thpt"],
    cong_lap: false,
    dia_chi: "Hạ Long",
    phuong_xa: "Phường Hạ Long",
    tinh_thanh: "Quảng Ninh",
    loai_hinh_dao_tao: "Tư thục",
    loai_hinh_truong: "TH-THCS-THPT",
  },
  {
    id: "2",
    ma_truong: "2200000002",
    ten: "Trường Mầm non Hoa Sen",
    loai_hinh: "mam_non",
    cap_hoc: ["mam_non"],
    cong_lap: true,
    dia_chi: null,
    phuong_xa: "Phường Bãi Cháy",
    tinh_thanh: "Quảng Ninh",
    loai_hinh_dao_tao: "Công lập",
    loai_hinh_truong: "MN",
  },
];

describe("school directory search", () => {
  it("normalizes Vietnamese diacritics", () => {
    expect(normalizeSchoolSearch("Phường Bãi Cháy")).toBe("phuong bai chay");
  });

  it("finds schools by a diacritic-free name", () => {
    expect(filterRegistrationSchools(schools, "mam non hoa sen")).toEqual([schools[1]]);
  });

  it("finds schools by MOET code and ward", () => {
    expect(filterRegistrationSchools(schools, "2200004001 ha long")).toEqual([schools[0]]);
  });

  it("finds schools by province", () => {
    expect(filterRegistrationSchools(schools, "quang ninh")).toEqual(schools);
  });

  it("limits the initial list", () => {
    expect(filterRegistrationSchools(schools, "", 1)).toEqual([schools[0]]);
  });
});
