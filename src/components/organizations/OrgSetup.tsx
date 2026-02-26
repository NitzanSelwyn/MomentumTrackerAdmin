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
    <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">
            Set Up Organization
          </h2>
        </div>
        {!inline && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <p className="mb-4 text-sm text-gray-400">
        Create an organization to group your workers. They can join using a QR
        code or join code.
      </p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Organization name"
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
        }}
      />

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      <div className="mt-4 flex justify-end gap-3">
        {!inline && (
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
      {card}
    </div>
  );
}
