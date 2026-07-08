import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

interface RefundBody {
  reason?: string;
}

/**
 * POST /api/orders/[ref]/refund
 *
 * Marks a paid order as refunded. In demo mode this just updates the
 * status — in production you'd also call JazzCash's refund API.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;

  let body: RefundBody = {};
  try {
    body = (await request.json()) as RefundBody;
  } catch {
    /* empty body is fine */
  }

  const order = await db.order.findFirst({
    where: { OR: [{ txnRefNo: ref }, { id: ref }] },
  });

  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Order not found" },
      { status: 404 },
    );
  }

  if (order.status !== "paid") {
    return NextResponse.json(
      {
        ok: false,
        error: `Cannot refund order with status "${order.status}". Only "paid" orders can be refunded.`,
      },
      { status: 400 },
    );
  }

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status: "refunded",
      refundedAt: new Date(),
      refundReason: body.reason?.trim() || null,
    },
  });

  return NextResponse.json({
    ok: true,
    data: updated,
    message: `Order ${order.txnRefNo} refunded successfully.`,
  });
}
