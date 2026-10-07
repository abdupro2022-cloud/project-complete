"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Cpu, Plug, Search, Settings, Sparkles } from "lucide-react";

import { Badge, StageBadge, StatusDot } from "@/components/ui/Surface";
import { IconButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { useApp } from "@/lib/store/provider";
import { cn, timeAgo } from "@/lib/utils";

/**
 * Top bar.
 *
 * Right (inline-start in RTL): brand context and the global search affordance.
 * Left (inline-end): AI status, notifications, settings, profile.
 * A project switcher lives here because every screen is project-scoped.
 */

export function TopBar({
  onOpenPalette,
  aiLive,
  onOpenSettings,
}: {
  onOpenPalette: () => void;
  aiLive: boolean;
  onOpenSettings: () => void;
}) {
  const pathname = usePathname();
  const { state } = useApp();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  // Current project = the deepest /projects/<id> segment, else the newest.
  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const current = projectId
    ? state.projects.find((p) => p.id === projectId) ?? null
    : state.projects.find((p) => p.stage !== "published" && p.stage !== "archived") ?? state.projects[0] ?? null;

  const failures = state.activity.filter((a) => a.outcome === "failure");
  const recent = state.activity.slice(0, 14);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 md:px-4">
      {/* --- search (the primary action, so it gets the space) ------------ */}
      <button
        type="button"
        onClick={onOpenPalette}
        className={cn(
          "group flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-line bg-panel px-3",
          "text-start text-sm text-ink-mute transition-colors dur-2 ease-expo",
          "hover:border-line-strong hover:text-ink-soft md:max-w-md",
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">ابحث أو نفّذ أمرًا</span>
        <kbd className="ms-auto hidden shrink-0 rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:block">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <div className="flex-1" />

      {/* --- project switcher -------------------------------------------- */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setSwitcherOpen((o) => !o)}
          aria-expanded={switcherOpen}
          aria-haspopup="listbox"
          className="flex h-9 max-w-[180px] items-center gap-2 rounded-lg border border-line bg-panel px-2.5 text-sm transition-colors hover:border-line-strong md:max-w-[260px]"
        >
          <span className="truncate text-ink-soft">{current ? current.title : "مركز القيادة"}</span>
          {current && <StageBadge stage={current.stage} />}
          <ChevronDown className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
        </button>

        {switcherOpen && (
          <>
            <button type="button" aria-label="إغلاق" className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
            <ul
              role="listbox"
              className="absolute end-0 z-50 mt-1.5 max-h-80 w-72 animate-fade-up overflow-y-auto rounded-lg border border-line-strong bg-panel p-1.5 shadow-lg"
            >
              <li className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                المشاريع
              </li>
              {state.projects.length === 0 && (
                <li className="px-2 py-4 text-center text-2xs text-ink-mute">لا مشاريع بعد</li>
              )}
              {state.projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    onClick={() => setSwitcherOpen(false)}
                    role="option"
                    aria-selected={p.id === current?.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                      p.id === current?.id ? "bg-panel-3 text-ink" : "text-ink-soft hover:bg-panel-2",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{p.title}</span>
                    <StageBadge stage={p.stage} />
                  </Link>
                </li>
              ))}
              <li className="mt-1 border-t border-line pt-1">
                <Link
                  href="/projects"
                  onClick={() => setSwitcherOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm text-accent-soft transition-colors hover:bg-panel-2"
                >
                  عرض كل المشاريع
                </Link>
              </li>
            </ul>
          </>
        )}
      </div>

      {/* --- AI status ----------------------------------------------------- */}
      <Link
        href="/ai/models"
        title={aiLive ? "مزوّد ذكاء اصطناعي متصل" : "الوضع التجريبي — لا يوجد مزوّد متصل"}
        className={cn(
          "hidden h-9 items-center gap-2 rounded-lg border px-2.5 text-2xs transition-colors sm:flex",
          aiLive ? "border-ok/25 bg-ok-tint text-ok" : "border-attention/25 bg-attention-tint text-attention",
        )}
      >
        {aiLive ? <Cpu className="size-3.5" aria-hidden /> : <Sparkles className="size-3.5" aria-hidden />}
        <StatusDot tone={aiLive ? "ok" : "warn"} />
        {aiLive ? "متصل" : "تجريبي"}
      </Link>

      {/* --- notifications -------------------------------------------------- */}
      <div className="relative">
        <IconButton
          label={failures.length > 0 ? `الإشعارات (${failures.length} يحتاج انتباهك)` : "الإشعارات"}
          onClick={() => setNotifOpen((o) => !o)}
          className="relative"
        >
          <Bell className="size-4" aria-hidden />
          {failures.length > 0 && (
            <span className="absolute end-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-danger" />
            </span>
          )}
        </IconButton>
      </div>

      <IconButton label="الإعدادات" onClick={onOpenSettings}>
        <Settings className="size-4" aria-hidden />
      </IconButton>

      <button
        type="button"
        onClick={() => setSwitcherOpen(true)}
        aria-label="الملف الشخصي"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-panel-3 to-panel-2 text-xs font-semibold text-ink-soft transition-colors hover:from-panel-3 hover:to-panel-3"
      >
        {state.settings.displayName.slice(0, 1) || "ع"}
      </button>

      {/* --- notification drawer ------------------------------------------- */}
      <Drawer open={notifOpen} onClose={() => setNotifOpen(false)} title="الإشعارات" width="max-w-sm">
        {recent.length === 0 ? (
          <div className="p-4">
            <EmptyState
              compact
              icon={<Bell className="size-4" />}
              title="لا إشعارات"
              description="ستظهر هنا نتائج workflows والأخطاء التي تحتاج انتباهك."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <StatusDot tone={a.outcome === "failure" ? "danger" : "ok"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-ink">{a.what}</p>
                  {a.detail && <p className="mt-0.5 text-2xs leading-relaxed text-ink-mute">{a.detail}</p>}
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-faint">
                    {a.projectTitle && <span className="truncate">{a.projectTitle}</span>}
                    {a.toolName && <span className="font-mono">{a.toolName}</span>}
                    <span>· {timeAgo(a.at)}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-line p-3">
          <Link
            href="/settings/logs"
            onClick={() => setNotifOpen(false)}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-xs text-ink-mute hover:bg-panel-2 hover:text-ink"
          >
            <Plug className="size-3.5" aria-hidden />
            عرض كل السجلات
          </Link>
        </div>
      </Drawer>
    </header>
  );
}
