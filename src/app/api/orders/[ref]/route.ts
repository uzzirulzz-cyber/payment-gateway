import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB, Order } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  await connectDB();
  const { ref } = await params;

  // Build query — only use _id if ref is a valid ObjectId, otherwise just txnRefNo
  const isValidObjectId = mongoose.isValidObjectId(ref);
  const query = isValidObjectId
    ? { $or: [{ txnRefNo: ref }, { _id: ref }] }
    : { txnRefNo: ref };

  const order = await Order.findOne(query).lean();

  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Order not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: order });
}
