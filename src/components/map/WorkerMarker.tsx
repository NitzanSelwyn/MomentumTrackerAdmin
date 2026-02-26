import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { formatDistanceToNow } from "date-fns";
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

interface WorkerMarkerProps {
  worker: WorkerWithLocation;
  isSelected: boolean;
  onSelect: () => void;
  onSendCommand: () => void;
}

function getBatteryColor(level: number | undefined): string {
  if (level === undefined) return "#556677";
  if (level > 50) return "#10b981";
  if (level > 20) return "#f59e0b";
  return "#f43f5e";
}

function createMarkerIcon(
  isOnDuty: boolean,
  isSelected: boolean,
  batteryLevel: number | undefined,
  isCharging: boolean | undefined,
  avatarUrl?: string
): L.DivIcon {
  const color = isOnDuty ? "#00d4ff" : "#556677";
  const borderColor = isSelected ? "#ffffff" : color;
  const size = isSelected ? 38 : 32;
  const batteryColor = isCharging ? "#10b981" : getBatteryColor(batteryLevel);
  const imgSize = size - 6;

  const innerContent = avatarUrl
    ? `<img src="${avatarUrl}" style="
        width: ${imgSize}px;
        height: ${imgSize}px;
        border-radius: 50%;
        object-fit: cover;
      " onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
        display: none;
      "></div>`
    : `<div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
      "></div>`;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid ${borderColor};
        box-shadow: 0 2px 12px rgba(0,0,0,0.5)${isSelected ? `, 0 0 20px ${color}40` : ""};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.2s;
        overflow: hidden;
      ">
        ${innerContent}
        <div style="
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${batteryColor};
          border: 2px solid #0a1120;
          display: flex;
          align-items: center;
          justify-content: center;
        ">${isCharging ? '<span style="font-size:7px;line-height:1;margin-top:-1px;">⚡</span>' : ""}</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

export function WorkerMarker({
  worker,
  isSelected,
  onSelect,
  onSendCommand,
}: WorkerMarkerProps) {
  if (!worker.currentLocation) return null;

  const { latitude, longitude, batteryLevel, isCharging, timestamp } =
    worker.currentLocation;

  const icon = createMarkerIcon(worker.isOnDuty, isSelected, batteryLevel, isCharging, worker.avatarUrl);

  return (
    <Marker
      position={[latitude, longitude]}
      icon={icon}
      eventHandlers={{
        click: onSelect,
      }}
    >
      <Popup>
        <div className="min-w-[200px] p-1 font-body">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-sm">{worker.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                worker.isOnDuty
                  ? "bg-[#10b981]/20 text-[#10b981]"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {worker.isOnDuty ? "On Duty" : "Off Duty"}
            </span>
          </div>

          <div className="mb-3 space-y-1.5 text-xs text-white/60">
            {batteryLevel !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">Battery:</span>
                <span
                  style={{ color: getBatteryColor(batteryLevel) }}
                  className="font-mono font-medium"
                >
                  {Math.round(batteryLevel)}%
                </span>
                {isCharging && <span className="text-[10px]">⚡</span>}
              </div>
            )}
            <div className="text-white/40">
              Updated:{" "}
              <span className="text-white/60">
                {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendCommand();
              }}
              className="rounded-lg bg-[#00d4ff] px-3 py-1.5 text-[11px] font-semibold text-[#040812] hover:bg-[#00d4ff]/90 transition-colors"
            >
              Send Alert
            </button>
            <a
              href={`/workers/${worker._id}`}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/60 hover:bg-white/10 hover:text-white/80 transition-colors"
            >
              Details
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
