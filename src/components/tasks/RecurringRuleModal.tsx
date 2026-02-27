import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { X, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type RecurrenceType = "daily" | "weekdays" | "weekly" | "custom";

type Rule = {
  _id: Id<"recurringTaskRules">;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  taskTemplateId?: Id<"taskTemplates">;
  workerIds: Id<"workers">[];
  recurrenceType: RecurrenceType;
  weekdays?: number[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
};

interface Props {
  rule?: Rule;
  onClose: () => void;
  onSaved: () => void;
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function RecurringRuleModal({ rule, onClose, onSaved }: Props) {
  const workers = useQuery(api.workers.listWorkers);
  const templates = useQuery(api.tasks.getTaskTemplates);
  const createRule = useMutation(api.tasks.createRecurringRule);
  const updateRule = useMutation(api.tasks.updateRecurringRule);
  const deleteRule = useMutation(api.tasks.deleteRecurringRule);
  const ensureRecurring = useMutation(api.tasks.ensureRecurringAssignments);

  // Helper: current week bounds for materialization
  function currentWeekBounds() {
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
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"taskTemplates"> | "">(
    rule?.taskTemplateId ?? ""
  );
  const [title, setTitle] = useState(rule?.title ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    rule?.estimatedMinutes != null ? String(rule.estimatedMinutes) : ""
  );
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Id<"workers">[]>(
    rule?.workerIds ?? []
  );
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    rule?.recurrenceType ?? "weekdays"
  );
  const [weekdays, setWeekdays] = useState<number[]>(rule?.weekdays ?? []);
  const [startDate, setStartDate] = useState(rule?.startDate ?? "");
  const [endDate, setEndDate] = useState(rule?.endDate ?? "");
  const [saving, setSaving] = useState(false);

  // When template is selected, pre-fill fields
  useEffect(() => {
    if (!selectedTemplateId || !templates) return;
    const t = templates.find((t) => t._id === selectedTemplateId);
    if (t) {
      setTitle(t.title);
      setDescription(t.description ?? "");
      setEstimatedMinutes(t.estimatedMinutes != null ? String(t.estimatedMinutes) : "");
    }
  }, [selectedTemplateId, templates]);

  function toggleWorker(id: Id<"workers">) {
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  }

  function toggleWeekday(dow: number) {
    if (recurrenceType === "weekly") {
      setWeekdays([dow]);
    } else {
      setWeekdays((prev) =>
        prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
      );
    }
  }

  async function handleSave() {
    if (!title.trim() || !startDate || selectedWorkerIds.length === 0) return;
    if ((recurrenceType === "weekly" || recurrenceType === "custom") && weekdays.length === 0) {
      toast.error("Select at least one day of the week");
      return;
    }
    setSaving(true);
    try {
      const mins = estimatedMinutes ? parseInt(estimatedMinutes) : undefined;
      const payload = {
        workerIds: selectedWorkerIds,
        title: title.trim(),
        description: description.trim() || undefined,
        estimatedMinutes: mins,
        taskTemplateId: selectedTemplateId || undefined,
        recurrenceType,
        weekdays: recurrenceType === "daily" || recurrenceType === "weekdays" ? undefined : weekdays,
        startDate,
        endDate: endDate || undefined,
      };

      if (rule) {
        await updateRule({ ruleId: rule._id, ...payload });
      } else {
        await createRule(payload);
      }

      // Materialize for current week
      const bounds = currentWeekBounds();
      await ensureRecurring(bounds).catch(() => {});

      toast.success(rule ? "Rule updated" : "Recurring rule created");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save rule");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!rule) return;
    if (!confirm(`Delete recurring rule "${rule.title}"? Existing assignments won't be affected.`)) return;
    try {
      await deleteRule({ ruleId: rule._id });
      toast.success("Rule deleted");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to delete rule");
    }
  }

  const canSave =
    title.trim() &&
    startDate &&
    selectedWorkerIds.length > 0 &&
    (recurrenceType === "daily" || recurrenceType === "weekdays" || weekdays.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-1 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="font-display text-base font-bold text-white">
            {rule ? "Edit Recurring Rule" : "New Recurring Rule"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5 max-h-[70vh] overflow-y-auto">
          {/* Template picker */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Use template (optional)
            </label>
            <div className="relative">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value as any)}
                className="w-full appearance-none rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white focus:border-accent/50 focus:outline-none transition-colors pr-8"
              >
                <option value="">— Manual entry —</option>
                {templates?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Title <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Shift Report"
              className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="e.g. 30"
              min={0}
              className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Workers */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Workers <span className="text-accent">*</span>
            </label>
            <div className="space-y-1 max-h-32 overflow-y-auto rounded-lg border border-white/[0.08] bg-surface-3 p-2">
              {workers?.filter((w) => w.organizationId).map((w) => (
                <label
                  key={w._id}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div
                    className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                      selectedWorkerIds.includes(w._id)
                        ? "bg-accent border-accent"
                        : "border-white/20"
                    }`}
                    onClick={() => toggleWorker(w._id)}
                  >
                    {selectedWorkerIds.includes(w._id) && (
                      <Check className="h-2.5 w-2.5 text-surface-0" />
                    )}
                  </div>
                  <span className="text-sm text-white/80 font-body">{w.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Recurrence type */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Recurrence
            </label>
            <div className="flex flex-wrap gap-2">
              {(["daily", "weekdays", "weekly", "custom"] as RecurrenceType[]).map((rt) => (
                <button
                  key={rt}
                  onClick={() => {
                    setRecurrenceType(rt);
                    setWeekdays([]);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200 ${
                    recurrenceType === rt
                      ? "bg-accent text-surface-0"
                      : "text-white/50 bg-white/[0.03] hover:bg-white/[0.06] hover:text-white/80"
                  }`}
                >
                  {rt}
                </button>
              ))}
            </div>

            {/* Day-of-week picker for weekly/custom */}
            {(recurrenceType === "weekly" || recurrenceType === "custom") && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {DOW_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => toggleWeekday(i)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-all duration-200 ${
                      weekdays.includes(i)
                        ? "bg-accent text-surface-0"
                        : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70"
                    }`}
                  >
                    {label.charAt(0)}
                  </button>
                ))}
                <span className="self-center text-xs text-white/30">
                  {recurrenceType === "weekly" ? "(pick one)" : "(pick multiple)"}
                </span>
              </div>
            )}
          </div>

          {/* Start / End date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Start date <span className="text-accent">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white focus:border-accent/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                End date (optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white focus:border-accent/50 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-4">
          <div>
            {rule && (
              <button
                onClick={handleDelete}
                className="rounded-lg px-3 py-1.5 text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm text-white/50 hover:bg-white/5 hover:text-white/80 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-surface-0 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Rule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
