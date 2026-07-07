import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/settings
 * Returns the active (isDefault=true) restore point.
 * Falls back to hardcoded defaults if no row exists yet.
 */
export async function GET() {
  const setting = await db.setting.findFirst({
    where: { isDefault: true },
  });

  if (!setting) {
    // Return hardcoded defaults matching the brand.
    return NextResponse.json({
      ok: true,
      data: {
        name: "default",
        label: "Default",
        logoPath: "/playbeat-logo.png",
        backgroundPath: "/playbeat-bg.jpg",
        primaryColor: "#1e3a8a",
        accentColor: "#3b82f6",
        heroTitle: "PlayBeat",
        heroTagline:
          "Premium digital products delivered instantly. Secure checkout powered by JazzCash — accepted across Pakistan & worldwide.",
      },
    });
  }

  return NextResponse.json({ ok: true, data: setting });
}

/**
 * PUT /api/settings
 * Updates the active restore point. Body should contain any subset of the
 * editable fields. If `name` is provided and doesn't exist, a new restore
 * point is created; otherwise the existing one is updated.
 */
export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name as string) ?? "default";
  const label = (body.label as string) ?? "Default";

  // Build the update payload from allowed fields.
  const data: Record<string, unknown> = { label };
  const allowed = [
    "logoPath",
    "backgroundPath",
    "primaryColor",
    "accentColor",
    "heroTitle",
    "heroTagline",
  ];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      data[key] = body[key];
    }
  }

  // Upsert by name so we can re-save the default restore point repeatedly.
  const setting = await db.setting.upsert({
    where: { name },
    create: {
      name,
      label,
      isDefault: true,
      ...data,
    },
    update: {
      ...data,
    },
  });

  // Ensure only this restore point is the default.
  await db.setting.updateMany({
    where: { name: { not: name } },
    data: { isDefault: false },
  });

  return NextResponse.json({ ok: true, data: setting });
}
