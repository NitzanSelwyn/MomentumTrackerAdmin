import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FloorPlanPickerProps {
  currentPlanId: Id<"floorPlans">;
  currentPlanName: string;
}

export function FloorPlanPicker({ currentPlanId, currentPlanName }: FloorPlanPickerProps) {
  const [open, setOpen] = useState(false);
  const plans = useQuery(api.floorPlans.getFloorPlans);
  const setActive = useMutation(api.floorPlans.setActiveFloorPlan);

  if (!plans || plans.length <= 1) {
    return (
      <div className="glass-strong rounded-xl px-3.5 py-2 shadow-lg">
        <span className="text-sm text-white/70 font-body font-medium">{currentPlanName}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass-strong rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2 text-sm text-white/70 font-body hover:text-white transition-colors"
      >
        <span className="font-medium">{currentPlanName}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[180px] rounded-xl shadow-xl overflow-hidden"
          style={{ background: "rgba(15,20,30,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {plans.map((plan) => (
            <button
              key={plan._id}
              onClick={async () => {
                if (plan._id !== currentPlanId) {
                  await setActive({ floorPlanId: plan._id });
                }
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-body transition-colors ${
                plan._id === currentPlanId
                  ? "text-accent bg-accent/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {plan.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
