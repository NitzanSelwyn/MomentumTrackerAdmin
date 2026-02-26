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
      return <Clock className="h-4 w-4 text-yellow-400" />;
    case "delivered":
      return <Send className="h-4 w-4 text-blue-400" />;
    case "acknowledged":
      return <CheckCircle2 className="h-4 w-4 text-green-400" />;
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
      <p className="text-sm text-gray-500">No commands sent to this worker</p>
    );
  }

  return (
    <div className="space-y-3">
      {commands.map((cmd) => (
        <div
          key={cmd._id}
          className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-800/30 p-3"
        >
          <div className="mt-0.5 text-gray-400">{getTypeIcon(cmd.type)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white capitalize">
                {cmd.type.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-gray-500">
                ({cmd.soundType})
              </span>
            </div>

            {cmd.message && (
              <p className="mt-1 text-sm text-gray-300 line-clamp-2">
                {cmd.message}
              </p>
            )}

            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span>
                {formatDistanceToNow(new Date(cmd.createdAt), {
                  addSuffix: true,
                })}
              </span>
              <span>&middot;</span>
              <span>by {cmd.fromAdminName}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {getStatusIcon(cmd.status)}
            <span
              className={`text-xs font-medium ${
                cmd.status === "pending"
                  ? "text-yellow-400"
                  : cmd.status === "delivered"
                    ? "text-blue-400"
                    : "text-green-400"
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
