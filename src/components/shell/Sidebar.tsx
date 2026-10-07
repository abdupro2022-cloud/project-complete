"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Plus, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { NAV } from "./nav";
import { IconButton } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/Surface";
import { useApp } from "@/lib/store/provider";
import { cn } from "@/lib/utils";

/**
 * Collapsible sidebar.
 *
 * Because the document is RTL, "inline-start" is the right edge — the rail
 * mirrors itself with no extra rules. Collapse is persisted so the workspace
 * keeps its shape between sessions.
 */

const STORAGE_KEY = "abdo.sidebar.collapsed";

export function Sidebar({
  onNewProject,
  aiLive,
}: {
  onNewProject: () => void;
  aiLive: boolean;
}) {
  const pathname = usePathname();
  const { state } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* storage unavailable — default to expanded */
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Counts that tell the truth: only entities that actually exist.
  const counts = useMemo(
    () => ({
      "/projects": state.projects.length,
      "/ideas": state.ideas.length,
      "/sources": state.sources.length,
      "/shorts": state.shorts.length,
    }),
    [state.projects, state.ideas, state.sources, state.shorts],
  );

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="التنقل الرئيسي"
      data-collapsed={collapsed}
      className={cn(
        "hidden shrink-0 flex-col border-e border-line bg-surface transition-[width] duration-300 ease-expo md:flex",
        collapsed ? "w-[60px]" : "w-[248px] xl:w-[264px]",
      )}
    >
      {/* --- brand ------------------------------------------------------- */}
      <div className={cn("flex h-14 items-center border-b border-line", collapsed ? "justify-center px-2" : "gap-2.5 px-4")}>
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-md outline-offset-4"
          aria-label="ABDO CREATOR OS — الصفحة الرئيسية"
        >
          <span
            className="relative flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-deep text-[10px] font-bold text-white"
            aria-hidden
          >
            A
            {aiLive && <span className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-live ring-2 ring-surface" />}
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold tracking-tight text-ink">ABDO CREATOR OS</span>
              <span className="block text-[10px] text-ink-faint">نظام تشغيل صانع المحتوى</span>
            </span>
          )}
        </Link>
      </div>

      {/* --- new project ------------------------------------------------- */}
      <div className={cn("py-3", collapsed ? "px-2" : "px-3")}>
        <button
          type="button"
          onClick={onNewProject}
          title="مشروع جديد"
          className={cn(
            "group flex w-full items-center gap-2 rounded-lg bg-accent text-white",
            "transition-[background-color,transform] dur-2 ease-expo hover:bg-accent-soft active:scale-[0.985]",
            collapsed ? "h-10 justify-center" : "h-10 px-3",
          )}
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          {!collapsed && <span className="text-sm font-medium">مشروع جديد</span>}
        </button>
      </div>

      {/* --- nav --------------------------------------------------------- */}
      <div className="rail min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {NAV.map((group) => (
          <div key={group.id} className="mb-1">
            {!collapsed && (
              <h2 className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                {group.label}
              </h2>
            )}
            {collapsed && <div className="my-2 h-px bg-line" aria-hidden />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                const count = counts[item.href as keyof typeof counts];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md text-sm",
                        "transition-colors dur-2 ease-expo",
                        collapsed ? "h-9 justify-center" : "h-9 px-2.5",
                        active
                          ? "bg-panel-2 font-medium text-ink"
                          : "text-ink-mute hover:bg-panel/70 hover:text-ink-soft",
                      )}
                    >
                      {/* Active marker hugs the inline-start edge, so it flips with RTL. */}
                      {active && (
                        <span
                          className="absolute inset-y-1.5 start-0 w-[2px] rounded-full bg-accent"
                          aria-hidden
                        />
                      )}
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && count !== undefined && count > 0 && (
                        <span className="num ms-auto text-[10px] text-ink-faint">{count}</span>
                      )}
                      {collapsed && count !== undefined && count > 0 && (
                        <span
                          className="absolute end-1 top-1 size-1.5 rounded-full bg-accent"
                          aria-hidden
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* --- collapse ---------------------------------------------------- */}
      <div className="border-t border-line p-2">
        {aiLive ? (
          <div
            className={cn(
              "mb-1 flex items-center gap-2 rounded-md bg-ok-tint px-2.5 py-2 text-2xs text-ok",
              collapsed && "justify-center px-0",
            )}
            title="مزوّد ذكاء اصطناعي متصل"
          >
            <StatusDot tone="ok" />
            {!collapsed && <span>النماذج متصلة</span>}
          </div>
        ) : (
          <div
            className={cn(
              "mb-1 flex items-center gap-2 rounded-md bg-attention-tint px-2.5 py-2 text-2xs text-attention",
              collapsed && "justify-center px-0",
            )}
            title="لا يوجد مزوّد ذكاء اصطناعي متصل — النظام في الوضع التجريبي"
          >
            <Radio className="size-3 shrink-0" aria-hidden />
            {!collapsed && <span>وضع تجريبي</span>}
          </div>
        )}
        <IconButton
          label={collapsed ? "توسيع القائمة" : "طيّ القائمة"}
          size="sm"
          onClick={toggle}
          className="w-full"
        >
          {collapsed ? <ChevronsLeft className="size-4" aria-hidden /> : <ChevronsRight className="size-4" aria-hidden />}
        </IconButton>
      </div>
    </nav>
  );
}
