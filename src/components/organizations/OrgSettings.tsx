import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Settings } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface OrgSettingsProps {
  organizationId: Id<"organizations">;
  locationIntervalMs: number | undefined;
  historyIntervalMs: number | undefined;
}

const DEFAULT_INTERVAL = 10000;
const MIN_INTERVAL = 5000;
const MAX_INTERVAL = 60000;
const STEP = 5000;

export function OrgSettings({
  organizationId,
  locationIntervalMs,
  historyIntervalMs,
}: OrgSettingsProps) {
  const updateSettings = useMutation(api.organizations.updateOrgSettings);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [locationMs, setLocationMs] = useState(
    locationIntervalMs ?? DEFAULT_INTERVAL
  );
  const [historyMs, setHistoryMs] = useState(
    historyIntervalMs ?? DEFAULT_INTERVAL
  );

  // Sync from props when they change (e.g. on first load)
  useEffect(() => {
    setLocationMs(locationIntervalMs ?? DEFAULT_INTERVAL);
  }, [locationIntervalMs]);

  useEffect(() => {
    setHistoryMs(historyIntervalMs ?? DEFAULT_INTERVAL);
  }, [historyIntervalMs]);

  const save = (locMs: number, histMs: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSettings({
        organizationId,
        locationIntervalMs: locMs,
        historyIntervalMs: histMs,
      });
    }, 500);
  };

  const handleLocationChange = (value: number) => {
    setLocationMs(value);
    save(value, historyMs);
  };

  const handleHistoryChange = (value: number) => {
    setHistoryMs(value);
    save(locationMs, value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-white/40">
        <Settings className="h-4 w-4 text-accent/50" />
        <span className="text-sm font-medium font-display tracking-wide">Tracking Intervals</span>
      </div>

      {/* Location Pull Interval */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-white/50 font-body">
            Location Pull Interval
          </label>
          <span className="font-mono text-sm font-medium text-accent">
            {locationMs / 1000}s
          </span>
        </div>
        <input
          type="range"
          min={MIN_INTERVAL}
          max={MAX_INTERVAL}
          step={STEP}
          value={locationMs}
          onChange={(e) => handleLocationChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-white/20 mt-1.5 font-mono">
          <span>5s</span>
          <span>60s</span>
        </div>
      </div>

      {/* History Save Interval */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-white/50 font-body">
            History Save Interval
          </label>
          <span className="font-mono text-sm font-medium text-accent">
            {historyMs / 1000}s
          </span>
        </div>
        <input
          type="range"
          min={MIN_INTERVAL}
          max={MAX_INTERVAL}
          step={STEP}
          value={historyMs}
          onChange={(e) => handleHistoryChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-white/20 mt-1.5 font-mono">
          <span>5s</span>
          <span>60s</span>
        </div>
      </div>

      <p className="text-xs text-white/25 font-body leading-relaxed">
        Changes are saved automatically. Workers will pick up new intervals on
        their next shift start.
      </p>
    </div>
  );
}
