/**
 * Simple in-memory rate limiter + idempotency tracker.
 *
 * For production you'd use Redis, but this works fine for a single-instance
 * Next.js app and demonstrates the pattern clearly.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/** Track txnRefNo values we've already seen to prevent double-processing. */
const processedTxnRefs = new Set<string>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 initiate requests per minute per IP

/**
 * Check rate limit for a given IP. Returns { allowed, retryAfter }.
 * If allowed, increments the counter.
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfter: number;
  remaining: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfter: 0, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil(
      (entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000,
    );
    return { allowed: false, retryAfter, remaining: 0 };
  }

  entry.count++;
  return {
    allowed: true,
    retryAfter: 0,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
  };
}

/**
 * Idempotency check — returns true if this txnRefNo has already been
 * processed (or is currently being processed).
 */
export function isDuplicateTxnRef(txnRefNo: string): boolean {
  return processedTxnRefs.has(txnRefNo);
}

/** Mark a txnRefNo as processed. */
export function markTxnRefProcessed(txnRefNo: string): void {
  processedTxnRefs.add(txnRefNo);
  // Clean up old entries after 10 minutes to prevent unbounded growth
  setTimeout(() => {
    processedTxnRefs.delete(txnRefNo);
  }, 10 * 60 * 1000);
}

/** Extract client IP from a Next.js Request. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
