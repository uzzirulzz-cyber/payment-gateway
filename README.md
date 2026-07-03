# PlayBeat Digital — JazzCash Payment Gateway

A complete JazzCash payment gateway reference app branded as **PlayBeat Digital**, a digital-products storefront. Customers land on a marketing page, click **Pay Now**, and are redirected to JazzCash's secure checkout. After payment, they're returned to a status modal that polls until the order resolves.

Built with **Next.js 16**, **TypeScript**, **Prisma** (PostgreSQL), **Tailwind CSS 4**, and **shadcn/ui**.

---

## Features

### Customer flow
- **Landing page** (`/`) — branded hero, value props (Instant Activation / Secure Payments / 24/7 Support), single "Pay Now" CTA.
- **Checkout view** — order summary with line items + total, accepted payment methods (Mobile Wallets / Bank Account / Debit Credit Card), customer details form, "How it works" guide.
- **JazzCash redirect** — server-signed form auto-submits to JazzCash sandbox (or production).
- **Return modal** — auto-opens on return from JazzCash, polls order status every 1.5s until paid/failed.

### Merchant flow
- **History view** — searchable, filterable table of all transactions.
- **Dashboard view** — revenue trend chart (14 days), stat cards (revenue / success / pending / failed), status breakdown bars.

### Backend
- `POST /api/jazzcash/initiate` — validates input, persists order with status=pending, builds & SHA-256-signs JazzCash params, returns formAction + params.
- `POST|GET /api/jazzcash/return` — handles JazzCash callback, verifies secure hash, updates order status, redirects browser to SPA.
- `GET /api/orders` — paginated list with status filter + free-text search.
- `GET /api/orders/[ref]` — fetch single order by txnRefNo or id (used by polling modal).
- `GET /api/orders/stats` — totals by status, 14-day revenue trend, success rate.
- `POST /api/ai/describe` — uses z-ai-web-dev-sdk (server-side only) to generate a clean ≤60-char payment description, with safe fallback.
- `POST /api/seed` — one-shot sample-data seeder.

---

## Getting started

### Prerequisites
- Node.js 20+ or Bun
- A PostgreSQL database (Neon, Supabase, or local)
- A JazzCash sandbox merchant account

### Install
```bash
bun install
```

