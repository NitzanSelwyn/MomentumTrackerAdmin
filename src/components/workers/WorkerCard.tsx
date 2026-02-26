import { formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";
import {
  Battery,
  BatteryCharging,
  BatteryLow,
  BatteryWarning,
  ExternalLink,
  MapPin,
  Send,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface WorkerWithLocation {
  _id: Id<"workers">;
  name: string;
  email: string;
  role: "worker" | "admin";
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

interface WorkerCardProps {
  worker: WorkerWithLocation;
  isSelected: boolean;
  onSelect: () => void;
  onSendCommand: () => void;
}

function BatteryIcon({
  level,
  isCharging,
}: {
  level?: number;
  isCharging?: boolean;
}) {
  if (isCharging)
    return <BatteryCharging className="h-4 w-4 text-green-400" />;
  if (level === undefined)
    return <Battery className="h-4 w-4 text-gray-500" />;
  if (level <= 20) return <BatteryLow className="h-4 w-4 text-red-400" />;
  if (level <= 50)
    return <BatteryWarning className="h-4 w-4 text-yellow-400" />;
  return <Battery className="h-4 w-4 text-green-400" />;
}

function getBatteryTextColor(level?: number): string {
  if (level === undefined) return "text-gray-500";
  if (level <= 20) return "text-red-400";
  if (level <= 50) return "text-yellow-400";
  return "text-green-400";
}

export function WorkerCard({
  worker,
  isSelected,
  onSelect,
  onSendCommand,
}: WorkerCardProps) {
  const batteryLevel = worker.currentLocation?.batteryLevel;
  const isCharging = worker.currentLocation?.isCharging;
  const hasLocation = !!worker.currentLocation;

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer px-3 py-3 transition-colors hover:bg-gray-800/50 ${
        isSelected ? "bg-gray-800 border-l-2 border-l-blue-500" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-1 min-w-0 items-start gap-2.5">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-700">
            {worker.avatarUrl ? (
              <img src={worker.avatarUrl} alt={worker.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-300">
                {worker.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-white">
              {worker.name}
            </h3>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                worker.isOnDuty
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {worker.isOnDuty ? "On Duty" : "Off"}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs">
            {/* Battery */}
            <div className="flex items-center gap-1">
              <BatteryIcon level={batteryLevel} isCharging={isCharging} />
              <span className={getBatteryTextColor(batteryLevel)}>
                {batteryLevel !== undefined
                  ? `${Math.round(batteryLevel)}%`
                  : "N/A"}
              </span>
            </div>

            {/* Location status */}
            <div className="flex items-center gap-1">
              <MapPin
                className={`h-3 w-3 ${hasLocation ? "text-blue-400" : "text-gray-600"}`}
              />
              <span className="text-gray-500">
                {worker.lastSeen
                  ? formatDistanceToNow(new Date(worker.lastSeen), {
                      addSuffix: true,
                    })
                  : "Never"}
              </span>
            </div>
          </div>
        </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/workers/$workerId"
            params={{ workerId: worker._id }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-700 hover:text-blue-400 transition-colors"
            title="View details"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendCommand();
            }}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-700 hover:text-blue-400 transition-colors"
            title="Send command"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
