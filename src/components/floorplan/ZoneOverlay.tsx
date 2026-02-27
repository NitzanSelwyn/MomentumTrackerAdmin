import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface Zone {
  _id: Id<"floorZones">;
  name: string;
  color: string;
  points: { x: number; y: number }[];
}

interface ZoneOverlayProps {
  zones: Zone[];
  displayW: number;
  displayH: number;
}

export function ZoneOverlay({ zones, displayW, displayH }: ZoneOverlayProps) {
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [editName, setEditName] = useState("");
  const deleteZone = useMutation(api.floorPlans.deleteFloorZone);
  const updateZone = useMutation(api.floorPlans.updateFloorZone);

  return (
    <>
      {zones.map((zone) => {
        const pointsStr = zone.points
          .map((p) => `${p.x * displayW},${p.y * displayH}`)
          .join(" ");

        return (
          <g key={zone._id}>
            <polygon
              points={pointsStr}
              fill={zone.color}
              fillOpacity={0.2}
              stroke={zone.color}
              strokeWidth={1.5}
              strokeOpacity={0.8}
              className="cursor-pointer hover:fill-opacity-30 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setActiveZone(zone);
                setEditName(zone.name);
              }}
            />
            {/* Zone label at centroid */}
            {zone.points.length > 0 && (
              <text
                x={
                  (zone.points.reduce((s, p) => s + p.x, 0) / zone.points.length) *
                  displayW
                }
                y={
                  (zone.points.reduce((s, p) => s + p.y, 0) / zone.points.length) *
                  displayH
                }
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fill={zone.color}
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={3}
                paintOrder="stroke"
                pointerEvents="none"
              >
                {zone.name}
              </text>
            )}
          </g>
        );
      })}

      {/* Zone popup */}
      {activeZone && (
        <foreignObject x={10} y={10} width={220} height={160} style={{ overflow: "visible" }}>
          <div
            className="rounded-xl p-4 shadow-xl text-sm text-white font-body"
            style={{ background: "rgba(15,20,30,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-white/90">Edit Zone</span>
              <button
                onClick={() => setActiveZone(null)}
                className="text-white/40 hover:text-white/70 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm text-white mb-3 outline-none focus:border-accent/50"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await updateZone({ zoneId: activeZone._id, name: editName });
                  setActiveZone(null);
                }}
                className="flex-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent py-1.5 text-xs font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={async () => {
                  await deleteZone({ zoneId: activeZone._id });
                  setActiveZone(null);
                }}
                className="flex-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 py-1.5 text-xs font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </foreignObject>
      )}
    </>
  );
}
