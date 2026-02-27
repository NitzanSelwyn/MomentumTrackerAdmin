import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface ZoneDrawerProps {
  floorPlanId: Id<"floorPlans">;
  displayW: number;
  displayH: number;
  onClose: () => void;
}

export function ZoneDrawer({ floorPlanId, displayW, displayH, onClose }: ZoneDrawerProps) {
  const [draftPoints, setDraftPoints] = useState<{ x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneColor, setZoneColor] = useState("#00d4ff");
  const createZone = useMutation(api.floorPlans.createFloorZone);

  const CLOSE_THRESHOLD = 10; // px

  const handleSvgClick = (e: React.MouseEvent<SVGGElement>) => {
    if (showForm) return;
    const svg = e.currentTarget.closest("svg")!;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / displayW;
    const y = (e.clientY - rect.top) / displayH;

    // Check if closing the polygon
    if (draftPoints.length >= 3) {
      const first = draftPoints[0];
      const dx = (x - first.x) * displayW;
      const dy = (y - first.y) * displayH;
      if (Math.sqrt(dx * dx + dy * dy) < CLOSE_THRESHOLD) {
        setShowForm(true);
        return;
      }
    }

    setDraftPoints((pts) => [...pts, { x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGGElement>) => {
    const svg = e.currentTarget.closest("svg")!;
    const rect = svg.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / displayW,
      y: (e.clientY - rect.top) / displayH,
    });
  };

  const handleSave = async () => {
    if (!zoneName.trim() || draftPoints.length < 3) return;
    await createZone({
      floorPlanId,
      name: zoneName.trim(),
      color: zoneColor,
      points: draftPoints,
    });
    onClose();
  };

  const pointsStr = draftPoints
    .map((p) => `${p.x * displayW},${p.y * displayH}`)
    .join(" ");

  const linePoints =
    draftPoints.length > 0 && mousePos && !showForm
      ? `${draftPoints[draftPoints.length - 1].x * displayW},${
          draftPoints[draftPoints.length - 1].y * displayH
        } ${mousePos.x * displayW},${mousePos.y * displayH}`
      : null;

  return (
    <g
      onClick={handleSvgClick}
      onMouseMove={handleMouseMove}
      style={{ cursor: showForm ? "default" : "crosshair" }}
    >
      {/* Transparent click capture */}
      <rect x={0} y={0} width={displayW} height={displayH} fill="transparent" />

      {/* Draft polygon */}
      {draftPoints.length >= 2 && (
        <polygon
          points={pointsStr}
          fill={zoneColor}
          fillOpacity={0.15}
          stroke={zoneColor}
          strokeWidth={1.5}
          strokeDasharray="6,3"
        />
      )}

      {/* Line to mouse */}
      {linePoints && (
        <polyline
          points={linePoints}
          fill="none"
          stroke={zoneColor}
          strokeWidth={1.5}
          strokeDasharray="4,3"
          opacity={0.6}
        />
      )}

      {/* Draft vertices */}
      {draftPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x * displayW}
          cy={p.y * displayH}
          r={i === 0 && draftPoints.length >= 3 ? 7 : 4}
          fill={i === 0 ? "white" : zoneColor}
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={1}
          style={{ cursor: i === 0 && draftPoints.length >= 3 ? "pointer" : "crosshair" }}
        />
      ))}

      {/* Save form overlay */}
      {showForm && (
        <foreignObject x={20} y={20} width={240} height={200} style={{ overflow: "visible" }}>
          <div
            className="rounded-xl p-4 shadow-xl text-sm text-white font-body"
            style={{ background: "rgba(15,20,30,0.97)", border: "1px solid rgba(255,255,255,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-white/90 mb-3">Name this zone</p>
            <input
              autoFocus
              placeholder="e.g. Assembly Line A"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white mb-2 outline-none focus:border-accent/50"
            />
            <div className="flex items-center gap-2 mb-3">
              <label className="text-white/50 text-xs">Color</label>
              <input
                type="color"
                value={zoneColor}
                onChange={(e) => setZoneColor(e.target.value)}
                className="h-7 w-10 rounded cursor-pointer border-0 bg-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent py-1.5 text-xs font-medium transition-colors"
              >
                Save Zone
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 py-1.5 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </foreignObject>
      )}

      {/* Instruction banner */}
      {!showForm && (
        <foreignObject x={displayW / 2 - 170} y={10} width={340} height={40} style={{ overflow: "visible" }}>
          <div
            className="rounded-lg px-4 py-2 text-xs text-center text-white/70 font-body"
            style={{ background: "rgba(15,20,30,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {draftPoints.length === 0
              ? "Click to start drawing a zone — Esc to cancel"
              : draftPoints.length < 3
                ? `${draftPoints.length} point${draftPoints.length > 1 ? "s" : ""} — click to add more`
                : "Click first point to close, or keep adding points"}
          </div>
        </foreignObject>
      )}
    </g>
  );
}
