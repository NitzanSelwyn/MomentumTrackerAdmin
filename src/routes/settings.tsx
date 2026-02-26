import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft } from "lucide-react";
import { OrgSettings } from "../components/organizations/OrgSettings";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = useNavigate();

  const organization = useQuery(
    api.organizations.getMyOrganization,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-lg text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900 px-4">
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-lg">
          {organization === undefined ? (
            <div className="text-center text-gray-400 py-12">Loading...</div>
          ) : organization === null ? (
            <div className="text-center text-gray-400 py-12">
              No organization found. Create or join one first.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-700 bg-gray-900 p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                {organization.name}
              </h2>
              <OrgSettings
                organizationId={organization._id}
                locationIntervalMs={organization.locationIntervalMs}
                historyIntervalMs={organization.historyIntervalMs}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
