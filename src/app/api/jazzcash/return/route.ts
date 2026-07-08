import { NextResponse } from "next/server";
import { connectDB, Order } from "@/lib/db";
import {
  getJazzCashEnv,
  interpretResponseCode,
  verifySecureHash,
} from "@/lib/jazzcash";
import { sendReceiptEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * JazzCash redirects the customer's browser (POST) to this URL after payment,
 * AND (in production) makes a server-to-server POST here. We support both.
 */
async function handleParams(params: Record<string, string>) {
  await connectDB();

  const txnRefNo = params["pp_TxnRefNo"] ?? "";
  if (!txnRefNo) {
    return NextResponse.json(
      { ok: false, error: "Missing pp_TxnRefNo" },
      { status: 400 },
    );
  }

  const order = (await Order.findOne({ txnRefNo }).lean()) as {
    _id: string;
    txnRefNo: string;
    amount: number;
    description: string;
    customerEmail: string | null;
    customerName: string | null;
  } | null;

  if (!order) {
    return NextResponse.json(
      { ok: false, error: `Order not found for ${txnRefNo}` },
      { status: 404 },
    );
  }

  let env;
  try {
    env = getJazzCashEnv();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }

  const hashValid = verifySecureHash(params, env.integritySalt);
  const responseCode = params["pp_ResponseCode"] ?? "";
  const interpretation = interpretResponseCode(responseCode);

  const newStatus = !hashValid
    ? "failed"
    : interpretation.success
      ? "paid"
      : "failed";

  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        status: newStatus,
        responseCode: responseCode || null,
        responseMessage: interpretation.label,
        paymentMethod: params["pp_PaymentMethod"] ?? null,
        transactionId:
          params["pp_RetreivalReferenceNumber"] ??
          params["pp_TxnRefNo"] ??
          null,
        rawResponse: JSON.stringify(params),
      },
    },
  );

  // Send email receipt on successful payment (fire-and-forget, non-blocking).
  if (newStatus === "paid" && order.customerEmail) {
    sendReceiptEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      txnRefNo: order.txnRefNo,
      amount: order.amount,
      description: order.description,
      transactionId:
        params["pp_RetreivalReferenceNumber"] ?? params["pp_TxnRefNo"] ?? null,
      paymentMethod: params["pp_PaymentMethod"] ?? null,
      status: newStatus,
    })
      .then((result) => {
        if (result.success) {
          Order.updateOne(
            { _id: order._id },
            { $set: { receiptSentAt: new Date() } },
          ).catch(() => {});
          if (result.previewUrl) {
            console.log(
              `[email] Receipt preview for ${order.txnRefNo}: ${result.previewUrl}`,
            );
          }
        }
      })
      .catch((e) => console.error("[email] Receipt send error:", e));
  }

  return { txnRefNo, status: newStatus, hashValid };
}

export async function POST(request: Request) {
  let params: Record<string, string> = {};

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      params = (await request.json()) as Record<string, string>;
    } catch {
      /* fall through */
    }
  } else {
    try {
      const form = await request.formData();
      for (const [k, v] of form.entries()) {
        params[k] = String(v);
      }
    } catch {
      /* fall through */
    }
  }

  const result = await handleParams(params);
  if (result instanceof NextResponse) return result;

  const baseUrl = new URL(request.url).origin;
  const redirectUrl = `${baseUrl}/?payment=return&txnRefNo=${encodeURIComponent(result.txnRefNo)}&status=${result.status}`;
  return NextResponse.redirect(redirectUrl, 302);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });

  const result = await handleParams(params);
  if (result instanceof NextResponse) return result;

  const baseUrl = new URL(request.url).origin;
  const redirectUrl = `${baseUrl}/?payment=return&txnRefNo=${encodeURIComponent(result.txnRefNo)}&status=${result.status}`;
  return NextResponse.redirect(redirectUrl, 302);
}
