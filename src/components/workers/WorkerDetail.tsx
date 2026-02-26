import { useState, useRef } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Battery,
  BatteryCharging,
  MapPin,
  Clock,
  Send,
  Pencil,
  Check,
  X,
  Upload,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CommandHistory } from "../commands/CommandHistory";

interface Worker {
  _id: Id<"workers">;
  name: string;
  email: string;
  role: "worker" | "admin";
  avatarUrl?: string;
  isOnDuty: boolean;
  lastSeen?: number;
  createdAt: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    batteryLevel?: number;
    isCharging?: boolean;
    timestamp: number;
  };
}

interface Command {
  _id: Id<"workerCommands">;
  type: "sound_alert" | "message" | "sound_and_message";
  message?: string;
  soundType: "alarm" | "notification" | "urgent";
  status: "pending" | "delivered" | "acknowledged";
  createdAt: number;
  deliveredAt?: number;
  acknowledgedAt?: number;
  fromAdminName: string;
}

interface LocationHistory {
  _id: Id<"historicalWorkerLocations">;
  latitude: number;
  longitude: number;
  batteryLevel?: number;
  timestamp: number;
}

interface WorkerDetailProps {
  worker: Worker;
  commandHistory: Command[];
  locationHistory: LocationHistory[];
  onSendCommand: () => void;
}

function getBatteryColor(level: number | undefined): string {
  if (level === undefined) return "text-white/30";
  if (level > 50) return "text-neon";
  if (level > 20) return "text-amber-400";
  return "text-rose-400";
}

export function WorkerDetail({
  worker,
  commandHistory,
  locationHistory,
  onSendCommand,
}: WorkerDetailProps) {
  const loc = worker.currentLocation;
  const updateName = useMutation(api.workers.updateWorkerName);
  const generateUploadUrl = useMutation(api.workers.generateUploadUrl);
  const updateAvatar = useMutation(api.workers.updateWorkerAvatar);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(worker.name);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== worker.name) {
      await updateName({ workerId: worker._id, name: trimmed });
    }
    setIsEditingName(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateAvatar({ workerId: worker._id, storageId });
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Worker Header */}
      <div className="animate-in rounded-2xl border border-white/[0.06] bg-surface-2 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div
              className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-full ring-2 ring-white/[0.08] hover:ring-accent/30 transition-all duration-300"
              onClick={() => fileInputRef.current?.click()}
            >
              {worker.avatarUrl ? (
                <img
                  src={worker.avatarUrl}
                  alt={worker.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center text-xl font-bold font-display ${worker.isOnDuty ? "bg-accent/15 text-accent" : "bg-surface-3 text-white/40"}`}>
                  {worker.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {isUploadingAvatar ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Upload className="h-5 w-5 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-1 font-display text-2xl font-bold text-white focus:border-accent/40 focus:outline-none input-glow"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setEditedName(worker.name);
                        setIsEditingName(false);
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="rounded-lg p-1.5 text-neon hover:bg-neon/10 transition-colors"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditedName(worker.name);
                      setIsEditingName(false);
                    }}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">{worker.name}</h1>
                  <button
                    onClick={() => {
                      setEditedName(worker.name);
                      setIsEditingName(true);
                    }}
                    className="rounded-lg p-1 text-white/20 hover:bg-white/5 hover:text-white/50 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="mt-1 text-sm text-white/40 font-body">{worker.email}</p>
              <div className="mt-3 flex items-center gap-2.5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium font-body ${
                    worker.isOnDuty
                      ? "bg-neon/15 text-neon"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {worker.isOnDuty ? "On Duty" : "Off Duty"}
                </span>
                <span className="rounded-full bg-surface-3 px-3 py-1 text-xs text-white/40 font-body">
                  {worker.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onSendCommand}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-surface-0 hover:bg-accent/90 transition-all duration-200 glow-accent-sm"
          >
            <Send className="h-4 w-4" />
            Send Alert
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Location */}
        <div className="animate-in stagger-1 rounded-2xl border border-white/[0.06] bg-surface-2 p-5">
          <div className="flex items-center gap-2 text-sm text-white/40 font-body">
            <MapPin className="h-4 w-4 text-accent/60" />
            Current Location
          </div>
          {loc ? (
            <div className="mt-3">
              <p className="text-sm font-mono text-white">
                {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
              </p>
              {loc.accuracy && (
                <p className="mt-1.5 text-xs text-white/25 font-mono">
                  ±{Math.round(loc.accuracy)}m accuracy
                </p>
              )}
              <p className="mt-1.5 text-xs text-white/25 font-body">
                Updated{" "}
                {formatDistanceToNow(new Date(loc.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/20 font-body">No location data</p>
          )}
        </div>

        {/* Battery */}
        <div className="animate-in stagger-2 rounded-2xl border border-white/[0.06] bg-surface-2 p-5">
          <div className="flex items-center gap-2 text-sm text-white/40 font-body">
            {loc?.isCharging ? (
              <BatteryCharging className="h-4 w-4 text-neon/60" />
            ) : (
              <Battery className="h-4 w-4 text-white/30" />
            )}
            Battery
          </div>
          {loc?.batteryLevel !== undefined ? (
            <div className="mt-3">
              <p
                className={`font-mono text-3xl font-bold ${getBatteryColor(loc.batteryLevel)}`}
              >
                {Math.round(loc.batteryLevel)}%
              </p>
              {loc.isCharging && (
                <p className="mt-1.5 text-xs text-neon font-body">Charging</p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/20 font-body">No battery data</p>
          )}
        </div>

        {/* Activity */}
        <div className="animate-in stagger-3 rounded-2xl border border-white/[0.06] bg-surface-2 p-5">
          <div className="flex items-center gap-2 text-sm text-white/40 font-body">
            <Clock className="h-4 w-4 text-white/30" />
            Activity
          </div>
          <div className="mt-3">
            <p className="text-sm text-white font-body">
              Last seen:{" "}
              <span className="text-white/70">
                {worker.lastSeen
                  ? formatDistanceToNow(new Date(worker.lastSeen), {
                      addSuffix: true,
                    })
                  : "Never"}
              </span>
            </p>
            <p className="mt-1.5 text-xs text-white/25 font-body">
              Joined {format(new Date(worker.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Location History */}
      {locationHistory.length > 0 && (
        <div className="animate-in rounded-2xl border border-white/[0.06] bg-surface-2 p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Location History</h2>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-white/30 font-body">
                <tr>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Battery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {locationHistory.map((loc) => (
                  <tr key={loc._id} className="text-white/60">
                    <td className="py-2.5 font-mono text-xs">
                      {format(new Date(loc.timestamp), "HH:mm:ss")}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-white/40">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </td>
                    <td className="py-2.5 font-mono text-xs">
                      {loc.batteryLevel !== undefined
                        ? `${Math.round(loc.batteryLevel)}%`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Command History */}
      <div className="animate-in rounded-2xl border border-white/[0.06] bg-surface-2 p-6">
        <h2 className="mb-4 font-display text-lg font-bold">Command History</h2>
        <CommandHistory commands={commandHistory} />
      </div>
    </div>
  );
}
