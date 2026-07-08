import { NextResponse } from "next/server";
import { connectDB, Order } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  await connectDB();

  // Aggregate by status
  const grouped = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        amount: { $sum: "$amount" },
      },
    },
  ]);

  const totals: Record<string, { count: number; amount: number }> = {};
  for (const g of grouped) {
    totals[g._id ?? "pending"] = {
      count: g.count,
      amount: g.amount ?? 0,
    };
  }

  const totalRevenue = totals["paid"]?.amount ?? 0;
  const totalPaid = totals["paid"]?.count ?? 0;
  const totalPending = totals["pending"]?.count ?? 0;
  const totalFailed = totals["failed"]?.count ?? 0;
  const totalCancelled = totals["cancelled"]?.count ?? 0;
  const totalRefunded = totals["refunded"]?.count ?? 0;
  const totalOrders =
    totalPaid + totalPending + totalFailed + totalCancelled + totalRefunded;

  // Daily revenue trend (last 14 days)
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const recent = await Order.find({
    createdAt: { $gte: since },
    status: "paid",
  })
    .select("amount createdAt")
    .lean();

  const dayMap = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of recent) {
    const key = new Date(r.createdAt).toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + (r.amount as number));
  }
  const trend = Array.from(dayMap.entries()).map(([date, amount]) => ({
    date,
    amount: Math.round(amount * 100) / 100,
  }));

  return NextResponse.json({
    ok: true,
    data: {
      totals,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalPaid,
        totalPending,
        totalFailed,
        totalCancelled,
        totalRefunded,
        successRate:
          totalOrders === 0
            ? 0
            : Math.round((totalPaid / totalOrders) * 1000) / 10,
      },
      trend,
    },
  });
}
