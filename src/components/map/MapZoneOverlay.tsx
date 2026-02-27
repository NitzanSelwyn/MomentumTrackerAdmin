import { useState } from "react";
import { Polygon, Tooltip } from "react-leaflet";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface MapZone {
  _id: Id<"mapZones">;
  name: string;
  color: string;
  points: { lat: number; lng: number }[];
}

interface MapZoneOverlayProps {
  zones: MapZone[];
}

export function MapZoneOverlay({ zones }: MapZoneOverlayProps) {
  const [editing, setEditing] = useState<MapZone | null>(null);
  const [editName, setEditName] = useState("");
  const deleteZone = useMutation(api.mapZones.deleteMapZone);
  const updateZone = useMutation(api.mapZones.updateMapZone);

  return (
    <>
      {zones.map((zone) => (
        <Polygon
          key={zone._id}
          positions={zone.points.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: zone.color,
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.8,
          }}
          eventHandlers={{
            click() {
              setEditing(zone);
              setEditName(zone.name);
            },
          }}
        >
          <Tooltip sticky>{zone.name}</Tooltip>
        </Polygon>
      ))}

      {/* Edit popup — rendered as a fixed overlay so it stays above the map */}
      {editing && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center pb-10 pointer-events-none"
        >
          <div
            className="pointer-events-auto rounded-2xl p-4 shadow-2xl w-72 font-body"
            style={{ background: "rgba(13,18,28,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white/90">Edit Zone</span>
              <button
                onClick={() => setEditing(null)}
                className="text-white/30 hover:text-white/70 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white mb-3 outline-none focus:border-accent/50"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await updateZone({ zoneId: editing._id, name: editName });
                  setEditing(null);
                }}
                className="flex-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent py-1.5 text-xs font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={async () => {
                  await deleteZone({ zoneId: editing._id });
                  setEditing(null);
                }}
                className="flex-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 py-1.5 text-xs font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
