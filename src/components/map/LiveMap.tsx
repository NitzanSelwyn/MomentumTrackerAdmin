import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { WorkerMarker } from "./WorkerMarker";
import { MapZoneDrawer } from "./MapZoneDrawer";
import { MapZoneOverlay } from "./MapZoneOverlay";
import { Maximize2, LayoutDashboard, LayoutTemplate, PenLine, X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface WorkerWithLocation {
  _id: Id<"workers">;
  name: string;
  avatarUrl?: string;
  isOnDuty: boolean;
  lastSeen?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    batteryLevel?: number;
    isCharging?: boolean;
    timestamp: number;
  };
}

interface LiveMapProps {
  workers: WorkerWithLocation[];
  selectedWorkerId: Id<"workers"> | null;
  onSelectWorker: (id: Id<"workers">) => void;
  onSendCommand: (id: Id<"workers">) => void;
  onOpenFloorPlanManager?: () => void;
  onSwitchToFloorPlan?: () => void;
}

function FitBounds({ workers }: { workers: WorkerWithLocation[] }) {
  const map = useMap();
  useEffect(() => {
    const located = workers.filter((w) => w.currentLocation);
    if (!located.length) return;
    const bounds = located.map((w) => [
      w.currentLocation!.latitude,
      w.currentLocation!.longitude,
    ]) as [number, number][];
    if (bounds.length === 1) map.setView(bounds[0], 15);
    else map.fitBounds(bounds, { padding: [50, 50] });
  }, [workers.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function FlyToWorker({
  workers,
  selectedWorkerId,
}: {
  workers: WorkerWithLocation[];
  selectedWorkerId: Id<"workers"> | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedWorkerId) return;
    const worker = workers.find((w) => w._id === selectedWorkerId);
    if (!worker?.currentLocation) return;
    map.flyTo(
      [worker.currentLocation.latitude, worker.currentLocation.longitude],
      16,
      { duration: 0.5 }
    );
  }, [selectedWorkerId, workers, map]);
  return null;
}

export function LiveMap({
  workers,
  selectedWorkerId,
  onSelectWorker,
  onSendCommand,
  onOpenFloorPlanManager,
  onSwitchToFloorPlan,
}: LiveMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  // Zone drawing state
  const [drawingZone, setDrawingZone] = useState(false);
  const [pendingPoints, setPendingPoints] = useState<{ lat: number; lng: number }[] | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [zoneColor, setZoneColor] = useState("#00d4ff");

  const mapZones = useQuery(api.mapZones.getMapZones) ?? [];
  const createZone = useMutation(api.mapZones.createMapZone);

  const handleFitAll = () => {
    if (!mapRef.current) return;
    const located = workers.filter((w) => w.currentLocation);
    if (!located.length) return;
    const bounds = located.map((w) => [
      w.currentLocation!.latitude,
      w.currentLocation!.longitude,
    ]) as [number, number][];
    if (bounds.length === 1) mapRef.current.setView(bounds[0], 15);
    else mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  const handlePolygonComplete = (pts: { lat: number; lng: number }[]) => {
    setDrawingZone(false);
    setPendingPoints(pts);
  };

  const handleSaveZone = async () => {
    if (!pendingPoints || !zoneName.trim()) return;
    await createZone({ name: zoneName.trim(), color: zoneColor, points: pendingPoints });
    setPendingPoints(null);
    setZoneName("");
    setZoneColor("#00d4ff");
  };

  const handleCancelForm = () => {
    setPendingPoints(null);
    setZoneName("");
    setZoneColor("#00d4ff");
  };

  const workersOnMap = workers.filter((w) => w.currentLocation);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[32.08, 34.78]}
        zoom={12}
        className="h-full w-full"
        ref={mapRef}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds workers={workers} />
        <FlyToWorker workers={workers} selectedWorkerId={selectedWorkerId} />

        <MapZoneOverlay zones={mapZones} />

        <MapZoneDrawer
          active={drawingZone}
          color={zoneColor}
          onComplete={handlePolygonComplete}
        />

        {workers
          .filter((w) => w.currentLocation)
          .map((worker) => (
            <WorkerMarker
              key={worker._id}
              worker={worker}
              isSelected={worker._id === selectedWorkerId}
              onSelect={() => onSelectWorker(worker._id)}
              onSendCommand={() => onSendCommand(worker._id)}
            />
          ))}
      </MapContainer>

      {/* ── Toolbar ── */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleFitAll}
          className="glass-strong rounded-xl p-2.5 text-white/50 shadow-lg hover:bg-white/5 hover:text-accent transition-all duration-200"
          title="Fit all workers"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        {onSwitchToFloorPlan && (
          <button
            onClick={onSwitchToFloorPlan}
            className="glass-strong rounded-xl p-2.5 text-white/50 shadow-lg hover:bg-white/5 hover:text-accent transition-all duration-200"
            title="Switch to floor plan"
          >
            <LayoutTemplate className="h-4 w-4" />
          </button>
        )}
        {onOpenFloorPlanManager && (
          <button
            onClick={onOpenFloorPlanManager}
            className="glass-strong rounded-xl p-2.5 text-white/50 shadow-lg hover:bg-white/5 hover:text-accent transition-all duration-200"
            title="Floor plans"
          >
            <LayoutDashboard className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Draw zone button (bottom-right) ── */}
      <div className="absolute right-3 bottom-4 z-[1000]">
        <button
          onClick={() => {
            setPendingPoints(null);
            setDrawingZone((v) => !v);
          }}
          className={`glass-strong rounded-xl px-3.5 py-2 shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-body ${
            drawingZone
              ? "text-accent bg-accent/10"
              : "text-white/50 hover:bg-white/5 hover:text-accent"
          }`}
        >
          <PenLine className="h-4 w-4" />
          {drawingZone ? "Drawing…" : "Draw Zone"}
        </button>
      </div>

      {/* ── Drawing instructions banner ── */}
      {drawingZone && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div
            className="rounded-lg px-4 py-2 text-xs text-center font-body"
            style={{
              background: "rgba(0,212,255,0.12)",
              border: "1px solid rgba(0,212,255,0.3)",
              color: "rgba(0,212,255,0.9)",
            }}
          >
            Click to place points · Click the first point (white dot) to close · Esc to cancel
          </div>
        </div>
      )}

      {/* ── Zone name form (appears after polygon is closed) ── */}
      {pendingPoints && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center">
          <div
            className="rounded-2xl p-5 shadow-2xl w-80 font-body"
            style={{ background: "rgba(13,18,28,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-white">Name this zone</p>
              <button onClick={handleCancelForm} className="text-white/30 hover:text-white/70">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              autoFocus
              placeholder="e.g. Warehouse North"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveZone();
                if (e.key === "Escape") handleCancelForm();
              }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white mb-3 outline-none focus:border-accent/50 transition-colors"
            />
            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs text-white/40">Color</label>
              <input
                type="color"
                value={zoneColor}
                onChange={(e) => setZoneColor(e.target.value)}
                className="h-7 w-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-xs text-white/30 font-mono">{pendingPoints.length} points</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveZone}
                disabled={!zoneName.trim()}
                className="flex-1 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Zone
              </button>
              <button
                onClick={handleCancelForm}
                className="rounded-xl bg-white/5 hover:bg-white/10 text-white/40 px-4 py-2 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Worker count badge ── */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-strong rounded-xl px-3.5 py-2 shadow-lg">
        <span className="text-sm text-white/50 font-body">
          <span className="font-mono font-medium text-accent">{workersOnMap.length}</span>{" "}
          worker{workersOnMap.length !== 1 ? "s" : ""} on map
        </span>
      </div>
    </div>
  );
}
