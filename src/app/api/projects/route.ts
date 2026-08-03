export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiRoute } from "@/lib/apiUtils";
import { listProjects } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  return apiRoute(() =>
    listProjects({
      search: params.get("search") || undefined,
      teamId: params.get("teamId") || undefined,
      status: params.get("status") || undefined,
    })
  );
}
