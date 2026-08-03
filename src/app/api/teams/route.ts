export const dynamic = "force-dynamic";

import { apiRoute } from "@/lib/apiUtils";
import { listTeams } from "@/lib/queries";

export async function GET() {
  return apiRoute(() => listTeams());
}
