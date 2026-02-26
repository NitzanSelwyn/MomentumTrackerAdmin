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
      <div className="flex items-center gap-2 text-gray-400">
        <Settings className="h-4 w-4" />
        <span className="text-sm font-medium">Tracking Intervals</span>
      </div>

      {/* Location Pull Interval */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-300">
            Location Pull Interval
          </label>
          <span className="text-sm font-mono font-medium text-white">
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
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>5s</span>
          <span>60s</span>
        </div>
      </div>

      {/* History Save Interval */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-300">
            History Save Interval
          </label>
          <span className="text-sm font-mono font-medium text-white">
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
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>5s</span>
          <span>60s</span>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Changes are saved automatically. Workers will pick up new intervals on
        their next shift start.
      </p>
    </div>
  );
}
