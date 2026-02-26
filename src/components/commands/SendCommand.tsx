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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade">
      <div className="animate-modal mx-4 w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-2 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Send Command</h2>
            <p className="text-sm text-white/40 font-body">
              To: <span className="text-accent/80">{workerName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Command Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/50 font-body">
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
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3.5 text-xs font-medium font-body transition-all duration-200 ${
                    commandType === value
                      ? "border-accent/30 bg-accent/10 text-accent glow-accent-sm"
                      : "border-white/[0.06] text-white/40 hover:border-white/10 hover:text-white/60"
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
              <label className="mb-2 block text-sm font-medium text-white/50 font-body">
                Sound Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "notification", label: "Normal" },
                    { value: "alarm", label: "Alarm" },
                    { value: "urgent", label: "Urgent" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSoundType(value)}
                    className={`rounded-xl border p-2.5 text-xs font-medium font-body transition-all duration-200 ${
                      soundType === value
                        ? value === "urgent"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                          : value === "alarm"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : "border-accent/30 bg-accent/10 text-accent"
                        : "border-white/[0.06] text-white/40 hover:border-white/10 hover:text-white/60"
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
              <label className="mb-2 block text-sm font-medium text-white/50 font-body">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full rounded-xl border border-white/[0.08] bg-surface-3 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 font-body focus:border-accent/40 focus:outline-none input-glow transition-all duration-200 resize-none"
              />
            </div>
          )}

          {/* Urgent warning */}
          {soundType === "urgent" && (
            <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15 p-3.5 text-xs text-rose-400 font-body">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Urgent alerts play a loud continuous sound on the worker's device
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white/70 font-body transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-surface-0 hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 glow-accent-sm"
          >
            {sending ? "Sending..." : "Send Command"}
          </button>
        </div>
      </div>
    </div>
  );
}
