import { UserButton, useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Menu, MapPin, Building2, Settings } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenOrgPanel: () => void;
  onOpenOrgSetup: () => void;
}

export function Header({
  sidebarOpen,
  onToggleSidebar,
  onOpenOrgPanel,
  onOpenOrgSetup,
}: HeaderProps) {
  const { user } = useUser();
  const navigate = useNavigate();
  const organization = useQuery(api.organizations.getMyOrganization);

  return (
    <header className="gradient-border-b relative flex h-14 shrink-0 items-center justify-between bg-surface-1/90 backdrop-blur-xl px-5">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white/80 transition-all duration-200"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <MapPin className="h-4 w-4 text-accent" />
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent pulse-dot" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Momentum
          </span>
          <span className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider text-accent uppercase">
            Admin
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {organization ? (
          <button
            onClick={onOpenOrgPanel}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white/80 hover:border-white/10 transition-all duration-200"
          >
            <Building2 className="h-3.5 w-3.5 text-accent/70" />
            <span className="font-body">{organization.name}</span>
          </button>
        ) : organization === null ? (
          <button
            onClick={onOpenOrgSetup}
            className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-semibold text-surface-0 hover:bg-accent/90 transition-all duration-200 glow-accent-sm"
          >
            Set Up Organization
          </button>
        ) : null}

        {organization && (
          <button
            onClick={() => navigate({ to: "/settings" })}
            className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-white/70 transition-all duration-200"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}

        {user && (
          <span className="hidden text-sm text-white/40 font-body sm:inline">
            {user.fullName}
          </span>
        )}
        <UserButton
          afterSignOutUrl="/login"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8 ring-2 ring-white/10",
            },
          }}
        />
      </div>
    </header>
  );
}
