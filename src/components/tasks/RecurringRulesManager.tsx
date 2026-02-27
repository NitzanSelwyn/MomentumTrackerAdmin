import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Pencil, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { RecurringRuleModal } from "./RecurringRuleModal";

type Rule = NonNullable<ReturnType<typeof useQuery<typeof api.tasks.getRecurringRules>>>[number];

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Every day",
  weekdays: "Mon – Fri",
  weekly: "Weekly",
  custom: "Custom days",
};

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function recurrenceSummary(rule: Rule): string {
  let base = RECURRENCE_LABELS[rule.recurrenceType] ?? rule.recurrenceType;
  if (
    (rule.recurrenceType === "weekly" || rule.recurrenceType === "custom") &&
    rule.weekdays?.length
  ) {
    base = rule.weekdays.map((d) => DOW_LABELS[d]).join(", ");
  }
  return base;
}

export function RecurringRulesManager() {
  const rules = useQuery(api.tasks.getRecurringRules);
  const workers = useQuery(api.workers.listWorkers);
  const updateRule = useMutation(api.tasks.updateRecurringRule);
  const ensureRecurring = useMutation(api.tasks.ensureRecurringAssignments);

  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);

  const workerMap = new Map<string, string>();
  workers?.forEach((w) => workerMap.set(w._id, w.name));

  async function toggleActive(rule: Rule) {
    try {
      await updateRule({ ruleId: rule._id, isActive: !rule.isActive });
      toast.success(rule.isActive ? "Rule paused" : "Rule activated");
    } catch {
      toast.error("Failed to update rule");
    }
  }

  async function handleMaterializeNow() {
    const today = new Date();
    const dow = today.getUTCDay();
    const toMon = dow === 0 ? -6 : 1 - dow;
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() + toMon);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    try {
      const count = await ensureRecurring({ startDate: fmt(start), endDate: fmt(end) });
      toast.success(count > 0 ? `Created ${count} new assignment${count > 1 ? "s" : ""}` : "All assignments are up to date");
    } catch {
      toast.error("Failed to materialize assignments");
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-white">Recurring Rules</h2>
            <p className="text-sm text-white/40 font-body mt-0.5">
              Tasks that auto-generate on a schedule
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleMaterializeNow}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white/80 transition-all duration-200"
              title="Generate assignments for this week now"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync week
            </button>
            <button
              onClick={() => {
                setEditingRule(undefined);
                setShowModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-surface-0 hover:bg-accent/90 transition-all duration-200 glow-accent-sm"
            >
              <Plus className="h-4 w-4" />
              New Rule
            </button>
          </div>
        </div>

        {/* Rule list */}
        {rules === undefined ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-surface-2 p-12 text-center">
            <p className="text-white/30 font-body text-sm">
              No recurring rules yet. Create one to auto-assign tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule._id}
                className={`rounded-xl border bg-surface-2 p-4 transition-all duration-200 ${
                  rule.isActive
                    ? "border-white/[0.06] hover:border-white/[0.1]"
                    : "border-white/[0.03] opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-sm font-semibold text-white">
                        {rule.title}
                      </span>
                      <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                        {recurrenceSummary(rule)}
                      </span>
                      {!rule.isActive && (
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/30">
                          Paused
                        </span>
                      )}
                    </div>

                    {rule.description && (
                      <p className="mt-1 text-xs text-white/40 font-body line-clamp-1">
                        {rule.description}
                      </p>
                    )}

                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {rule.workerIds.map((wId) => (
                        <span
                          key={wId}
                          className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/50"
                        >
                          {workerMap.get(wId) ?? "Unknown"}
                        </span>
                      ))}
                    </div>

                    <div className="mt-1.5 text-[11px] text-white/30">
                      From {rule.startDate}
                      {rule.endDate ? ` → ${rule.endDate}` : " (no end)"}
                      {rule.estimatedMinutes != null && ` · ${rule.estimatedMinutes}m`}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(rule)}
                      className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
                      title={rule.isActive ? "Pause rule" : "Activate rule"}
                    >
                      {rule.isActive ? (
                        <ToggleRight className="h-4 w-4 text-accent" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setShowModal(true);
                      }}
                      className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
                      title="Edit rule"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <RecurringRuleModal
          rule={editingRule}
          onClose={() => setShowModal(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
