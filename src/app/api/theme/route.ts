import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Default theme — the factory restore point.
 *
 * Colors are derived from the official PLAYBEAT logo:
 *   - Background: pure black (#000000)
 *   - Surface: near-black (#0a0a0a)
 *   - Primary text: pure white (#FFFFFF)
 *   - Accent gradient: blue (#0099FF → #0066CC) — matches the "BEAT" wordmark
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

/** Ensure the default theme row exists. Returns it. */
export async function ensureDefaultTheme() {
  const existing = await db.theme.findUnique({
    where: { preset: "default" },
  });
  if (existing) return existing;

  return db.theme.create({
    data: { ...DEFAULT_THEME },
  });
}

export async function GET() {
  // Active theme = "custom" if it exists, otherwise "default".
  const custom = await db.theme.findUnique({
    where: { preset: "custom" },
  });
  const theme = custom ?? (await ensureDefaultTheme());
  return NextResponse.json({ ok: true, data: theme });
}

export async function POST(request: Request) {
  let body: Partial<typeof DEFAULT_THEME> = {};
  try {
    body = (await request.json()) as Partial<typeof DEFAULT_THEME>;
  } catch {
    /* empty body is fine */
  }

  // Update or create the "custom" preset.
  const theme = await db.theme.upsert({
    where: { preset: "custom" },
    update: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
      ...(body.bgImageUrl !== undefined && { bgImageUrl: body.bgImageUrl }),
      ...(body.backgroundColor !== undefined && {
        backgroundColor: body.backgroundColor,
      }),
      ...(body.surfaceColor !== undefined && {
        surfaceColor: body.surfaceColor,
      }),
      ...(body.primaryColor !== undefined && {
        primaryColor: body.primaryColor,
      }),
      ...(body.accentFrom !== undefined && { accentFrom: body.accentFrom }),
      ...(body.accentTo !== undefined && { accentTo: body.accentTo }),
      ...(body.isDark !== undefined && { isDark: body.isDark }),
    },
    create: {
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
  });

  return NextResponse.json({ ok: true, data: theme });
}
