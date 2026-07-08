import { NextResponse } from "next/server";
import { Theme } from "@/lib/models/theme";
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
  await Theme.deleteOne({ preset: "custom" });
  const restored = await Theme.findOne({ preset: "default" }).lean();
  return NextResponse.json({
    ok: true,
    message: "Theme restored to default.",
    data: restored,
  });
}
