"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher, ApiError } from "@/lib/api";
import type { OrgStats, BridgePerson } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import { SkeletonLine } from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import PersonCard from "@/components/PersonCard";

const STAT_LABELS: Array<{ key: keyof OrgStats; label: string }> = [
  { key: "people", label: "People" },
  { key: "teams", label: "Teams" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
];

const QUICK_LINKS = [
  { href: "/people", title: "Browse people", desc: "Filter by team or skill, jump into any profile." },
  { href: "/projects", title: "Staff a project", desc: "See required skills and who's missing." },
  { href: "/connect", title: "Connect two people", desc: "Find the shortest path between anyone." },
  { href: "/explore", title: "Explore the network", desc: "A force-directed view of the whole org." },
];

export default function DashboardPage() {
  const stats = useSWR<OrgStats>("/api/stats", fetcher);
  const bridges = useSWR<BridgePerson[]>("/api/insights/bridges", fetcher);

  const dbDown = stats.error instanceof ApiError && stats.error.status === 503;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white p-8">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          Who knows what. Who&rsquo;s worked with whom.
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          OrgGraph maps people, skills, teams and projects as a connected graph — so questions like &ldquo;who
          should I loop in?&rdquo; or &ldquo;how are these two people connected?&rdquo; are a traversal away, not a
          spreadsheet away.
        </p>
        <div className="mt-5">
          <SearchBar />
        </div>
      </section>

      <section>
        {dbDown ? (
          <ErrorState message={stats.error.message} onRetry={() => stats.mutate()} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STAT_LABELS.map(({ key, label }) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">{label}</p>
                {stats.isLoading ? (
                  <SkeletonLine className="mt-2 w-16" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.data?.[key] ?? "—"}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Who bridges your teams?</h2>
        <p className="mt-1 text-sm text-slate-500">
          People who connect two otherwise-separate teams through shared project work — the kind of insight
          that&rsquo;s a one-line graph pattern, and a painful recursive self-join in SQL.
        </p>
        <div className="mt-4">
          {bridges.isLoading && (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          )}
          {!bridges.isLoading && bridges.error && (
            <ErrorState
              message={bridges.error instanceof ApiError ? bridges.error.message : "Failed to load insight."}
              onRetry={() => bridges.mutate()}
            />
          )}
          {!bridges.isLoading && !bridges.error && bridges.data?.length === 0 && (
            <EmptyState title="No bridges found" description="No one currently spans two teams' project work." />
          )}
          {!bridges.isLoading && !bridges.error && bridges.data && bridges.data.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {bridges.data.map((b) => (
                <PersonCard
                  key={b.id}
                  person={b}
                  href={`/people/${b.id}`}
                  subtitle={`${b.teamA.name} ↔ ${b.teamB.name}`}
                  right={<span className="font-medium text-indigo-600">{b.bridgeStrength} shared project(s)</span>}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Get started</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
            >
              <p className="font-medium text-slate-900">{q.title}</p>
              <p className="mt-1 text-sm text-slate-500">{q.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
