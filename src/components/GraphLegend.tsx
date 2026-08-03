import type { GraphNodeType } from "@/lib/types";

const COLOR: Record<GraphNodeType, string> = {
  Person: "bg-node-person",
  Team: "bg-node-team",
  Skill: "bg-node-skill",
  Project: "bg-node-project",
};

export default function GraphLegend({ types }: { types: GraphNodeType[] }) {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-500">
      {types.map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${COLOR[t]}`} />
          {t}
        </span>
      ))}
    </div>
  );
}
