"use client";

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Header, PageContainer, cn } from "@md2pptx/ui";
import { useTheme } from "next-themes";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Link2,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "theme", label: "Theme", icon: Palette },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { theme, setTheme } = useTheme();

  return (
    <AppLayout>
      <Header title="Settings" description="Manage your preferences" />
      <PageContainer>
        <div className="flex gap-6">
          {/* Side tabs */}
          <nav className="hidden w-48 shrink-0 space-y-1 md:block">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-[var(--color-violet-muted)] text-[var(--color-violet)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Mobile tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 md:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-[var(--color-violet-muted)] text-[var(--color-violet)]"
                    : "text-[var(--color-text-muted)]"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            {activeTab === "general" && <GeneralSettings />}
            {activeTab === "notifications" && <NotificationSettings />}
            {activeTab === "security" && <SecuritySettings />}
            {activeTab === "integrations" && <IntegrationSettings />}
            {activeTab === "theme" && <ThemeSettings theme={theme} setTheme={setTheme} />}
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
      {children}
    </h3>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function InputField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-violet)]"
    />
  );
}

function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-violet)]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[var(--color-violet)]" : "bg-[var(--color-border)]"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function SaveButton() {
  return (
    <button className="mt-6 rounded-lg bg-[var(--color-violet)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-violet-hover)]">
      Save Changes
    </button>
  );
}

function GeneralSettings() {
  const [appName, setAppName] = useState("MD → PPTX Converter");
  const [language, setLanguage] = useState("ko");
  const [timezone, setTimezone] = useState("Asia/Seoul");

  return (
    <div>
      <SectionTitle>General Settings</SectionTitle>
      <FormField label="Application Name">
        <InputField value={appName} onChange={setAppName} />
      </FormField>
      <FormField label="Language">
        <SelectField value={language} onChange={setLanguage} options={[
          { value: "ko", label: "한국어" },
          { value: "en", label: "English" },
          { value: "ja", label: "日本語" },
        ]} />
      </FormField>
      <FormField label="Timezone">
        <SelectField value={timezone} onChange={setTimezone} options={[
          { value: "Asia/Seoul", label: "Asia/Seoul (KST)" },
          { value: "America/New_York", label: "America/New_York (EST)" },
          { value: "Europe/London", label: "Europe/London (GMT)" },
          { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
        ]} />
      </FormField>
      <SaveButton />
    </div>
  );
}

function NotificationSettings() {
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);

  return (
    <div>
      <SectionTitle>Notification Preferences</SectionTitle>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Email Notifications</p>
            <p className="text-xs text-[var(--color-text-muted)]">Receive conversion reports via email</p>
          </div>
          <Toggle checked={email} onChange={setEmail} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Push Notifications</p>
            <p className="text-xs text-[var(--color-text-muted)]">Browser push when conversion completes</p>
          </div>
          <Toggle checked={push} onChange={setPush} />
        </div>
      </div>
      <SaveButton />
    </div>
  );
}

function SecuritySettings() {
  return (
    <div>
      <SectionTitle>Security</SectionTitle>
      <FormField label="Current Password">
        <input type="password" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-violet)]" />
      </FormField>
      <FormField label="New Password">
        <input type="password" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-violet)]" />
      </FormField>
      <FormField label="Confirm Password">
        <input type="password" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-violet)]" />
      </FormField>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Two-Factor Authentication</p>
          <p className="text-xs text-[var(--color-text-muted)]">Add extra security to your account</p>
        </div>
        <Toggle checked={false} onChange={() => {}} />
      </div>
      <SaveButton />
    </div>
  );
}

function IntegrationSettings() {
  const integrations = [
    { name: "Google Drive", status: "connected", icon: "📁" },
    { name: "Dropbox", status: "disconnected", icon: "📦" },
    { name: "OneDrive", status: "disconnected", icon: "☁️" },
  ];

  return (
    <div>
      <SectionTitle>Integrations</SectionTitle>
      <div className="space-y-3">
        {integrations.map((integration) => (
          <div key={integration.name} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{integration.icon}</span>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{integration.name}</p>
                <p className={cn("text-xs", integration.status === "connected" ? "text-[var(--color-green)]" : "text-[var(--color-text-faint)]")}>
                  {integration.status === "connected" ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            <button className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              integration.status === "connected"
                ? "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
                : "bg-[var(--color-violet)] text-white hover:bg-[var(--color-violet-hover)]"
            )}>
              {integration.status === "connected" ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeSettings({ theme, setTheme }: { theme: string | undefined; setTheme: (t: string) => void }) {
  const themes = [
    { id: "dark", label: "Dark", icon: Moon, description: "Dark background, light text" },
    { id: "light", label: "Light", icon: Sun, description: "Light background, dark text" },
    { id: "system", label: "System", icon: Monitor, description: "Follow system preference" },
  ];

  return (
    <div>
      <SectionTitle>Appearance</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border p-6 transition-colors",
              theme === t.id
                ? "border-[var(--color-violet)] bg-[var(--color-violet-muted)]"
                : "border-[var(--color-border)] hover:border-[var(--color-text-faint)]"
            )}
          >
            {theme === t.id && (
              <div className="absolute right-2 top-2">
                <Check className="h-4 w-4 text-[var(--color-violet)]" />
              </div>
            )}
            <t.icon className="h-6 w-6 text-[var(--color-text-primary)]" />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{t.label}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
