export const dynamic = "force-dynamic";

import { apiRoute } from "@/lib/apiUtils";
import { getCollaborators, getPersonNeighborhoodGraph } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return apiRoute(async () => {
    const [collaborators, graph] = await Promise.all([
      getCollaborators(params.id),
      getPersonNeighborhoodGraph(params.id),
    ]);
    return { collaborators, graph };
  });
}
