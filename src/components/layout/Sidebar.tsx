import type { ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="gradient-border-r flex w-80 shrink-0 flex-col bg-surface-1">
      {children}
    </aside>
  );
}
