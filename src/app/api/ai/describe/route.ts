import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";

interface DescribeBody {
  /** What the user is selling / charging for. e.g. "1 month Netflix subscription" */
  product: string;
  /** Optional context: target audience, tone, etc. */
  context?: string;
}

function fallbackDescription(product: string): string {
  const cleaned = product.trim().slice(0, 80);
  return `Payment for ${cleaned}`;
}

export async function POST(request: Request) {
  let body: DescribeBody;
  try {
    body = (await request.json()) as DescribeBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const product = (body.product ?? "").trim();
  if (product.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Product name must be at least 2 characters" },
      { status: 400 },
    );
  }

  // Try the LLM; if anything fails, return a sensible fallback so the
  // checkout flow never breaks because of AI rate limits.
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You write SHORT payment descriptions for a JazzCash checkout form. " +
            "Rules: max 50 characters, no quotes, no emojis, no trailing period, " +
            "title case, mention the product. Output ONLY the description text.",
        },
        {
          role: "user",
          content: `Product: ${product}\nContext: ${body.context ?? "general"}\nWrite the description:`,
        },
      ],
      temperature: 0.6,
      max_tokens: 40,
    });

    const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
    const description = text.replace(/^["']|["']$/g, "").slice(0, 60);
    return NextResponse.json({
      ok: true,
      description: description || fallbackDescription(product),
    });
  } catch (e) {
    console.error("[ai/describe] LLM call failed:", e);
    return NextResponse.json({
      ok: true,
      description: fallbackDescription(product),
      fallback: true,
    });
  }
}
