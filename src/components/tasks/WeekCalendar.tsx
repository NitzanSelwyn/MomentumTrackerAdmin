import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AssignTaskModal } from "./AssignTaskModal";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const dow = d.getUTCDay();
  const toMon = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + toMon);
  return d;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDayLabel(dateStr: string): { short: string; date: string } {
  const d = new Date(dateStr + "T00:00:00Z");
  return {
    short: DAY_LABELS[d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1],
    date: `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`,
  };
}

// ─── Status chip ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-white/[0.06] text-white/60 border-white/[0.06]",
  in_progress: "bg-accent/15 text-accent border-accent/20",
  completed: "bg-green-500/15 text-green-400 border-green-500/20",
  skipped: "bg-white/[0.03] text-white/25 border-white/[0.04] line-through",
};

type Assignment = NonNullable<
  ReturnType<typeof useQuery<typeof api.tasks.getTasksForDateRange>>
>[number];

// ─── Component ────────────────────────────────────────────────────────────────

export function WeekCalendar() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [modal, setModal] = useState<
    | { mode: "create"; date: string; workerId: Id<"workers"> }
    | { mode: "edit"; assignment: Assignment }
    | null
  >(null);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    return formatDate(d);
  });

  const workers = useQuery(api.workers.listWorkers);
  const assignments = useQuery(
    api.tasks.getTasksForDateRange,
    { startDate: days[0], endDate: days[6] }
  );
  const ensureRecurring = useMutation(api.tasks.ensureRecurringAssignments);

  // Materialize recurring tasks whenever the week changes
  useEffect(() => {
    ensureRecurring({ startDate: days[0], endDate: days[6] }).catch(() => {});
  }, [days[0]]);

  const today = formatDate(new Date());

  // Build lookup: workerId → dateStr → Assignment[]
  const assignmentMap = new Map<string, Map<string, Assignment[]>>();
  if (assignments) {
    for (const a of assignments) {
      if (!assignmentMap.has(a.workerId)) {
        assignmentMap.set(a.workerId, new Map());
      }
      const byDate = assignmentMap.get(a.workerId)!;
      if (!byDate.has(a.assignedDate)) byDate.set(a.assignedDate, []);
      byDate.get(a.assignedDate)!.push(a);
    }
  }

  // Week header label
  const weekLabel = () => {
    const start = new Date(days[0] + "T00:00:00Z");
    const end = new Date(days[6] + "T00:00:00Z");
    const startStr = `${MONTH_NAMES[start.getUTCMonth()]} ${start.getUTCDate()}`;
    const endStr = `${MONTH_NAMES[end.getUTCMonth()]} ${end.getUTCDate()}, ${end.getUTCFullYear()}`;
    return `${startStr} – ${endStr}`;
  };

  const orgWorkers = workers?.filter((w) => w.organizationId) ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Week navigation */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <button
          onClick={() => {
            const prev = new Date(weekStart);
            prev.setUTCDate(prev.getUTCDate() - 7);
            setWeekStart(prev);
          }}
          className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white/80 transition-all duration-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-display text-sm font-semibold text-white/80">
          {weekLabel()}
        </span>
        <button
          onClick={() => {
            const next = new Date(weekStart);
            next.setUTCDate(next.getUTCDate() + 7);
            setWeekStart(next);
          }}
          className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white/80 transition-all duration-200"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 700 }}>
          {/* Day header row */}
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface-0 w-32 min-w-32 border-b border-r border-white/[0.06] px-3 py-2.5 text-left">
                <span className="text-xs font-medium text-white/30">Worker</span>
              </th>
              {days.map((d) => {
                const { short, date } = formatDayLabel(d);
                const isToday = d === today;
                return (
                  <th
                    key={d}
                    className={`border-b border-r border-white/[0.06] px-2 py-2.5 text-center ${
                      isToday ? "bg-accent/5" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
                        {short}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          isToday ? "text-accent" : "text-white/70"
                        }`}
                      >
                        {date}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Worker rows */}
          <tbody>
            {orgWorkers.length === 0 && !workers ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-white/30 text-sm font-body">
                  Loading...
                </td>
              </tr>
            ) : orgWorkers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-white/30 text-sm font-body">
                  No workers in your organization yet.
                </td>
              </tr>
            ) : (
              orgWorkers.map((worker) => (
                <tr key={worker._id} className="group/row hover:bg-white/[0.01]">
                  {/* Worker name */}
                  <td className="sticky left-0 z-10 bg-surface-0 border-b border-r border-white/[0.06] px-3 py-2 group-hover/row:bg-surface-1/50">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 flex-shrink-0 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-bold text-accent">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-white/70 truncate max-w-[88px]">
                        {worker.name}
                      </span>
                    </div>
                  </td>

                  {/* Day cells */}
                  {days.map((d) => {
                    const isToday = d === today;
                    const cellAssignments =
                      assignmentMap.get(worker._id)?.get(d) ?? [];

                    return (
                      <td
                        key={d}
                        className={`border-b border-r border-white/[0.06] px-1.5 py-1.5 align-top ${
                          isToday ? "bg-accent/[0.03]" : ""
                        }`}
                        style={{ minWidth: 110 }}
                      >
                        <div className="space-y-1">
                          {cellAssignments.map((a) => (
                            <button
                              key={a._id}
                              onClick={() => setModal({ mode: "edit", assignment: a })}
                              className={`w-full rounded-md border px-2 py-1 text-left text-[11px] font-medium leading-tight transition-all duration-150 hover:brightness-110 ${STATUS_STYLES[a.status]}`}
                              title={a.title}
                            >
                              <div className="truncate">{a.title}</div>
                              {a.estimatedMinutes != null && (
                                <div className="mt-0.5 opacity-60 text-[10px]">
                                  {a.estimatedMinutes}m
                                </div>
                              )}
                            </button>
                          ))}

                          {/* Add button */}
                          <button
                            onClick={() =>
                              setModal({
                                mode: "create",
                                date: d,
                                workerId: worker._id,
                              })
                            }
                            className="w-full rounded-md border border-dashed border-white/[0.08] px-2 py-1 text-center text-white/20 hover:border-white/20 hover:text-white/40 transition-all duration-150"
                          >
                            <Plus className="h-3 w-3 mx-auto" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <AssignTaskModal
          mode={modal.mode}
          prefilledDate={modal.mode === "create" ? modal.date : undefined}
          prefilledWorkerId={modal.mode === "create" ? modal.workerId : undefined}
          assignment={modal.mode === "edit" ? modal.assignment : undefined}
          onClose={() => setModal(null)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