### Configure
Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string (no `channel_binding` param — Prisma's runtime validator is strict) |
| `DIRECT_URL` | Postgres connection string for migrations (can include `channel_binding=require`) |
| `JAZZCASH_MERCHANT_ID` | From JazzCash sandbox → Merchant Profile |
| `JAZZCASH_PASSWORD` | From JazzCash sandbox → Merchant Profile |
| `JAZZCASH_INTEGRITY_SALT` | From JazzCash sandbox → Merchant Profile |
| `JAZZCASH_SANDBOX` | `true` for sandbox, `false` for production |
| `JAZZCASH_RETURN_URL` | Public URL of your `/api/jazzcash/return` endpoint |
| `NEXT_PUBLIC_APP_URL` | Used to build absolute return URL if `JAZZCASH_RETURN_URL` not set |

### Set up database
```bash
bun run db:push    # Create tables
```

### Run
```bash
bun run dev
```

Open http://localhost:3000.

### Seed sample data (optional)
Visit the Dashboard tab and click "Seed sample data", or:
```bash
curl -X POST http://localhost:3000/api/seed?count=25
```

---

## How JazzCash integration works

### Signing a checkout request
1. Customer enters their name + email on the checkout view.
2. Frontend POSTs to `/api/jazzcash/initiate` with `{amount, description, customerName, customerEmail}`.
3. Backend persists an `Order` with `status=pending`.
4. Backend builds the full JazzCash param set (`pp_Version`, `pp_MerchantID`, `pp_Password`, `pp_TxnRefNo`, `pp_Amount` in paisa, etc.).
5. Backend computes `pp_SecureHash`:
   - Sort all param keys alphabetically (excluding `pp_SecureHash`).
   - Concatenate values with `&`: `<salt>&<val1>&<val2>&...`.
   - SHA-256 → uppercase hex.
6. Backend returns `{formAction, params}` to the frontend.
7. Frontend builds a hidden `<form>` with all params and auto-submits → browser navigates to JazzCash.

### Verifying the callback
1. JazzCash redirects the customer's browser (POST form-encoded) to `/api/jazzcash/return`.
2. Backend extracts `pp_TxnRefNo`, looks up the order.
3. Backend recomputes the secure hash over the response params and compares to the received `pp_SecureHash`.
4. If hash matches AND `pp_ResponseCode === "000"` → mark order `paid`. Otherwise `failed`.
5. Backend redirects browser to `/?payment=return&txnRefNo=...&status=...`.
6. The SPA's `PaymentReturnModal` auto-opens, polls `/api/orders/[ref]` every 1.5s until status resolves.

### Production notes
- Flip `JAZZCASH_SANDBOX=false` to use `https://payments.jazzcash.com.pk/...` instead of sandbox.
- Make sure `JAZZCASH_RETURN_URL` is publicly reachable (JazzCash may also POST server-to-server).
- Consider adding webhook signature verification for production S2S callbacks (same `/api/jazzcash/return` endpoint handles both browser redirects and S2S).

### Going live checklist

Before you can receive **real** payments, you need to complete these steps on JazzCash's side. Our code is ready — the gaps are all merchant-account provisioning tasks.

| # | Task | Where to do it | Why |
|---|------|----------------|-----|
| 1 | Get **production** merchant credentials | Email `merchantsupport@jazz.com.pk` or your JazzCash account manager | Sandbox credentials (`MC…` issued as "Sandbox Test Credentials") only work against `sandbox.jazzcash.com.pk`. Production needs a separate Merchant ID + Password + Integrity Salt issued after your live KYC is approved. |
| 2 | Confirm `pp_TxnType` is enabled | JazzCash merchant support | Some merchants are enabled only for `CREDIT_CARD` initially. Ask them to enable `MWALLET` (Mobile Wallet) too if you want wallet payments. |
| 3 | Confirm `pp_BankID` and `pp_ProductID` values | JazzCash merchant support | The defaults in `src/lib/jazzcash.ts` (`TBANK` / `RETL`) may not match your merchant profile. Ask JazzCash for your assigned values. |
| 4 | Set a stable public `JAZZCASH_RETURN_URL` | Your deployment platform | JazzCash production POSTs the callback to this URL. It must be HTTPS and publicly reachable (not `localhost`, not the sandbox preview URL). |
| 5 | Replace credentials in `.env` | Your production deployment | Set `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT` to your **production** values, and `JAZZCASH_SANDBOX=false`. |
| 6 | Test a small live payment | Your live site | Pay PKR 1 with a real JazzCash wallet / card to confirm the full loop works end-to-end (initiate → JazzCash → callback → order marked paid). |
| 7 | Monitor the History tab | Your live site | All real transactions will appear there. Filter by `pending` to catch any stuck callbacks. |

**Symptom you'll see if production isn't provisioned yet:**
> "Sorry! Your transaction could not be processed due to insufficient merchant information. Kindly contact respective merchant for further details."

This is a JazzCash-side error — it means the merchant profile is incomplete. Our code is correctly signing and submitting the request; JazzCash just isn't accepting it yet. Email `merchantsupport@jazz.com.pk` with your Merchant ID and they'll fix it on their side.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Charts | Recharts |
| Forms | react-hook-form + zod |
| AI | z-ai-web-dev-sdk (server-side only) |
| Icons | lucide-react |

---

## Project structure

```
.
├── prisma/
│   └── schema.prisma              # Order + User models
├── public/
│   ├── playbeat-logo.svg          # Full wordmark
│   └── playbeat-mark.svg          # Favicon-sized mark
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/describe/       # AI description helper
│   │   │   ├── jazzcash/
│   │   │   │   ├── initiate/      # Build & sign checkout params
│   │   │   │   └── return/        # Verify callback, update order
│   │   │   ├── orders/            # List + single + stats
│   │   │   └── seed/              # Sample data seeder
│   │   ├── layout.tsx
│   │   └── page.tsx               # View state: landing | checkout | history | dashboard
│   ├── components/
│   │   ├── payment/
│   │   │   ├── landing.tsx        # Hero + value props + Pay Now
│   │   │   ├── checkout-view.tsx  # Cart + payment methods + your details
│   │   │   ├── payment-history.tsx
│   │   │   ├── dashboard.tsx
│   │   │   └── payment-return-modal.tsx
│   │   └── ui/                    # shadcn/ui components
│   └── lib/
│       ├── brand.ts               # PlayBeat brand config + cart items
│       ├── db.ts                  # Prisma client
│       └── jazzcash.ts            # Signing + verification helpers
├── .env.example
├── package.json
└── README.md
```

---

## License

MIT
