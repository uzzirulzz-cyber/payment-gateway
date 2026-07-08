import { NextResponse } from "next/server";
import { connectDB, Order } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await connectDB();
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";
  const search = url.searchParams.get("q") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  // Build MongoDB filter
  const filter: Record<string, unknown> = {};
  if (status !== "all") {
    filter.status = status;
  }
  if (search.trim()) {
    filter.$or = [
      { txnRefNo: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { customerEmail: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { transactionId: { $regex: search, $options: "i" } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return NextResponse.json({
    ok: true,
    data: orders,
    total,
    limit,
    offset,
  });
}
