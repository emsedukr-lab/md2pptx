"use client";

import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { Sidebar, type NavItem } from "./Sidebar";
import { cn } from "../utils";

interface MainLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  logo: {
    icon: LucideIcon;
    label: string;
  };
}

export function MainLayout({ children, navItems, logo }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        navItems={navItems}
        logo={logo}
      />
      <main
        className={cn(
          "min-h-screen transition-[margin-left] duration-200 ease-out",
          collapsed ? "ml-16" : "ml-60"
        )}
      >
        {children}
      </main>
    </div>
  );
}
