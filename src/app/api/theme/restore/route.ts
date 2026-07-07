import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDefaultTheme } from "@/app/api/theme/route";

export const runtime = "nodejs";

/**
 * POST /api/theme/restore
 *
 * Deletes the "custom" preset so the app falls back to the factory
 * "default" theme (the restore point).
 */
export async function POST() {
  await ensureDefaultTheme();
  await db.theme.deleteMany({ where: { preset: "custom" } });
  const restored = await db.theme.findUnique({
    where: { preset: "default" },
  });
  return NextResponse.json({
    ok: true,
    message: "Theme restored to default.",
    data: restored,
  });
}
