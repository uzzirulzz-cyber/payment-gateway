import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const SAMPLE_DESCRIPTIONS = [
  "Premium subscription - 1 month",
  "Order #4823 - Electronics",
  "Consulting session - 1 hour",
  "Course enrollment fee",
  "Annual membership renewal",
  "Software license - Pro tier",
  "Event ticket - Tech Summit 2026",
  "Food delivery order",
  "Domain registration - 1 year",
  "Graphic design service",
];

const SAMPLE_NAMES = [
  "Ahmed Raza",
  "Fatima Khan",
  "Bilal Ahmed",
  "Ayesha Siddiqui",
  "Hassan Ali",
  "Zainab Malik",
  "Usman Tariq",
  "Maryam Iqbal",
];

const SAMPLE_EMAILS = [
  "ahmed.raza@example.com",
  "fatima.khan@example.com",
  "bilal.ahmed@example.com",
  "ayesha.s@example.com",
  "hassan.ali@example.com",
  "zainab.malik@example.com",
  "usman.tariq@example.com",
  "maryam.iqbal@example.com",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const count = Math.min(Number(url.searchParams.get("count") ?? 25), 100);

  // Don't re-seed if we already have data.
  const existing = await db.order.count();
  if (existing > 0) {
    return NextResponse.json({
      ok: true,
      message: `Skipped — ${existing} orders already exist.`,
      created: 0,
    });
  }

  const statuses = ["paid", "paid", "paid", "paid", "pending", "failed"];
  const now = Date.now();
  const created = [];

  for (let i = 0; i < count; i++) {
    const status = pick(statuses);
    const daysAgo = Math.floor(Math.random() * 14);
    const hoursAgo = Math.floor(Math.random() * 24);
    const createdAt = new Date(
      now - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000,
    );
    const amount = pick([199, 299, 499, 999, 1499, 2499, 4999, 9999, 14999]);
    const txnRefNo = `T${createdAt.getTime()}${Math.floor(100000 + Math.random() * 900000)}`;

    created.push(
      db.order.create({
        data: {
          txnRefNo,
          amount,
          description: pick(SAMPLE_DESCRIPTIONS),
          customerName: pick(SAMPLE_NAMES),
          customerEmail: pick(SAMPLE_EMAILS),
          customerPhone: `+923${Math.floor(10000000 + Math.random() * 89999999)}`,
          status,
          responseCode: status === "paid" ? "000" : status === "failed" ? "121" : null,
          responseMessage:
            status === "paid"
              ? "Approved"
              : status === "failed"
                ? "Transaction not found"
                : null,
          paymentMethod: status === "paid" ? "MWALLET" : null,
          transactionId:
            status === "paid" ? `5023${Math.floor(100000 + Math.random() * 900000)}` : null,
          createdAt,
          updatedAt: createdAt,
        },
      }),
    );
  }

  await Promise.all(created);

  return NextResponse.json({
    ok: true,
    message: `Seeded ${count} sample orders.`,
    created: count,
  });
}
