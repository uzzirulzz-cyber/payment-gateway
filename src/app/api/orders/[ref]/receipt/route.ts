import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/orders/[ref]/receipt
 *
 * Returns a plain-text receipt for the order (viewable in browser or
 * emailable). Used by the History/Refunds tab "View receipt" link.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;

  const order = await db.order.findFirst({
    where: { OR: [{ txnRefNo: ref }, { id: ref }] },
  });

  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Order not found" },
      { status: 404 },
    );
  }

  const date = order.createdAt.toLocaleString("en-PK", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const receipt = `
PLAYBEAT DIGITAL — RECEIPT
==========================

Status:           ${order.status.toUpperCase()}
Date:             ${date}

Description:      ${order.description}
Transaction ref:  ${order.txnRefNo}
${order.transactionId ? `JazzCash txn:    ${order.transactionId}\n` : ""}${order.paymentMethod ? `Payment method:  ${order.paymentMethod}\n` : ""}Customer:         ${order.customerName ?? "—"}
Email:            ${order.customerEmail ?? "—"}

TOTAL:            PKR ${order.amount.toLocaleString()}

${order.receiptSentAt ? `Receipt emailed: ${order.receiptSentAt.toLocaleString("en-PK")}\n` : ""}---
PlayBeat Digital Private Limited
hello@playbeat.digital
© 2026 Playbeat Digital Private Limited. All rights reserved.
`.trim();

  return new NextResponse(receipt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
