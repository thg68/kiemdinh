import {
  type KetQuaTieuChi,
  type MucHieuLuc,
  mucHopLe,
} from "./level-engine";

export type MucMucTieu = 1 | 2;

export type ThayDoiGiaDinh = {
  ma: string;
  muc: MucMucTieu;
};

function sapXepTheoMa(items: KetQuaTieuChi[]) {
  return [...items].sort((a, b) => a.ma.localeCompare(b.ma, "vi", { numeric: true }));
}

export function deXuatPhuongAnToiThieu(
  ketQuaTieuChi: KetQuaTieuChi[],
  mucMucTieu: MucMucTieu,
): ThayDoiGiaDinh[] {
  const batBuoc = sapXepTheoMa(ketQuaTieuChi.filter((item) => item.laBatBuoc));
  const conLai = sapXepTheoMa(ketQuaTieuChi.filter((item) => !item.laBatBuoc));
  const thayDoi = new Map<string, MucMucTieu>();

  if (mucMucTieu === 1) {
    batBuoc.filter((item) => mucHopLe(item) < 1).forEach((item) => thayDoi.set(item.ma, 1));
    const soConThieu = Math.max(0, 5 - conLai.filter((item) => mucHopLe(item) >= 1).length);
    conLai
      .filter((item) => mucHopLe(item) < 1)
      .slice(0, soConThieu)
      .forEach((item) => thayDoi.set(item.ma, 1));
  } else {
    batBuoc.filter((item) => mucHopLe(item) < 2).forEach((item) => thayDoi.set(item.ma, 2));
    conLai.filter((item) => mucHopLe(item) < 1).forEach((item) => thayDoi.set(item.ma, 1));

    const soConThieuMuc2 = Math.max(0, 5 - conLai.filter((item) => mucHopLe(item) >= 2).length);
    conLai
      .filter((item) => mucHopLe(item) < 2)
      .sort((a, b) => mucHopLe(b) - mucHopLe(a) || a.ma.localeCompare(b.ma, "vi", { numeric: true }))
      .slice(0, soConThieuMuc2)
      .forEach((item) => thayDoi.set(item.ma, 2));
  }

  return [...thayDoi].map(([ma, muc]) => ({ ma, muc }));
}

export function taoBanDoMucGiaDinh(thayDoi: ThayDoiGiaDinh[]) {
  return new Map<string, MucHieuLuc>(thayDoi.map((item) => [item.ma, item.muc]));
}
