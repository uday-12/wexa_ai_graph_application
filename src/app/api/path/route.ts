export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { apiRoute } from "@/lib/apiUtils";
import { findShortestPath } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Both 'from' and 'to' person ids are required." }, { status: 400 });
  }
  return apiRoute(async () => {
    const graph = await findShortestPath(from, to);
    if (!graph) {
      return NextResponse.json({ found: false });
    }
    return { found: true, graph };
  });
}
