/**
 * PlayBeat Digital — Embedded Environment
 *
 * All configuration is hardcoded here so the app is fully self-contained.
 * No external .env file is needed — just clone and run.
 *
 * To change any value, edit this file and restart the dev server.
 *
 * Values can still be overridden by real process.env vars (e.g. when
 * deploying to a platform that injects env vars), but the defaults below
 * are always used as fallback.
 */

// ─── MongoDB Atlas ────────────────────────────────────────────────────────
export const MONGODB_URI =
  process.env.MONGODB_URI ??
  "mongodb+srv://max11:n3lSs2xcyaCSGH9O@playbeat.umqpdyx.mongodb.net/?appName=playbeat";

export const MONGODB_DB_NAME = "playbeat";

// ─── JazzCash ─────────────────────────────────────────────────────────────
export const JAZZCASH_MERCHANT_ID =
  process.env.JAZZCASH_MERCHANT_ID ?? "MC828331";

export const JAZZCASH_PASSWORD =
  process.env.JAZZCASH_PASSWORD ?? "fwy7u597b4";

export const JAZZCASH_INTEGRITY_SALT =
  process.env.JAZZCASH_INTEGRITY_SALT ?? "4s8931g402";

// Live mode = sandbox:false, demoMode:false
export const JAZZCASH_SANDBOX = (process.env.JAZZCASH_SANDBOX ?? "false") !== "false";

export const JAZZCASH_DEMO_MODE =
  (process.env.JAZZCASH_DEMO_MODE ?? "false") === "true";

export const JAZZCASH_RETURN_URL =
  process.env.JAZZCASH_RETURN_URL ??
  "https://preview-zai-web.space-z.ai/api/jazzcash/return";

export const NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://preview-zai-web.space-z.ai";

// ─── Email (SMTP) ─────────────────────────────────────────────────────────
// When these are empty, the app uses Ethereal test accounts (auto-generated,
// no signup needed). Set them to use real SMTP (Gmail, SendGrid, etc.).
export const SMTP_HOST = process.env.SMTP_HOST ?? "";
export const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
export const SMTP_SECURE = (process.env.SMTP_SECURE ?? "false") === "true";
export const SMTP_USER = process.env.SMTP_USER ?? "";
export const SMTP_PASS = process.env.SMTP_PASS ?? "";

// ─── z-ai-web-dev-sdk ─────────────────────────────────────────────────────
export const ZAI_API_KEY = process.env.ZAI_API_KEY ?? "";
