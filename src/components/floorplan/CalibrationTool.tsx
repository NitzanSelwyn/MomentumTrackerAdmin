import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface CalibPoint { px: number; py: number; lat: number; lng: number }

interface CalibrationToolProps {
  floorPlanId: Id<"floorPlans">;
  existingPoints: CalibPoint[];
  displayW: number;
  displayH: number;
  imageWidth: number;
  imageHeight: number;
  onClose: () => void;
}

export function CalibrationTool({
  floorPlanId,
  existingPoints,
  displayW,
  displayH,
  imageWidth,
  imageHeight,
  onClose,
}: CalibrationToolProps) {
  const [draftPoints, setDraftPoints] = useState<CalibPoint[]>(existingPoints);
  const [pendingPixel, setPendingPixel] = useState<{ px: number; py: number } | null>(null);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [saving, setSaving] = useState(false);

  const updateCalibration = useMutation(api.floorPlans.updateFloorPlanCalibration);

  const handleSvgClick = (e: React.MouseEvent<SVGGElement>) => {
    if (pendingPixel) return; // already waiting for GPS input
    const svg = e.currentTarget.closest("svg")!;
    const rect = svg.getBoundingClientRect();
    // Convert display coords to natural image coords
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;
    const px = (displayX / displayW) * imageWidth;
    const py = (displayY / displayH) * imageHeight;
    setPendingPixel({ px, py });
    setLatInput("");
    setLngInput("");
  };

  const handleAddPoint = () => {
    if (!pendingPixel) return;
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) return;
    setDraftPoints((pts) => [...pts, { px: pendingPixel.px, py: pendingPixel.py, lat, lng }]);
    setPendingPixel(null);
  };

  const handleRemove = (i: number) => {
    setDraftPoints((pts) => pts.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCalibration({ floorPlanId, calibrationPoints: draftPoints });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <g onClick={handleSvgClick} style={{ cursor: pendingPixel ? "default" : "crosshair" }}>
      {/* Transparent click target */}
      <rect x={0} y={0} width={displayW} height={displayH} fill="transparent" />

      {/* Existing calibration points */}
      {draftPoints.map((p, i) => {
        const cx = (p.px / imageWidth) * displayW;
        const cy = (p.py / imageHeight) * displayH;
        return (
          <g key={i}>
            <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke="#f59e0b" strokeWidth={2} />
            <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} stroke="#f59e0b" strokeWidth={2} />
            <circle cx={cx} cy={cy} r={5} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            <text
              x={cx + 10}
              y={cy - 8}
              fontSize={10}
              fill="#f59e0b"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={3}
              paintOrder="stroke"
            >
              #{i + 1} {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
            </text>
          </g>
        );
      })}

      {/* Pending click marker */}
      {pendingPixel && (
        <>
          <line
            x1={(pendingPixel.px / imageWidth) * displayW - 8}
            y1={(pendingPixel.py / imageHeight) * displayH}
            x2={(pendingPixel.px / imageWidth) * displayW + 8}
            y2={(pendingPixel.py / imageHeight) * displayH}
            stroke="white"
            strokeWidth={2}
          />
          <line
            x1={(pendingPixel.px / imageWidth) * displayW}
            y1={(pendingPixel.py / imageHeight) * displayH - 8}
            x2={(pendingPixel.px / imageWidth) * displayW}
            y2={(pendingPixel.py / imageHeight) * displayH + 8}
            stroke="white"
            strokeWidth={2}
          />
        </>
      )}

      {/* Side panel */}
      <foreignObject
        x={displayW - 280}
        y={0}
        width={280}
        height={displayH}
        style={{ overflow: "visible" }}
      >
        <div
          className="h-full flex flex-col p-4 gap-3 font-body text-sm overflow-y-auto"
          style={{ background: "rgba(10,15,25,0.93)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white text-base">GPS Calibration</p>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 text-lg leading-none">×</button>
          </div>
          <p className="text-white/40 text-xs leading-relaxed">
            Click a recognizable point on the floor plan, then enter its real-world GPS coordinates.
            You need at least 2 points.
          </p>

          {/* GPS input for pending point */}
          {pendingPixel && (
            <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/70 font-medium text-xs mb-1">Enter GPS for selected point</p>
              <input
                autoFocus
                type="number"
                step="any"
                placeholder="Latitude (e.g. 32.0853)"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddPoint(); }}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude (e.g. 34.7818)"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddPoint(); }}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddPoint}
                  className="flex-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-1.5 text-xs font-medium transition-colors"
                >
                  Add Point
                </button>
                <button
                  onClick={() => setPendingPixel(null)}
                  className="flex-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 py-1.5 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing points list */}
          {draftPoints.length > 0 && (
            <div className="space-y-1">
              <p className="text-white/40 text-xs">Calibration points ({draftPoints.length})</p>
              {draftPoints.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-xs text-amber-400 font-mono">
                    #{i + 1} {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                  </span>
                  <button
                    onClick={() => handleRemove(i)}
                    className="text-white/30 hover:text-red-400 text-xs ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {draftPoints.length < 2 && !pendingPixel && (
            <p className="text-white/30 text-xs">
              Click on the floor plan image to place a calibration point.
            </p>
          )}

          <div className="mt-auto pt-2 flex gap-2">
            <button
              onClick={handleSave}
              disabled={draftPoints.length < 2 || saving}
              className="flex-1 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save Calibration"}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/5 hover:bg-white/10 text-white/40 px-3 py-2 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </foreignObject>

      {/* Banner */}
      {!pendingPixel && (
        <foreignObject x={10} y={10} width={displayW - 300} height={40} style={{ overflow: "visible" }}>
          <div
            className="rounded-lg px-4 py-2 text-xs text-center font-body"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "rgba(251,191,36,0.9)" }}
          >
            Calibration mode — click a known point on the floor plan
          </div>
        </foreignObject>
      )}
    </g>
  );
}
