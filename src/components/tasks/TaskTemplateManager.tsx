import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Check, X, Clock, Tag } from "lucide-react";
import { toast } from "sonner";

interface TemplateFormState {
  title: string;
  description: string;
  estimatedMinutes: string;
  category: string;
}

const emptyForm: TemplateFormState = {
  title: "",
  description: "",
  estimatedMinutes: "",
  category: "",
};

export function TaskTemplateManager() {
  const templates = useQuery(api.tasks.getTaskTemplates);
  const createTemplate = useMutation(api.tasks.createTaskTemplate);
  const updateTemplate = useMutation(api.tasks.updateTaskTemplate);
  const deleteTemplate = useMutation(api.tasks.deleteTaskTemplate);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"taskTemplates"> | null>(null);
  const [form, setForm] = useState<TemplateFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(t: NonNullable<typeof templates>[number]) {
    setEditingId(t._id);
    setForm({
      title: t.title,
      description: t.description ?? "",
      estimatedMinutes: t.estimatedMinutes != null ? String(t.estimatedMinutes) : "",
      category: t.category ?? "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const mins = form.estimatedMinutes ? parseInt(form.estimatedMinutes) : undefined;
      if (editingId) {
        await updateTemplate({
          templateId: editingId,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          estimatedMinutes: mins,
          category: form.category.trim() || undefined,
        });
        toast.success("Template updated");
      } else {
        await createTemplate({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          estimatedMinutes: mins,
          category: form.category.trim() || undefined,
        });
        toast.success("Template created");
      }
      closeForm();
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: Id<"taskTemplates">, title: string) {
    if (!confirm(`Delete template "${title}"?`)) return;
    try {
      await deleteTemplate({ templateId: id });
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-white">Task Templates</h2>
            <p className="text-sm text-white/40 font-body mt-0.5">
              Reusable tasks you can quickly assign to workers
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-surface-0 hover:bg-accent/90 transition-all duration-200 glow-accent-sm"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="rounded-xl border border-white/[0.08] bg-surface-2 p-5 space-y-4">
            <h3 className="font-display text-sm font-semibold text-white">
              {editingId ? "Edit Template" : "New Template"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Title <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Safety walkthrough"
                  className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional details..."
                  rows={2}
                  className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={form.estimatedMinutes}
                    onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
                    placeholder="e.g. 30"
                    min={0}
                    className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Safety"
                    className="w-full rounded-lg border border-white/[0.08] bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={closeForm}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/50 hover:bg-white/5 hover:text-white/80 transition-all duration-200"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim() || saving}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-surface-0 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Check className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Template list */}
        {templates === undefined ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-surface-2 p-12 text-center">
            <p className="text-white/30 font-body text-sm">
              No templates yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t._id}
                className="group rounded-xl border border-white/[0.06] bg-surface-2 p-4 hover:border-white/[0.1] transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-sm font-semibold text-white">
                        {t.title}
                      </span>
                      {t.category && (
                        <span className="flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          <Tag className="h-2.5 w-2.5" />
                          {t.category}
                        </span>
                      )}
                      {t.estimatedMinutes != null && (
                        <span className="flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/50">
                          <Clock className="h-2.5 w-2.5" />
                          {t.estimatedMinutes}m
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="mt-1 text-xs text-white/40 font-body line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id, t.title)}
                      className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
