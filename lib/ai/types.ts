import type { CapHoc } from "@/lib/assessment/level-engine";

export type AiDraftKind = "report_standard" | "improvement_task";

export type AiProvider = "openai" | "gemini" | "claude" | "deepseek" | "qwen";

export type ReportStandardDraft = {
  diem_manh_noi_bat: string;
  han_che_trong_tam: string;
  dinh_huong_cai_tien: string;
};

export type ImprovementTaskDraft = {
  noi_dung: string;
  muc_tieu: string;
  hoat_dong: string;
  chi_so_ket_qua: string;
  nguon_luc: string;
  minh_chung_du_kien: string;
};

export type AiDraftRequest = {
  kind: AiDraftKind;
  provider: AiProvider;
  namHocId: string;
  capHoc: CapHoc;
  model: string;
  standardId?: string;
  criterionId?: string;
  currentDraft?: Record<string, string>;
};

export type AiConnectionRequest = {
  provider: AiProvider;
  model: string;
};

export type AiConnectionResponse = AiConnectionRequest & {
  ok: true;
};

export type AiDraftResponse =
  | { kind: "report_standard"; draft: ReportStandardDraft }
  | { kind: "improvement_task"; draft: ImprovementTaskDraft };
