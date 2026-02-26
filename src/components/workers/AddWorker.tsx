import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { OrgQRCode } from "../organizations/OrgQRCode";

interface AddWorkerProps {
  onClose: () => void;
}

export function AddWorker({ onClose }: AddWorkerProps) {
  const createWorker = useMutation(api.workers.createWorker);
  const organization = useQuery(api.organizations.getMyOrganization);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"worker" | "admin">("worker");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await createWorker({
        name: name.trim(),
        email: email.trim(),
        role,
      });
      toast.success(`Worker "${name.trim()}" added`);
      onClose();
    } catch {
      toast.error("Failed to add worker");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade">
      <div className="animate-modal mx-4 w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-2 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <UserPlus className="h-4 w-4 text-accent" />
            </div>
            <h2 className="font-display text-lg font-bold text-white">Add Worker</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/50 font-body">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoFocus
              className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 font-body focus:border-accent/40 focus:outline-none input-glow transition-all duration-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/50 font-body">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 font-body focus:border-accent/40 focus:outline-none input-glow transition-all duration-200"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/50 font-body">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`rounded-lg border p-2.5 text-sm font-medium font-body transition-all duration-200 ${
                  role === "worker"
                    ? "border-accent/30 bg-accent/10 text-accent glow-accent-sm"
                    : "border-white/[0.08] text-white/40 hover:border-white/15 hover:text-white/60"
                }`}
              >
                Worker
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`rounded-lg border p-2.5 text-sm font-medium font-body transition-all duration-200 ${
                  role === "admin"
                    ? "border-accent/30 bg-accent/10 text-accent glow-accent-sm"
                    : "border-white/[0.08] text-white/40 hover:border-white/15 hover:text-white/60"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white/70 font-body transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !email.trim()}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface-0 hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 glow-accent-sm"
            >
              {saving ? "Adding..." : "Add Worker"}
            </button>
          </div>
        </form>

        {organization && (
          <div className="border-t border-white/[0.06] px-5 py-5">
            <p className="mb-4 text-center text-sm font-medium text-white/40 font-body">
              Or share the join code
            </p>
            <OrgQRCode
              organizationId={organization._id}
              joinCode={organization.joinCode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
