import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface MarkerOverlayProps {
  floorPlanId: Id<"floorPlans">;
  displayW: number;
  displayH: number;
}

const HEAD_R = 10;
const HEAD_OFFSET = HEAD_R + 6; // distance from tip to circle center

const ICON_PRESETS = ["📍", "🚨", "⚡", "🚪", "📦", "🔧", "💻", "🏭", "⛽", "🅿️"];

export function MarkerOverlay({ floorPlanId, displayW, displayH }: MarkerOverlayProps) {
  const markers = useQuery(api.floorPlans.getFloorMarkers, { floorPlanId }) ?? [];
  const updateMarker = useMutation(api.floorPlans.updateFloorMarker);
  const deleteMarker = useMutation(api.floorPlans.deleteFloorMarker);

  const [editingId, setEditingId] = useState<Id<"floorMarkers"> | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const editing = markers.find((m) => m._id === editingId) ?? null;

  const openEdit = (m: (typeof markers)[number]) => {
    setEditingId(m._id);
    setEditName(m.name);
    setEditIcon(m.icon ?? "");
  };

  const handleSave = async () => {
    if (!editingId) return;
    await updateMarker({
      markerId: editingId,
      name: editName.trim() || "Marker",
      icon: editIcon.trim() || undefined,
    });
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    await deleteMarker({ markerId: editingId });
    setEditingId(null);
  };

  return (
    <>
      {markers.map((marker) => {
        const cx = marker.x * displayW;
        const cy = marker.y * displayH;
        const headCy = cy - HEAD_OFFSET;
        const label = marker.icon?.trim() || marker.name[0]?.toUpperCase() || "?";

        return (
          <g
            key={marker._id}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(marker);
            }}
          >
            {/* Pin circle head */}
            <circle
              cx={cx}
              cy={headCy}
              r={HEAD_R}
              fill="#f59e0b"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={1.5}
            />
            {/* Pin triangle pointer */}
            <polygon
              points={`${cx - 5},${headCy + HEAD_R - 1} ${cx + 5},${headCy + HEAD_R - 1} ${cx},${cy}`}
              fill="#f59e0b"
            />
            {/* Icon / first letter */}
            <text
              x={cx}
              y={headCy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={label.length > 1 ? 9 : 11}
              fill="white"
              fontWeight="600"
              pointerEvents="none"
            >
              {label}
            </text>
            {/* Name label */}
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              fontSize={10}
              fill="white"
              stroke="rgba(0,0,0,0.65)"
              strokeWidth={3}
              paintOrder="stroke"
              pointerEvents="none"
            >
              {marker.name}
            </text>
          </g>
        );
      })}

      {/* Edit panel */}
      {editing && (
        <foreignObject
          x={Math.min(editing.x * displayW + 16, displayW - 240)}
          y={Math.max(editing.y * displayH - HEAD_OFFSET - 120, 8)}
          width={230}
          height={220}
          style={{ overflow: "visible" }}
        >
          <div
            className="rounded-2xl p-4 shadow-2xl font-body text-sm"
            style={{ background: "rgba(13,18,28,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-white/90 text-sm">Edit Marker</span>
              <button
                onClick={() => setEditingId(null)}
                className="text-white/30 hover:text-white/70 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Name */}
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="Marker name"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white mb-2 outline-none focus:border-amber-400/50 transition-colors"
            />

            {/* Icon custom input */}
            <input
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              placeholder="Icon (emoji or leave blank)"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white mb-2 outline-none focus:border-amber-400/50 transition-colors"
            />

            {/* Quick-pick icons */}
            <div className="flex flex-wrap gap-1 mb-3">
              {ICON_PRESETS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setEditIcon(ic)}
                  className={`rounded-lg px-1.5 py-1 text-base transition-colors ${
                    editIcon === ic ? "bg-amber-400/25 ring-1 ring-amber-400/50" : "hover:bg-white/10"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-1.5 text-xs font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleDelete}
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
