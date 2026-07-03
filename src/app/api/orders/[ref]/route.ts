import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;

  // ref can be either the txnRefNo OR the order id
  const order = await db.order.findFirst({
    where: {
      OR: [{ txnRefNo: ref }, { id: ref }],
    },
  });

  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Order not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: order });
}
