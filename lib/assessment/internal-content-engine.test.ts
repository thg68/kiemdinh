import { describe, expect, it } from "vitest";
import {
  evaluateInternalContentAssessment,
  NoiHamDanhGia,
} from "./internal-content-engine";

function createContent(
  id: string,
  muc: 1 | 2,
  requiresEvidence = true,
): NoiHamDanhGia {
  return {
    id,
    ma: `${id}.${muc}`,
    muc,
    noiDung: `Nội hàm ${id}`,
    trichDanGoc: `Yêu cầu ${id}`,
    thuTu: 1,
    menhDe: [
      {
        id: `${id}-pass`,
        noiHamId: id,
        ma: `${id}.A`,
        noiDung: "Đã đáp ứng",
        loai: "dap_ung",
        laDat: true,
        laKhongDat: false,
        yeuCauMinhChung: requiresEvidence,
        thuTu: 1,
      },
      {
        id: `${id}-fail`,
        noiHamId: id,
        ma: `${id}.N`,
        noiDung: "Chưa đáp ứng",
        loai: "chua_dap_ung",
        laDat: false,
        laKhongDat: true,
        yeuCauMinhChung: false,
        thuTu: 2,
      },
    ],
  };
}

describe("evaluateInternalContentAssessment", () => {
  const contents = [createContent("m1", 1), createContent("m2", 2)];

  it("không đạt khi chưa có lựa chọn", () => {
    expect(evaluateInternalContentAssessment(contents, []).mucDat).toBe(0);
  });

  it("không mở Mức 1 nếu mệnh đề đạt thiếu mô tả hoặc minh chứng", () => {
    const result = evaluateInternalContentAssessment(contents, [{
      noiHamId: "m1",
      menhDeId: "m1-pass",
      moTaThucTe: "",
      minhChungIds: [],
    }]);

    expect(result.muc1HoanThanh).toBe(false);
    expect(result.daChon).toBe(1);
    expect(result.daDuDieuKien).toBe(0);
  });

  it("đạt Mức 1 khi đủ mô tả và minh chứng", () => {
    const result = evaluateInternalContentAssessment(contents, [{
      noiHamId: "m1",
      menhDeId: "m1-pass",
      moTaThucTe: "Nhà trường đã ban hành kế hoạch năm học.",
      minhChungIds: ["evidence-1"],
    }]);

    expect(result.mucDat).toBe(1);
    expect(result.moTaMuc1).toBe("Nhà trường đã ban hành kế hoạch năm học.");
  });

  it("chỉ đạt Mức 2 sau khi Mức 1 đã hoàn thành", () => {
    const result = evaluateInternalContentAssessment(contents, [
      {
        noiHamId: "m1",
        menhDeId: "m1-pass",
        moTaThucTe: "Đã đáp ứng Mức 1.",
        minhChungIds: ["evidence-1"],
      },
      {
        noiHamId: "m2",
        menhDeId: "m2-pass",
        moTaThucTe: "Đã đáp ứng Mức 2.",
        minhChungIds: ["evidence-2"],
      },
    ]);

    expect(result.mucDat).toBe(2);
    expect(result.muc2HoanThanh).toBe(true);
  });

  it("ghi nhận mệnh đề chưa đạt thành điểm yếu mà không đòi minh chứng", () => {
    const result = evaluateInternalContentAssessment(contents, [{
      noiHamId: "m1",
      menhDeId: "m1-fail",
      moTaThucTe: "Nhà trường chưa có kế hoạch được phê duyệt.",
      minhChungIds: [],
    }]);

    expect(result.mucDat).toBe(0);
    expect(result.diemYeu).toEqual(["Nhà trường chưa có kế hoạch được phê duyệt."]);
  });
});

