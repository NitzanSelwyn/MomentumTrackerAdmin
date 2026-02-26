import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Building2 } from "lucide-react";

interface OrgSetupProps {
  onClose: () => void;
  onCreated: () => void;
  inline?: boolean;
}

export function OrgSetup({ onClose, onCreated, inline }: OrgSetupProps) {
  const createOrganization = useMutation(api.organizations.createOrganization);
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsCreating(true);
    setError("");
    try {
      await createOrganization({ name: trimmed });
      onCreated();
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  };

  const card = (
    <div className="animate-modal w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-2 p-6 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <Building2 className="h-4.5 w-4.5 text-accent" />
          </div>
          <h2 className="font-display text-lg font-bold text-white">
            Set Up Organization
          </h2>
        </div>
        {!inline && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <p className="mb-5 text-sm text-white/40 font-body leading-relaxed">
        Create an organization to group your workers. They can join using a QR
        code or join code.
      </p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Organization name"
        className="w-full rounded-xl border border-white/[0.08] bg-surface-3 px-4 py-3 text-white placeholder-white/20 font-body focus:border-accent/40 focus:outline-none input-glow transition-all duration-200"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
        }}
      />

      {error && (
        <p className="mt-2.5 text-sm text-rose-400 font-body">{error}</p>
      )}

      <div className="mt-5 flex justify-end gap-3">
        {!inline && (
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white/70 font-body transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-surface-0 hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 glow-accent-sm"
        >
          {isCreating ? "Creating..." : "Create Organization"}
        </button>
      </div>
    </div>
  );

  if (inline) {
    return card;
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade">
      {card}
    </div>
  );
}
