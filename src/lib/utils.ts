import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** RFC4122-ish id. crypto.randomUUID is available in every modern runtime we target. */
export function uid(prefix = ""): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 20)
      : Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
  return prefix ? `${prefix}_${raw}` : raw;
}

export const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const AR_NUM = new Intl.NumberFormat("ar-EG");

/** Compact numbers with Arabic-Indic digits handled by Intl. */
export function formatNumber(n: number, locale: "ar" | "en" = "ar"): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) {
    const v = n / 1_000_000;
    return `${locale === "ar" ? AR_NUM.format(Number(v.toFixed(1))) : v.toFixed(1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    const v = n / 1_000;
    return `${locale === "ar" ? AR_NUM.format(Number(v.toFixed(1))) : v.toFixed(1)}K`;
  }
  return locale === "ar" ? AR_NUM.format(n) : n.toLocaleString("en-US");
}

export function formatFullNumber(n: number, locale: "ar" | "en" = "ar"): string {
  if (!Number.isFinite(n)) return "—";
  return locale === "ar" ? AR_NUM.format(n) : n.toLocaleString("en-US");
}

/** 12:04 / 12:04 م — stable across server and client to avoid hydration drift. */
export function formatTime(iso: string, locale: "ar" | "en" = "ar"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "ص" : "م";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return locale === "ar" ? `${AR_NUM.format(h12)}:${m} ${period}` : `${h12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

/** "قبل ٣ دقائق" / "3m ago" — no dependency on the Intl.RelativeTimeFormat ICU build. */
export function timeAgo(iso: string, locale: "ar" | "en" = "ar"): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 45) return locale === "ar" ? "الآن" : "now";
  const units: [number, string, string][] = [
    [60, "دقيقة", "m"],
    [3600, "ساعة", "h"],
    [86400, "يوم", "d"],
    [604800, "أسبوع", "w"],
  ];
  let value = diff;
  let arLabel = "دقيقة";
  let enLabel = "m";
  if (diff < 3600) {
    value = Math.floor(diff / 60);
    arLabel = "دقيقة";
    enLabel = "m";
  } else if (diff < 86400) {
    value = Math.floor(diff / 3600);
    arLabel = "ساعة";
    enLabel = "h";
  } else if (diff < 604800) {
    value = Math.floor(diff / 86400);
    arLabel = "يوم";
    enLabel = "d";
  } else {
    value = Math.floor(diff / 604800);
    arLabel = "أسبوع";
    enLabel = "w";
  }
  void units;
  if (locale === "ar") {
    return `قبل ${AR_NUM.format(value)} ${arLabel}`;
  }
  return `${value}${enLabel} ago`;
}

export function formatDate(iso: string, locale: "ar" | "en" = "ar"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const monthsAr = [
    "يناير","فبراير","مارس","أبريل","مايو","يونيو",
    "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
  ];
  const day = d.getDate();
  if (locale === "ar") {
    return `${AR_NUM.format(day)} ${monthsAr[d.getMonth()]} ${AR_NUM.format(d.getFullYear())}`;
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** 1:23:45 or 12:07 for transcripts and video beats. */
export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Reading-speed estimate. Arabic narration lands around 130 wpm. */
export function estimateSpeechSeconds(text: string, wpm = 130): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  return Math.round((words / wpm) * 60);
}

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1).trimEnd()}…`;
}

/** Deterministic hostname extraction — never throws on malformed URLs. */
export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || "—";
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Masks a secret for display: "AIzaSy…Kj3f". Never returns the full value. */
export function maskSecret(secret: string): string {
  if (secret.length <= 10) return "••••••••";
  return `${secret.slice(0, 6)}…${secret.slice(-4)}`;
}

export function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// Arrays
// ---------------------------------------------------------------------------

export function groupBy<T, K extends string>(items: T[], key: (t: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const k = key(item);
      (acc[k] ||= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

export function uniqueBy<T>(items: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function sortBy<T>(items: T[], key: (t: T) => number | string, dir: "asc" | "desc" = "desc"): T[] {
  return [...items].sort((a, b) => {
    const av = key(a);
    const bv = key(b);
    const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "ar");
    return dir === "asc" ? cmp : -cmp;
  });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
