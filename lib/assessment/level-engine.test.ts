import { describe, expect, it } from "vitest";
import {
  KetQuaTieuChi,
  kiemTraRangBuocCapNhat,
  mucHopLe,
  xacDinhMucToanTruongTuKetQua,
  xacDinhMucTuKetQua,
} from "./level-engine";

const MA_BAT_BUOC = ["1.3", "1.4", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2"];
const MA_CON_LAI = ["1.1", "1.2", "2.3", "3.3", "3.4", "3.5", "4.3"];

function taoBoTieuChi(overrides: Record<string, Partial<KetQuaTieuChi>> = {}) {
  return [...MA_BAT_BUOC, ...MA_CON_LAI]
    .map<KetQuaTieuChi>((ma) => ({
      ma,
      ten: `Tiêu chí ${ma}`,
      laBatBuoc: MA_BAT_BUOC.includes(ma),
      mucDat: 2,
      moTaMuc1: `Mô tả Mức 1 ${ma}`,
      moTaMuc2: `Mô tả Mức 2 ${ma}`,
      maMinhChung: [`MC.${ma}.01`],
      ...overrides[ma],
    }))
    .sort((a, b) => a.ma.localeCompare(b.ma));
}

describe("xacDinhMucTuKetQua", () => {
  it("đạt Mức 2 khi đủ 8/8 bắt buộc Mức 2, ít nhất 5/7 còn lại Mức 2 và phần còn lại tối thiểu Mức 1", () => {
    const ketQua = taoBoTieuChi({
      "3.5": { mucDat: 1, moTaMuc2: "" },
      "4.3": { mucDat: 1, moTaMuc2: "" },
    });

    expect(xacDinhMucTuKetQua(ketQua).mucDat).toBe("Đạt Mức 2");
  });

  it("thiếu đúng 1 tiêu chí bắt buộc ở Mức 2 thì chỉ đạt Mức 1", () => {
    const ketQua = taoBoTieuChi({
      "2.2": { mucDat: 1, moTaMuc2: "" },
    });
    const result = xacDinhMucTuKetQua(ketQua);

    expect(result.mucDat).toBe("Đạt Mức 1");
    expect(result.chanLenMucTiepTheo).toContain("2.2 đang Mức 1");
  });

  it("đạt Mức 1 khi đủ 5/7 tiêu chí còn lại và giải trình hai tiêu chí dưới Mức 1", () => {
    const batBuocMuc1 = Object.fromEntries(
      MA_BAT_BUOC.map((ma) => [ma, { mucDat: 1 as const, moTaMuc2: "" }]),
    );
    const ketQua = taoBoTieuChi({
      ...batBuocMuc1,
      "3.5": { mucDat: 0, moTaMuc1: "", moTaMuc2: "", maMinhChung: [] },
      "4.3": { mucDat: 0, moTaMuc1: "", moTaMuc2: "", maMinhChung: [] },
    });
    const result = xacDinhMucTuKetQua(ketQua);

    expect(result.mucDat).toBe("Đạt Mức 1");
    expect(result.khoangCach).toContain("2 tiêu chí còn lại tối thiểu lên Mức 1");
    expect(result.chanLenMucTiepTheo).toContain("3.5 chưa đạt tối thiểu Mức 1");
  });

  it("chỉ 4/7 tiêu chí còn lại đạt Mức 1 thì trượt Mức 1", () => {
    const ketQua = taoBoTieuChi({
      "3.3": { mucDat: 0, moTaMuc1: "", moTaMuc2: "", maMinhChung: [] },
      "3.4": { mucDat: 0, moTaMuc1: "", moTaMuc2: "", maMinhChung: [] },
      "3.5": { mucDat: 0, moTaMuc1: "", moTaMuc2: "", maMinhChung: [] },
    });

    expect(xacDinhMucTuKetQua(ketQua).mucDat).toBe("Không đạt Mức 1");
  });

  it("một tiêu chí bắt buộc không đạt làm toàn cấp trượt Mức 1 dù các tiêu chí khác tốt", () => {
    const ketQua = taoBoTieuChi({
      "1.3": { mucDat: 0, moTaMuc1: "", moTaMuc2: "", maMinhChung: [] },
    });
    const result = xacDinhMucTuKetQua(ketQua);

    expect(result.mucDat).toBe("Không đạt Mức 1");
    expect(result.chanLenMucTiepTheo).toContain("1.3 chưa đạt Mức 1");
  });

  it("xem tiêu chí bắt buộc bị thiếu khỏi đầu vào là chưa đạt Mức 1", () => {
    const ketQua = taoBoTieuChi().filter((item) => item.ma !== "1.3");
    const result = xacDinhMucTuKetQua(ketQua);

    expect(result.mucDat).toBe("Không đạt Mức 1");
    expect(result.chanLenMucTiepTheo).toContain(
      "Bộ tiêu chuẩn của năm học chưa đủ cấu trúc 4-15-8.",
    );
  });

  it("không tính đạt khi thiếu mã minh chứng dù đã bật cờ đạt", () => {
    const ketQua = taoBoTieuChi({
      "1.4": { mucDat: 2, maMinhChung: [] },
    });
    const result = xacDinhMucTuKetQua(ketQua);

    expect(result.mucDat).toBe("Không đạt Mức 1");
    expect(result.chanLenMucTiepTheo).toContain("1.4 thiếu mô tả hiện trạng hoặc mã minh chứng");
  });

  it("không tính Mức 2 khi thiếu mô tả hiện trạng Mức 2", () => {
    const ketQua = taoBoTieuChi({
      "3.1": { mucDat: 2, moTaMuc2: "" },
    });
    const result = xacDinhMucTuKetQua(ketQua);

    expect(result.mucDat).toBe("Đạt Mức 1");
    expect(result.chanLenMucTiepTheo).toContain("3.1 đang Mức 1");
  });
});

describe("kiemTraRangBuocCapNhat", () => {
  it("báo lỗi khi đánh dấu Mức 2 nhưng chưa có mô tả Mức 1", () => {
    const result = kiemTraRangBuocCapNhat({
      ma: "2.1",
      laBatBuoc: true,
      mucDat: 2,
      moTaMuc1: "",
      moTaMuc2: "Có cải tiến",
      maMinhChung: ["MC.2.1.01"],
    });

    expect(result.hopLe).toBe(false);
    expect(result.loi).toContain("2.1 chưa có mô tả hiện trạng Mức 1.");
  });

  it("chấp nhận Mức 1 khi có mô tả và mã minh chứng", () => {
    const item: KetQuaTieuChi = {
      ma: "2.1",
      laBatBuoc: true,
      mucDat: 1,
      moTaMuc1: "Có hiện trạng",
      maMinhChung: ["MC.2.1.01"],
    };

    expect(kiemTraRangBuocCapNhat(item)).toEqual({ hopLe: true, loi: [] });
    expect(mucHopLe(item)).toBe(1);
  });

  it("không chấp nhận mã minh chứng chỉ có khoảng trắng", () => {
    expect(mucHopLe({
      ma: "2.1",
      laBatBuoc: true,
      mucDat: 1,
      moTaMuc1: "Có hiện trạng",
      maMinhChung: ["   "],
    })).toBe(0);
  });
});

describe("xacDinhMucToanTruongTuKetQua", () => {
  it("trường 2 cấp học có mức khác nhau lấy mức thấp nhất", () => {
    const result = xacDinhMucToanTruongTuKetQua([
      { capHoc: "tieu_hoc", ketQuaTieuChi: taoBoTieuChi() },
      {
        capHoc: "thcs",
        ketQuaTieuChi: taoBoTieuChi({
          "4.1": { mucDat: 1, moTaMuc2: "" },
        }),
      },
    ]);

    expect(result.mucDat).toBe("Đạt Mức 1");
  });

  it("không suy diễn mức khi trường chưa khai báo cấp học", () => {
    const result = xacDinhMucToanTruongTuKetQua([]);

    expect(result.mucDat).toBe("Không đạt");
    expect(result.chanLenMucTiepTheo).toContain(
      "Cần khai báo ít nhất một cấp học trong năm học.",
    );
  });

  it("không đếm trùng một tiêu chí khi dữ liệu đầu vào bị lặp", () => {
    const duplicated = [...taoBoTieuChi(), taoBoTieuChi()[0]];

    expect(xacDinhMucTuKetQua(duplicated).mucDat).toBe("Đạt Mức 2");
  });

  it("một mã minh chứng bị lặp không làm thay đổi kết quả tiêu chí", () => {
    const result = xacDinhMucTuKetQua(taoBoTieuChi({
      "1.3": { maMinhChung: ["MC.1.3.01", "MC.1.3.01"] },
    }));

    expect(result.mucDat).toBe("Đạt Mức 2");
  });

  it("lấy Không đạt nếu một trong nhiều cấp học thiếu minh chứng", () => {
    const result = xacDinhMucToanTruongTuKetQua([
      { capHoc: "tieu_hoc", ketQuaTieuChi: taoBoTieuChi() },
      {
        capHoc: "thcs",
        ketQuaTieuChi: taoBoTieuChi({
          "1.3": { mucDat: 2, maMinhChung: [] },
        }),
      },
    ]);

    expect(result.mucDat).toBe("Không đạt");
    expect(result.chanLenMucTiepTheo).toContain(
      "1.3 thiếu mô tả hiện trạng hoặc mã minh chứng",
    );
  });
});
