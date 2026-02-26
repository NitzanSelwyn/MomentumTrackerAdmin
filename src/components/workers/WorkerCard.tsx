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
    return <BatteryCharging className="h-4 w-4 text-neon" />;
  if (level === undefined)
    return <Battery className="h-4 w-4 text-white/20" />;
  if (level <= 20) return <BatteryLow className="h-4 w-4 text-rose-400" />;
  if (level <= 50)
    return <BatteryWarning className="h-4 w-4 text-amber-400" />;
  return <Battery className="h-4 w-4 text-neon" />;
}

function getBatteryTextColor(level?: number): string {
  if (level === undefined) return "text-white/20";
  if (level <= 20) return "text-rose-400";
  if (level <= 50) return "text-amber-400";
  return "text-neon";
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
      className={`group cursor-pointer px-3 py-3 transition-all duration-200 ${
        isSelected
          ? "bg-accent/[0.06] border-l-2 border-l-accent"
          : "hover:bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-1 min-w-0 items-start gap-2.5">
          <div className={`h-8 w-8 shrink-0 overflow-hidden rounded-full ${isSelected ? "ring-2 ring-accent/30" : "ring-1 ring-white/[0.08]"} transition-all duration-200`}>
            {worker.avatarUrl ? (
              <img src={worker.avatarUrl} alt={worker.name} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-xs font-bold font-display ${worker.isOnDuty ? "bg-accent/15 text-accent" : "bg-surface-3 text-white/40"}`}>
                {worker.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium text-white font-body">
                {worker.name}
              </h3>
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium font-body ${
                  worker.isOnDuty
                    ? "bg-neon/15 text-neon"
                    : "bg-white/5 text-white/30"
                }`}
              >
                {worker.isOnDuty ? "On Duty" : "Off"}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs">
              {/* Battery */}
              <div className="flex items-center gap-1">
                <BatteryIcon level={batteryLevel} isCharging={isCharging} />
                <span className={`font-mono text-[11px] ${getBatteryTextColor(batteryLevel)}`}>
                  {batteryLevel !== undefined
                    ? `${Math.round(batteryLevel)}%`
                    : "N/A"}
                </span>
              </div>

              {/* Location status */}
              <div className="flex items-center gap-1">
                <MapPin
                  className={`h-3 w-3 ${hasLocation ? "text-accent/60" : "text-white/15"}`}
                />
                <span className="text-white/30 font-body">
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

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link
            to="/workers/$workerId"
            params={{ workerId: worker._id }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-accent transition-all duration-200"
            title="View details"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendCommand();
            }}
            className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-accent transition-all duration-200"
            title="Send command"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
