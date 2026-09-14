import type { ReportData } from "@/lib/reports/data";
import type {
  AiDraftRequest,
  AiDraftResponse,
  ImprovementTaskDraft,
  ReportStandardDraft,
} from "@/lib/ai/types";
import { apiErrors } from "@/lib/api/errors";
import { capHocSchema, uuidSchema } from "@/lib/api/validation";
import { isAiProvider } from "@/lib/ai/provider-catalog";

const MODEL_PATTERN = /^[A-Za-z0-9._:-]{1,80}$/;
const MAX_DRAFT_FIELD_LENGTH = 5_000;

const reportDraftKeys = [
  "diem_manh_noi_bat",
  "han_che_trong_tam",
  "dinh_huong_cai_tien",
] as const;

const improvementDraftKeys = [
  "noi_dung",
  "muc_tieu",
  "hoat_dong",
  "chi_so_ket_qua",
  "nguon_luc",
  "minh_chung_du_kien",
] as const;

function readBoundedString(
  value: unknown,
  field: string,
  options: { required?: boolean; max?: number } = {},
) {
  if (value === undefined || value === null) {
    if (options.required) throw apiErrors.unprocessable(`${field} là bắt buộc.`);
    return "";
  }

  if (typeof value !== "string") {
    throw apiErrors.unprocessable(`${field} phải là chuỗi.`);
  }

  const normalized = value.trim();
  if (options.required && !normalized) {
    throw apiErrors.unprocessable(`${field} là bắt buộc.`);
  }
  if (normalized.length > (options.max ?? MAX_DRAFT_FIELD_LENGTH)) {
    throw apiErrors.unprocessable(`${field} vượt quá độ dài cho phép.`);
  }

  return normalized;
}

function readCurrentDraft(value: unknown) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw apiErrors.unprocessable("Bản nháp hiện tại không hợp lệ.");
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => [
      key,
      readBoundedString(fieldValue, `currentDraft.${key}`),
    ]),
  );
}

export function parseAiDraftRequest(value: unknown): AiDraftRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw apiErrors.badRequest("Nội dung JSON gửi lên không hợp lệ.");
  }

  const body = value as Record<string, unknown>;
  const kind = body.kind;
  if (kind !== "report_standard" && kind !== "improvement_task") {
    throw apiErrors.unprocessable("Loại bản nháp AI không hợp lệ.");
  }

  if (!isAiProvider(body.provider)) {
    throw apiErrors.unprocessable("Nhà cung cấp AI không hợp lệ.");
  }

  const model = parseAiModel(body.model);

  const parsed: AiDraftRequest = {
    kind,
    provider: body.provider,
    namHocId: uuidSchema.parse(body.namHocId, "namHocId"),
    capHoc: capHocSchema.parse(body.capHoc, "capHoc"),
    model,
    currentDraft: readCurrentDraft(body.currentDraft),
  };

  if (kind === "report_standard") {
    parsed.standardId = uuidSchema.parse(body.standardId, "standardId");
  } else {
    parsed.criterionId = uuidSchema.parse(body.criterionId, "criterionId");
  }

  return parsed;
}

export function parseAiModel(value: unknown) {
  const model = readBoundedString(value, "model", { required: true, max: 80 });
  if (!MODEL_PATTERN.test(model)) {
    throw apiErrors.unprocessable("Tên mô hình AI không hợp lệ.");
  }
  return model;
}

export function parseAiConnectionRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw apiErrors.badRequest("Nội dung JSON gửi lên không hợp lệ.");
  }

  const body = value as Record<string, unknown>;
  if (!isAiProvider(body.provider)) {
    throw apiErrors.unprocessable("Nhà cung cấp AI không hợp lệ.");
  }

  return { provider: body.provider, model: parseAiModel(body.model) };
}

function evidenceForCriterion(data: ReportData, criterionId: string) {
  return data.evidence
    .filter((evidence) => evidence.tieuChiIds.includes(criterionId))
    .map((evidence) => ({
      ma: evidence.ma,
      ten: evidence.ten,
      ngay_ban_hanh: evidence.ngay_ban_hanh,
      ngay_het_gia_tri: evidence.ngay_het_gia_tri,
    }));
}

