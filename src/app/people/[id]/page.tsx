"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher, ApiError } from "@/lib/api";
import type { PersonWithTeam, PersonSkill, Project, Collaborator, GraphData, Person } from "@/lib/types";
import SkillBadge from "@/components/SkillBadge";
import PersonCard from "@/components/PersonCard";
import GraphView from "@/components/GraphView";
import GraphLegend from "@/components/GraphLegend";
import { SkeletonLine, SkeletonList, SkeletonGraph } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

interface PersonDetail {
  person: PersonWithTeam;
  skills: PersonSkill[];
  projects: Array<Project & { role: string; since: string }>;
  mentorship: { mentors: Person[]; mentees: Person[] };
}

interface CollaboratorsResponse {
  collaborators: Collaborator[];
  graph: GraphData;
}

export default function PersonProfilePage({ params }: { params: { id: string } }) {
  const detail = useSWR<PersonDetail>(`/api/people/${params.id}`, fetcher);
  const network = useSWR<CollaboratorsResponse>(`/api/people/${params.id}/collaborators`, fetcher);

  if (detail.error instanceof ApiError && detail.error.status === 404) {
    return (
      <div className="space-y-6">
        <Link href="/people" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to people
        </Link>
        <EmptyState title="Person not found" description="They may have left the org graph." />
      </div>
    );
  }
  if (detail.error) {
    return (
      <div className="space-y-6">
        <Link href="/people" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to people
        </Link>
        <ErrorState
          message={detail.error instanceof ApiError ? detail.error.message : undefined}
          onRetry={() => detail.mutate()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/people" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to people
      </Link>

      {detail.isLoading || !detail.data ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="mt-2 w-1/4" />
        </div>
      ) : (
        <header className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{detail.data.person.name}</h1>
              <p className="mt-1 text-slate-600">{detail.data.person.title}</p>
              {detail.data.person.team && (
                <Link
                  href={`/people?teamId=${detail.data.person.team.id}`}
                  className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                >
                  {detail.data.person.team.name}
                </Link>
              )}
            </div>
            <a href={`mailto:${detail.data.person.email}`} className="text-sm text-indigo-600 hover:underline">
              {detail.data.person.email}
            </a>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-slate-600">{detail.data.person.bio}</p>
        </header>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
          {detail.isLoading && <div className="mt-3 flex flex-wrap gap-2"><SkeletonLine className="h-7 w-20 rounded-full" /><SkeletonLine className="h-7 w-24 rounded-full" /><SkeletonLine className="h-7 w-16 rounded-full" /></div>}
          {!detail.isLoading && detail.data?.skills.length === 0 && (
            <div className="mt-3">
              <EmptyState title="No skills recorded yet" />
            </div>
          )}
          {!detail.isLoading && detail.data && detail.data.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {detail.data.skills.map((s) => (
                <SkillBadge key={s.id} name={s.name} level={s.level} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Mentorship</h2>
          {detail.isLoading && <SkeletonLine className="mt-3 w-1/2" />}
          {!detail.isLoading && detail.data && (
            <div className="mt-3 space-y-3 text-sm">
              {detail.data.mentorship.mentors.length === 0 && detail.data.mentorship.mentees.length === 0 && (
                <p className="text-slate-500">No mentorship relationships on record.</p>
              )}
              {detail.data.mentorship.mentors.length > 0 && (
                <p>
                  <span className="text-slate-500">Mentored by </span>
                  {detail.data.mentorship.mentors.map((m, i) => (
                    <span key={m.id}>
                      {i > 0 && ", "}
                      <Link href={`/people/${m.id}`} className="font-medium text-indigo-600 hover:underline">
                        {m.name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
              {detail.data.mentorship.mentees.length > 0 && (
                <p>
                  <span className="text-slate-500">Mentors </span>
                  {detail.data.mentorship.mentees.map((m, i) => (
                    <span key={m.id}>
                      {i > 0 && ", "}
                      <Link href={`/people/${m.id}`} className="font-medium text-indigo-600 hover:underline">
                        {m.name}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
        {detail.isLoading && (
          <div className="mt-3">
            <SkeletonList count={2} />
          </div>
        )}
        {!detail.isLoading && detail.data?.projects.length === 0 && (
          <div className="mt-3">
            <EmptyState title="Not staffed on any project" description="This person isn't working on anything currently tracked." />
          </div>
        )}
        {!detail.isLoading && detail.data && detail.data.projects.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {detail.data.projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <p className="font-medium text-slate-900">{p.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {p.role} · since {p.since}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Collaboration neighborhood</h2>
          <GraphLegend types={["Person", "Team", "Project", "Skill"]} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Team, projects, skills, and everyone who&rsquo;s shared a project or mentorship link with{" "}
          {detail.data?.person.name ?? "this person"} — a two-hop traversal from a single node.
        </p>
        <div className="mt-3">
          {network.isLoading && <SkeletonGraph />}
          {!network.isLoading && network.error && (
            <ErrorState
              message={network.error instanceof ApiError ? network.error.message : undefined}
              onRetry={() => network.mutate()}
            />
          )}
          {!network.isLoading && !network.error && network.data && (
            <GraphView data={network.data.graph} focusId={params.id} height={420} />
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Top collaborators</h2>
        {network.isLoading && (
          <div className="mt-3">
            <SkeletonList count={3} />
          </div>
        )}
        {!network.isLoading && !network.error && network.data?.collaborators.length === 0 && (
          <div className="mt-3">
            <EmptyState title="No collaborators yet" description="No shared project work recorded." />
          </div>
        )}
        {!network.isLoading && !network.error && network.data && network.data.collaborators.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {network.data.collaborators.slice(0, 8).map((c) => (
              <PersonCard
                key={c.id}
                person={c}
                href={`/people/${c.id}`}
                subtitle={c.sharedProjects.join(", ")}
                right={<span className="font-medium text-indigo-600">{c.strength}×</span>}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
