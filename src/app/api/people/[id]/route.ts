export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/apiUtils";
import { getPerson, getPersonSkills, getPersonProjects, getMentorship } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return apiRoute(async () => {
    const person = await getPerson(params.id);
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }
    const [skills, projects, mentorship] = await Promise.all([
      getPersonSkills(params.id),
      getPersonProjects(params.id),
      getMentorship(params.id),
    ]);
    return { person, skills, projects, mentorship };
  });
}
