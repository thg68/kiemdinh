const ORGANIZATION = "PDT Academy";
const SUPPORT_EMAIL = "tuphung@gmail.com";
const TOKEN_TTL_MINUTES = 60;

const COPY = {
  signup: {
    subject: "Xác thực tài khoản PDT Academy",
    heading: "Xác thực tài khoản của bạn",
    intro: "Cảm ơn bạn đã đăng ký hệ thống kiểm định chất lượng giáo dục.",
    action: "Xác thực tài khoản",
    expiry: `Liên kết này có hiệu lực trong ${TOKEN_TTL_MINUTES} phút.`,
  },
  recovery: {
    subject: "Đặt lại mật khẩu PDT Academy",
    heading: "Đặt lại mật khẩu",
    intro: "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
    action: "Đặt lại mật khẩu",
    expiry: `Liên kết này có hiệu lực trong ${TOKEN_TTL_MINUTES} phút.`,
  },
  invite: {
    subject: "Lời mời tham gia PDT Academy",
    heading: "Bạn được mời tham gia",
    intro: "Một quản trị viên đã mời bạn tham gia hệ thống kiểm định chất lượng giáo dục.",
    action: "Chấp nhận lời mời",
    expiry: `Liên kết này có hiệu lực trong ${TOKEN_TTL_MINUTES} phút.`,
  },
  magiclink: {
    subject: "Liên kết đăng nhập PDT Academy",
    heading: "Đăng nhập vào tài khoản",
    intro: "Sử dụng liên kết an toàn dưới đây để đăng nhập.",
    action: "Đăng nhập",
    expiry: `Liên kết này có hiệu lực trong ${TOKEN_TTL_MINUTES} phút.`,
  },
  email_change: {
    subject: "Xác nhận thay đổi email PDT Academy",
    heading: "Xác nhận địa chỉ email",
    intro: "Chúng tôi nhận được yêu cầu thay đổi địa chỉ email của tài khoản.",
    action: "Xác nhận email",
    expiry: `Liên kết này có hiệu lực trong ${TOKEN_TTL_MINUTES} phút.`,
  },
  reauthentication: {
    subject: "Mã xác thực PDT Academy",
    heading: "Xác nhận thao tác bảo mật",
    intro: "Dùng mã dưới đây để hoàn tất thao tác bảo mật đang chờ.",
    action: "Xác nhận thao tác",
    expiry: `Mã này có hiệu lực trong ${TOKEN_TTL_MINUTES} phút.`,
  },
};

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildAuthEmail({ actionLink, actionType, appUrl, name, otp }) {
  const copy = COPY[actionType] ?? COPY.magiclink;
  const safeName = escapeHtml(String(name || "bạn").trim() || "bạn");
  const safeLink = escapeHtml(actionLink);
  const logoUrl = `${String(appUrl).replace(/\/$/, "")}/icon.png`;
  const safeLogoUrl = escapeHtml(logoUrl);
  const safeOtp = escapeHtml(otp ?? "");
  const actionBlock = actionType === "reauthentication"
    ? `<div style="margin:24px 0;padding:16px;border-radius:10px;background:#eef3ff;text-align:center;font-size:28px;font-weight:700;letter-spacing:8px;color:#102a56">${safeOtp}</div>`
    : `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto"><tr><td bgcolor="#1d4ed8" style="border-radius:8px"><a href="${safeLink}" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700">${copy.action}</a></td></tr></table>`;
  const fallbackBlock = actionType === "reauthentication"
    ? ""
    : `<p style="margin:22px 0 6px;color:#526071;font-size:13px;line-height:20px">Nếu nút không hoạt động, sao chép liên kết này vào trình duyệt:</p><p style="margin:0;overflow-wrap:anywhere;font-size:13px;line-height:20px"><a href="${safeLink}" style="color:#1d4ed8">${safeLink}</a></p>`;

  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${copy.subject}</title></head>
<body style="margin:0;padding:0;background:#f3f6fa;font-family:Arial,'Helvetica Neue',sans-serif;color:#172033">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f6fa"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #dfe5ec;border-radius:12px">
<tr><td align="center" style="padding:30px 32px 18px"><img src="${safeLogoUrl}" width="56" height="56" alt="PDT Academy" style="display:block;border:0;border-radius:12px"><p style="margin:12px 0 0;color:#102a56;font-size:15px;font-weight:700">PDT Academy</p></td></tr>
<tr><td style="padding:8px 32px 34px"><h1 style="margin:0 0 20px;text-align:center;color:#102a56;font-size:26px;line-height:34px">${copy.heading}</h1><p style="margin:0 0 14px;font-size:16px;line-height:25px">Xin chào ${safeName},</p><p style="margin:0;font-size:15px;line-height:24px;color:#38465a">${copy.intro}</p>${actionBlock}<p style="margin:18px 0 0;font-size:14px;line-height:22px;color:#526071">${copy.expiry}</p>${fallbackBlock}<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e7ebf0;font-size:13px;line-height:20px;color:#687588">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email. Tài khoản của bạn sẽ không thay đổi.</p></td></tr>
<tr><td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #e7ebf0;text-align:center;color:#687588;font-size:12px;line-height:19px">${ORGANIZATION}<br>Hỗ trợ: <a href="mailto:${SUPPORT_EMAIL}" style="color:#1d4ed8">${SUPPORT_EMAIL}</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    copy.heading,
    "",
    `Xin chào ${String(name || "bạn").trim() || "bạn"},`,
    copy.intro,
    "",
    actionType === "reauthentication" ? `Mã xác thực: ${otp}` : `${copy.action}: ${actionLink}`,
    copy.expiry,
    "",
    "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email. Tài khoản của bạn sẽ không thay đổi.",
    "",
    ORGANIZATION,
    `Hỗ trợ: ${SUPPORT_EMAIL}`,
  ].join("\n");

  return { html, subject: copy.subject, text };
}
