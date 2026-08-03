"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { fetcher, ApiError } from "@/lib/api";
import type { Project, Team } from "@/lib/types";
import { SkeletonList } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

const STATUS_STYLE: Record<Project["status"], string> = {
  planning: "bg-slate-100 text-slate-600",
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-indigo-50 text-indigo-700",
};

function ProjectsDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState(searchParams.get("teamId") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (teamId) params.set("teamId", teamId);
    if (status) params.set("status", status);
    router.replace(params.toString() ? `/projects?${params}` : "/projects");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, status]);

  const teams = useSWR<Team[]>("/api/teams", fetcher);

  const query = new URLSearchParams();
  if (search.trim()) query.set("search", search.trim());
  if (teamId) query.set("teamId", teamId);
  if (status) query.set("status", status);
  const projects = useSWR<Array<Project & { team: Team | null }>>(`/api/projects?${query}`, fetcher);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">Every project, its owning team, and status.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All teams</option>
          {teams.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Any status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {projects.isLoading && <SkeletonList count={6} />}
      {!projects.isLoading && projects.error && (
        <ErrorState
          message={projects.error instanceof ApiError ? projects.error.message : undefined}
          onRetry={() => projects.mutate()}
        />
      )}
      {!projects.isLoading && !projects.error && projects.data?.length === 0 && (
        <EmptyState title="No projects match" description="Try a different search or clear the filters." />
      )}
      {!projects.isLoading && !projects.error && projects.data && projects.data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900">{p.name}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>
                  {p.status}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-slate-500">{p.description}</p>
              {p.team && <p className="text-xs font-medium text-amber-700">{p.team.name}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<SkeletonList count={6} />}>
      <ProjectsDirectory />
    </Suspense>
  );
}
