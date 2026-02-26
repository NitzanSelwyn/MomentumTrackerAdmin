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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          <span className="text-lg font-semibold">MomentumTracker</span>
          <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
            Admin
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {organization ? (
          <button
            onClick={onOpenOrgPanel}
            className="flex items-center gap-1.5 rounded-md bg-gray-800 px-2.5 py-1.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <Building2 className="h-4 w-4 text-blue-400" />
            {organization.name}
          </button>
        ) : organization === null ? (
          <button
            onClick={onOpenOrgSetup}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Set Up Organization
          </button>
        ) : null}

        {organization && (
          <button
            onClick={() => navigate({ to: "/settings" })}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}

        {user && (
          <span className="text-sm text-gray-400">{user.fullName}</span>
        )}
        <UserButton
          afterSignOutUrl="/login"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
