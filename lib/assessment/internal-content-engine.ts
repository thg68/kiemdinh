export type MucNoiHam = 1 | 2;

export type MenhDeTrangThai = {
  id: string;
  noiHamId: string;
  ma: string;
  noiDung: string;
  loai: "dap_ung" | "dap_ung_mot_phan" | "chua_dap_ung" | "khac";
  laDat: boolean;
  laKhongDat: boolean;
  yeuCauMinhChung: boolean;
  thuTu: number;
};

export type NoiHamDanhGia = {
  id: string;
  ma: string;
  muc: MucNoiHam;
  noiDung: string;
  trichDanGoc: string;
  thuTu: number;
  menhDe: MenhDeTrangThai[];
};

export type LuaChonNoiHamDraft = {
  noiHamId: string;
  menhDeId: string;
  moTaThucTe: string;
  minhChungIds: string[];
};

export type KetQuaPhieuNoiHam = {
  daChon: number;
  daDuDieuKien: number;
  moTaMuc1: string;
  moTaMuc2: string;
  muc1HoanThanh: boolean;
  muc2HoanThanh: boolean;
  mucDat: 0 | 1 | 2;
  tongNoiHam: number;
  diemYeu: string[];
};

function findSelection(
  drafts: LuaChonNoiHamDraft[],
  noiHamId: string,
) {
  return drafts.find((draft) => draft.noiHamId === noiHamId);
}

export function findSelectedProposition(
  content: NoiHamDanhGia,
  draft: LuaChonNoiHamDraft | undefined,
) {
  return content.menhDe.find((proposition) => proposition.id === draft?.menhDeId);
}

export function isInternalContentSatisfied(
  content: NoiHamDanhGia,
  draft: LuaChonNoiHamDraft | undefined,
) {
  const proposition = findSelectedProposition(content, draft);

  return Boolean(
    proposition?.laDat
      && draft?.moTaThucTe.trim()
      && (!proposition.yeuCauMinhChung || draft.minhChungIds.length > 0),
  );
}

function buildLevelDescription(
  contents: NoiHamDanhGia[],
  drafts: LuaChonNoiHamDraft[],
  level: MucNoiHam,
) {
  return contents
    .filter((content) => content.muc === level)
    .sort((left, right) => left.thuTu - right.thuTu)
    .map((content) => {
      const draft = findSelection(drafts, content.id);
      const proposition = findSelectedProposition(content, draft);

      if (!proposition) return "";

      return draft?.moTaThucTe.trim() || proposition.noiDung;
    })
    .filter(Boolean)
    .join("\n\n");
}

export function evaluateInternalContentAssessment(
  contents: NoiHamDanhGia[],
  drafts: LuaChonNoiHamDraft[],
): KetQuaPhieuNoiHam {
  const level1 = contents.filter((content) => content.muc === 1);
  const level2 = contents.filter((content) => content.muc === 2);
  const muc1HoanThanh = level1.length > 0
    && level1.every((content) => isInternalContentSatisfied(
      content,
      findSelection(drafts, content.id),
    ));
  const muc2HoanThanh = muc1HoanThanh
    && level2.length > 0
    && level2.every((content) => isInternalContentSatisfied(
      content,
      findSelection(drafts, content.id),
    ));
  const selected = contents.filter((content) => (
    Boolean(findSelectedProposition(content, findSelection(drafts, content.id)))
  ));
  const diemYeu = selected.flatMap((content) => {
    const draft = findSelection(drafts, content.id);
    const proposition = findSelectedProposition(content, draft);

    if (!proposition || proposition.laDat) return [];

    return [draft?.moTaThucTe.trim() || proposition.noiDung];
  });

  return {
    daChon: selected.length,
    daDuDieuKien: contents.filter((content) => isInternalContentSatisfied(
      content,
      findSelection(drafts, content.id),
    )).length,
    moTaMuc1: buildLevelDescription(contents, drafts, 1),
    moTaMuc2: buildLevelDescription(contents, drafts, 2),
    muc1HoanThanh,
    muc2HoanThanh,
    mucDat: muc2HoanThanh ? 2 : muc1HoanThanh ? 1 : 0,
    tongNoiHam: contents.length,
    diemYeu,
  };
}

