"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CornerDownLeft, Search } from "lucide-react";

import { NAV_FLAT, PALETTE_ACTIONS } from "./nav";
import { Badge, StageBadge } from "@/components/ui/Surface";
import { useApp } from "@/lib/store/provider";
import { cn, formatNumber } from "@/lib/utils";

/**
 * Command palette (Ctrl/Cmd + K).
 *
 * Searches navigation, the user's own content, and quick actions in one list.
 * A global search that only returns page names is a dead end, so projects,
 * ideas, scripts, sources and videos are all searchable from here.
 */

interface Result {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href: string;
  badge?: React.ReactNode;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const out: Result[] = [];

    const push = (r: Result) => out.push(r);
    const match = (...fields: (string | undefined | null)[]) =>
      !q || fields.some((f) => f?.toLowerCase().includes(q));

    if (q) {
      for (const a of PALETTE_ACTIONS) {
        if (match(a.label, a.hint)) {
          push({ id: `a-${a.id}`, group: "إجراءات", label: a.label, hint: a.hint, href: a.href });
        }
      }
      for (const n of NAV_FLAT) {
        if (match(n.label, n.group)) {
          push({ id: `n-${n.href}`, group: n.group, label: n.label, href: n.href });
        }
      }
      for (const p of state.projects) {
        if (match(p.title, p.premise)) {
          push({
            id: `p-${p.id}`,
            group: "المشاريع",
            label: p.title,
            hint: p.premise.slice(0, 60),
            href: `/projects/${p.id}`,
            badge: <StageBadge stage={p.stage} />,
          });
        }
      }
      for (const i of state.ideas) {
        if (match(i.title, i.topic, i.angle)) {
          push({ id: `i-${i.id}`, group: "الأفكار", label: i.title, hint: i.angle, href: "/ideas" });
        }
      }
      for (const s of state.scripts) {
        if (match(s.title)) {
          push({
            id: `s-${s.id}`,
            group: "السكربتات",
            label: s.title,
            href: `/scripts?project=${s.projectId}`,
          });
        }
      }
      for (const s of state.sources) {
        if (match(s.title, s.domain, s.summary)) {
          push({ id: `src-${s.id}`, group: "المصادر", label: s.title.slice(0, 64), hint: s.domain, href: `/sources?project=${s.projectId}` });
        }
      }
      for (const v of state.videos) {
        if (match(v.title, v.channelName)) {
          push({
            id: `v-${v.id}`,
            group: "الفيديوهات",
            label: v.title.slice(0, 64),
            hint: `${v.channelName} · ${formatNumber(v.views)} مشاهدة`,
            href: "/youtube",
          });
        }
      }
      for (const m of state.memories) {
        if (match(m.key, m.value)) {
          push({ id: `m-${m.id}`, group: "الذاكرة", label: m.key, hint: m.value.slice(0, 60), href: "/memory" });
        }
      }
    } else {
      for (const a of PALETTE_ACTIONS.slice(0, 6)) {
        push({ id: `a-${a.id}`, group: "إجراءات", label: a.label, hint: a.hint, href: a.href });
      }
      for (const p of state.projects.slice(0, 4)) {
        push({
          id: `p-${p.id}`,
          group: "متابعة",
          label: p.title,
          href: `/projects/${p.id}`,
          badge: <StageBadge stage={p.stage} />,
        });
      }
    }
    return out.slice(0, 40);
  }, [query, state.projects, state.ideas, state.scripts, state.sources, state.videos, state.memories]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const go = (r: Result) => {
    onClose();
    router.push(r.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) go(r);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" aria-label="إغلاق" onClick={onClose} className="absolute inset-0 animate-fade-in bg-canvas-deep/80 backdrop-blur-[3px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="لوحة الأوامر"
        className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line-strong bg-panel shadow-float animate-fade-up"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-ink-mute" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `pal-${active}` : undefined}
            placeholder="ابحث في المشاريع، السكربتات، المصادر… أو نفّذ أمرًا"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="hidden shrink-0 rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:block">
            ESC
          </kbd>
        </div>

        <ul id="palette-list" ref={listRef} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-10 text-center text-xs text-ink-mute">
              لا نتائج لـ «{query}»
              <span className="mt-1 block text-2xs text-ink-faint">جرّب كلمة أقصر أو ابحث في قسم آخر</span>
            </li>
          )}
          {results.map((r, i) => {
            const showGroup = r.group !== lastGroup;
            lastGroup = r.group;
            return (
              <li key={r.id}>
                {showGroup && (
                  <div className="px-2.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    {r.group}
                  </div>
                )}
                <button
                  id={`pal-${i}`}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  data-active={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start transition-colors dur-1",
                    i === active ? "bg-panel-3 text-ink" : "text-ink-soft",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{r.label}</span>
                    {r.hint && <span className="block truncate text-2xs text-ink-mute">{r.hint}</span>}
                  </span>
                  {r.badge}
                  {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-ink-faint" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>

        <footer className="flex items-center gap-4 border-t border-line bg-surface px-4 py-2 text-[10px] text-ink-faint">
          <span className="flex items-center gap-1">
            <ArrowLeft className="size-3" aria-hidden />
            <kbd className="font-mono">↑↓</kbd> تنقّل
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono">Enter</kbd> فتح
          </span>
          <Badge tone="neutral" className="ms-auto">
            {results.length} نتيجة
          </Badge>
        </footer>
      </div>
    </div>
  );
}
