"use client";

import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-6">
      <div>
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
      </div>

      {actions ?? (
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]">
            <Search className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]">
            <Bell className="h-4 w-4" />
          </button>
          <div className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-violet)] text-xs font-medium text-white">
            U
          </div>
        </div>
      )}
    </header>
  );
}
