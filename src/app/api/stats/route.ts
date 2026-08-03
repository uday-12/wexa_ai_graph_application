export const dynamic = "force-dynamic";

import { apiRoute } from "@/lib/apiUtils";
import { getOrgStats } from "@/lib/queries";

export async function GET() {
  return apiRoute(() => getOrgStats());
}
