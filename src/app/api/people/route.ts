export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { apiRoute } from "@/lib/apiUtils";
import { listPeople } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  return apiRoute(() =>
    listPeople({
      search: params.get("search") || undefined,
      teamId: params.get("teamId") || undefined,
      skillId: params.get("skillId") || undefined,
    })
  );
}
