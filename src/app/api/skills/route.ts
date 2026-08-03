export const dynamic = "force-dynamic";

import { apiRoute } from "@/lib/apiUtils";
import { listSkills } from "@/lib/queries";

export async function GET() {
  return apiRoute(() => listSkills());
}
