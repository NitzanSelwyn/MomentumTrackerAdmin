import { useRef, useState, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Maximize2, Map, PenLine, Sliders, Settings, MapPin } from "lucide-react";
import { buildTransform } from "../../lib/geoTransform";
import { FloorPlanWorkerDot } from "./FloorPlanWorkerDot";
import { ZoneOverlay } from "./ZoneOverlay";
import { ZoneDrawer } from "./ZoneDrawer";
import { CalibrationTool } from "./CalibrationTool";
import { FloorPlanPicker } from "./FloorPlanPicker";
import { MarkerOverlay } from "./MarkerOverlay";
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

interface FloorPlan {
  _id: Id<"floorPlans">;
  name: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  calibrationPoints: { px: number; py: number; lat: number; lng: number }[];
  zones: { _id: Id<"floorZones">; name: string; color: string; points: { x: number; y: number }[] }[];
}

interface FloorPlanViewerProps {
  floorPlan: FloorPlan;
  workers: WorkerWithLocation[];
  selectedWorkerId: Id<"workers"> | null;
  onSelectWorker: (id: Id<"workers">) => void;
  onSendCommand: (id: Id<"workers">) => void;
  onSwitchToMap: () => void;
  onOpenManager: () => void;
}

const ICON_PRESETS = ["📍", "🚨", "⚡", "🚪", "📦", "🔧", "💻", "🏭", "⛽", "🅿️"];

