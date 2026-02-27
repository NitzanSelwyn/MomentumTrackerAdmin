import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { X, Check, Clock, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type Assignment = {
  _id: Id<"taskAssignments">;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  workerId: Id<"workers">;
  assignedDate: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  notes?: string;
};

interface Props {
  mode: "create" | "edit";
  prefilledDate?: string;
  prefilledWorkerId?: Id<"workers">;
  assignment?: Assignment;
  onClose: () => void;
  onSaved: () => void;
}

export function AssignTaskModal({
  mode,
  prefilledDate,
  prefilledWorkerId,
  assignment,
  onClose,
  onSaved,
}: Props) {
  const workers = useQuery(api.workers.listWorkers);
  const templates = useQuery(api.tasks.getTaskTemplates);
  const createAssignments = useMutation(api.tasks.createTaskAssignments);
  const updateAssignment = useMutation(api.tasks.updateTaskAssignment);
  const deleteAssignment = useMutation(api.tasks.deleteTaskAssignment);

  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"taskTemplates"> | "">("");
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [description, setDescription] = useState(assignment?.description ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    assignment?.estimatedMinutes != null ? String(assignment.estimatedMinutes) : ""
  );
  const [assignedDate, setAssignedDate] = useState(
    assignment?.assignedDate ?? prefilledDate ?? ""
  );
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Id<"workers">[]>(
    mode === "edit" && assignment ? [assignment.workerId] : prefilledWorkerId ? [prefilledWorkerId] : []
  );
  const [status, setStatus] = useState(assignment?.status ?? "pending");
  const [notes, setNotes] = useState(assignment?.notes ?? "");
  const [saving, setSaving] = useState(false);

  // When a template is selected, pre-fill title/description/duration
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
    if (mode === "edit") return; // edit mode: one worker only
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!title.trim()) return;
    if (mode === "create" && selectedWorkerIds.length === 0) {
      toast.error("Select at least one worker");
      return;
    }
    if (!assignedDate) {
      toast.error("Select a date");
      return;
    }
    setSaving(true);
    try {
      const mins = estimatedMinutes ? parseInt(estimatedMinutes) : undefined;
      if (mode === "create") {
        await createAssignments({
          workerIds: selectedWorkerIds,
          assignedDate,
          title: title.trim(),
          description: description.trim() || undefined,
          estimatedMinutes: mins,
          taskTemplateId: selectedTemplateId || undefined,
        });
        toast.success(
          `Task assigned to ${selectedWorkerIds.length} worker${selectedWorkerIds.length > 1 ? "s" : ""}`
        );
      } else if (assignment) {
        await updateAssignment({
          assignmentId: assignment._id,
          title: title.trim(),
          description: description.trim() || undefined,
          estimatedMinutes: mins,
          status: status as any,
          notes: notes.trim() || undefined,
        });
        toast.success("Assignment updated");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!assignment) return;
    if (!confirm("Delete this assignment?")) return;
    try {
      await deleteAssignment({ assignmentId: assignment._id });
      toast.success("Assignment deleted");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to delete");
    }
  }

  const statusColors: Record<string, string> = {
    pending: "text-white/60 bg-white/5",
    in_progress: "text-accent bg-accent/10",
    completed: "text-green-400 bg-green-400/10",
    skipped: "text-white/30 bg-white/5",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-1 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="font-display text-base font-bold text-white">
            {mode === "create" ? "Assign Task" : "Edit Assignment"}
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
          {/* Template picker (create mode only) */}
          {mode === "create" && (
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
                      {t.estimatedMinutes != null ? ` (${t.estimatedMinutes}m)` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Title <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
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

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Date <span className="text-accent">*</span>
              </label>
              <input
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                disabled={mode === "edit"}
                className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white focus:border-accent/50 focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Duration (min)
              </label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="30"
                  min={0}
                  className="w-full rounded-lg border border-white/[0.08] bg-surface-3 pl-8 pr-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Worker multi-select (create mode) */}
          {mode === "create" && (
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Assign to workers <span className="text-accent">*</span>
              </label>
              <div className="space-y-1 max-h-36 overflow-y-auto rounded-lg border border-white/[0.08] bg-surface-3 p-2">
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
                    {w.role === "admin" && (
                      <span className="text-[10px] text-white/30">(admin)</span>
                    )}
                  </label>
                ))}
                {!workers && (
                  <div className="py-2 text-center">
                    <div className="h-4 w-4 mx-auto rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status (edit mode) */}
          {mode === "edit" && (
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Status</label>
              <div className="flex flex-wrap gap-2">
                {(["pending", "in_progress", "completed", "skipped"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      status === s
                        ? statusColors[s] + " ring-1 ring-current"
                        : "text-white/40 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes (edit mode) */}
          {mode === "edit" && (
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Worker notes..."
                rows={2}
                className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:outline-none transition-colors resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-4">
          <div>
            {mode === "edit" && (
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
              disabled={!title.trim() || saving}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-surface-0 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
