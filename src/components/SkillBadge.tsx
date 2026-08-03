import clsx from "clsx";

export default function SkillBadge({
  name,
  level,
  priority,
}: {
  name: string;
  level?: number;
  priority?: "must-have" | "nice-to-have";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        priority === "must-have"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : priority === "nice-to-have"
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      {name}
      {typeof level === "number" && (
        <span className="flex items-center gap-0.5" aria-label={`level ${level} of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={clsx("h-1.5 w-1.5 rounded-full", i < level ? "bg-current" : "bg-current opacity-20")}
            />
          ))}
        </span>
      )}
    </span>
  );
}
