"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/api";
import type { GraphData, PersonWithTeam } from "@/lib/types";
import PersonPicker from "@/components/PersonPicker";
import GraphView from "@/components/GraphView";
import GraphLegend from "@/components/GraphLegend";
import { SkeletonGraph } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

const REL_LABEL: Record<string, string> = {
  WORKS_ON: "works on",
  MEMBER_OF: "is a member of",
  MENTORS: "mentors",
};

export default function ConnectPage() {
  const [from, setFrom] = useState<PersonWithTeam | null>(null);
  const [to, setTo] = useState<PersonWithTeam | null>(null);

  const key = from && to ? `/api/path?from=${from.id}&to=${to.id}` : null;
  const path = useSWR<{ found: boolean; graph?: GraphData }>(key, fetcher);

  const nodeLabels = useMemo(() => {
    const map = new Map<string, string>();
    path.data?.graph?.nodes.forEach((n) => map.set(n.id, n.label));
    return map;
  }, [path.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Connect two people</h1>
        <p className="mt-1 text-sm text-slate-500">
          Find the shortest path between anyone in the org through shared projects, teams, or mentorship — a
          variable-length traversal that&rsquo;s awkward to express as recursive SQL joins.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
        <PersonPicker label="From" value={from} onChange={setFrom} exclude={to?.id} />
        <div className="hidden pb-2 text-slate-300 sm:block">→</div>
        <PersonPicker label="To" value={to} onChange={setTo} exclude={from?.id} />
      </div>

      {!from || !to ? (
        <EmptyState title="Pick two people" description="Choose someone to start from and someone to connect to." />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Path</h2>
            <GraphLegend types={["Person", "Team", "Project"]} />
          </div>

          {path.isLoading && <SkeletonGraph />}
          {!path.isLoading && path.error && (
            <ErrorState
              message={path.error instanceof ApiError ? path.error.message : undefined}
              onRetry={() => path.mutate()}
            />
          )}
          {!path.isLoading && !path.error && path.data && !path.data.found && (
            <EmptyState
              title="No connection found"
              description={`${from.name} and ${to.name} aren't connected within 10 hops of shared work, teams, or mentorship.`}
            />
          )}
          {!path.isLoading && !path.error && path.data?.found && path.data.graph && (
            <>
              <GraphView data={path.data.graph} height={380} />
              <ol className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                {path.data.graph.links.map((l, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                      {i + 1}
                    </span>
                    <span className="font-medium">{nodeLabels.get(l.source) ?? l.source}</span>
                    <span className="text-slate-400">{REL_LABEL[l.type] ?? l.type.toLowerCase()}</span>
                    <span className="font-medium">{nodeLabels.get(l.target) ?? l.target}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}
