import Link from "next/link";
import type { ReactNode } from "react";

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PersonCard({
  person,
  subtitle,
  right,
  href,
}: {
  person: { id: string; name: string; title: string };
  subtitle?: string;
  right?: ReactNode;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${colorFor(
          person.id
        )}`}
      >
        {initials(person.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{person.name}</p>
        <p className="truncate text-sm text-slate-500">{subtitle ?? person.title}</p>
      </div>
      {right && <div className="shrink-0 text-sm text-slate-500">{right}</div>}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
