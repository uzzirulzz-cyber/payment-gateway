import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";
  const search = url.searchParams.get("q") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  // Build Prisma where clause
  const where: Record<string, unknown> = {};
  if (status !== "all") {
    where.status = status;
  }
  if (search.trim()) {
    where.OR = [
      { txnRefNo: { contains: search } },
      { description: { contains: search } },
      { customerEmail: { contains: search } },
      { customerName: { contains: search } },
      { transactionId: { contains: search } },
    ];
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.order.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    data: orders,
    total,
    limit,
    offset,
  });
}
