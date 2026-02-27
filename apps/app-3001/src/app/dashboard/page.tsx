"use client";

import { useState, useCallback, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Header, PageContainer, StatCard, cn } from "@md2pptx/ui";
import {
  FileText,
  Upload,
  Zap,
  Download,
  Layers,
  CheckCircle,
  X,
  Loader2,
  ArrowDownToLine,
  Package,
} from "lucide-react";

interface ConvertedFile {
  name: string;
  size: number;
  slides: number;
  data: Blob;
  selected: boolean;
}

export default function DashboardPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState<ConvertedFile[]>([]);
  const [stats, setStats] = useState({
    totalConverted: 0,
    totalSlides: 0,
    avgSlides: 0,
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [font, setFont] = useState("Malgun Gothic");
  const [titleSize, setTitleSize] = useState(22);
  const [bodySize, setBodySize] = useState(16);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [codeFontSeparate, setCodeFontSeparate] = useState(false);

  const fontOptions = [
    { value: "Malgun Gothic", label: "맑은 고딕" },
    { value: "Noto Sans KR", label: "Noto Sans KR" },
    { value: "KoPubDotumLight", label: "KoPub돋움 Light" },
    { value: "KoPubDotumMedium", label: "KoPub돋움 Medium" },
    { value: "KoPubDotumBold", label: "KoPub돋움 Bold" },
  ];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".html") || f.name.endsWith(".htm")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setConverting(true);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("font_name", font);
      formData.append("title_size", String(titleSize));
      formData.append("body_size", String(bodySize));
      formData.append("line_spacing_multiplier", String(lineSpacing));
      formData.append("code_font_separate", String(codeFontSeparate));

      const res = await fetch("/api/convert", { method: "POST", body: formData });

      if (!res.ok) throw new Error("Conversion failed");

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/zip")) {
        const blob = await res.blob();
        const converted: ConvertedFile[] = [
          {
            name: "converted.zip",
            size: blob.size,
            slides: 0,
            data: blob,
            selected: true,
          },
        ];
        setResults(converted);
        setStats({ totalConverted: files.length, totalSlides: 0, avgSlides: 0 });
      } else {
        const blob = await res.blob();
        const fname = files[0]?.name.replace(/\.(md|html|htm)$/, ".pptx") || "output.pptx";
        const converted: ConvertedFile[] = [
          {
            name: fname,
            size: blob.size,
            slides: 0,
            data: blob,
            selected: true,
          },
        ];
        setResults(converted);
        setStats({ totalConverted: 1, totalSlides: 0, avgSlides: 0 });
      }
    } catch (err) {
      console.error("Convert error:", err);
    } finally {
      setConverting(false);
    }
  };

  const downloadFile = (file: ConvertedFile) => {
    const url = URL.createObjectURL(file.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSelected = () => {
    results.filter((r) => r.selected).forEach(downloadFile);
  };

  const toggleSelect = (index: number) => {
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  };

  const selectAll = (v: boolean) => {
    setResults((prev) => prev.map((r) => ({ ...r, selected: v })));
  };

  const selectedCount = results.filter((r) => r.selected).length;

  return (
    <AppLayout>
      <Header title="Dashboard" description="Convert markdown files to presentations" />
      <PageContainer>
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Converted" value={String(stats.totalConverted)} icon={FileText} change={12} />
          <StatCard title="Total Slides" value={String(stats.totalSlides)} icon={Layers} />
          <StatCard title="Files Ready" value={String(files.length)} icon={Upload} />
          <StatCard title="Results" value={String(results.length)} icon={CheckCircle} />
        </div>

        {/* Upload + Settings Row */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Upload Zone - spans 2 cols */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
              <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
                File Upload
              </h2>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-colors",
                  dragOver
                    ? "border-[var(--color-violet)] bg-[var(--color-violet-muted)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-text-faint)]"
                )}
              >
                <Upload className="mb-3 h-8 w-8 text-[var(--color-text-faint)]" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  Drop .md or .html files here, or click to browse
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-faint)]">
                  Supports .md, .html | Max 50MB per file
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".md,.html,.htm"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-[var(--color-violet)]" />
                        <span className="text-[var(--color-text-primary)]">{f.name}</span>
                        <span className="text-xs text-[var(--color-text-faint)]">
                          {(f.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        className="text-[var(--color-text-faint)] hover:text-[var(--color-red)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Convert button */}
              <button
                onClick={handleConvert}
                disabled={files.length === 0 || converting}
                className={cn(
                  "mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors",
                  files.length === 0 || converting
                    ? "cursor-not-allowed bg-[var(--color-border)]"
                    : "bg-[var(--color-violet)] hover:bg-[var(--color-violet-hover)] shadow-lg shadow-[var(--color-violet)]/20"
                )}
              >
                {converting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Convert to PPTX
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
              Settings
            </h2>
            <div className="space-y-4">
              {/* Font */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
                  Font
                </label>
                <select
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-violet)]"
                >
                  {fontOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Title size */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)]">
                  <span>Title Size</span>
                  <span className="font-semibold text-[var(--color-violet)]">{titleSize}pt</span>
                </label>
                <input
                  type="range" min={14} max={36} value={titleSize}
                  onChange={(e) => setTitleSize(Number(e.target.value))}
                  className="w-full accent-[var(--color-violet)]"
                />
              </div>

              {/* Body size */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)]">
                  <span>Body Size</span>
                  <span className="font-semibold text-[var(--color-violet)]">{bodySize}pt</span>
                </label>
                <input
                  type="range" min={10} max={28} value={bodySize}
                  onChange={(e) => setBodySize(Number(e.target.value))}
                  className="w-full accent-[var(--color-violet)]"
                />
              </div>

              {/* Line spacing */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)]">
                  <span>Line Spacing</span>
                  <span className="font-semibold text-[var(--color-violet)]">&times; {lineSpacing.toFixed(1)}</span>
                </label>
                <input
                  type="range" min={10} max={25} value={lineSpacing * 10}
                  onChange={(e) => setLineSpacing(Number(e.target.value) / 10)}
                  className="w-full accent-[var(--color-violet)]"
                />
              </div>

              {/* Code font */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={codeFontSeparate}
                  onChange={(e) => setCodeFontSeparate(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-violet)]"
                />
                <span className="text-xs text-[var(--color-text-muted)]">
                  Separate code font (Consolas)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Results ({results.length} file{results.length > 1 ? "s" : ""})
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => selectAll(true)}
                  className="text-xs font-medium text-[var(--color-violet)] hover:underline"
                >
                  Select all
                </button>
                <button
                  onClick={() => selectAll(false)}
                  className="text-xs font-medium text-[var(--color-text-muted)] hover:underline"
                >
                  Deselect
                </button>
              </div>
            </div>

            <div className="divide-y divide-[var(--color-border-subtle)]">
              {results.map((file, i) => (
                <div
                  key={file.name}
                  className={cn(
                    "flex items-center gap-4 py-3 transition-colors",
                    file.selected ? "bg-[var(--color-violet-muted)] -mx-5 px-5 rounded-lg" : ""
                  )}
                >
                  <input
                    type="checkbox"
                    checked={file.selected}
                    onChange={() => toggleSelect(i)}
                    className="h-4 w-4 rounded accent-[var(--color-violet)]"
                  />
                  <FileText className="h-4 w-4 text-[var(--color-violet)]" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {file.name}
                    </span>
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    onClick={() => downloadFile(file)}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--color-violet)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-violet-hover)]"
                  >
                    <ArrowDownToLine className="h-3 w-3" />
                    Download
                  </button>
                </div>
              ))}
            </div>

            {/* Download bar */}
            <div className="mt-4 flex items-center gap-3 border-t border-[var(--color-border)] pt-4">
              <span className="text-xs text-[var(--color-text-muted)]">
                {selectedCount} selected
              </span>
              <div className="flex-1" />
              {selectedCount >= 2 && (
                <button
                  onClick={downloadSelected}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                >
                  <Package className="h-3 w-3" />
                  Download Selected ({selectedCount})
                </button>
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
