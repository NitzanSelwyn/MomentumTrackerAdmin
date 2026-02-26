import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { X, Volume2, MessageSquare, Bell, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SendCommandProps {
  workerId: Id<"workers">;
  workerName: string;
  onClose: () => void;
}

type CommandType = "sound_alert" | "message" | "sound_and_message";
type SoundType = "alarm" | "notification" | "urgent";

export function SendCommand({
  workerId,
  workerName,
  onClose,
}: SendCommandProps) {
  const sendCommand = useMutation(api.commands.sendCommand);
  const [commandType, setCommandType] = useState<CommandType>("sound_and_message");
  const [soundType, setSoundType] = useState<SoundType>("notification");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await sendCommand({
        workerId,
        type: commandType,
        soundType,
        message: message.trim() || undefined,
      });
      toast.success(`Command sent to ${workerName}`);
      onClose();
    } catch (error) {
      toast.error("Failed to send command");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Send Command</h2>
            <p className="text-sm text-gray-400">To: {workerName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Command Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Command Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    value: "sound_alert",
                    label: "Sound",
                    icon: Volume2,
                  },
                  {
                    value: "message",
                    label: "Message",
                    icon: MessageSquare,
                  },
                  {
                    value: "sound_and_message",
                    label: "Both",
                    icon: Bell,
                  },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setCommandType(value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors ${
                    commandType === value
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Type */}
          {commandType !== "message" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Sound Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "notification", label: "Normal", color: "blue" },
                    { value: "alarm", label: "Alarm", color: "yellow" },
                    { value: "urgent", label: "Urgent", color: "red" },
                  ] as const
                ).map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setSoundType(value)}
                    className={`rounded-lg border p-2 text-xs transition-colors ${
                      soundType === value
                        ? `border-${color}-500 bg-${color}-500/10 text-${color}-400`
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          {commandType !== "sound_alert" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Urgent warning */}
          {soundType === "urgent" && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Urgent alerts play a loud continuous sound on the worker's device
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-800 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? "Sending..." : "Send Command"}
          </button>
        </div>
      </div>
    </div>
  );
}
