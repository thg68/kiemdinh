export type ValidationIssue = {
  code: string;
  field: string;
  message: string;
};

export class SchemaValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super("Dữ liệu không hợp lệ.");
    this.name = "SchemaValidationError";
    this.issues = issues;
  }
}

export type Schema<T> = {
  parse(value: unknown, field?: string): T;
};

function invalid(field: string, code: string, message: string): never {
  throw new SchemaValidationError([{ field, code, message }]);
}

function trimmedString(value: unknown, field: string) {
  if (typeof value !== "string") {
    return invalid(field, "invalid_type", `${field} phải là chuỗi.`);
  }

  return value.trim();
}

export const uuidSchema: Schema<string> = {
  parse(value, field = "id") {
    const normalized = trimmedString(value, field).toLowerCase();

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)) {
      return invalid(field, "invalid_uuid", `${field} không phải UUID hợp lệ.`);
    }

    return normalized;
  },
};

export function createEnumSchema<const T extends readonly string[]>(
  values: T,
  label: string,
): Schema<T[number]> {
  const allowed = new Set<string>(values);

  return {
    parse(value, field = label) {
      const normalized = trimmedString(value, field);

      if (!allowed.has(normalized)) {
        return invalid(
          field,
          "invalid_enum",
          `${label} phải là một trong các giá trị: ${values.join(", ")}.`,
        );
      }

      return normalized as T[number];
    },
  };
}

export const LOAI_HINH_VALUES = ["mam_non", "pho_thong", "gdtx"] as const;
export const CAP_HOC_VALUES = [
  "mam_non",
  "tieu_hoc",
  "thcs",
  "thpt",
  "gdtx",
  "khac",
] as const;

export const loaiHinhSchema = createEnumSchema(LOAI_HINH_VALUES, "Loại hình");
export const capHocSchema = createEnumSchema(CAP_HOC_VALUES, "Cấp học");

export const namHocSchema: Schema<string> = {
  parse(value, field = "namHoc") {
    const normalized = trimmedString(value, field);
    const match = /^(\d{4})-(\d{4})$/.exec(normalized);

    if (!match || Number(match[2]) !== Number(match[1]) + 1) {
      return invalid(
        field,
        "invalid_school_year",
        "Năm học phải có dạng YYYY-YYYY và gồm hai năm liên tiếp.",
      );
    }

    return normalized;
  },
};

export const isoDateSchema: Schema<string> = {
  parse(value, field = "date") {
    const normalized = trimmedString(value, field);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return invalid(field, "invalid_date", `${field} không phải ngày ISO hợp lệ.`);
    }

    const parsed = new Date(`${normalized}T00:00:00.000Z`);
    if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== normalized) {
      return invalid(field, "invalid_date", `${field} không phải ngày hợp lệ.`);
    }

    return normalized;
  },
};

function positiveInteger(value: string | null, fallback: number, field: string) {
  if (value === null || value === "") {
    return fallback;
  }

  if (!/^\d+$/.test(value) || Number(value) < 1) {
    return invalid(field, "invalid_integer", `${field} phải là số nguyên dương.`);
  }

  return Number(value);
}

export const paginationSchema: Schema<{
  page: number;
  pageSize: number;
  from: number;
  to: number;
}> = {
  parse(value) {
    if (!(value instanceof URLSearchParams)) {
      return invalid("pagination", "invalid_type", "Phân trang không hợp lệ.");
    }

    const page = positiveInteger(value.get("page"), 1, "page");
    const pageSize = positiveInteger(value.get("pageSize"), 25, "pageSize");

    if (pageSize > 100) {
      return invalid("pageSize", "value_too_large", "Mỗi trang không được vượt quá 100 dòng.");
    }

    const from = (page - 1) * pageSize;
    return { page, pageSize, from, to: from + pageSize - 1 };
  },
};
