import { describe, expect, it } from "vitest";
import { buildAuthEmail } from "./auth-email-template.mjs";

describe("auth email template", () => {
  it("tạo đủ HTML và plain text cho email xác thực", () => {
    const email = buildAuthEmail({
      actionLink: "https://kdclgd.io.vn/xac-thuc-email?token_hash=abc&type=email",
      actionType: "signup",
      appUrl: "https://kdclgd.io.vn",
      name: "Nguyễn An",
      otp: "123456",
    });

    expect(email.subject).toContain("Xác thực tài khoản");
    expect(email.html).toContain("Xác thực tài khoản");
    expect(email.html).toContain("https://kdclgd.io.vn/icon.png");
    expect(email.html).toContain("PDT Academy");
    expect(email.text).toContain("tuphung@gmail.com");
    expect(email.text).toContain("60 phút");
    expect(email.text).not.toContain("localhost");
  });

  it("escape tên và URL trước khi đưa vào HTML", () => {
    const email = buildAuthEmail({
      actionLink: "https://kdclgd.io.vn/?next=<script>",
      actionType: "recovery",
      appUrl: "https://kdclgd.io.vn",
      name: "<img src=x onerror=alert(1)>",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.text).toContain("https://kdclgd.io.vn/");
  });
});
