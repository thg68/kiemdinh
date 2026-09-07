import { describe, expect, it } from "vitest";
import {
  type KetQuaTieuChi,
  xacDinhMucToanTruongVoiGiaDinh,
  xacDinhMucVoiGiaDinh,
} from "./level-engine";
import { deXuatPhuongAnToiThieu, taoBanDoMucGiaDinh } from "./simulation";

function taoTieuChi(ma: string, laBatBuoc: boolean, mucDat: 0 | 1 | 2): KetQuaTieuChi {
  return {
    id: ma,
    ma,
    ten: `Tiêu chí ${ma}`,
    laBatBuoc,
    mucDat,
    moTaMuc1: mucDat >= 1 ? "Đã có mô tả Mức 1" : "",
    moTaMuc2: mucDat >= 2 ? "Đã có mô tả Mức 2" : "",
    maMinhChung: mucDat >= 1 ? [`MC.${ma}`] : [],
  };
}

function taoBoTieuChi(mucBatBuoc: 0 | 1 | 2, mucConLai: 0 | 1 | 2) {
  return [
    ...Array.from({ length: 8 }, (_, index) => taoTieuChi(`1.${index + 1}`, true, mucBatBuoc)),
    ...Array.from({ length: 7 }, (_, index) => taoTieuChi(`2.${index + 1}`, false, mucConLai)),
  ];
}

describe("mô phỏng lộ trình nâng mức", () => {
  it("đề xuất đúng số tiêu chí tối thiểu để đạt Mức 1", () => {
    const items = taoBoTieuChi(1, 0);
    items[8].mucDat = 1;
    items[8].moTaMuc1 = "Đã có mô tả";
    items[8].maMinhChung = ["MC.2.1"];

    const changes = deXuatPhuongAnToiThieu(items, 1);

    expect(changes).toHaveLength(4);
    expect(changes.every((item) => item.muc === 1)).toBe(true);
    expect(xacDinhMucVoiGiaDinh(items, taoBanDoMucGiaDinh(changes)).mucDat).toBe("Đạt Mức 1");
  });

  it("đề xuất Mức 2 gồm toàn bộ tiêu chí bắt buộc, đủ năm tiêu chí còn lại và không để tiêu chí nào dưới Mức 1", () => {
    const items = taoBoTieuChi(1, 1);
    const changes = deXuatPhuongAnToiThieu(items, 2);

    expect(changes.filter((item) => item.ma.startsWith("1.") && item.muc === 2)).toHaveLength(8);
    expect(changes.filter((item) => item.ma.startsWith("2.") && item.muc === 2)).toHaveLength(5);
    expect(xacDinhMucVoiGiaDinh(items, taoBanDoMucGiaDinh(changes)).mucDat).toBe("Đạt Mức 2");
  });

  it("không sửa dữ liệu nguồn hoặc tạo mã minh chứng giả", () => {
    const items = taoBoTieuChi(0, 0);
    const snapshot = structuredClone(items);
    const changes = deXuatPhuongAnToiThieu(items, 1);

    xacDinhMucVoiGiaDinh(items, taoBanDoMucGiaDinh(changes));

    expect(items).toEqual(snapshot);
    expect(JSON.stringify(items)).not.toContain("GIA-DINH");
  });

  it("tổng hợp toàn trường chỉ thay cấp học đang mô phỏng", () => {
    const mamNon = taoBoTieuChi(1, 1);
    const tieuHoc = taoBoTieuChi(2, 2);
    const changes = deXuatPhuongAnToiThieu(mamNon, 2);

    const result = xacDinhMucToanTruongVoiGiaDinh(
      [
        { capHoc: "mam_non", ketQuaTieuChi: mamNon },
        { capHoc: "tieu_hoc", ketQuaTieuChi: tieuHoc },
      ],
      "mam_non",
      taoBanDoMucGiaDinh(changes),
    );

    expect(result.mucDat).toBe("Đạt Mức 2");
  });

  it("không đề xuất thay đổi khi mục tiêu đã đạt", () => {
    expect(deXuatPhuongAnToiThieu(taoBoTieuChi(2, 2), 2)).toEqual([]);
  });
});
