import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB, Order } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/orders/[ref]/receipt
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  await connectDB();
  const { ref } = await params;

  const isValidObjectId = mongoose.isValidObjectId(ref);
  const query = isValidObjectId
    ? { $or: [{ txnRefNo: ref }, { _id: ref }] }
    : { txnRefNo: ref };

  const order = (await Order.findOne(query).lean()) as {
    txnRefNo: string;
    amount: number;
    description: string;
    customerName: string | null;
    customerEmail: string | null;
    status: string;
    transactionId: string | null;
    paymentMethod: string | null;
    receiptSentAt: Date | null;
    createdAt: Date;
  } | null;

  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Order not found" },
      { status: 404 },
    );
  }

  const date = new Date(order.createdAt).toLocaleString("en-PK", {
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

${order.receiptSentAt ? `Receipt emailed: ${new Date(order.receiptSentAt).toLocaleString("en-PK")}\n` : ""}---
PlayBeat Digital Private Limited
hello@playbeat.digital
© 2026 Playbeat Digital Private Limited. All rights reserved.
`.trim();

  return new NextResponse(receipt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
