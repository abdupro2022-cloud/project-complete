"use client";

import React, { useMemo } from "react";

import { cn } from "@/lib/utils";

/**
 * Minimal, safe Markdown renderer.
 *
 * The app renders AI output here, so this deliberately does NOT use
 * `dangerouslySetInnerHTML`. Output is converted to a React tree, which means
 * no script injection is possible even if a model returns hostile markup.
 *
 * Supported: headings, bold, italic, inline code, fenced code, lists, block
 * quotes, horizontal rules, tables, and `[S01]`-style citation chips.
 */

type Block =
  | { t: "h"; level: 1 | 2 | 3 | 4; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "quote"; text: string }
  | { t: "code"; lang: string; text: string }
  | { t: "hr" }
  | { t: "table"; head: string[]; rows: string[][] };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced code
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      blocks.push({ t: "code", lang, text: buf.join("\n") });
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      blocks.push({ t: "h", level: h[1].length as 1 | 2 | 3 | 4, text: h[2] });
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }

    // Table: header row followed by a separator row
    if (line.includes("|") && lines[i + 1]?.match(/^\s*\|?[\s:|-]+\|[\s:|-]*$/)) {
      const cells = (r: string) =>
        r
          .replace(/^\s*\|/, "")
          .replace(/\|\s*$/, "")
          .split("|")
          .map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(cells(lines[i++]));
      }
      blocks.push({ t: "table", head, rows });
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ t: "quote", text: buf.join(" ") });
      continue;
    }

    // Lists
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      }
      blocks.push({ t: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      }
      blocks.push({ t: "ol", items });
      continue;
    }

    // Paragraph — consume until a blank line or the start of another block.
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|```|>|\s*[-*]\s|\s*\d+[.)]\s)/.test(lines[i])
    ) {
      buf.push(lines[i++]);
    }
    if (buf.length) blocks.push({ t: "p", text: buf.join(" ") });
    else i++;
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Inline formatting
// ---------------------------------------------------------------------------

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[S\d+\]|\[مصدر[^\]]*\])/g;

function Inline({ text, onCite }: { text: string; onCite?: (id: string) => void }) {
  const parts = useMemo(() => text.split(INLINE).filter((p) => p !== ""), [text]);

  return (
    <>
      {parts.map((part, idx) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return <strong key={idx} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
        }
        if (/^`[^`]+`$/.test(part)) {
          return (
            <code
              key={idx}
              className="rounded bg-panel-3 px-1 py-0.5 font-mono text-[0.8em] text-accent-soft"
              dir="ltr"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (/^\*[^*]+\*$/.test(part)) {
          return <em key={idx} className="italic text-ink-soft">{part.slice(1, -1)}</em>;
        }
        if (/^\[S\d+\]$/i.test(part)) {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onCite?.(part.replace(/[[\]]/g, ""))}
              className="cite"
              title="افتح المصدر"
            >
              {part}
            </button>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Markdown({
  content,
  onCite,
  className,
}: {
  content: string;
  onCite?: (id: string) => void;
  className?: string;
}) {
  const blocks = useMemo(() => parseBlocks(content ?? ""), [content]);

  if (!blocks.length) return null;

  return (
    <div className={cn("prose-doc", className)}>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h": {
            const sizes = {
              1: "text-xl font-semibold text-ink mt-6 first:mt-0",
              2: "text-lg font-semibold text-ink mt-6 first:mt-0",
              3: "text-md font-semibold text-ink mt-5 first:mt-0",
              4: "text-sm font-semibold text-ink-soft mt-4 first:mt-0",
            } as const;
            const Tag = (b.level === 1 ? "h2" : b.level === 2 ? "h3" : "h4") as "h2" | "h3" | "h4";
            return (
              <Tag key={i} className={sizes[b.level]}>
                <Inline text={b.text} onCite={onCite} />
              </Tag>
            );
          }
          case "p":
            return (
              <p key={i} className="my-3">
                <Inline text={b.text} onCite={onCite} />
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="my-3 space-y-1.5 ps-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
                    <span>
                      <Inline text={it} onCite={onCite} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="my-3 list-decimal space-y-1.5 ps-5 marker:text-ink-faint">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} onCite={onCite} />
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="my-4 rounded-e-lg border-s-2 border-accent/50 bg-accent-tint/40 px-4 py-3 text-ink-soft"
              >
                <Inline text={b.text} onCite={onCite} />
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={i}
                dir="ltr"
                className="my-4 overflow-x-auto rounded-lg border border-line bg-canvas-deep p-3 text-left font-mono text-xs leading-relaxed text-ink-soft"
              >
                <code>{b.text}</code>
              </pre>
            );
          case "hr":
            return <hr key={i} className="my-5 border-0 h-px bg-line" />;
          case "table":
            return (
              <div key={i} className="my-4 overflow-x-auto rounded-lg border border-line">
                <table className="w-full border-collapse text-start text-xs">
                  <thead>
                    <tr className="bg-panel-2">
                      {b.head.map((c, j) => (
                        <th key={j} className="border-b border-line px-3 py-2 text-start font-semibold text-ink-soft">
                          <Inline text={c} onCite={onCite} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="even:bg-panel/50">
                        {r.map((c, k) => (
                          <td key={k} className="border-b border-line-soft px-3 py-2 align-top text-ink-soft last:border-0">
                            <Inline text={c} onCite={onCite} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
