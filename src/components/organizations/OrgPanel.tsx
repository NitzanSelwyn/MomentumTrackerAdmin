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
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {organization.name}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-gray-800 p-1">
          <button
            onClick={() => setTab("qr")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "qr"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <QrCode className="h-4 w-4" />
            Join Code
          </button>
          <button
            onClick={() => setTab("members")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "members"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-white"
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
              <p className="text-center text-sm text-gray-500 py-4">
                Loading...
              </p>
            ) : members.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">
                No members yet
              </p>
            ) : (
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          member.isOnDuty
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {member.isOnDuty ? "On Duty" : "Off"}
                      </span>
                      {member.role !== "admin" && (
                        <button
                          onClick={() =>
                            handleRemove(member._id, member.name)
                          }
                          className="rounded-md p-1 text-gray-500 hover:bg-gray-700 hover:text-red-400"
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
