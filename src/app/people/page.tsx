"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/api";
import type { PersonWithTeam, Team, Skill } from "@/lib/types";
import PersonCard from "@/components/PersonCard";
import { SkeletonList } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

function PeopleDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState(searchParams.get("teamId") ?? "");
  const [skillId, setSkillId] = useState(searchParams.get("skillId") ?? "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (teamId) params.set("teamId", teamId);
    if (skillId) params.set("skillId", skillId);
    router.replace(params.toString() ? `/people?${params}` : "/people");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, skillId]);

  const teams = useSWR<Team[]>("/api/teams", fetcher);
  const skills = useSWR<Skill[]>("/api/skills", fetcher);

  const query = new URLSearchParams();
  if (search.trim()) query.set("search", search.trim());
  if (teamId) query.set("teamId", teamId);
  if (skillId) query.set("skillId", skillId);
  const people = useSWR<PersonWithTeam[]>(`/api/people?${query}`, fetcher);

  const selectedSkill = skills.data?.find((s) => s.id === skillId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">People</h1>
        <p className="mt-1 text-sm text-slate-500">Browse everyone in the org, or narrow by team and skill.</p>
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
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All skills</option>
          {skills.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {(teamId || skillId || search) && (
          <button
            onClick={() => {
              setSearch("");
              setTeamId("");
              setSkillId("");
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {selectedSkill && (
        <p className="text-sm text-slate-500">
          Showing people with <span className="font-medium text-slate-700">{selectedSkill.name}</span>
        </p>
      )}

      {people.isLoading && <SkeletonList count={6} />}
      {!people.isLoading && people.error && (
        <ErrorState
          message={people.error instanceof ApiError ? people.error.message : undefined}
          onRetry={() => people.mutate()}
        />
      )}
      {!people.isLoading && !people.error && people.data?.length === 0 && (
        <EmptyState title="No one matches" description="Try clearing a filter or searching a different name." />
      )}
      {!people.isLoading && !people.error && people.data && people.data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.data.map((p) => (
            <PersonCard
              key={p.id}
              person={p}
              href={`/people/${p.id}`}
              subtitle={p.team ? `${p.title} · ${p.team.name}` : p.title}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={<SkeletonList count={6} />}>
      <PeopleDirectory />
    </Suspense>
  );
}
