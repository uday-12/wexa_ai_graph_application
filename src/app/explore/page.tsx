"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/api";
import type { GraphData, GraphNodeType, Team } from "@/lib/types";
import GraphView from "@/components/GraphView";
import { SkeletonGraph } from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import clsx from "clsx";

const TYPES: Array<{ type: GraphNodeType; color: string; label: string }> = [
  { type: "Person", color: "bg-node-person", label: "People" },
  { type: "Team", color: "bg-node-team", label: "Teams" },
  { type: "Project", color: "bg-node-project", label: "Projects" },
];

export default function ExplorePage() {
  const [teamId, setTeamId] = useState("");
  const [visible, setVisible] = useState<Record<GraphNodeType, boolean>>({
    Person: true,
    Team: true,
    Project: true,
    Skill: true,
  });

  const teams = useSWR<Team[]>("/api/teams", fetcher);
  const graph = useSWR<GraphData>(`/api/graph${teamId ? `?teamId=${teamId}` : ""}`, fetcher);

  const filtered = useMemo<GraphData>(() => {
    if (!graph.data) return { nodes: [], links: [] };
    const nodes = graph.data.nodes.filter((n) => visible[n.type]);
    const ids = new Set(nodes.map((n) => n.id));
    const links = graph.data.links.filter((l) => ids.has(l.source) && ids.has(l.target));
    return { nodes, links };
  }, [graph.data, visible]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Network explorer</h1>
        <p className="mt-1 text-sm text-slate-500">
          A force-directed view of the whole org — people, teams, projects and mentorship, all at once. Click any
          node to jump to it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Whole org</option>
          {teams.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => setVisible((v) => ({ ...v, [t.type]: !v[t.type] }))}
              className={clsx(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                visible[t.type] ? "border-slate-300 bg-slate-50 text-slate-700" : "border-slate-200 text-slate-400"
              )}
            >
              <span className={clsx("h-2 w-2 rounded-full", visible[t.type] ? t.color : "bg-slate-300")} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {graph.isLoading && <SkeletonGraph />}
      {!graph.isLoading && graph.error && (
        <ErrorState
          message={graph.error instanceof ApiError ? graph.error.message : undefined}
          onRetry={() => graph.mutate()}
        />
      )}
      {!graph.isLoading && !graph.error && filtered.nodes.length === 0 && (
        <EmptyState title="Nothing to show" description="Try enabling a layer or picking a different team." />
      )}
      {!graph.isLoading && !graph.error && filtered.nodes.length > 0 && <GraphView data={filtered} height={560} />}
    </div>
  );
}
