"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";

import { CommandPalette } from "./CommandPalette";
import { MobileNav, MobileTopBar, NavDrawer } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { DemoBanner } from "@/components/shell/DemoBanner";
import { fetchHealth, type HealthReport } from "@/lib/api/client";
import { useApp } from "@/lib/store/provider";

/**
 * Application shell.
 *
 * Layout contract:
 *   desktop  → [sidebar | main | optional context panel]
 *   mobile   → [top bar / main / bottom nav], navigation in a drawer
 *
 * RTL is inherited from <html dir="rtl">; every rule below uses logical
 * properties, so nothing needs a mirrored override.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, isDemo } = useApp();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [health, setHealth] = useState<HealthReport | null>(null);

  // Ctrl/Cmd+K anywhere, and "/" when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Probe provider availability once at boot; failure is non-fatal.
  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const aiLive = health?.providers.some(
    (p) => ["gemini", "deepseek", "openrouter"].includes(p.id) && p.configured,
  ) ?? false;

  const openNewProject = useCallback(() => setNewProjectOpen(true), []);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <MobileTopBar onOpenDrawer={() => setDrawerOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <Sidebar onNewProject={openNewProject} aiLive={aiLive} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="hidden md:block">
            <TopBar
              onOpenPalette={() => setPaletteOpen(true)}
              aiLive={aiLive}
              onOpenSettings={() => router.push("/settings")}
            />
          </div>

          {isDemo && health && !health.hasRealMode && <DemoBanner />}

          <main id="main" className="min-h-0 flex-1 pb-20 md:pb-0" tabIndex={-1}>
            {!ready ? (
              <BootSkeleton />
            ) : (
              children
            )}
          </main>
        </div>
      </div>

      <MobileNav onOpenPalette={() => setPaletteOpen(true)} />
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <NewProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreated={(id) => router.push(`/projects/${id}`)}
      />
    </div>
  );
}

/** Boot state — matches the page layout so nothing shifts when data lands. */
function BootSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 md:px-8" aria-busy="true">
      <span className="sr-only">جارٍ تحميل مساحة العمل</span>
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-panel-2" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-panel-2" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-panel-2" />
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-line bg-panel" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-line bg-panel" />
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 pt-4 text-ink-faint">
        <FlaskConical className="size-3.5 animate-pulse" aria-hidden />
        <span className="text-2xs">جارٍ تجهيز مساحة العمل</span>
      </div>
    </div>
  );
}
