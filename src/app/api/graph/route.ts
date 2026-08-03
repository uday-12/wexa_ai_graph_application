export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiRoute } from "@/lib/apiUtils";
import { getFullGraph } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("teamId") || undefined;
  return apiRoute(() => getFullGraph(teamId));
}
