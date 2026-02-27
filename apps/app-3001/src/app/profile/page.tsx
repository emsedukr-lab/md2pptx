"use client";

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Header, PageContainer } from "@md2pptx/ui";
import { Upload, Clock, FileText, Settings, User } from "lucide-react";

export default function ProfilePage() {
  const [name, setName] = useState("User");
  const [email, setEmail] = useState("user@example.com");
  const [bio, setBio] = useState("");

  const activities = [
    { action: "Converted 3 files", time: "2 hours ago", icon: FileText },
    { action: "Changed theme to dark", time: "1 day ago", icon: Settings },
    { action: "Uploaded batch of 12 files", time: "3 days ago", icon: Upload },
    { action: "Updated profile settings", time: "1 week ago", icon: User },
    { action: "First conversion", time: "2 weeks ago", icon: FileText },
  ];

  return (
    <AppLayout>
      <Header title="Profile" description="Manage your account" />
      <PageContainer>
        {/* Profile header */}
        <div className="flex items-center gap-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-violet)] text-2xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{name}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{email}</p>
            <span className="mt-1 inline-block rounded-md bg-[var(--color-violet-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-violet)]">
              Free Plan
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Edit form */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
              Edit Profile
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-violet)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-violet)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-violet)]"
                />
              </div>
              <button className="rounded-lg bg-[var(--color-violet)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-violet-hover)]">
                Save Changes
              </button>
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
              Recent Activity
            </h3>
            <div className="space-y-1">
              {activities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--color-bg-hover)]"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-secondary)]">
                    <activity.icon className="h-3.5 w-3.5 text-[var(--color-text-faint)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--color-text-primary)]">{activity.action}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-[var(--color-text-faint)]">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
