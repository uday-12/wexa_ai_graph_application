"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { GraphData, GraphNode } from "@/lib/types";

// react-force-graph-2d touches `window`/canvas at import time, so it's loaded client-side only,
// inside an effect. (next/dynamic's wrapper works too, but doesn't forward refs, which zoomToFit needs.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForceGraphComponent = any;

const NODE_COLOR: Record<string, string> = {
  Person: "#6366f1",
  Team: "#f59e0b",
  Skill: "#10b981",
  Project: "#f43f5e",
};

export default function GraphView({
  data,
  height = 420,
  focusId,
  onNodeClick,
}: {
  data: GraphData;
  height?: number;
  focusId?: string;
  onNodeClick?: (node: GraphNode) => void;
}) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const [width, setWidth] = useState(0);
  const [ForceGraph2D, setForceGraph2D] = useState<ForceGraphComponent>(null);

  useEffect(() => {
    import("react-force-graph-2d").then((mod) => setForceGraph2D(() => mod.default));
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const fgData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data]
  );

  const handleClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      if (onNodeClick) {
        onNodeClick(node as GraphNode);
        return;
      }
      if (node.type === "Person") router.push(`/people/${node.id}`);
      else if (node.type === "Project") router.push(`/projects/${node.id}`);
      else if (node.type === "Skill") router.push(`/people?skillId=${node.id}`);
    },
    [onNodeClick, router]
  );

  if (data.nodes.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400"
      >
        No graph data to show.
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="force-graph-wrapper overflow-hidden rounded-xl border border-slate-200 bg-white"
      style={{ height }}
    >
      {width > 0 && ForceGraph2D && (
        <ForceGraph2D
          ref={fgRef}
          graphData={fgData}
          width={width}
          height={height}
          nodeId="id"
          nodeLabel={(n: GraphNode) => `${n.label}${n.sub ? ` · ${n.sub}` : ""}`}
          nodeColor={(n: GraphNode) => (n.id === focusId ? "#4338ca" : NODE_COLOR[n.type] ?? "#94a3b8")}
          nodeRelSize={5}
          linkColor={() => "rgba(100,116,139,0.35)"}
          linkWidth={1}
          onNodeClick={handleClick}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 40)}
          nodeCanvasObjectMode={() => "after"}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            // Dense graphs get unreadable if every label draws at once; only label once zoomed in
            // (small graphs like a profile neighborhood or a path are always under the threshold).
            if (fgData.nodes.length > 25 && globalScale < 1.4) return;
            const fontSize = 11 / globalScale;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillStyle = "#334155";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(node.label, node.x, node.y + 7);
          }}
          cooldownTicks={80}
        />
      )}
    </div>
  );
}
