"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/api";

interface SearchResult {
  id: string;
  label: string;
  type: "Person" | "Project" | "Skill";
}

const TYPE_COLOR: Record<SearchResult["type"], string> = {
  Person: "text-node-person",
  Project: "text-node-project",
  Skill: "text-node-skill",
};

export default function SearchBar({ placeholder = "Search people, projects, skills…" }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      fetcher<SearchResult[]>(`/api/search?q=${encodeURIComponent(term)}`)
        .then((r) => {
          setResults(r);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function go(result: SearchResult) {
    setOpen(false);
    setQuery("");
    if (result.type === "Person") router.push(`/people/${result.id}`);
    else if (result.type === "Project") router.push(`/projects/${result.id}`);
    else router.push(`/people?skillId=${result.id}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      {open && (
        <div className="absolute z-40 mt-1 w-full animate-fade-in overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading && <div className="px-3.5 py-3 text-sm text-slate-400">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="px-3.5 py-3 text-sm text-slate-400">No matches for &ldquo;{query}&rdquo;</div>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => go(r)}
                className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="text-slate-800">{r.label}</span>
                <span className={`text-xs font-medium ${TYPE_COLOR[r.type]}`}>{r.type}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