export function FloorPlanViewer({
  floorPlan,
  workers,
  selectedWorkerId,
  onSelectWorker,
  onSendCommand,
  onSwitchToMap,
  onOpenManager,
}: FloorPlanViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Zoom/pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  // SVG overlay dimensions
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  // Active modes (mutually exclusive)
  const [mode, setMode] = useState<"none" | "zone" | "calibrate" | "marker">("none");

  // Pending new marker (placed, waiting for name/icon form)
  const [pendingMarker, setPendingMarker] = useState<{ x: number; y: number } | null>(null);
  const [markerName, setMarkerName] = useState("");
  const [markerIcon, setMarkerIcon] = useState("");
  const createMarker = useMutation(api.floorPlans.createFloorMarker);

  const transform = buildTransform(
    floorPlan.calibrationPoints,
    floorPlan.imageWidth,
    floorPlan.imageHeight
  );

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setDisplaySize({ w: img.clientWidth, h: img.clientHeight });
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const ro = new ResizeObserver(() => {
      setDisplaySize({ w: img.clientWidth, h: img.clientHeight });
    });
    ro.observe(img);
    return () => ro.disconnect();
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.min(8, Math.max(0.2, s * factor)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== "none") return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input, select, a, [role='button']")) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !panStart.current) return;
    setTranslate({
      x: panStart.current.tx + (e.clientX - panStart.current.x),
      y: panStart.current.ty + (e.clientY - panStart.current.y),
    });
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    panStart.current = null;
  };

  const handleFit = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // Handle click in marker-placing mode
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== "marker" || pendingMarker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / displaySize.w;
    const y = (e.clientY - rect.top) / displaySize.h;
    setPendingMarker({ x, y });
    setMode("none");
  };

  // Escape cancels any mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMode("none");
        setPendingMarker(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSaveMarker = async () => {
    if (!pendingMarker || !markerName.trim()) return;
    await createMarker({
      floorPlanId: floorPlan._id,
      name: markerName.trim(),
      icon: markerIcon.trim() || undefined,
      x: pendingMarker.x,
      y: pendingMarker.y,
    });
    setPendingMarker(null);
    setMarkerName("");
    setMarkerIcon("");
  };

  const setModeExclusive = (m: typeof mode) =>
    setMode((prev) => (prev === m ? "none" : m));

  const workersOnMap = workers.filter((w) => w.currentLocation);

  const cursor =
    mode === "zone" || mode === "calibrate" || mode === "marker"
      ? "crosshair"
      : isPanning
        ? "grabbing"
        : "grab";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-surface-0"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ cursor }}
    >
      {/* Zoomable/pannable layer */}
      <div
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
        }}
      >
        <img
          ref={imgRef}
          src={floorPlan.imageUrl}
          alt={floorPlan.name}
          onLoad={handleImageLoad}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "top left",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
          }}
          draggable={false}
        />

        {displaySize.w > 0 && (
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: displaySize.w,
              height: displaySize.h,
              overflow: "visible",
              cursor: mode === "marker" ? "crosshair" : "inherit",
            }}
            viewBox={`0 0 ${displaySize.w} ${displaySize.h}`}
            onClick={handleSvgClick}
          >
            {/* Transparent hit area for marker placement */}
            {mode === "marker" && (
              <rect x={0} y={0} width={displaySize.w} height={displaySize.h} fill="transparent" />
            )}

            <ZoneOverlay
              zones={floorPlan.zones}
              displayW={displaySize.w}
              displayH={displaySize.h}
            />

            <MarkerOverlay
              floorPlanId={floorPlan._id}
              displayW={displaySize.w}
              displayH={displaySize.h}
            />

            {/* Workers */}
            {workers.map((worker) => {
              const loc = worker.currentLocation;
              let pos: { x: number; y: number } | null = null;
              if (loc && transform) pos = transform(loc.latitude, loc.longitude);
              const hasValid =
                pos !== null && pos.x >= -0.1 && pos.x <= 1.1 && pos.y >= -0.1 && pos.y <= 1.1;
              const cx = hasValid && pos ? pos.x * displaySize.w : displaySize.w / 2;
              const cy = hasValid && pos ? pos.y * displaySize.h : displaySize.h / 2;
              return (
                <FloorPlanWorkerDot
                  key={worker._id}
                  workerId={worker._id}
                  name={worker.name}
                  cx={cx}
                  cy={cy}
                  isSelected={worker._id === selectedWorkerId}
                  isOnDuty={worker.isOnDuty}
                  batteryLevel={loc?.batteryLevel}
                  isCharging={loc?.isCharging}
                  lastSeen={worker.lastSeen}
                  hasValidPosition={hasValid}
                  onSelect={() => onSelectWorker(worker._id)}
                  onSendCommand={() => onSendCommand(worker._id)}
                />
              );
            })}

            {mode === "zone" && (
              <ZoneDrawer
                floorPlanId={floorPlan._id}
                displayW={displaySize.w}
                displayH={displaySize.h}
                onClose={() => setMode("none")}
              />
            )}

            {mode === "calibrate" && (
              <CalibrationTool
                floorPlanId={floorPlan._id}
                existingPoints={floorPlan.calibrationPoints}
                displayW={displaySize.w}
                displayH={displaySize.h}
                imageWidth={floorPlan.imageWidth}
                imageHeight={floorPlan.imageHeight}
                onClose={() => setMode("none")}
              />
            )}
          </svg>
        )}
      </div>

      {/* ── Toolbar overlays ── */}

      <div className="absolute left-3 top-3 z-[1000]">
        <FloorPlanPicker currentPlanId={floorPlan._id} currentPlanName={floorPlan.name} />
      </div>

      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleFit}
          title="Fit to screen"
          className="glass-strong rounded-xl p-2.5 text-white/50 shadow-lg hover:bg-white/5 hover:text-accent transition-all duration-200"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setModeExclusive("calibrate")}
          title="Calibrate GPS"
          className={`glass-strong rounded-xl p-2.5 shadow-lg transition-all duration-200 ${mode === "calibrate" ? "text-accent bg-accent/10" : "text-white/50 hover:bg-white/5 hover:text-accent"}`}
        >
          <Sliders className="h-4 w-4" />
        </button>
        <button
          onClick={onOpenManager}
          title="Manage floor plans"
          className="glass-strong rounded-xl p-2.5 text-white/50 shadow-lg hover:bg-white/5 hover:text-accent transition-all duration-200"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          onClick={onSwitchToMap}
          title="Switch to street map"
          className="glass-strong rounded-xl p-2.5 text-white/50 shadow-lg hover:bg-white/5 hover:text-accent transition-all duration-200"
        >
          <Map className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom-right: Draw zone + Add marker */}
      <div className="absolute right-3 bottom-4 z-[1000] flex flex-col items-end gap-2">
        <button
          onClick={() => setModeExclusive("marker")}
          className={`glass-strong rounded-xl px-3.5 py-2 shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-body ${
            mode === "marker" ? "text-amber-400 bg-amber-400/10" : "text-white/50 hover:bg-white/5 hover:text-amber-400"
          }`}
        >
          <MapPin className="h-4 w-4" />
          {mode === "marker" ? "Click to place…" : "Add Marker"}
        </button>
        <button
          onClick={() => setModeExclusive("zone")}
          className={`glass-strong rounded-xl px-3.5 py-2 shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-body ${
            mode === "zone" ? "text-accent bg-accent/10" : "text-white/50 hover:bg-white/5 hover:text-accent"
          }`}
        >
          <PenLine className="h-4 w-4" />
          {mode === "zone" ? "Drawing Zone" : "Draw Zone"}
        </button>
      </div>

      {/* Bottom-left: worker count */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-strong rounded-xl px-3.5 py-2 shadow-lg">
        <span className="text-sm text-white/50 font-body">
          <span className="font-mono font-medium text-accent">{workersOnMap.length}</span>{" "}
          worker{workersOnMap.length !== 1 ? "s" : ""} on map
        </span>
      </div>

      {/* ── New marker form ── */}
      {pendingMarker && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center">
          <div
            className="rounded-2xl p-5 shadow-2xl w-80 font-body"
            style={{ background: "rgba(13,18,28,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-white">New Marker</p>
              <button
                onClick={() => { setPendingMarker(null); setMarkerName(""); setMarkerIcon(""); }}
                className="text-white/30 hover:text-white/70 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <input
              autoFocus
              placeholder="Name (e.g. Emergency Exit)"
              value={markerName}
              onChange={(e) => setMarkerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveMarker(); if (e.key === "Escape") { setPendingMarker(null); setMarkerName(""); setMarkerIcon(""); } }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white mb-3 outline-none focus:border-amber-400/50 transition-colors"
            />

            <div className="flex items-center gap-2 mb-2">
              <input
                placeholder="Icon (emoji)"
                value={markerIcon}
                onChange={(e) => setMarkerIcon(e.target.value)}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>

            {/* Quick-pick icons */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {ICON_PRESETS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setMarkerIcon((prev) => (prev === ic ? "" : ic))}
                  className={`rounded-lg px-1.5 py-1 text-base transition-colors ${
                    markerIcon === ic ? "bg-amber-400/20 ring-1 ring-amber-400/40" : "hover:bg-white/10"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveMarker}
                disabled={!markerName.trim()}
                className="flex-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Place Marker
              </button>
              <button
                onClick={() => { setPendingMarker(null); setMarkerName(""); setMarkerIcon(""); }}
                className="rounded-xl bg-white/5 hover:bg-white/10 text-white/40 px-4 py-2 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
