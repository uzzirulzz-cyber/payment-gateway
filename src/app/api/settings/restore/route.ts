import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/settings/restore
 * Resets the "default" restore point to the original brand values and
 * marks it as the active configuration. All other restore points are
 * demoted (isDefault=false).
 */
export async function POST() {
  // The canonical default values — what the app ships with.
  const defaults = {
    name: "default",
    label: "Default",
    logoPath: "/playbeat-logo.png",
    backgroundPath: "/playbeat-bg.jpg",
    primaryColor: "#1e3a8a",
    accentColor: "#3b82f6",
    heroTitle: "PlayBeat",
    heroTagline:
      "Premium digital products delivered instantly. Secure checkout powered by JazzCash — accepted across Pakistan & worldwide.",
  };

  // Upsert the default row.
  const setting = await db.setting.upsert({
    where: { name: "default" },
    create: { ...defaults, isDefault: true },
    update: { ...defaults, isDefault: true },
  });

  // Demote any other restore points.
  await db.setting.updateMany({
    where: { name: { not: "default" } },
    data: { isDefault: false },
  });

  return NextResponse.json({
    ok: true,
    message: "Restored to default restore point.",
    data: setting,
  });
}
