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
  if (level === undefined) return "text-gray-500";
  if (level > 50) return "text-green-400";
  if (level > 20) return "text-yellow-400";
  return "text-red-400";
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
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-full bg-gray-700"
              onClick={() => fileInputRef.current?.click()}
            >
              {worker.avatarUrl ? (
                <img
                  src={worker.avatarUrl}
                  alt={worker.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-300">
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
                  className="rounded-md border border-gray-600 bg-gray-800 px-3 py-1 text-2xl font-bold text-white focus:border-blue-500 focus:outline-none"
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
                  className="rounded-md p-1.5 text-green-400 hover:bg-gray-800"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setEditedName(worker.name);
                    setIsEditingName(false);
                  }}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{worker.name}</h1>
                <button
                  onClick={() => {
                    setEditedName(worker.name);
                    setIsEditingName(true);
                  }}
                  className="rounded-md p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="mt-1 text-sm text-gray-400">{worker.email}</p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  worker.isOnDuty
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {worker.isOnDuty ? "On Duty" : "Off Duty"}
              </span>
              <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                {worker.role}
              </span>
            </div>
          </div>
          </div>

          <button
            onClick={onSendCommand}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Send className="h-4 w-4" />
            Send Alert
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Location */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="h-4 w-4" />
            Current Location
          </div>
          {loc ? (
            <div className="mt-2">
              <p className="text-sm font-mono text-white">
                {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
              </p>
              {loc.accuracy && (
                <p className="mt-1 text-xs text-gray-500">
                  ±{Math.round(loc.accuracy)}m accuracy
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Updated{" "}
                {formatDistanceToNow(new Date(loc.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-600">No location data</p>
          )}
        </div>

        {/* Battery */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {loc?.isCharging ? (
              <BatteryCharging className="h-4 w-4" />
            ) : (
              <Battery className="h-4 w-4" />
            )}
            Battery
          </div>
          {loc?.batteryLevel !== undefined ? (
            <div className="mt-2">
              <p
                className={`text-2xl font-bold ${getBatteryColor(loc.batteryLevel)}`}
              >
                {Math.round(loc.batteryLevel)}%
              </p>
              {loc.isCharging && (
                <p className="mt-1 text-xs text-green-400">Charging</p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-600">No battery data</p>
          )}
        </div>

        {/* Activity */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            Activity
          </div>
          <div className="mt-2">
            <p className="text-sm text-white">
              Last seen:{" "}
              {worker.lastSeen
                ? formatDistanceToNow(new Date(worker.lastSeen), {
                    addSuffix: true,
                  })
                : "Never"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Joined {format(new Date(worker.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Location History */}
      {locationHistory.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold">Location History</h2>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Battery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {locationHistory.map((loc) => (
                  <tr key={loc._id} className="text-gray-300">
                    <td className="py-2">
                      {format(new Date(loc.timestamp), "HH:mm:ss")}
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </td>
                    <td className="py-2">
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
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-lg font-semibold">Command History</h2>
        <CommandHistory commands={commandHistory} />
      </div>
    </div>
  );
}
