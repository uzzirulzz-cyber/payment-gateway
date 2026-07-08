import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB, Order } from "@/lib/db";

export const runtime = "nodejs";

interface RefundBody {
  reason?: string;
}

/**
 * POST /api/orders/[ref]/refund
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  await connectDB();
  const { ref } = await params;

  let body: RefundBody = {};
  try {
    body = (await request.json()) as RefundBody;
  } catch {
    /* empty body is fine */
  }

  const isValidObjectId = mongoose.isValidObjectId(ref);
  const query = isValidObjectId
    ? { $or: [{ txnRefNo: ref }, { _id: ref }] }
    : { txnRefNo: ref };

  const order = (await Order.findOne(query).lean()) as { _id: string; txnRefNo: string; status: string } | null;

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

  const updated = await Order.findByIdAndUpdate(
    order._id,
    {
      $set: {
        status: "refunded",
        refundedAt: new Date(),
        refundReason: body.reason?.trim() || null,
      },
    },
    { new: true },
  ).lean();

  return NextResponse.json({
    ok: true,
    data: updated,
    message: `Order ${order.txnRefNo} refunded successfully.`,
  });
}
