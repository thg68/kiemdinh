export type CapHoc = "mam_non" | "tieu_hoc" | "thcs" | "thpt" | "gdtx" | "khac";

export type MucDatCapHoc = "Không đạt Mức 1" | "Đạt Mức 1" | "Đạt Mức 2";
export type MucDatToanTruong = "Không đạt" | "Đạt Mức 1" | "Đạt Mức 2";

export type KetQuaTieuChi = {
  id?: string;
  ma: string;
  ten?: string;
  laBatBuoc: boolean;
  mucDat: 0 | 1 | 2;
  moTaMuc1?: string | null;
  moTaMuc2?: string | null;
  maMinhChung?: string[];
};

export type GiaiTrinhMuc<TMucDat extends string = MucDatCapHoc> = {
  mucDat: TMucDat;
  lyDo: string;
  chanLenMucTiepTheo: string[];
  khoangCach: string;
};

export type KetQuaTheoCapHoc = {
  capHoc: CapHoc;
  ketQuaTieuChi: KetQuaTieuChi[];
};

export type MucHieuLuc = 0 | 1 | 2;

type KetQuaTieuChiDaTinh = {
  mucDat: MucHieuLuc;
  nguon: KetQuaTieuChi;
};

function coNoiDung(value?: string | null) {
  return Boolean(value?.trim());
}

function coMinhChung(item: KetQuaTieuChi) {
  return (item.maMinhChung ?? []).some((ma) => ma.trim().length > 0);
}

function chuanHoaKetQuaTieuChi(ketQuaTieuChi: KetQuaTieuChi[]) {
  // Nguon su that ve ma va co bat buoc la phien ban bo tieu chuan trong CSDL.
  // Loai ban ghi trung ma de du lieu loi khong lam tang sai so tieu chi dat.
  return [...new Map(ketQuaTieuChi.map((item) => [item.ma, item])).values()];
}

export function mucHopLe(item: KetQuaTieuChi): 0 | 1 | 2 {
  const mucDaNhap = item.mucDat;

  if (mucDaNhap <= 0) {
    return 0;
  }

  // Quy tắc nghiệp vụ: đạt bất kỳ mức nào đều phải có mô tả hiện trạng và mã minh chứng thật.
  if (!coNoiDung(item.moTaMuc1) || !coMinhChung(item)) {
    return 0;
  }

  // Mức 2 chỉ được tính khi Mức 1 hợp lệ và có mô tả hiện trạng riêng cho Mức 2.
  if (mucDaNhap === 2) {
    return coNoiDung(item.moTaMuc2) ? 2 : 1;
  }

  return 1;
}

export function kiemTraRangBuocCapNhat(item: KetQuaTieuChi) {
  const loi: string[] = [];

  if (item.mucDat >= 1) {
    if (!coNoiDung(item.moTaMuc1)) {
      loi.push(`${item.ma} chưa có mô tả hiện trạng Mức 1.`);
    }

    if (!coMinhChung(item)) {
      loi.push(`${item.ma} chưa gắn mã minh chứng.`);
    }
  }

  if (item.mucDat === 2 && !coNoiDung(item.moTaMuc2)) {
    loi.push(`${item.ma} chưa có mô tả hiện trạng Mức 2.`);
  }

  return {
    hopLe: loi.length === 0,
    loi,
  };
}

function chuanHoaVaTinhMuc(
  ketQuaTieuChi: KetQuaTieuChi[],
  mucGiaDinh?: ReadonlyMap<string, MucHieuLuc>,
) {
  return chuanHoaKetQuaTieuChi(ketQuaTieuChi).map<KetQuaTieuChiDaTinh>((item) => ({
    mucDat: mucGiaDinh?.get(item.ma) ?? mucHopLe(item),
    nguon: item,
  }));
}

function demTheoMuc(items: KetQuaTieuChiDaTinh[], mucToiThieu: 1 | 2) {
  return items.filter((item) => item.mucDat >= mucToiThieu).length;
}

function labelMuc(muc: 0 | 1 | 2) {
  if (muc === 2) {
    return "đang Mức 2";
  }

  if (muc === 1) {
    return "đang Mức 1";
  }

  return "chưa đạt Mức 1";
}

function taoChan(items: KetQuaTieuChiDaTinh[], mucToiThieu: 1 | 2) {
  return items
    .filter((item) => item.mucDat < mucToiThieu)
    .map((item) => {
      const rangBuoc = kiemTraRangBuocCapNhat(item.nguon);
      const thieuDuLieu = rangBuoc.loi.length > 0 && item.mucDat === 0 && item.nguon.mucDat >= mucToiThieu;

      if (thieuDuLieu) {
        return `${item.nguon.ma} thiếu mô tả hiện trạng hoặc mã minh chứng`;
      }

      return `${item.nguon.ma} ${labelMuc(item.mucDat)}`;
    });
}

