import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

interface WorkerDotProps {
  workerId: Id<"workers">;
  name: string;
  cx: number;
  cy: number;
  isSelected: boolean;
  isOnDuty: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  lastSeen?: number;
  hasValidPosition: boolean;
  onSelect: () => void;
  onSendCommand: () => void;
}

export function FloorPlanWorkerDot({
  name,
  cx,
  cy,
  isSelected,
  isOnDuty,
  batteryLevel,
  isCharging,
  lastSeen,
  hasValidPosition,
  onSelect,
  onSendCommand,
}: WorkerDotProps) {
  const [showPopup, setShowPopup] = useState(false);

  const r = isSelected ? 10 : 8;
  const color = !hasValidPosition
    ? "#888"
    : isOnDuty
      ? "#00d4ff"
      : "#ff6b35";

  const lastSeenText = lastSeen
    ? (() => {
        const diff = Date.now() - lastSeen;
        if (diff < 60000) return "just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return `${Math.floor(diff / 3600000)}h ago`;
      })()
    : "unknown";

  return (
    <g
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
        setShowPopup((v) => !v);
      }}
    >
      {/* Pulse ring for selected */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.4}
        />
      )}

      {/* Dot */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={1.5}
      />

      {/* "?" for no valid position */}
      {!hasValidPosition && (
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontSize={10}
          fill="white"
          fontWeight="bold"
          pointerEvents="none"
        >
          ?
        </text>
      )}

      {/* Name label */}
      <text
        x={cx}
        y={cy - r - 4}
        textAnchor="middle"
        fontSize={10}
        fill="white"
        stroke="rgba(0,0,0,0.6)"
        strokeWidth={3}
        paintOrder="stroke"
        pointerEvents="none"
      >
        {name}
      </text>

      {/* Popup */}
      {showPopup && (
        <foreignObject
          x={cx + 14}
          y={cy - 60}
          width={180}
          height={130}
          style={{ overflow: "visible" }}
        >
          <div
            className="glass-strong rounded-xl p-3 shadow-lg text-xs text-white/80 font-body"
            style={{ background: "rgba(15,20,30,0.92)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-white mb-1 truncate">{name}</p>
            <p className="text-white/50 mb-0.5">
              Status: <span className={isOnDuty ? "text-accent" : "text-orange-400"}>
                {isOnDuty ? "On Duty" : "Off Duty"}
              </span>
            </p>
            {batteryLevel !== undefined && (
              <p className="text-white/50 mb-0.5">
                Battery: <span className="text-white/80">{Math.round(batteryLevel * 100)}%{isCharging ? " ⚡" : ""}</span>
              </p>
            )}
            <p className="text-white/50 mb-2">
              Last seen: <span className="text-white/80">{lastSeenText}</span>
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPopup(false);
                onSendCommand();
              }}
              className="w-full rounded-lg bg-accent/20 hover:bg-accent/30 text-accent py-1 transition-colors text-xs font-medium"
            >
              Send Alert
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
