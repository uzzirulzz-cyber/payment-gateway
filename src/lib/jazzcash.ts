import crypto from "node:crypto";

/**
 * JazzCash Payment Gateway integration helpers.
 *
 * Spec reference (JazzCash Merchant API):
 *  - Sort all request parameters alphabetically by NAME (excluding pp_SecureHash).
 *  - Concatenate the values with "&".
 *  - Prepend Integrity Salt: "<salt>&<val1>&<val2>..."
 *  - Compute SHA-256 (uppercase hex).
 *
 * The result is sent back as `pp_SecureHash` on every request. JazzCash also
 * signs its callback response with the same algorithm so we can verify it.
 */

export type JazzCashEnv = {
  merchantId: string;
  password: string;
  integritySalt: string;
  returnUrl: string;
  sandbox: boolean;
  demoMode: boolean;
};

export function getJazzCashEnv(): JazzCashEnv {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID;
  const password = process.env.JAZZCASH_PASSWORD;
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;
  const returnUrl =
    process.env.JAZZCASH_RETURN_URL ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/jazzcash/return`;
  const sandbox = (process.env.JAZZCASH_SANDBOX ?? "true") !== "false";
  const demoMode = (process.env.JAZZCASH_DEMO_MODE ?? "false") === "true";

  if (!merchantId || !password || !integritySalt) {
    throw new Error(
      "Missing JazzCash credentials. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT in .env",
    );
  }

  return { merchantId, password, integritySalt, returnUrl, sandbox, demoMode };
}

export function jazzCashFormAction(sandbox: boolean, demoMode = false): string {
  // In demo mode, redirect to our local simulated JazzCash payment page.
  // This keeps the full signing → redirect → callback → verification flow
  // intact while removing the external dependency on JazzCash's server.
  if (demoMode) {
    return "/simulate";
  }
  return sandbox
    ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
    : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
}

/** Generate a unique transaction reference: T<timestamp><random6>. */
export function generateTxnRef(): string {
  const ts = Date.now().toString();
  const rand = Math.floor(100000 + Math.random() * 900000).toString();
  return `T${ts}${rand}`;
}

/** Format Date as yyyyMMddHHmmss for JazzCash. */
export function formatJazzCashDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/**
 * Compute pp_SecureHash using SHA-256 over `salt&val1&val2&...`.
 * Values are taken in alphabetical order of their KEY, excluding pp_SecureHash.
 */
export function computeSecureHash(
  params: Record<string, string>,
  salt: string,
): string {
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== "pp_SecureHash")
    .sort();
  const valueString =
    salt + "&" + sortedKeys.map((k) => params[k] ?? "").join("&");
  return crypto
    .createHash("sha256")
    .update(valueString, "utf8")
    .digest("hex")
    .toUpperCase();
}

/** Verify the secure hash on a JazzCash callback response. */
export function verifySecureHash(
  response: Record<string, string>,
  salt: string,
): boolean {
  const received = (response["pp_SecureHash"] ?? "").toUpperCase();
  if (!received) return false;
  const expected = computeSecureHash(response, salt);
  return received === expected;
}

/**
 * Build the full set of signed JazzCash form parameters for a checkout.
 * `amount` is in PKR (whole number, e.g. 500 = PKR 500).
 */
export function buildJazzCashParams(opts: {
  amount: number;
  description: string;
  txnRefNo: string;
  customerEmail?: string;
  customerPhone?: string;
  env: JazzCashEnv;
}): Record<string, string> {
  const { amount, description, txnRefNo, customerEmail, customerPhone, env } =
    opts;

  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000);

  // JazzCash expects amount in paisa (PKR * 100), zero-padded to 10+ digits.
  const amountInPaisa = Math.round(amount * 100)
    .toString()
    .padStart(10, "0");

  const params: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: env.merchantId,
    pp_SubMerchantID: "",
    pp_Password: env.password,
    pp_BankID: "TBANK",
    pp_ProductID: "RETL",
    pp_TxnRefNo: txnRefNo,
    pp_Amount: amountInPaisa,
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: formatJazzCashDateTime(now),
    pp_BillReference: `billRef-${txnRefNo}`,
    pp_Description: description,
    pp_TxnExpiryDateTime: formatJazzCashDateTime(expiry),
    pp_ReturnURL: env.returnUrl,
    ppmpf_1: customerEmail ?? "",
    ppmpf_2: customerPhone ?? "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
    pp_SecureHash: "",
  };

  params.pp_SecureHash = computeSecureHash(params, env.integritySalt);
  return params;
}

/** Map JazzCash response code -> human label. */
export function interpretResponseCode(code: string): {
  success: boolean;
  label: string;
} {
  if (code === "000") return { success: true, label: "Approved" };
  const messages: Record<string, string> = {
    "000": "Approved",
    "121": "Transaction not found",
    "124": "Invalid merchant ID",
    "125": "Invalid password",
    "126": "Invalid integrity salt",
    "127": "Invalid transaction reference",
    "128": "Amount mismatch",
    "129": "Currency mismatch",
    "130": "Transaction expired",
    "131": "Transaction already reversed",
    "132": "Transaction not allowed",
    "133": "Transaction blocked",
    "134": "Customer account blocked",
    "135": "Customer account inactive",
    "136": "Customer account limit exceeded",
    "137": "Customer account not found",
    "138": "Customer account not verified",
    "139": "Customer account verification failed",
    "140": "Customer account verification pending",
    "999": "Internal server error",
  };
  return {
    success: false,
    label: messages[code] ?? `Response code ${code}`,
  };
}
