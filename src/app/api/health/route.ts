export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { checkConnectivity } from "@/lib/neo4j";

export async function GET() {
  const ok = await checkConnectivity();
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
