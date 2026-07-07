import { NextResponse } from "next/server";
import { computeSecureHash, getJazzCashEnv } from "@/lib/jazzcash";

export const runtime = "nodejs";

interface CallbackBody {
  responseParams: Record<string, string>;
  returnUrl: string;
}

/**
 * POST /api/simulate/callback
 *
 * Receives the "approved" response params from the /simulate payment page,
 * signs them with the real Integrity Salt (so the real /api/jazzcash/return
 * handler can verify the hash), and returns a redirect URL that the browser
 * should navigate to.
 *
 * The redirect URL points to /api/jazzcash/return with the signed params
 * as query string — this is exactly what JazzCash does on a real callback.
 */
export async function POST(request: Request) {
  let body: CallbackBody;
  try {
    body = (await request.json()) as CallbackBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { responseParams, returnUrl } = body;
  if (!responseParams?.pp_TxnRefNo) {
    return NextResponse.json(
      { ok: false, error: "Missing pp_TxnRefNo in responseParams" },
      { status: 400 },
    );
  }

  let env;
  try {
    env = getJazzCashEnv();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }

  // Sign the response with the same algorithm JazzCash uses.
  // The /api/jazzcash/return handler will recompute and verify this.
  const signedParams = { ...responseParams };
  signedParams.pp_SecureHash = computeSecureHash(
    signedParams,
    env.integritySalt,
  );

  // Build the redirect URL — mimic JazzCash's POST to the return URL.
  // We use GET with query params so the browser can navigate client-side,
  // and /api/jazzcash/return handles both GET and POST.
  const url = new URL(returnUrl || "/api/jazzcash/return", "http://dummy");
  for (const [k, v] of Object.entries(signedParams)) {
    url.searchParams.set(k, v);
  }

  // Return a relative URL so it works regardless of the deployment domain.
  const redirectUrl = `${url.pathname}?${url.searchParams.toString()}`;

  return NextResponse.json({
    ok: true,
    redirectUrl,
    signedParams,
  });
}