function taoKhoangCachLenMuc2(batBuoc: KetQuaTieuChiDaTinh[], conLai: KetQuaTieuChiDaTinh[]) {
  const batBuocCanNang = batBuoc.filter((item) => item.mucDat < 2).length;
  const conLaiMuc2 = demTheoMuc(conLai, 2);
  const conLaiCanNang = Math.max(0, 5 - conLaiMuc2);
  const conLaiDuoiMuc1 = conLai.filter((item) => item.mucDat < 1).length;

  const parts = [
    `Cần nâng ${batBuocCanNang} tiêu chí bắt buộc lên Mức 2`,
    `${conLaiCanNang} tiêu chí còn lại lên Mức 2`,
  ];

  if (conLaiDuoiMuc1 > 0) {
    parts.push(`${conLaiDuoiMuc1} tiêu chí còn lại tối thiểu lên Mức 1`);
  }

  return parts.join(" và ");
}

function taoKhoangCachLenMuc1(batBuoc: KetQuaTieuChiDaTinh[], conLai: KetQuaTieuChiDaTinh[]) {
  const batBuocCanDat = batBuoc.filter((item) => item.mucDat < 1).length;
  const conLaiCanDat = Math.max(0, 5 - demTheoMuc(conLai, 1));

  return `Cần hoàn thành ${batBuocCanDat} tiêu chí bắt buộc và ${conLaiCanDat} tiêu chí còn lại ở Mức 1`;
}

function tinhMucTuKetQuaDaChuanHoa(ketQuaDaChuanHoa: KetQuaTieuChiDaTinh[]): GiaiTrinhMuc {
  const batBuoc = ketQuaDaChuanHoa.filter((item) => item.nguon.laBatBuoc);
  const conLai = ketQuaDaChuanHoa.filter((item) => !item.nguon.laBatBuoc);

  if (ketQuaDaChuanHoa.length !== 15 || batBuoc.length !== 8 || conLai.length !== 7) {
    return {
      mucDat: "Không đạt Mức 1",
      lyDo: `Dữ liệu phiên bản bộ tiêu chuẩn chưa đầy đủ: ${ketQuaDaChuanHoa.length}/15 tiêu chí, ${batBuoc.length}/8 tiêu chí bắt buộc.`,
      chanLenMucTiepTheo: ["Bộ tiêu chuẩn của năm học chưa đủ cấu trúc 4-15-8."],
      khoangCach: "Cần kiểm tra lại phiên bản bộ tiêu chuẩn đã gắn với năm học.",
    };
  }
  const batBuocMuc2 = demTheoMuc(batBuoc, 2);
  const batBuocMuc1 = demTheoMuc(batBuoc, 1);
  const conLaiMuc2 = demTheoMuc(conLai, 2);
  const conLaiMuc1 = demTheoMuc(conLai, 1);
  const conLaiDuoiMuc1 = conLai.filter((item) => item.mucDat < 1);

  if (batBuocMuc2 === batBuoc.length && conLaiMuc2 >= 5 && conLaiDuoiMuc1.length === 0) {
    return {
      mucDat: "Đạt Mức 2",
      lyDo: `${batBuocMuc2}/${batBuoc.length} tiêu chí bắt buộc đạt Mức 2; ${conLaiMuc2}/${conLai.length} tiêu chí còn lại đạt Mức 2; các tiêu chí còn lại tối thiểu đạt Mức 1`,
      chanLenMucTiepTheo: [],
      khoangCach: "Đã đạt mức cao nhất theo khung hiện tại.",
    };
  }

  if (batBuocMuc1 === batBuoc.length && conLaiMuc1 >= 5) {
    return {
      mucDat: "Đạt Mức 1",
      lyDo: `${batBuocMuc1}/${batBuoc.length} tiêu chí bắt buộc đạt Mức 1; ${conLaiMuc1}/${conLai.length} tiêu chí còn lại đạt Mức 1 trở lên`,
      chanLenMucTiepTheo: [
        ...taoChan(batBuoc, 2),
        ...taoChan(conLai, 2).slice(0, Math.max(0, 5 - conLaiMuc2)),
        ...conLaiDuoiMuc1.map((item) => `${item.nguon.ma} chưa đạt tối thiểu Mức 1`),
      ],
      khoangCach: taoKhoangCachLenMuc2(batBuoc, conLai),
    };
  }

  return {
    mucDat: "Không đạt Mức 1",
    lyDo: `${batBuocMuc1}/${batBuoc.length} tiêu chí bắt buộc đạt Mức 1; ${conLaiMuc1}/${conLai.length} tiêu chí còn lại đạt Mức 1 trở lên`,
    chanLenMucTiepTheo: [
      ...taoChan(batBuoc, 1),
      ...taoChan(conLai, 1).slice(0, Math.max(0, 5 - conLaiMuc1)),
    ],
    khoangCach: taoKhoangCachLenMuc1(batBuoc, conLai),
  };
}

