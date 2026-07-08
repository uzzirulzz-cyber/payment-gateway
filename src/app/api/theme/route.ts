import { NextResponse } from "next/server";
import { connectDB, Order } from "@/lib/db";
import { Theme } from "@/lib/models/theme";

export const runtime = "nodejs";

/**
 * Default theme — the factory restore point.
 */
export const DEFAULT_THEME = {
  preset: "default",
  name: "PlayBeat Default",
  logoUrl: "/playbeat-logo.png",
  bgImageUrl: "/playbeat-bg.jpg",
  backgroundColor: "#000000",
  surfaceColor: "#0a0a0a",
  primaryColor: "#FFFFFF",
  accentFrom: "#0099FF",
  accentTo: "#0066CC",
  isDark: true,
} as const;

/** Ensure the default theme doc exists. Returns it. */
export async function ensureDefaultTheme() {
  await connectDB();
  const existing = await Theme.findOne({ preset: "default" }).lean();
  if (existing) return existing;

  return await Theme.create({ ...DEFAULT_THEME });
}

export async function GET() {
  await connectDB();
  // Active theme = "custom" if it exists, otherwise "default".
  const custom = await Theme.findOne({ preset: "custom" }).lean();
  const theme = custom ?? (await ensureDefaultTheme());
  return NextResponse.json({ ok: true, data: theme });
}

export async function POST(request: Request) {
  await connectDB();
  let body: Partial<typeof DEFAULT_THEME> = {};
  try {
    body = (await request.json()) as Partial<typeof DEFAULT_THEME>;
  } catch {
    /* empty body is fine */
  }

  // Update or create the "custom" preset (upsert).
  const updateData: Record<string, unknown> = {};
  for (const key of [
    "name",
    "logoUrl",
    "bgImageUrl",
    "backgroundColor",
    "surfaceColor",
    "primaryColor",
    "accentFrom",
    "accentTo",
    "isDark",
  ] as const) {
    if (body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  const theme = await Theme.findOneAndUpdate(
    { preset: "custom" },
    {
      $set: updateData,
      $setOnInsert: {
        preset: "custom",
        name: body.name ?? "Custom",
        logoUrl: body.logoUrl ?? DEFAULT_THEME.logoUrl,
        bgImageUrl: body.bgImageUrl ?? DEFAULT_THEME.bgImageUrl,
        backgroundColor: body.backgroundColor ?? DEFAULT_THEME.backgroundColor,
        surfaceColor: body.surfaceColor ?? DEFAULT_THEME.surfaceColor,
        primaryColor: body.primaryColor ?? DEFAULT_THEME.primaryColor,
        accentFrom: body.accentFrom ?? DEFAULT_THEME.accentFrom,
        accentTo: body.accentTo ?? DEFAULT_THEME.accentTo,
        isDark: body.isDark ?? DEFAULT_THEME.isDark,
      },
    },
    { new: true, upsert: true },
  ).lean();

  return NextResponse.json({ ok: true, data: theme });
}

// Avoid unused import lint
void Order;
