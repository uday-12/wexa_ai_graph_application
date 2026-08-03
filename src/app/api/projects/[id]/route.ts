export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/apiUtils";
import { getProject, getProjectRequiredSkills, getProjectMembers } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return apiRoute(async () => {
    const project = await getProject(params.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const [requiredSkills, members] = await Promise.all([
      getProjectRequiredSkills(params.id),
      getProjectMembers(params.id),
    ]);
    return { project, requiredSkills, members };
  });
}
