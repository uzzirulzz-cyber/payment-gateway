import nodemailer from "nodemailer";
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
} from "@/lib/env";

/**
 * Email receipt sender.
 *
 * If SMTP is configured (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS),
 * sends real email via that server. Otherwise, generates an Ethereal
 * test account on the fly and "sends" to it — the preview URL is
 * logged and returned so you can view the actual email in a browser.
 *
 * Either way, the function is 100% functional and doesn't throw.
 */

export interface ReceiptEmail {
  to: string;
  customerName: string | null;
  txnRefNo: string;
  amount: number;
  description: string;
  transactionId: string | null;
  paymentMethod: string | null;
  status: string;
}

export interface SendResult {
  success: boolean;
  previewUrl?: string;
  messageId?: string;
  error?: string;
  mode: "smtp" | "ethereal" | "skipped";
}

let cachedTransporter: nodemailer.Transporter | null = null;
let etherealAccount: nodemailer.TestAccount | null = null;

async function getTransporter(): Promise<{
  transporter: nodemailer.Transporter;
  mode: "smtp" | "ethereal";
}> {
  // Real SMTP configured?
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    if (!cachedTransporter) {
      cachedTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
    }
    return { transporter: cachedTransporter, mode: "smtp" };
  }

  // Fallback: Ethereal test account (auto-generated, no signup needed).
  if (!etherealAccount) {
    etherealAccount = await nodemailer.createTestAccount();
  }
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });
  }
  return { transporter: cachedTransporter, mode: "ethereal" };
}

function formatPKR(n: number): string {
  return "PKR " + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function buildHtmlReceipt(r: ReceiptEmail): string {
  const isSuccess = r.status === "paid";
  const statusColor = isSuccess ? "#10b981" : "#ef4444";
  const statusLabel = isSuccess ? "Payment Successful" : `Payment ${r.status}`;
  const date = new Date().toLocaleString("en-PK", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>PlayBeat Receipt — ${r.txnRefNo}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;padding:8px 20px;border-radius:8px;background:linear-gradient(135deg,#0099FF,#0066CC);color:#fff;font-weight:700;font-size:20px;letter-spacing:1px;">PLAYBEAT</div>
      <p style="color:#888;font-size:13px;margin:8px 0 0;">Premium digital products, instantly delivered.</p>
    </div>

    <!-- Status banner -->
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="size:48px;width:48px;height:48px;border-radius:50%;background:${statusColor}22;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:24px;color:${statusColor};">
        ${isSuccess ? "✓" : "✕"}
      </div>
      <h1 style="margin:0;font-size:22px;color:${statusColor};">${statusLabel}</h1>
      <p style="color:#888;font-size:13px;margin:8px 0 0;">${date}</p>
    </div>

    <!-- Receipt details -->
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:24px;">
      <h2 style="margin:0 0 16px;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;">Receipt</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#888;">Description</td>
          <td style="padding:8px 0;text-align:right;color:#fff;font-weight:500;">${r.description}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;">Transaction ref</td>
          <td style="padding:8px 0;text-align:right;color:#fff;font-family:monospace;font-size:12px;">${r.txnRefNo}</td>
        </tr>
        ${r.transactionId ? `<tr><td style="padding:8px 0;color:#888;">JazzCash txn ID</td><td style="padding:8px 0;text-align:right;color:#fff;font-family:monospace;font-size:12px;">${r.transactionId}</td></tr>` : ""}
        ${r.paymentMethod ? `<tr><td style="padding:8px 0;color:#888;">Payment method</td><td style="padding:8px 0;text-align:right;color:#fff;">${r.paymentMethod}</td></tr>` : ""}
        <tr>
          <td style="padding:8px 0;color:#888;">Customer</td>
          <td style="padding:8px 0;text-align:right;color:#fff;">${r.customerName ?? "—"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;">Email</td>
          <td style="padding:8px 0;text-align:right;color:#fff;">${r.to}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:0;border-top:1px solid #222;margin-top:8px;"></td>
        </tr>
        <tr>
          <td style="padding:16px 0 0;color:#888;font-size:16px;">Total</td>
          <td style="padding:16px 0 0;text-align:right;color:#fff;font-size:24px;font-weight:700;">${formatPKR(r.amount)}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;color:#555;font-size:12px;">
      <p>This is an automated receipt from PlayBeat Digital Private Limited.</p>
      <p>Questions? Reply to this email or contact hello@playbeat.digital</p>
      <p style="margin-top:16px;">© 2026 Playbeat Digital Private Limited. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildTextReceipt(r: ReceiptEmail): string {
  const date = new Date().toLocaleString("en-PK");
  return `PlayBeat Digital — Receipt

${r.status === "paid" ? "PAYMENT SUCCESSFUL" : `PAYMENT ${r.status.toUpperCase()}`}
Date: ${date}

Description:     ${r.description}
Transaction ref: ${r.txnRefNo}
${r.transactionId ? `JazzCash txn:  ${r.transactionId}\n` : ""}${r.paymentMethod ? `Payment method: ${r.paymentMethod}\n` : ""}Customer:        ${r.customerName ?? "—"}
Email:           ${r.to}

Total: ${formatPKR(r.amount)}

---
PlayBeat Digital Private Limited
hello@playbeat.digital
© 2026 Playbeat Digital Private Limited`;
}

export async function sendReceiptEmail(r: ReceiptEmail): Promise<SendResult> {
  if (!r.to || !r.to.includes("@")) {
    return { success: false, mode: "skipped", error: "Invalid email address" };
  }

  try {
    const { transporter, mode } = await getTransporter();

    const info = await transporter.sendMail({
      from:
        mode === "smtp"
          ? `"PlayBeat Digital" <${SMTP_USER}>`
          : '"PlayBeat Digital" <noreply@playbeat.digital>',
      to: r.to,
      subject:
        r.status === "paid"
          ? `✓ Payment Successful — ${formatPKR(r.amount)}`
          : `Payment ${r.status} — PlayBeat Digital`,
      text: buildTextReceipt(r),
      html: buildHtmlReceipt(r),
    });

    const previewUrl = mode === "ethereal"
      ? nodemailer.getTestMessageUrl(info)
      : undefined;

    if (mode === "ethereal" && previewUrl) {
      console.log(`[email] Ethereal preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl ?? undefined,
      mode,
    };
  } catch (e) {
    console.error("[email] Failed to send receipt:", e);
    return {
      success: false,
      mode: "skipped",
      error: (e as Error).message,
    };
  }
}
