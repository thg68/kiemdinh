type ErrorLike = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
};

const DEFAULT_MESSAGE =
  "Không thể hoàn thành thao tác. Bạn có thể thử lại; nếu lỗi vẫn còn, hãy liên hệ người phụ trách hệ thống.";

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { code: "", message: "", status: "" };
  }

  const value = error as ErrorLike;
  return {
    code: typeof value.code === "string" ? value.code.toLowerCase() : "",
    message: typeof value.message === "string" ? value.message.toLowerCase() : "",
    status: typeof value.status === "number" ? String(value.status) : "",
  };
}

export function toUserMessage(error: unknown, fallback = DEFAULT_MESSAGE) {
  const { code, message, status } = errorDetails(error);
  const technical = `${code} ${message} ${status}`;

  if (/jwt|session|refresh token|not authenticated|401/.test(technical)) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi thử lại.";
  }

  if (/42501|row-level security|permission denied|forbidden|không có quyền|chưa có quyền|khong co quyen|chua co quyen|403/.test(technical)) {
    return "Bạn không có quyền thực hiện thao tác này. Hãy kiểm tra vai trò hoặc phạm vi được phân công.";
  }

  if (/23505|duplicate|already exists|409/.test(technical)) {
    return "Dữ liệu này đã tồn tại. Vui lòng kiểm tra lại trước khi lưu.";
  }

  if (/fetch|network|connection|econn|offline/.test(technical)) {
    return "Không kết nối được với hệ thống. Vui lòng kiểm tra mạng và thử lại.";
  }

  if (/timeout|timed out|57014/.test(technical)) {
    return "Hệ thống phản hồi quá lâu. Vui lòng thử lại sau ít phút.";
  }

  return fallback;
}

export function classifyError(error: unknown) {
  const { code, message, status } = errorDetails(error);
  const technical = `${code} ${message} ${status}`;

  if (/jwt|session|refresh token|not authenticated|401/.test(technical)) return "authentication";
  if (/42501|row-level security|permission denied|forbidden|không có quyền|chưa có quyền|khong co quyen|chua co quyen|403/.test(technical)) return "authorization";
  if (/23505|duplicate|already exists|409/.test(technical)) return "conflict";
  if (/fetch|network|connection|econn|offline/.test(technical)) return "network";
  if (/timeout|timed out|57014/.test(technical)) return "timeout";
  return "unexpected";
}
