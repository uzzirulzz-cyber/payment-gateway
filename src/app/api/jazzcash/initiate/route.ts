import { NextResponse } from "next/server";
import { connectDB, Order } from "@/lib/db";
import {
  buildJazzCashParams,
  generateTxnRef,
  getJazzCashEnv,
  jazzCashFormAction,
} from "@/lib/jazzcash";
import {
  checkRateLimit,
  getClientIp,
  isDuplicateTxnRef,
  markTxnRefProcessed,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

interface InitiateBody {
  amount: number;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  // ===== Rate limiting =====
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  let body: InitiateBody;
  try {
    body = (await request.json()) as InitiateBody;
  } catch {
    return fail("Invalid JSON body");
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return fail("Amount must be a positive number (PKR).");
  }
  if (amount < 1) {
    return fail("Minimum payment amount is PKR 1.");
  }
  if (!body.description || body.description.trim().length < 3) {
    return fail("Description must be at least 3 characters.");
  }

  let env;
  try {
    env = getJazzCashEnv();
  } catch (e) {
    return fail((e as Error).message, 500);
  }

  // Generate txnRefNo with idempotency check
  let txnRefNo = generateTxnRef();
  let attempts = 0;
  while (isDuplicateTxnRef(txnRefNo) && attempts < 5) {
    txnRefNo = generateTxnRef();
    attempts++;
  }
  if (isDuplicateTxnRef(txnRefNo)) {
    return fail("Could not generate unique transaction reference. Retry.", 503);
  }

  await connectDB();

  // Check DB for existing txnRefNo
  const existing = await Order.findOne({ txnRefNo }).select("_id").lean();
  if (existing) {
    return fail("Transaction reference collision. Please retry.", 409);
  }

  markTxnRefProcessed(txnRefNo);

  // Persist the order
  const order = await Order.create({
    txnRefNo,
    amount,
    description: body.description.trim(),
    customerName: body.customerName?.trim() || null,
    customerEmail: body.customerEmail?.trim() || null,
    customerPhone: body.customerPhone?.trim() || null,
    status: "pending",
  });

  const params = buildJazzCashParams({
    amount,
    description: body.description.trim(),
    txnRefNo,
    customerEmail: body.customerEmail,
    customerPhone: body.customerPhone,
    env,
  });

  return NextResponse.json(
    {
      ok: true,
      orderId: String(order._id),
      txnRefNo,
      formAction: jazzCashFormAction(env.sandbox, env.demoMode),
      params,
      sandbox: env.sandbox,
      demoMode: env.demoMode,
    },
    {
      headers: {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    },
  );
}
