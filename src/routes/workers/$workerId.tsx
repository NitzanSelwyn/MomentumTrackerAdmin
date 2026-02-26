import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Header } from "../../components/layout/Header";
import { WorkerDetail } from "../../components/workers/WorkerDetail";
import { SendCommand } from "../../components/commands/SendCommand";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/workers/$workerId")({
  component: WorkerDetailPage,
});

function WorkerDetailPage() {
  const { workerId } = Route.useParams();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = useNavigate();
  const [showCommandPanel, setShowCommandPanel] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const worker = useQuery(
    api.workers.getWorker,
    isAuthenticated
      ? { workerId: workerId as Id<"workers"> }
      : "skip"
  );

  const commandHistory = useQuery(
    api.commands.getCommandHistory,
    isAuthenticated
      ? { workerId: workerId as Id<"workers"> }
      : "skip"
  );

  const locationHistory = useQuery(
    api.locations.getWorkerHistory,
    isAuthenticated
      ? { workerId: workerId as Id<"workers">, limit: 50 }
      : "skip"
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

  return (
    <div className="flex h-screen flex-col bg-surface-0 text-white">
      <Header sidebarOpen={false} onToggleSidebar={() => {}} onOpenOrgPanel={() => {}} onOpenOrgSetup={() => {}} />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-2 text-sm text-white/40 hover:text-accent font-body transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {worker ? (
            <WorkerDetail
              worker={worker}
              commandHistory={commandHistory ?? []}
              locationHistory={locationHistory ?? []}
              onSendCommand={() => setShowCommandPanel(true)}
            />
          ) : (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            </div>
          )}
        </div>
      </div>

      {showCommandPanel && worker && (
        <SendCommand
          workerId={worker._id}
          workerName={worker.name}
          onClose={() => setShowCommandPanel(false)}
        />
      )}
    </div>
  );
}