export function xacDinhMucTuKetQua(ketQuaTieuChi: KetQuaTieuChi[]): GiaiTrinhMuc {
  return tinhMucTuKetQuaDaChuanHoa(chuanHoaVaTinhMuc(ketQuaTieuChi));
}

export function xacDinhMucVoiGiaDinh(
  ketQuaTieuChi: KetQuaTieuChi[],
  mucGiaDinh: ReadonlyMap<string, MucHieuLuc>,
): GiaiTrinhMuc {
  return tinhMucTuKetQuaDaChuanHoa(chuanHoaVaTinhMuc(ketQuaTieuChi, mucGiaDinh));
}

function mucThuTu(muc: MucDatCapHoc) {
  if (muc === "Đạt Mức 2") {
    return 2;
  }

  if (muc === "Đạt Mức 1") {
    return 1;
  }

  return 0;
}

function tongHopMucToanTruong(
  ketQua: Array<{ capHoc: CapHoc; giaiTrinh: GiaiTrinhMuc }>,
): GiaiTrinhMuc<MucDatToanTruong> {
  if (ketQua.length === 0) {
    return {
      mucDat: "Không đạt",
      lyDo: "Chưa có cấp học nào để xác định mức toàn trường.",
      chanLenMucTiepTheo: ["Cần khai báo ít nhất một cấp học trong năm học."],
      khoangCach: "Cần kiểm tra lại thông tin cấp học của cơ sở giáo dục.",
    };
  }

  const coCapKhongDat = ketQua.some((item) => item.giaiTrinh.mucDat === "Không đạt Mức 1");

  if (coCapKhongDat) {
    return {
      mucDat: "Không đạt",
      lyDo: ketQua.map((item) => `${item.capHoc}: ${item.giaiTrinh.mucDat}`).join("; "),
      chanLenMucTiepTheo: ketQua.flatMap((item) => item.giaiTrinh.chanLenMucTiepTheo),
      khoangCach: "Cần xử lý các cấp học chưa đạt Mức 1 trước khi xác định mức toàn trường.",
    };
  }

  const mucThapNhat = Math.min(...ketQua.map((item) => mucThuTu(item.giaiTrinh.mucDat)));
  const mucDat = mucThapNhat === 2 ? "Đạt Mức 2" : "Đạt Mức 1";

  return {
    mucDat,
    lyDo: ketQua.map((item) => `${item.capHoc}: ${item.giaiTrinh.mucDat}`).join("; "),
    chanLenMucTiepTheo: ketQua.flatMap((item) => item.giaiTrinh.chanLenMucTiepTheo),
    khoangCach:
      mucDat === "Đạt Mức 2"
        ? "Toàn trường đã đạt mức cao nhất theo khung hiện tại."
        : "Mức toàn trường lấy theo cấp học có mức thấp nhất.",
  };
}

export function xacDinhMucToanTruongTuKetQua(
  cacCapHoc: KetQuaTheoCapHoc[],
): GiaiTrinhMuc<MucDatToanTruong> {
  return tongHopMucToanTruong(cacCapHoc.map((cap) => ({
    capHoc: cap.capHoc,
    giaiTrinh: xacDinhMucTuKetQua(cap.ketQuaTieuChi),
  })));
}

export function xacDinhMucToanTruongVoiGiaDinh(
  cacCapHoc: KetQuaTheoCapHoc[],
  capHocGiaDinh: CapHoc,
  mucGiaDinh: ReadonlyMap<string, MucHieuLuc>,
): GiaiTrinhMuc<MucDatToanTruong> {
  return tongHopMucToanTruong(cacCapHoc.map((cap) => ({
    capHoc: cap.capHoc,
    giaiTrinh: cap.capHoc === capHocGiaDinh
      ? xacDinhMucVoiGiaDinh(cap.ketQuaTieuChi, mucGiaDinh)
      : xacDinhMucTuKetQua(cap.ketQuaTieuChi),
  })));
}
