"use client";

/**
 * Reusable decorative motifs drawn from the ABDO Creator OS visual DNA:
 * layered chevron panels, marble planet, glowing accent bar, scattered dots,
 * thin yellow circuit-board lines, and cross markers. All are pure SVG so
 * they stay sharp at any size, scale with the layout, and never hit the
 * network. Use them as accents — never as content — and respect
 * `prefers-reduced-motion`.
 */

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// PanelStack — layered chevron diamond panels in dark gray with yellow edges
// ---------------------------------------------------------------------------

export function PanelStack({
  size = 240,
  className,
  ariaHidden = true,
}: {
  size?: number;
  className?: string;
  ariaHidden?: boolean;
}) {
  const layers = [0, 1, 2, 3, 4];
  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * 1.2}
      className={cn(className)}
      aria-hidden={ariaHidden}
      focusable="false"
    >
      <defs>
        <linearGradient id="ps-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC93C" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFC93C" stopOpacity="1" />
          <stop offset="1" stopColor="#FFC93C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {layers.map((i) => {
        const inset = i * 14;
        const stroke = i === 0 ? "url(#ps-edge)" : i === 2 ? "#FFC93C" : "transparent";
        const fill = `hsl(220 8% ${18 + i * 3}%)`;
        return (
          <polygon
            key={i}
            points={`100,${20 + inset} ${180 - inset},120 ${100},${220 - inset} ${20 + inset},120`}
            fill={fill}
            stroke={stroke}
            strokeWidth={i === 2 ? 1.5 : 0}
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// AccentBar — vertical yellow glow bar (the signature motif from the brand)
// ---------------------------------------------------------------------------

export function AccentBar({
  height = 240,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 240"
      width={16}
      height={height}
      className={cn(className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="ab-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFC93C" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFE07A" stopOpacity="1" />
          <stop offset="1" stopColor="#FFC93C" stopOpacity="0" />
        </linearGradient>
        <filter id="ab-blur">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <rect x="2" y="0" width="12" height="240" fill="url(#ab-glow)" filter="url(#ab-blur)" />
      <rect x="6" y="20" width="4" height="200" fill="#FFE07A" rx="2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DotGrid — scattered dots and tiny markers
// ---------------------------------------------------------------------------

export function DotGrid({
  width = 320,
  height = 200,
  className,
  density = "low",
}: {
  width?: number;
  height?: number;
  className?: string;
  density?: "low" | "medium";
}) {
  // Deterministic positions so SSR + CSR match.
  const low: Array<[number, number, number]> = [
    [0.12, 0.18, 2.5],
    [0.32, 0.42, 1.5],
    [0.55, 0.20, 2],
    [0.78, 0.34, 1.5],
    [0.21, 0.74, 2],
    [0.45, 0.85, 1.5],
    [0.68, 0.62, 2.5],
    [0.88, 0.78, 1.5],
    [0.05, 0.55, 1.5],
    [0.92, 0.10, 2],
  ];
  const medium = [...low,
    [0.15, 0.32, 1],
    [0.40, 0.55, 1],
    [0.60, 0.78, 1],
    [0.82, 0.50, 1],
    [0.25, 0.05, 1],
    [0.70, 0.05, 1],
  ];
  const dots = density === "medium" ? medium : low;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("pointer-events-none", className)}
      aria-hidden
      focusable="false"
    >
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x * width} cy={y * height} r={r} fill="#FFC93C" opacity={0.7} />
      ))}
      {/* A pair of cross markers */}
      <g stroke="#FFC93C" strokeWidth="1" opacity={0.6}>
        <path d={`M ${width * 0.10 - 6} ${height * 0.10} L ${width * 0.10 + 6} ${height * 0.10}`} />
        <path d={`M ${width * 0.10} ${height * 0.10 - 6} L ${width * 0.10} ${height * 0.10 + 6}`} />
        <path d={`M ${width * 0.85 - 6} ${height * 0.85} L ${width * 0.85 + 6} ${height * 0.85}`} />
        <path d={`M ${width * 0.85} ${height * 0.85 - 6} L ${width * 0.85} ${height * 0.85 + 6}`} />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// OrbGroup — a marbled Saturn-like planet with a solid amber moon
// ---------------------------------------------------------------------------

export function OrbGroup({
  size = 220,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 240 200" width={size} height={(size * 200) / 240} className={cn(className)} aria-hidden focusable="false">
      <defs>
        <radialGradient id="og-planet" cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#D9DDE3" />
          <stop offset="1" stopColor="#7C828A" />
        </radialGradient>
        <radialGradient id="og-moon" cx="0.35" cy="0.35" r="0.65">
          <stop offset="0" stopColor="#FFD566" />
          <stop offset="1" stopColor="#D78A1A" />
        </radialGradient>
        <linearGradient id="og-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFC93C" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFC93C" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFC93C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Saturn ring (behind) */}
      <ellipse cx="120" cy="100" rx="92" ry="22" fill="none" stroke="url(#og-ring)" strokeWidth="2.5" />
      {/* Planet */}
      <circle cx="120" cy="100" r="62" fill="url(#og-planet)" />
      <path
        d="M 60 95 Q 80 80 110 95 T 160 100 T 180 110"
        stroke="#7C828A"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 70 115 Q 100 105 140 115 T 180 115"
        stroke="#7C828A"
        strokeWidth="1.5"
        fill="none"
        opacity="0.45"
      />
      {/* Moon */}
      <circle cx="200" cy="60" r="14" fill="url(#og-moon)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// CircuitLines — thin yellow circuit-board line accents
// ---------------------------------------------------------------------------

export function CircuitLines({
  width = 360,
  height = 240,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  const paths = [
    "M 0 60 L 80 60 L 100 80 L 200 80",
    "M 360 120 L 260 120 L 240 140 L 140 140",
    "M 60 200 L 120 200 L 140 180 L 240 180",
    "M 360 40 L 300 40 L 280 60 L 200 60",
  ];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("pointer-events-none", className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="cl-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFC93C" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFC93C" stopOpacity="1" />
          <stop offset="1" stopColor="#FFC93C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <g key={i}>
          <path d={d} stroke="url(#cl-fade)" strokeWidth="1.4" fill="none" />
          <circle cx={d.split(" L ").slice(-1)[0].split(" ")[0]} cy={d.split(" L ").slice(-1)[0].split(" ")[1]} r="2.5" fill="#FFC93C" />
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SectionBackdrop — composes the full motif for any page background
// ---------------------------------------------------------------------------

export function SectionBackdrop({
  variant = "default",
  className,
}: {
  variant?: "default" | "research" | "ai" | "timeline" | "subtle";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* Warm halo */}
      <div className="absolute -top-32 end-1/3 h-72 w-72 rounded-full bg-amber-500/8 blur-3xl" />
      <div className="absolute top-1/3 -start-24 h-72 w-72 rounded-full bg-amber-300/5 blur-3xl" />
      {/* Floating chevron */}
      {variant !== "subtle" && (
        <PanelStack size={variant === "default" ? 220 : 160} className="absolute top-6 end-6 opacity-90" />
      )}
      {/* Vertical accent bar */}
      <AccentBar height={260} className="absolute top-12 start-6 opacity-80" />
      {/* Scattered dots */}
      <DotGrid width={320} height={200} density={variant === "subtle" ? "low" : "medium"} className="absolute bottom-8 end-12 opacity-90" />
      {/* Circuit lines */}
      <CircuitLines width={360} height={240} className="absolute top-1/2 start-1/3 opacity-70" />
      {/* Saturn-orbit motif on AI variant */}
      {variant === "ai" && <OrbGroup size={220} className="absolute -bottom-4 end-1/4 opacity-90" />}
      {/* Subtle bottom-right orb on research */}
      {variant === "research" && <OrbGroup size={180} className="absolute -bottom-6 start-1/4 opacity-80" />}
    </div>
  );
}