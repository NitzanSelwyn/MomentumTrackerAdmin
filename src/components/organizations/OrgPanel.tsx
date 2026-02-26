import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, QrCode, Users, UserMinus } from "lucide-react";
import { OrgQRCode } from "./OrgQRCode";
import type { Doc } from "../../../convex/_generated/dataModel";

interface OrgPanelProps {
  organization: Doc<"organizations">;
  onClose: () => void;
}

export function OrgPanel({ organization, onClose }: OrgPanelProps) {
  const [tab, setTab] = useState<"qr" | "members">("qr");
  const members = useQuery(api.organizations.getOrganizationMembers, {
    organizationId: organization._id,
  });
  const removeWorker = useMutation(
    api.organizations.removeWorkerFromOrganization
  );

  const handleRemove = async (workerId: any, name: string) => {
    if (!confirm(`Remove ${name} from the organization?`)) return;
    await removeWorker({ workerId });
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade">
      <div className="animate-modal w-full max-w-lg rounded-2xl border border-white/[0.08] bg-surface-2 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-white">
            {organization.name}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl bg-surface-3 p-1">
          <button
            onClick={() => setTab("qr")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium font-body transition-all duration-200 ${
              tab === "qr"
                ? "bg-surface-4 text-white shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <QrCode className="h-4 w-4" />
            Join Code
          </button>
          <button
            onClick={() => setTab("members")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium font-body transition-all duration-200 ${
              tab === "members"
                ? "bg-surface-4 text-white shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <Users className="h-4 w-4" />
            Members{members ? ` (${members.length})` : ""}
          </button>
        </div>

        {/* Content */}
        {tab === "qr" && (
          <OrgQRCode
            organizationId={organization._id}
            joinCode={organization.joinCode}
          />
        )}

        {tab === "members" && (
          <div className="max-h-80 overflow-y-auto">
            {!members ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-center text-sm text-white/25 py-8 font-body">
                No members yet
              </p>
            ) : (
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 ring-1 ring-white/[0.06]">
                        <span className="text-xs font-bold font-display text-white/50">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white font-body">
                          {member.name}
                        </p>
                        <p className="text-xs text-white/30 font-body">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium font-body ${
                          member.isOnDuty
                            ? "bg-neon/15 text-neon"
                            : "bg-white/5 text-white/30"
                        }`}
                      >
                        {member.isOnDuty ? "On Duty" : "Off"}
                      </span>
                      {member.role !== "admin" && (
                        <button
                          onClick={() =>
                            handleRemove(member._id, member.name)
                          }
                          className="rounded-lg p-1.5 text-white/20 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200"
                          title="Remove from organization"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
