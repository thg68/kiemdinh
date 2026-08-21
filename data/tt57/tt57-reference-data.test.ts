import { describe, expect, it } from "vitest";
import tt57All from "./tt57-all.json";
import validation from "./validation.json";

const MA_BAT_BUOC = new Set([
  "1.3",
  "1.4",
  "2.1",
  "2.2",
  "3.1",
  "3.2",
  "4.1",
  "4.2",
]);

type LoaiHinh = keyof typeof validation;

function flattenCriteria(boTieuChuan: (typeof tt57All.bo_tieu_chuan)[number]) {
  return boTieuChuan.tieu_chuan.flatMap((tieuChuan) => tieuChuan.tieu_chi);
}

describe("du lieu tham chieu TT57", () => {
  it("dung so hieu va ngay hieu luc da xac minh", () => {
    expect(tt57All.metadata.ma_van_ban).toBe("57/2026/TT-BGDĐT");
    expect(tt57All.metadata.ngay_hieu_luc).toBe("2026-07-07");
  });

  it("du khung 4-15-8 va noi dung muc cho ca 3 loai hinh", () => {
    for (const bo of tt57All.bo_tieu_chuan) {
      const loaiHinh = bo.metadata.loai_hinh as LoaiHinh;
      const expected = validation[loaiHinh];
      const criteria = flattenCriteria(bo);
      const mandatoryCriteria = criteria.filter((criterion) => criterion.la_bat_buoc);
      const levels = criteria.flatMap((criterion) => criterion.muc_do);
      const evidenceRows = criteria.filter(
        (criterion) => criterion.thong_tin_minh_chung.minh_chung_goi_y.trim().length > 0,
      );
      const indicators = criteria.flatMap(
        (criterion) => criterion.thong_tin_minh_chung.chi_so_dinh_luong,
      );

      expect(bo.tieu_chuan).toHaveLength(expected.standards);
      expect(criteria).toHaveLength(expected.criteria);
      expect(mandatoryCriteria).toHaveLength(expected.mandatory);
      expect(levels).toHaveLength(expected.levels);
      expect(evidenceRows).toHaveLength(expected.evidence_rows);
      expect(indicators).toHaveLength(expected.quantitative_indicators);
      expect(criteria.map((criterion) => criterion.ma)).toEqual(expected.criterion_codes);

      for (const criterion of criteria) {
        expect(criterion.la_bat_buoc).toBe(MA_BAT_BUOC.has(criterion.ma));
        expect(criterion.ten).not.toMatch(/^Tiêu chí \d\.\d$/);
        expect(criterion.muc_do.map((level) => level.muc)).toEqual([1, 2]);
        expect(criterion.muc_do.every((level) => level.noi_dung_yeu_cau.trim().length > 0)).toBe(
          true,
        );
      }
    }
  });
});
