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
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
          <span className="text-sm text-white/30 font-body">Loading</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen flex-col bg-surface-0 text-white">
      {/* Header */}
      <header className="gradient-border-b relative flex h-14 shrink-0 items-center gap-3 bg-surface-1/90 backdrop-blur-xl px-5">
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white/80 transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-bold">Settings</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-lg animate-in">
          {organization === undefined ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            </div>
          ) : organization === null ? (
            <div className="text-center text-white/30 py-16 font-body">
              No organization found. Create or join one first.
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-surface-2 p-6">
              <h2 className="font-display text-base font-bold text-white mb-5">
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
