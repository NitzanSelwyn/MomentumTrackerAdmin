import { useState } from "react";
import { Search, Filter, UserPlus } from "lucide-react";
import { WorkerCard } from "./WorkerCard";
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

interface WorkerListProps {
  workers: WorkerWithLocation[];
  selectedWorkerId: Id<"workers"> | null;
  onSelectWorker: (id: Id<"workers">) => void;
  onSendCommand: (id: Id<"workers">) => void;
  onAddWorker: () => void;
  showOnlyOnDuty: boolean;
  onToggleOnDuty: () => void;
}

type SortBy = "name" | "lastSeen" | "battery";

export function WorkerList({
  workers,
  selectedWorkerId,
  onSelectWorker,
  onSendCommand,
  onAddWorker,
  showOnlyOnDuty,
  onToggleOnDuty,
}: WorkerListProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "lastSeen":
        return (b.lastSeen ?? 0) - (a.lastSeen ?? 0);
      case "battery":
        return (
          (b.currentLocation?.batteryLevel ?? -1) -
          (a.currentLocation?.batteryLevel ?? -1)
        );
    }
  });

  return (
    <div className="flex h-full flex-col">
      {/* Search and filters */}
      <div className="border-b border-gray-800 p-3">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search workers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-gray-800 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="name">Sort: Name</option>
              <option value="lastSeen">Sort: Last Seen</option>
              <option value="battery">Sort: Battery</option>
            </select>
          </div>

          <button
            onClick={onToggleOnDuty}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
              showOnlyOnDuty
                ? "bg-blue-500/20 text-blue-400"
                : "bg-gray-800 text-gray-400 hover:text-gray-300"
            }`}
          >
            <Filter className="h-3 w-3" />
            On Duty
          </button>
        </div>
      </div>

      {/* Worker list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            {search ? "No workers match your search" : "No workers found"}
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {sorted.map((worker) => (
              <WorkerCard
                key={worker._id}
                worker={worker}
                isSelected={worker._id === selectedWorkerId}
                onSelect={() => onSelectWorker(worker._id)}
                onSendCommand={() => onSendCommand(worker._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-gray-800 px-3 py-2">
        <span className="text-xs text-gray-500">
          {workers.length} worker{workers.length !== 1 ? "s" : ""} &middot;{" "}
          {workers.filter((w) => w.isOnDuty).length} on duty
        </span>
        <button
          onClick={onAddWorker}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-3 w-3" />
          Add
        </button>
      </div>
    </div>
  );
}
