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
  if (level === undefined) return "#9ca3af";
  if (level > 50) return "#22c55e";
  if (level > 20) return "#eab308";
  return "#ef4444";
}

function createMarkerIcon(
  isOnDuty: boolean,
  isSelected: boolean,
  batteryLevel: number | undefined,
  isCharging: boolean | undefined,
  avatarUrl?: string
): L.DivIcon {
  const color = isOnDuty ? "#3b82f6" : "#6b7280";
  const borderColor = isSelected ? "#ffffff" : color;
  const size = isSelected ? 36 : 30;
  const batteryColor = isCharging ? "#22c55e" : getBatteryColor(batteryLevel);
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
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
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
          border: 2px solid #1f2937;
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
        <div className="min-w-[200px] p-1">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{worker.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                worker.isOnDuty
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {worker.isOnDuty ? "On Duty" : "Off Duty"}
            </span>
          </div>

          <div className="mb-2 space-y-1 text-sm text-gray-600">
            {batteryLevel !== undefined && (
              <div className="flex items-center gap-1">
                <span>Battery:</span>
                <span
                  style={{ color: getBatteryColor(batteryLevel) }}
                  className="font-medium"
                >
                  {Math.round(batteryLevel)}%
                </span>
                {isCharging && <span className="text-xs">⚡</span>}
              </div>
            )}
            <div>
              Updated:{" "}
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendCommand();
              }}
              className="rounded-md bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
            >
              Send Alert
            </button>
            <a
              href={`/workers/${worker._id}`}
              className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Details
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
