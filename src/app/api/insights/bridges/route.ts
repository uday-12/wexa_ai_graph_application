export const dynamic = "force-dynamic";

import { apiRoute } from "@/lib/apiUtils";
import { findBridgePeople } from "@/lib/queries";

export async function GET() {
  return apiRoute(() => findBridgePeople(8));
}
