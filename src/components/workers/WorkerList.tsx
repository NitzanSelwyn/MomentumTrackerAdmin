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
      <div className="border-b border-white/[0.04] p-3 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search workers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-surface-2 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/25 font-body focus:outline-none focus:border-accent/40 input-glow transition-all duration-200"
          />
        </div>

        <div className="flex items-center justify-between">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg border border-white/[0.06] bg-surface-2 px-2.5 py-1 text-xs text-white/50 font-body focus:outline-none focus:border-accent/40 transition-colors"
          >
            <option value="name">Sort: Name</option>
            <option value="lastSeen">Sort: Last Seen</option>
            <option value="battery">Sort: Battery</option>
          </select>

          <button
            onClick={onToggleOnDuty}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
              showOnlyOnDuty
                ? "bg-accent/15 text-accent border border-accent/20"
                : "border border-white/[0.06] bg-surface-2 text-white/40 hover:text-white/60"
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
          <div className="p-8 text-center">
            <p className="text-sm text-white/30 font-body">
              {search ? "No workers match your search" : "No workers found"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
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
      <div className="flex items-center justify-between border-t border-white/[0.04] px-3 py-2.5">
        <span className="text-xs text-white/30 font-body">
          {workers.length} worker{workers.length !== 1 ? "s" : ""} &middot;{" "}
          <span className="text-neon/70">
            {workers.filter((w) => w.isOnDuty).length} on duty
          </span>
        </span>
        <button
          onClick={onAddWorker}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-surface-0 hover:bg-accent/90 transition-all duration-200 glow-accent-sm"
        >
          <UserPlus className="h-3 w-3" />
          Add
        </button>
      </div>
    </div>
  );
}
