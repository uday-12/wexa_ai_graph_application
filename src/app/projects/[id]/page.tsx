"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher, ApiError } from "@/lib/api";
import type { Project, Team, ProjectRequiredSkill, Person, SkillGap } from "@/lib/types";
import SkillBadge from "@/components/SkillBadge";
import PersonCard from "@/components/PersonCard";
import { SkeletonLine, SkeletonList } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

const STATUS_STYLE: Record<Project["status"], string> = {
  planning: "bg-slate-100 text-slate-600",
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-indigo-50 text-indigo-700",
};

interface ProjectDetail {
  project: Project & { team: Team | null };
  requiredSkills: ProjectRequiredSkill[];
  members: Array<Person & { role: string; since: string }>;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const detail = useSWR<ProjectDetail>(`/api/projects/${params.id}`, fetcher);
  const gaps = useSWR<SkillGap[]>(`/api/projects/${params.id}/gaps`, fetcher);

  if (detail.error instanceof ApiError && detail.error.status === 404) {
    return (
      <div className="space-y-6">
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to projects
        </Link>
        <EmptyState title="Project not found" description="It may have been archived or renamed." />
      </div>
    );
  }
  if (detail.error) {
    return (
      <div className="space-y-6">
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to projects
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
      <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to projects
      </Link>

      {detail.isLoading || !detail.data ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="mt-2 w-2/3" />
        </div>
      ) : (
        <header className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{detail.data.project.name}</h1>
              {detail.data.project.team && (
                <p className="mt-1 text-sm font-medium text-amber-700">{detail.data.project.team.name}</p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLE[detail.data.project.status]}`}>
              {detail.data.project.status}
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-slate-600">{detail.data.project.description}</p>
        </header>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Required skills</h2>
        {detail.isLoading && <SkeletonLine className="mt-3 w-1/2" />}
        {!detail.isLoading && detail.data?.requiredSkills.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">No specific skill requirements recorded.</p>
        )}
        {!detail.isLoading && detail.data && detail.data.requiredSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.data.requiredSkills.map((s) => (
              <SkillBadge key={s.id} name={s.name} priority={s.priority} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Current team</h2>
        {detail.isLoading && (
          <div className="mt-3">
            <SkeletonList count={3} />
          </div>
        )}
        {!detail.isLoading && detail.data?.members.length === 0 && (
          <div className="mt-3">
            <EmptyState title="Nobody staffed yet" description="This project doesn't have anyone assigned." />
          </div>
        )}
        {!detail.isLoading && detail.data && detail.data.members.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detail.data.members.map((m) => (
              <PersonCard key={m.id} person={m} href={`/people/${m.id}`} subtitle={`${m.role} · since ${m.since}`} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Skill gap analysis</h2>
        <p className="mt-1 text-sm text-slate-500">
          Required skills nobody on the current team has, and who in the org could fill the gap — a 2-hop traversal
          from project to skill to candidate, with the current team excluded.
        </p>
        <div className="mt-4 space-y-5">
          {gaps.isLoading && <SkeletonList count={2} />}
          {!gaps.isLoading && gaps.error && (
            <ErrorState
              message={gaps.error instanceof ApiError ? gaps.error.message : undefined}
              onRetry={() => gaps.mutate()}
            />
          )}
          {!gaps.isLoading && !gaps.error && gaps.data?.length === 0 && (
            <EmptyState icon="✓" title="Fully staffed" description="Every required skill is already covered by the current team." />
          )}
          {!gaps.isLoading &&
            !gaps.error &&
            gaps.data?.map((gap) => (
              <div key={gap.skill.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <SkillBadge name={gap.skill.name} priority={gap.priority} />
                  <span className="text-xs text-slate-400">gap</span>
                </div>
                {gap.candidates.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No one in the org currently has this skill — consider hiring or upskilling.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {gap.candidates.map((c) => (
                      <PersonCard
                        key={c.id}
                        person={c}
                        href={`/people/${c.id}`}
                        right={<span className="font-medium text-indigo-600">L{c.level}</span>}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
