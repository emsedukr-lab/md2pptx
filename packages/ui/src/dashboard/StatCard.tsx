"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
}

export function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-shadow hover:shadow-lg hover:shadow-black/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          {title}
        </span>
        <Icon className="h-4 w-4 text-[var(--color-text-faint)]" />
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-bold text-[var(--color-text-primary)]">
          {value}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              "mb-0.5 flex items-center gap-0.5 text-xs font-medium",
              isPositive ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}
