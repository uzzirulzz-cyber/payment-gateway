/**
 * PlayBeat Digital — brand configuration.
 *
 * Matches the deployed reference at
 * https://01kwhmx82vy1crbgvte4nzd1pd.hercules-dev.com/
 *
 * PlayBeat Digital Private Limited sells premium digital products (game
 * bundles, DLC, gift cards) with instant activation, secured by JazzCash.
 */

export const BRAND = {
  name: "PlayBeat",
  legalName: "Playbeat Digital Private Limited",
  tagline: "Premium digital products delivered instantly.",
  description:
    "Premium digital products delivered instantly. Secure checkout powered by JazzCash — accepted across Pakistan & worldwide.",
  email: "hello@playbeat.digital",
  domain: "playbeat.digital",
  footer: "© 2026 Playbeat Digital Private Limited. All rights reserved.",
  logo: "/playbeat-logo.png",
  // Brand palette — derived from the official PLAYBEAT logo.
  // "PLAY" is white, "BEAT" is a blue gradient #0099FF → #0066CC.
  colors: {
    bg: "#000000",
    surface: "#0a0a0a",
    primary: "#FFFFFF",
    accentFrom: "#0099FF",
    accentTo: "#0066CC",
  },
} as const;

export interface ValueProp {
  title: string;
  body: string;
}

export const VALUE_PROPS: ValueProp[] = [
  {
    title: "Instant Activation",
    body: "Your order is activated the moment payment clears",
  },
  {
    title: "Secure Payments",
    body: "Protected by JazzCash — Pakistan's leading gateway",
  },
  {
    title: "24/7 Support",
    body: "Our team is always here to help you",
  },
];

export interface OrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number; // PKR
}

/**
 * The single cart that the checkout page renders. In a real app this would
 * come from a cart state; here it's a fixed sample matching the deployed
 * reference so the totals line up visually.
 */
export const CART_ITEMS: OrderItem[] = [
  {
    id: "gaming-bundle",
    name: "Premium Gaming Bundle",
    description: "Full game + season pass + exclusive skins",
    quantity: 1,
    unitPrice: 2500,
  },
  {
    id: "dlc-pack",
    name: "Bonus DLC Pack",
    description: "2 × expansion content",
    quantity: 2,
    unitPrice: 500,
  },
];

export function cartTotal(items: OrderItem[] = CART_ITEMS): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function cartDescription(items: OrderItem[] = CART_ITEMS): string {
  // JazzCash pp_Description is capped at 60 chars in our validator.
  // Build a compact summary like "Premium Gaming Bundle + Bonus DLC Pack".
  const names = items.map((i) => i.name);
  let desc = names[0] ?? "Digital order";
  for (let i = 1; i < names.length; i++) {
    const candidate = `${desc} + ${names[i]}`;
    if (candidate.length > 60) break;
    desc = candidate;
  }
  return desc;
}

export interface PaymentMethodCategory {
  title: string;
  methods: string;
}

export const PAYMENT_METHODS: PaymentMethodCategory[] = [
  {
    title: "Mobile Wallets",
    methods: "JazzCash Wallet · Easypaisa",
  },
  {
    title: "Bank Account",
    methods: "Internet Banking · Direct Debit",
  },
  {
    title: "Debit / Credit Card",
    methods: "Visa · Mastercard · UnionPay",
  },
];

export const HOW_IT_WORKS: string[] = [
  "Click Pay Now below",
  "You'll be redirected to JazzCash's secure page",
  "Choose your payment method — wallet, bank, or card",
  "Complete payment and you're done",
];
