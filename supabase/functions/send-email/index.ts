import { Resend } from "npm:resend@6";
import { Webhook } from "npm:standardwebhooks@1";
import { buildAuthEmail } from "../_shared/auth-email-template.mjs";

type EmailActionType = "signup" | "recovery" | "invite" | "magiclink" | "email_change" | "reauthentication";

type HookPayload = {
  user: {
    email?: string;
    new_email?: string;
    user_metadata?: Record<string, unknown>;
  };
  email_data: {
    email_action_type: EmailActionType;
    redirect_to?: string;
    site_url: string;
    token?: string;
    token_hash?: string;
    token_new?: string;
    token_hash_new?: string;
  };
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function directVerifyLink(supabaseUrl: string, tokenHash: string, type: string, redirectTo: string) {
  const url = new URL("/auth/v1/verify", supabaseUrl);
  url.searchParams.set("token", tokenHash);
  url.searchParams.set("type", type);
  url.searchParams.set("redirect_to", redirectTo);
  return url.toString();
}

function appActionLink(appUrl: string, actionType: EmailActionType, tokenHash: string) {
  const path = actionType === "recovery" ? "/quen-mat-khau" : "/xac-thuc-email";
  const type = actionType === "recovery" ? "recovery" : "email";
  const url = new URL(path, `${appUrl.replace(/\/$/, "")}/`);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  return url.toString();
}

function messagesFor(payload: HookPayload, appUrl: string, supabaseUrl: string) {
  const { user, email_data: data } = payload;
  const type = data.email_action_type;
  const redirectTo = data.redirect_to || appUrl;

  if (type === "email_change") {
    const messages: Array<{ actionLink: string; otp?: string; to: string }> = [];
    if (user.email && data.token_hash_new) {
      messages.push({
        actionLink: directVerifyLink(supabaseUrl, data.token_hash_new, "email_change", redirectTo),
        otp: data.token,
        to: user.email,
      });
    }
    if (user.new_email && data.token_hash) {
      messages.push({
        actionLink: directVerifyLink(supabaseUrl, data.token_hash, "email_change", redirectTo),
        otp: data.token_new || data.token,
        to: user.new_email,
      });
    }
    return messages;
  }

  if (!user.email) throw new Error("Missing destination email");
  if (type === "reauthentication") {
    if (!data.token) throw new Error("Missing reauthentication token");
    return [{ actionLink: appUrl, otp: data.token, to: user.email }];
  }
  if (!data.token_hash) throw new Error("Missing token hash");

  const actionLink = type === "signup" || type === "recovery"
    ? appActionLink(appUrl, type, data.token_hash)
    : directVerifyLink(supabaseUrl, data.token_hash, type, redirectTo);
  return [{ actionLink, otp: data.token, to: user.email }];
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: { http_code: 405, message: "Method not allowed" } }, { status: 405 });
  }

  const rawPayload = await request.text();
  let payload: HookPayload;
  try {
    const hookSecret = requiredEnv("SEND_EMAIL_HOOK_SECRET").replace(/^v1,whsec_/, "");
    payload = new Webhook(hookSecret).verify(
      rawPayload,
      Object.fromEntries(request.headers),
    ) as HookPayload;
  } catch {
    return Response.json(
      { error: { http_code: 401, message: "Invalid webhook signature" } },
      { status: 401 },
    );
  }

  try {
    const resendApiKey = requiredEnv("RESEND_API_KEY");
    const from = requiredEnv("AUTH_EMAIL_FROM");
    const appUrl = requiredEnv("PUBLIC_APP_URL");
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const resend = new Resend(resendApiKey);
    const messages = messagesFor(payload, appUrl, supabaseUrl);

    if (messages.length === 0) throw new Error("No email destination was produced");

    for (const message of messages) {
      const content = buildAuthEmail({
        actionLink: message.actionLink,
        actionType: payload.email_data.email_action_type,
        appUrl,
        name: payload.user.user_metadata?.ho_ten,
        otp: message.otp,
      });
      const { error } = await resend.emails.send({
        from,
        to: [message.to],
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
      if (error) throw error;
    }

    return Response.json({});
  } catch {
    return Response.json(
      { error: { http_code: 500, message: "Unable to send authentication email" } },
      { status: 500 },
    );
  }
});
