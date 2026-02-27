import { useEffect, useRef, useState } from "react";
import { Polygon, Polyline, CircleMarker, useMapEvents } from "react-leaflet";

interface LatLng { lat: number; lng: number }

interface MapZoneDrawerProps {
  active: boolean;
  color: string;
  onComplete: (points: LatLng[]) => void;
}

const CLOSE_THRESHOLD_PX = 15;

export function MapZoneDrawer({ active, color, onComplete }: MapZoneDrawerProps) {
  const [draft, setDraft] = useState<LatLng[]>([]);
  const [mouse, setMouse] = useState<LatLng | null>(null);

  // Refs so event handlers always see current values (stale-closure safety)
  const activeRef = useRef(active);
  const draftRef = useRef(draft);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const map = useMapEvents({
    click(e) {
      if (!activeRef.current) return;
      const current = draftRef.current;
      const pt = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (current.length >= 3) {
        const p1 = map.latLngToContainerPoint([current[0].lat, current[0].lng]);
        const p2 = map.latLngToContainerPoint(e.latlng);
        if (Math.hypot(p1.x - p2.x, p1.y - p2.y) < CLOSE_THRESHOLD_PX) {
          onCompleteRef.current(current);
          setDraft([]);
          setMouse(null);
          return;
        }
      }
      setDraft((prev) => [...prev, pt]);
    },
    mousemove(e) {
      if (!activeRef.current) return;
      setMouse({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  // Disable map drag + set cursor while drawing
  useEffect(() => {
    const container = map.getContainer();
    if (active) {
      map.dragging.disable();
      container.style.cursor = "crosshair";
    } else {
      map.dragging.enable();
      container.style.cursor = "";
      setDraft([]);
      setMouse(null);
    }
    return () => {
      map.dragging.enable();
      container.style.cursor = "";
    };
  }, [active, map]);

  if (!active || draft.length === 0) return null;

  const positions = draft.map((p) => [p.lat, p.lng] as [number, number]);
  const mousePos = mouse ? ([mouse.lat, mouse.lng] as [number, number]) : null;

  return (
    <>
      {/* Filled draft polygon once 3+ points */}
      {draft.length >= 3 && (
        <Polygon
          positions={positions}
          pathOptions={{ color, fillOpacity: 0.15, dashArray: "6 4", weight: 2 }}
        />
      )}

      {/* Live line following the mouse */}
      {mousePos && (
        <Polyline
          positions={[...positions, mousePos]}
          pathOptions={{ color, dashArray: "5 4", opacity: 0.7, weight: 2 }}
        />
      )}

      {/* Vertex dots */}
      {draft.map((pt, i) => (
        <CircleMarker
          key={i}
          center={[pt.lat, pt.lng]}
          radius={i === 0 && draft.length >= 3 ? 8 : 5}
          pathOptions={{
            color: i === 0 ? "#ffffff" : color,
            fillColor: i === 0 ? "#ffffff" : color,
            fillOpacity: 1,
            weight: 2,
          }}
        />
      ))}
    </>
  );
}
