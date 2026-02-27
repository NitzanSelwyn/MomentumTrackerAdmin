import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { LiveMap } from "../components/map/LiveMap";
import { WorkerList } from "../components/workers/WorkerList";
import { SendCommand } from "../components/commands/SendCommand";
import { AddWorker } from "../components/workers/AddWorker";
import { OrgSetup } from "../components/organizations/OrgSetup";
import { OrgPanel } from "../components/organizations/OrgPanel";
import { FloorPlanViewer } from "../components/floorplan/FloorPlanViewer";
import { FloorPlanManager } from "../components/floorplan/FloorPlanManager";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = useNavigate();
  const ensureWorker = useMutation(api.workers.ensureWorker);
  const [selectedWorkerId, setSelectedWorkerId] =
    useState<Id<"workers"> | null>(null);
  const [showCommandPanel, setShowCommandPanel] = useState(false);
  const [commandTargetId, setCommandTargetId] =
    useState<Id<"workers"> | null>(null);
  const [showOnlyOnDuty, setShowOnlyOnDuty] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [showOrgPanel, setShowOrgPanel] = useState(false);
  const [showFloorPlanManager, setShowFloorPlanManager] = useState(false);
  const [forceStreetMap, setForceStreetMap] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      ensureWorker({ role: "admin" });
    }
  }, [isAuthenticated, ensureWorker]);

  const workers = useQuery(
    api.workers.listWorkers,
    isAuthenticated ? {} : "skip"
  );

  const organization = useQuery(
    api.organizations.getMyOrganization,
    isAuthenticated ? {} : "skip"
  );

  const activeFloorPlan = useQuery(
    api.floorPlans.getActiveFloorPlan,
    isAuthenticated ? {} : "skip"
  );

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

  const filteredWorkers = showOnlyOnDuty
    ? workers?.filter((w) => w.isOnDuty)
    : workers;

  const handleSendCommand = (workerId: Id<"workers">) => {
    setCommandTargetId(workerId);
    setShowCommandPanel(true);
  };

  const hasOrg = !!organization;
  const orgLoaded = organization !== undefined;

  return (
    <div className="flex h-screen flex-col bg-surface-0 text-white">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenOrgPanel={() => setShowOrgPanel(true)}
        onOpenOrgSetup={() => setShowOrgSetup(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {hasOrg && sidebarOpen && (
          <Sidebar>
            <WorkerList
              workers={filteredWorkers ?? []}
              selectedWorkerId={selectedWorkerId}
              onSelectWorker={setSelectedWorkerId}
              onSendCommand={handleSendCommand}
              onAddWorker={() => setShowAddWorker(true)}
              showOnlyOnDuty={showOnlyOnDuty}
              onToggleOnDuty={() => setShowOnlyOnDuty(!showOnlyOnDuty)}
            />
          </Sidebar>
        )}

        <main className="relative flex-1">
          {hasOrg ? (
            <>
              {activeFloorPlan && !forceStreetMap ? (
                <FloorPlanViewer
                  floorPlan={activeFloorPlan}
                  workers={filteredWorkers ?? []}
                  selectedWorkerId={selectedWorkerId}
                  onSelectWorker={setSelectedWorkerId}
                  onSendCommand={handleSendCommand}
                  onSwitchToMap={() => setForceStreetMap(true)}
                  onOpenManager={() => setShowFloorPlanManager(true)}
                />
              ) : (
                <LiveMap
                  workers={filteredWorkers ?? []}
                  selectedWorkerId={selectedWorkerId}
                  onSelectWorker={setSelectedWorkerId}
                  onSendCommand={handleSendCommand}
                  onOpenFloorPlanManager={() => setShowFloorPlanManager(true)}
                  onSwitchToFloorPlan={activeFloorPlan ? () => setForceStreetMap(false) : undefined}
                />
              )}

              {showOrgPanel && (
                <OrgPanel
                  organization={organization}
                  onClose={() => setShowOrgPanel(false)}
                />
              )}
            </>
          ) : orgLoaded ? (
            <div className="flex h-full items-center justify-center">
              <OrgSetup
                onClose={() => {}}
                onCreated={() => {}}
                inline
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                <span className="text-sm text-white/30 font-body">Loading</span>
              </div>
            </div>
          )}

          {hasOrg && showOrgSetup && (
            <OrgSetup
              onClose={() => setShowOrgSetup(false)}
              onCreated={() => setShowOrgSetup(false)}
            />
          )}
        </main>
      </div>

      {showAddWorker && (
        <AddWorker onClose={() => setShowAddWorker(false)} />
      )}

      {showFloorPlanManager && (
        <FloorPlanManager onClose={() => setShowFloorPlanManager(false)} />
      )}

      {showCommandPanel && commandTargetId && (
        <SendCommand
          workerId={commandTargetId}
          workerName={
            workers?.find((w) => w._id === commandTargetId)?.name ?? "Worker"
          }
          onClose={() => {
            setShowCommandPanel(false);
            setCommandTargetId(null);
          }}
        />
      )}
    </div>
  );
}
