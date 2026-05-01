import { NextResponse } from "next/server";
import { PROVIDERS } from "@/lib/providers";

export async function GET() {
  return NextResponse.json({
    providers: PROVIDERS.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      models: p.models.map((m) => ({
        id: m.id,
        name: m.name,
        isFree: m.isFree,
        description: m.description,
      })),
    })),
  });
}
