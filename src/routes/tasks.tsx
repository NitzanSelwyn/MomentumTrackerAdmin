import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, LayoutList, Repeat } from "lucide-react";
import { WeekCalendar } from "../components/tasks/WeekCalendar";
import { TaskTemplateManager } from "../components/tasks/TaskTemplateManager";
import { RecurringRulesManager } from "../components/tasks/RecurringRulesManager";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
});

type Tab = "calendar" | "templates" | "recurring";

const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "templates", label: "Templates", icon: LayoutList },
  { id: "recurring", label: "Recurring Rules", icon: Repeat },
];

function TasksPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("calendar");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="h-8 w-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
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
        <CalendarDays className="h-4 w-4 text-accent" />
        <h1 className="font-display text-lg font-bold">Task Planner</h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] bg-surface-1/50 px-5 pt-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 ${
              tab === id
                ? "border-accent text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "calendar" && <WeekCalendar />}
        {tab === "templates" && <TaskTemplateManager />}
        {tab === "recurring" && <RecurringRulesManager />}
      </div>
    </div>
  );
}
