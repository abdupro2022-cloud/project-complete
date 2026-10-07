"use client";

import Link from "next/link";
import { FlaskConical, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

/**
 * Demo-mode banner.
 *
 * Shown only while there is no live provider, and it states exactly what is
 * real and what is simulated. Silently mixing the two would be the single
 * worst failure mode for a tool whose whole job is trustworthy sourcing.
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-attention/20 bg-attention-tint/60 px-4 py-2"
    >
      <FlaskConical className="size-3.5 shrink-0 text-attention" aria-hidden />
      <p className="min-w-0 flex-1 text-2xs leading-relaxed text-attention">
        <span className="font-semibold">الوضع التجريبي.</span> لا يوجد مزوّد متصل بعد، لذا نتائج البحث والتحليل
        مُولَّدة محليًا لتوضيح الشكل. كل ما تنشئه يُحفظ على جهازك ويبقى كما هو عند ربط المفاتيح.
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link href="/settings/integrations">
          <Button size="sm" variant="subtle">
            اربط مزوّدًا
          </Button>
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إخفاء شريط الوضع التجريبي"
          className="rounded p-1 text-attention/70 transition-colors hover:text-attention"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