export function buildAiDraftContext(data: ReportData, request: AiDraftRequest) {
  const shared = {
    don_vi: data.school.ten,
    ma_truong: data.school.ma_truong,
    nam_hoc: data.year.ten,
    cap_hoc: request.capHoc,
  };

  if (request.kind === "report_standard") {
    const standard = data.standards.find((item) => item.id === request.standardId);
    if (!standard) throw apiErrors.notFound("Không tìm thấy tiêu chuẩn trong năm học đã chọn.");

    const criteria = data.criteria
      .filter((criterion) => criterion.tieu_chuan_id === standard.id)
      .map((criterion) => {
        const assessment = data.assessments.find((item) => item.tieu_chi_id === criterion.id);
        return {
          ma: criterion.ma,
          ten: criterion.ten,
          bat_buoc: criterion.la_bat_buoc,
          muc_dat: assessment?.muc_dat ?? 0,
          mo_ta_muc_1: assessment?.mo_ta_muc_1 ?? "",
          mo_ta_muc_2: assessment?.mo_ta_muc_2 ?? "",
          minh_chung: evidenceForCriterion(data, criterion.id),
        };
      });

    return {
      ...shared,
      loai_noi_dung: "nhan_xet_tieu_chuan_mau_1",
      tieu_chuan: { so_thu_tu: standard.so_thu_tu, ten: standard.ten },
      tieu_chi: criteria,
      ban_nhap_hien_tai: request.currentDraft,
    };
  }

  const criterion = data.criteria.find((item) => item.id === request.criterionId);
  if (!criterion) throw apiErrors.notFound("Không tìm thấy tiêu chí trong năm học đã chọn.");
  const assessment = data.assessments.find((item) => item.tieu_chi_id === criterion.id);

  return {
    ...shared,
    loai_noi_dung: "nhiem_vu_cai_tien_mau_2",
    tieu_chi: {
      ma: criterion.ma,
      ten: criterion.ten,
      bat_buoc: criterion.la_bat_buoc,
      yeu_cau_muc_1: criterion.muc_1,
      yeu_cau_muc_2: criterion.muc_2,
      muc_dat: assessment?.muc_dat ?? 0,
      mo_ta_muc_1: assessment?.mo_ta_muc_1 ?? "",
      mo_ta_muc_2: assessment?.mo_ta_muc_2 ?? "",
      minh_chung: evidenceForCriterion(data, criterion.id),
    },
    nhiem_vu_da_co: data.plans
      .filter((plan) => plan.tieu_chi_id === criterion.id)
      .map((plan) => ({ noi_dung: plan.noi_dung, muc_tieu: plan.muc_tieu })),
    ban_nhap_hien_tai: request.currentDraft,
  };
}

export function jsonSchemaFor(kind: AiDraftRequest["kind"]) {
  const keys = kind === "report_standard" ? reportDraftKeys : improvementDraftKeys;

  return {
    type: "object",
    additionalProperties: false,
    required: [...keys],
    properties: Object.fromEntries(keys.map((key) => [key, { type: "string" }])),
  };
}

export function buildAiInstructions(kind: AiDraftRequest["kind"]) {
  const purpose = kind === "report_standard"
    ? "soạn nhận xét theo tiêu chuẩn cho Mẫu 1"
    : "soạn một nhiệm vụ cải tiến cho Mẫu 2";
  const outputFields = kind === "report_standard" ? reportDraftKeys : improvementDraftKeys;

  return [
    `Bạn là trợ lý hỗ trợ ${purpose} trong hệ thống quản trị chất lượng giáo dục.`,
    "Chỉ sử dụng dữ liệu JSON được cung cấp. Không suy đoán sự kiện, số liệu, người phụ trách, thời hạn hoặc minh chứng.",
    "Khi dữ liệu chưa đủ, ghi rõ [CẦN BỔ SUNG] tại đúng vị trí thay vì tự tạo thông tin.",
    "Nêu mã minh chứng khi dùng một minh chứng làm căn cứ. Không tuyên bố tiêu chí đạt nếu dữ liệu đầu vào không thể hiện điều đó.",
    "Viết tiếng Việt hành chính rõ ràng, câu ngắn, có thể kiểm chứng. Đây chỉ là bản nháp để con người rà soát.",
    `Chỉ trả về một đối tượng JSON, không kèm Markdown, với đúng các trường: ${outputFields.join(", ")}.`,
  ].join("\n");
}

export function buildOpenAiRequest(request: AiDraftRequest, context: unknown) {
  return {
    model: request.model,
    store: false,
    max_output_tokens: 1_600,
    instructions: buildAiInstructions(request.kind),
    input: JSON.stringify(context),
    text: {
      format: {
        type: "json_schema",
        name: request.kind === "report_standard" ? "report_standard_draft" : "improvement_task_draft",
        strict: true,
        schema: jsonSchemaFor(request.kind),
      },
    },
  };
}

export function extractOpenAiOutputText(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const response = value as { output_text?: unknown; output?: unknown };
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return "";

  for (const item of response.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const candidate = (part as { type?: unknown; text?: unknown });
      if (candidate.type === "output_text" && typeof candidate.text === "string") {
        return candidate.text;
      }
    }
  }

  return "";
}

function parseJsonObject(text: string) {
  const normalized = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(normalized) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw apiErrors.internal("AI trả về nội dung không đúng định dạng. Vui lòng thử lại.");
  }
}

function readDraftFields<const T extends readonly string[]>(
  value: Record<string, unknown>,
  keys: T,
) {
  return Object.fromEntries(keys.map((key) => [
    key,
    readBoundedString(value[key], key, { required: true }),
  ])) as Record<T[number], string>;
}

export function parseAiDraftResponse(kind: AiDraftRequest["kind"], text: string): AiDraftResponse {
  const parsed = parseJsonObject(text);

  if (kind === "report_standard") {
    return {
      kind,
      draft: readDraftFields(parsed, reportDraftKeys) as ReportStandardDraft,
    };
  }

  return {
    kind,
    draft: readDraftFields(parsed, improvementDraftKeys) as ImprovementTaskDraft,
  };
}
