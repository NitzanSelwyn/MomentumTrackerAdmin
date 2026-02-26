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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Add Worker</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoFocus
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`rounded-lg border p-2.5 text-sm transition-colors ${
                  role === "worker"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                Worker
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`rounded-lg border p-2.5 text-sm transition-colors ${
                  role === "admin"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
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
              className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !email.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Adding..." : "Add Worker"}
            </button>
          </div>
        </form>

        {organization && (
          <div className="border-t border-gray-800 px-5 py-4">
            <p className="mb-3 text-center text-sm font-medium text-gray-300">
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
