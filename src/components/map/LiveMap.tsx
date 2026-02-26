import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { WorkerMarker } from "./WorkerMarker";
import { Maximize2 } from "lucide-react";
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

interface LiveMapProps {
  workers: WorkerWithLocation[];
  selectedWorkerId: Id<"workers"> | null;
  onSelectWorker: (id: Id<"workers">) => void;
  onSendCommand: (id: Id<"workers">) => void;
}

function FitBounds({ workers }: { workers: WorkerWithLocation[] }) {
  const map = useMap();

  useEffect(() => {
    const locatedWorkers = workers.filter((w) => w.currentLocation);
    if (locatedWorkers.length === 0) return;

    const bounds = locatedWorkers.map((w) => [
      w.currentLocation!.latitude,
      w.currentLocation!.longitude,
    ]) as [number, number][];

    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [workers.length]); // Only re-fit when worker count changes

  return null;
}

function FlyToWorker({
  workers,
  selectedWorkerId,
}: {
  workers: WorkerWithLocation[];
  selectedWorkerId: Id<"workers"> | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedWorkerId) return;
    const worker = workers.find((w) => w._id === selectedWorkerId);
    if (!worker?.currentLocation) return;

    map.flyTo(
      [worker.currentLocation.latitude, worker.currentLocation.longitude],
      16,
      { duration: 0.5 }
    );
  }, [selectedWorkerId, workers, map]);

  return null;
}

export function LiveMap({
  workers,
  selectedWorkerId,
  onSelectWorker,
  onSendCommand,
}: LiveMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  const handleFitAll = () => {
    if (!mapRef.current) return;
    const locatedWorkers = workers.filter((w) => w.currentLocation);
    if (locatedWorkers.length === 0) return;

    const bounds = locatedWorkers.map((w) => [
      w.currentLocation!.latitude,
      w.currentLocation!.longitude,
    ]) as [number, number][];

    if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 15);
    } else {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[32.08, 34.78]} // Default: Tel Aviv
        zoom={12}
        className="h-full w-full"
        ref={mapRef}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds workers={workers} />
        <FlyToWorker workers={workers} selectedWorkerId={selectedWorkerId} />

        {workers
          .filter((w) => w.currentLocation)
          .map((worker) => (
            <WorkerMarker
              key={worker._id}
              worker={worker}
              isSelected={worker._id === selectedWorkerId}
              onSelect={() => onSelectWorker(worker._id)}
              onSendCommand={() => onSendCommand(worker._id)}
            />
          ))}
      </MapContainer>

      {/* Map controls overlay */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleFitAll}
          className="glass-strong rounded-xl p-2.5 text-white/50 shadow-lg hover:bg-white/5 hover:text-accent transition-all duration-200"
          title="Fit all workers"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Worker count badge */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-strong rounded-xl px-3.5 py-2 shadow-lg">
        <span className="text-sm text-white/50 font-body">
          <span className="font-mono font-medium text-accent">
            {workers.filter((w) => w.currentLocation).length}
          </span>{" "}
          worker{workers.filter((w) => w.currentLocation).length !== 1 ? "s" : ""} on map
        </span>
      </div>
    </div>
  );
}
