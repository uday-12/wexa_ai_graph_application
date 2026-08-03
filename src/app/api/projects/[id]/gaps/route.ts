export const dynamic = "force-dynamic";

import { apiRoute } from "@/lib/apiUtils";
import { getProjectSkillGaps } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return apiRoute(() => getProjectSkillGaps(params.id));
}
