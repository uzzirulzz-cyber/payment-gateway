import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildJazzCashParams,
  generateTxnRef,
  getJazzCashEnv,
  jazzCashFormAction,
} from "@/lib/jazzcash";

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

  const txnRefNo = generateTxnRef();

  // Persist the order first so we can reconcile on callback.
  const order = await db.order.create({
    data: {
      txnRefNo,
      amount,
      description: body.description.trim(),
      customerName: body.customerName?.trim() || null,
      customerEmail: body.customerEmail?.trim() || null,
      customerPhone: body.customerPhone?.trim() || null,
      status: "pending",
    },
  });

  const params = buildJazzCashParams({
    amount,
    description: body.description.trim(),
    txnRefNo,
    customerEmail: body.customerEmail,
    customerPhone: body.customerPhone,
    env,
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    txnRefNo,
    formAction: jazzCashFormAction(env.sandbox, env.demoMode),
    params,
    sandbox: env.sandbox,
    demoMode: env.demoMode,
  });
}
