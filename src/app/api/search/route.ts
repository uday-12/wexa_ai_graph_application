export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiRoute } from "@/lib/apiUtils";
import { searchAll } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const term = (req.nextUrl.searchParams.get("q") ?? "").trim();
  return apiRoute(async () => (term.length < 2 ? [] : searchAll(term)));
}
