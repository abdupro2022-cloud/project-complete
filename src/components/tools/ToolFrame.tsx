"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plug, Sparkles, Wrench } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge, Panel, PanelHeader } from "@/components/ui/Surface";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiError } from "@/lib/api/client";
import { useApp } from "@/lib/store/provider";

/**
 * Shared tool page frame.
 *
 * Every standalone tool follows the same contract: state the integration it
 * needs, say plainly what is not connected yet, run for real, and show the raw
 * result so the user can judge the tool rather than trust a summary.
 */
export function ToolFrame({
  title,
  description,
  integration,
  input,
  children,
  onResult,
}: {
  title: string;
  description: string;
  integration: { name: string; envVar: string };
  input: React.ReactNode;
  children: React.ReactNode;
  onResult?: React.ReactNode;
}) {
  const router = useRouter();
  const { state } = useApp();
  const st = state.integrationState.find((i) => i.id === integration.envVar);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/tools"
        className="mb-3 inline-flex items-center gap-1.5 text-2xs text-ink-mute transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3" aria-hidden />
        كل الأدوات
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">{title}</h1>
          {st?.status === "connected" ? (
            <Badge tone="ok">متصل</Badge>
          ) : (
            <Badge tone="warn">
              <Plug className="size-2.5" />
              يحتاج مفتاحًا
            </Badge>
          )}
        </div>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">{description}</p>
      </header>

      <Panel className="mb-4 overflow-hidden">
        <PanelHeader
          title="المدخل"
          subtitle={`يعمل عبر: ${integration.name}`}
          icon={<Wrench className="size-4" />}
        />
        <div className="p-4">{input}</div>
      </Panel>

      {children}
      {onResult}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/settings/integrations">
          <Button size="sm" variant="secondary" icon={<Plug className="size-3.5" />}>
            إدارة {integration.name}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/** Standard result surface: state, copy, and a clear demo badge. */
export function ToolResult({
  title,
  demo,
  error,
  loading,
  empty,
  onCopy,
  children,
}: {
  title: string;
  demo?: boolean;
  error?: ApiError | null;
  loading?: boolean;
  empty?: boolean;
  onCopy?: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <Panel className="p-4" aria-busy>
        <p className="text-xs text-ink-mute">جارٍ التنفيذ…</p>
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-panel-2" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-panel-2" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-panel-2" />
        </div>
      </Panel>
    );
  }
  if (error) {
    return <ErrorState error={error} />;
  }
  if (empty) {
    return <EmptyState compact title="لا نتيجة بعد" description="أدخل المُدخل أعلاه واضغط تنفيذ." />;
  }
  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title={title}
        actions={
          <div className="flex items-center gap-2">
            {demo && <Badge tone="warn">وضع تجريبي</Badge>}
            {onCopy && (
              <Button size="sm" variant="ghost" onClick={onCopy}>
                نسخ
              </Button>
            )}
          </div>
        }
      />
      <div className="p-4">{children}</div>
    </Panel>
  );
}

/** Copy helper shared by every tool. */
export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the text is still selectable on screen */
    }
  };
  return { copy, copied };
}

export { Field, Input, Select, Textarea, Sparkles };
