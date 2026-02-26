import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Send,
  Volume2,
  MessageSquare,
  Bell,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

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

interface CommandHistoryProps {
  commands: Command[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-amber-400" />;
    case "delivered":
      return <Send className="h-4 w-4 text-accent" />;
    case "acknowledged":
      return <CheckCircle2 className="h-4 w-4 text-neon" />;
    default:
      return null;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "delivered":
      return "Delivered";
    case "acknowledged":
      return "Acknowledged";
    default:
      return status;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "sound_alert":
      return <Volume2 className="h-4 w-4" />;
    case "message":
      return <MessageSquare className="h-4 w-4" />;
    case "sound_and_message":
      return <Bell className="h-4 w-4" />;
    default:
      return null;
  }
}

export function CommandHistory({ commands }: CommandHistoryProps) {
  if (commands.length === 0) {
    return (
      <p className="text-sm text-white/25 font-body">No commands sent to this worker</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {commands.map((cmd) => (
        <div
          key={cmd._id}
          className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5 transition-colors hover:bg-white/[0.03]"
        >
          <div className="mt-0.5 text-white/30">{getTypeIcon(cmd.type)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white capitalize font-body">
                {cmd.type.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-white/25 font-mono">
                ({cmd.soundType})
              </span>
            </div>

            {cmd.message && (
              <p className="mt-1 text-sm text-white/50 line-clamp-2 font-body">
                {cmd.message}
              </p>
            )}

            <div className="mt-2 flex items-center gap-3 text-xs text-white/25 font-body">
              <span>
                {formatDistanceToNow(new Date(cmd.createdAt), {
                  addSuffix: true,
                })}
              </span>
              <span className="text-white/10">&middot;</span>
              <span>by {cmd.fromAdminName}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {getStatusIcon(cmd.status)}
            <span
              className={`text-xs font-medium font-body ${
                cmd.status === "pending"
                  ? "text-amber-400"
                  : cmd.status === "delivered"
                    ? "text-accent"
                    : "text-neon"
              }`}
            >
              {getStatusLabel(cmd.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
