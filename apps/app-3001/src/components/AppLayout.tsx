"use client";

import { MainLayout } from "@md2pptx/ui";
import {
  LayoutDashboard,
  Settings,
  User,
  FileSliders,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

const logo = {
  icon: FileSliders,
  label: "MD → PPTX",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout navItems={navItems} logo={logo}>
      {children}
    </MainLayout>
  );
}
