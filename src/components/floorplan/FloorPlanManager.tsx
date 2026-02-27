import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Upload, Trash2, Check, X } from "lucide-react";

interface FloorPlanManagerProps {
  onClose: () => void;
}

export function FloorPlanManager({ onClose }: FloorPlanManagerProps) {
  const plans = useQuery(api.floorPlans.getFloorPlans) ?? [];
  const generateUploadUrl = useMutation(api.floorPlans.generateFloorPlanUploadUrl);
  const createPlan = useMutation(api.floorPlans.createFloorPlan);
  const setActive = useMutation(api.floorPlans.setActiveFloorPlan);
  const deactivate = useMutation(api.floorPlans.deactivateFloorPlan);
  const deletePlan = useMutation(api.floorPlans.deleteFloorPlan);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Id<"floorPlans"> | null>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) { setError("Select an image file first."); return; }
    if (!nameInput.trim()) { setError("Enter a name for the floor plan."); return; }
    setError(null);
    setUploading(true);

    try {
      // Get natural image dimensions
      const dims = await getImageDimensions(file);

      // Upload to Convex storage
      const uploadUrl = await generateUploadUrl();
      const resp = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!resp.ok) throw new Error("Upload failed");
      const { storageId } = await resp.json();

      await createPlan({
        name: nameInput.trim(),
        imageStorageId: storageId as Id<"_storage">,
        imageWidth: dims.width,
        imageHeight: dims.height,
      });

      setNameInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl font-body overflow-hidden"
        style={{ background: "rgba(13,18,28,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-base font-semibold text-white">Floor Plans</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Upload form */}
          <div className="space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Upload New Floor Plan</p>
            <input
              type="text"
              placeholder="Floor plan name (e.g. Building A – Floor 1)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-accent/50 transition-colors"
            />
            <div
              className="rounded-xl border border-dashed border-white/20 px-4 py-6 text-center cursor-pointer hover:border-accent/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/40">
                {fileInputRef.current?.files?.[0]
                  ? fileInputRef.current.files[0].name
                  : "Click to select an image (PNG, JPG, SVG)"}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={() => setError(null)}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full rounded-xl bg-accent/20 hover:bg-accent/30 text-accent py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading…" : "Upload Floor Plan"}
            </button>
          </div>

          {/* Plans list */}
          {plans.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Your Floor Plans</p>
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: plan.isActive ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium truncate">{plan.name}</p>
                    <p className="text-xs text-white/30">
                      {plan.imageWidth}×{plan.imageHeight}px
                      {" · "}
                      {plan.calibrationPoints.length} calibration point{plan.calibrationPoints.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Active toggle */}
                    <button
                      onClick={() =>
                        plan.isActive
                          ? deactivate({ floorPlanId: plan._id })
                          : setActive({ floorPlanId: plan._id })
                      }
                      title={plan.isActive ? "Deactivate" : "Set as active"}
                      className={`rounded-lg p-1.5 transition-colors ${
                        plan.isActive
                          ? "text-accent bg-accent/15 hover:bg-accent/25"
                          : "text-white/30 hover:text-accent hover:bg-accent/10"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete */}
                    {confirmDelete === plan._id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            await deletePlan({ floorPlanId: plan._id });
                            setConfirmDelete(null);
                          }}
                          className="rounded-lg px-2 py-1 text-xs text-red-400 bg-red-500/20 hover:bg-red-500/30 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg px-2 py-1 text-xs text-white/40 hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(plan._id)}
                        title="Delete floor plan"
                        className="rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {plans.length === 0 && (
            <p className="text-sm text-white/30 text-center py-4">No floor plans yet. Upload one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
}
