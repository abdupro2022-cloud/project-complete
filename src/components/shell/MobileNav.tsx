"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { MOBILE_NAV, NAV as NAV_FOR_DRAWER } from "./nav";
import { Button, IconButton } from "@/components/ui/Button";
import { useApp } from "@/lib/store/provider";
import { cn } from "@/lib/utils";

/** Phone navigation. Five destinations, thumb-reachable, 64px tall. */
export function MobileNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="التنقل على الهاتف"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-6">
        <li>
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="فتح لوحة الأوامر"
            className="flex h-16 w-full flex-col items-center justify-center gap-1 text-ink-mute transition-colors active:text-ink"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent-tint text-accent">
              <Search className="size-4" aria-hidden />
            </span>
            <span className="text-[10px] font-medium">بحث</span>
          </button>
        </li>
        {MOBILE_NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 w-full flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-accent" : "text-ink-mute",
                )}
              >
                <span className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", active && "bg-accent-tint")}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Hamburger + brand for the mobile top bar. */
export function MobileTopBar({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-line bg-surface px-3 md:hidden">
      <IconButton label="فتح القائمة" onClick={onOpenDrawer} size="sm">
        <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
          <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </IconButton>
      <Link href="/" className="brand-link flex min-w-0 items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-deep text-[10px] font-bold text-white">
          A
        </span>
        <span className="truncate text-xs font-semibold text-ink">ABDO CREATOR OS</span>
      </Link>
    </div>
  );
}

/** Drawer navigation for phones — full nav tree, reachable without a rail. */
export function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { state } = useApp();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  const q = query.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-[75] md:hidden">
      <button type="button" aria-label="إغلاق" onClick={onClose} className="absolute inset-0 animate-fade-in bg-canvas-deep/80" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="قائمة التنقل"
        className="absolute inset-y-0 end-0 flex w-[86%] max-w-xs flex-col border-s border-line bg-surface shadow-float"
        style={{ animation: "drawer-in 240ms var(--ease-out-expo)" }}
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <span className="text-sm font-semibold text-ink">التنقل</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </header>

        <div className="border-b border-line px-3 py-2.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في القائمة"
            aria-label="ابحث في القائمة"
            className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 pb-24">
          {NAV_FOR_DRAWER.map((group) => {
            const items = group.items.filter(
              (i) => !q || i.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q),
            );
            if (!items.length) return null;
            return (
              <div key={group.id} className="mb-2">
                <h2 className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                  {group.label}
                </h2>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = item.exact
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                            active ? "bg-panel-2 font-medium text-ink" : "text-ink-soft",
                          )}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <footer className="absolute inset-x-0 bottom-0 border-t border-line bg-surface px-4 py-3 text-2xs text-ink-faint">
          {state.projects.length} مشروع · {state.sources.length} مصدر
        </footer>
      </div>
      <style>{`@keyframes drawer-in{from{transform:translateX(-100%);opacity:.4}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}
