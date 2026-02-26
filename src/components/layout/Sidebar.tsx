import type { ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-gray-800 bg-gray-900">
      {children}
    </aside>
  );
}
