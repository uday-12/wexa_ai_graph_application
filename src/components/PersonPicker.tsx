"use client";

import { useEffect, useRef, useState } from "react";
import { fetcher } from "@/lib/api";
import type { PersonWithTeam } from "@/lib/types";

export default function PersonPicker({
  label,
  value,
  onChange,
  exclude,
}: {
  label: string;
  value: PersonWithTeam | null;
  onChange: (person: PersonWithTeam | null) => void;
  exclude?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonWithTeam[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetcher<PersonWithTeam[]>(`/api/people?search=${encodeURIComponent(query.trim())}`)
        .then((r) => {
          setResults(r.filter((p) => p.id !== exclude));
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, exclude]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2">
          <span className="text-sm font-medium text-indigo-900">{value.name}</span>
          <button
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="text-xs font-medium text-indigo-500 hover:text-indigo-700"
          >
            Change
          </button>
        </div>
      ) : (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Type a name…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      )}
      {open && !value && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.length === 0 && <div className="px-3.5 py-3 text-sm text-slate-400">No matches</div>}
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className="flex w-full flex-col px-3.5 py-2 text-left hover:bg-slate-50"
            >
              <span className="text-sm text-slate-800">{p.name}</span>
              <span className="text-xs text-slate-400">{p.team?.name ?? p.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
