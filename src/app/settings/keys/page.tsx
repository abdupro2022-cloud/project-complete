"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { Badge, DemoTag, Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { ErrorState, InlineError } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ApiError, fetchHealth, removeKey, saveKey, testConnection, type HealthReport } from "@/lib/api/client";
import { INTEGRATIONS, type IntegrationId } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

/**
 * API key manager.
 *
 * Security contract enforced by this screen:
 *   - A key is typed into a password field, sent once over POST, and never
 *     read back. The server returns only a masked hint.
 *   - There is no "reveal" and no "copy existing key" — by design.
 *   - Removing a key asks for confirmation because it is destructive.
 *   - Nothing here ever writes a key to localStorage.
 */

interface State {
  id: IntegrationId;
  configured: boolean;
  source: "vault" | "env" | null;
  hint: string | null;
  persisted: boolean;
  config: Record<string, string>;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const toast = useToast();

  const [health, setHealth] = useState<HealthReport | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);

  const [editing, setEditing] = useState<IntegrationId | null>(null);
  const [removing, setRemoving] = useState<IntegrationId | null>(null);
  const [testing, setTesting] = useState<IntegrationId | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; detail: string }>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [h, keysRes] = await Promise.all([
        fetchHealth(true),
        fetch("/api/keys", { headers: { "Content-Type": "application/json" } })
          .then((r) => r.json())
          .catch(() => null),
      ]);
      setHealth(h);
      if (keysRes?.ok) setStates(keysRes.data.states as State[]);
    } catch (e) {
      setLoadError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stateOf = (id: IntegrationId): State | undefined => states.find((s) => s.id === id);

  const runTest = async (id: IntegrationId) => {
    setTesting(id);
    setTestResults((r) => {
      const n = { ...r };
      delete n[id];
      return n;
    });
    try {
      const res = await testConnection(id);
      setTestResults((r) => ({ ...r, [id]: { ok: res.ok, detail: res.detail } }));
      if (res.ok) toast.success("الاتصال ناجح", INTEGRATIONS.find((i) => i.id === id)?.name);
      else toast.warning("فشل الاختبار", res.detail);
    } catch (e) {
      const err = e as ApiError;
      setTestResults((r) => ({ ...r, [id]: { ok: false, detail: err.message } }));
    } finally {
      setTesting(null);
    }
  };

  const confirmRemove = async (id: IntegrationId) => {
    try {
      await removeKey(id);
      setStates((s) => s.map((x) => (x.id === id ? { ...x, configured: false, hint: null, source: null } : x)));
      setRemoving(null);
      toast.success("حُذف المفتاح", INTEGRATIONS.find((i) => i.id === id)?.name);
    } catch (e) {
      toast.error("تعذّر الحذف", (e as ApiError).message);
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState error={loadError} onRetry={() => void reload()} onConfigure={() => router.push("/settings/integrations")} />
      </div>
    );
  }

  const grouped = INTEGRATIONS.reduce<Record<string, typeof INTEGRATIONS>>((acc, m) => {
    (acc[m.category] ||= []).push(m);
    return acc;
  }, {});

  const CATEGORY_LABELS: Record<string, string> = {
    ai: "نماذج الذكاء الاصطناعي",
    research: "البحث والاستخراج",
    youtube: "YouTube",
    video: "الفيديو",
    automation: "الأتمتة",
    productivity: "الإنتاجية",
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">مفاتيح API</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-mute">
          المفاتيح تُحفظ في خادم التطبيق ولا تُعرض بعد الحفظ. لا يمكن استرجاعها من هنا — يمكنك تحديثها أو حذفها فقط.
        </p>
        {health && !health.vaultPersistent && (
          <div className="mt-4 rounded-lg border border-attention/25 bg-attention-tint/40 px-4 py-3">
            <p className="text-2xs leading-relaxed text-attention">
              <span className="font-semibold">تنبيه أمني:</span> لم يُضبط متغيّر البيئة{" "}
              <code className="font-mono">ABDO_VAULT_SECRET</code>، لذا تُحفظ المفاتيح في ذاكرة الخادم فقط
              وتُفقد عند إعادة التشغيل. لم تُكتب أي مفتاح على القرص.
            </p>
          </div>
        )}
      </header>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-line bg-panel" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <Section key={category} title={CATEGORY_LABELS[category] ?? category}>
              <ul className="space-y-2.5">
                {items.map((meta) => {
                  const st = stateOf(meta.id);
                  const result = testResults[meta.id];
                  return (
                    <li key={meta.id}>
                      <Panel className="overflow-hidden">
                        <div className="flex flex-wrap items-start gap-4 p-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-ink">{meta.name}</h3>
                              {st?.configured ? (
                                <Badge tone="ok" icon={<StatusDot tone="ok" />}>
                                  متصل {st.source === "env" ? "· من البيئة" : "· من الخزنة"}
                                </Badge>
                              ) : (
                                <Badge tone="neutral">غير مُعدّ</Badge>
                              )}
                              {result && (
                                <Badge tone={result.ok ? "ok" : "danger"}>{result.ok ? "اختبار ناجح" : "اختبار فاشل"}</Badge>
                              )}
                            </div>

                            <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">{meta.description}</p>

                            {meta.notes && (
                              <p className="mt-2 rounded-md border border-line/60 bg-panel/60 px-2.5 py-1.5 text-2xs text-ink-soft">
                                {meta.notes}
                              </p>
                            )}

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              {st?.configured && st.hint && (
                                <code className="rounded bg-panel-2 px-2 py-0.5 font-mono text-2xs text-ink-mute">
                                  {st.hint}
                                </code>
                              )}
                              <span className="font-mono text-[10px] text-ink-faint">{meta.envVar}</span>
                              {meta.keyUrl && (
                                <a
                                  href={meta.keyUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-flex items-center gap-1 text-2xs text-accent-soft hover:underline"
                                >
                                  احصل على مفتاح
                                  <ExternalLink className="size-2.5" aria-hidden />
                                </a>
                              )}
                            </div>

                            <ul className="mt-2.5 flex flex-wrap gap-1.5">
                              {meta.capabilities.map((c) => (
                                <li key={c}>
                                  <Badge tone="neutral">{c}</Badge>
                                </li>
                              ))}
                            </ul>

                            {result && !result.ok && (
                              <p className="mt-2.5 text-2xs leading-relaxed text-danger">{result.detail}</p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="subtle"
                              onClick={() => void runTest(meta.id)}
                              loading={testing === meta.id}
                              icon={testing === meta.id ? undefined : <RefreshCw className="size-3.5" />}
                            >
                              اختبار
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditing(meta.id)}
                              icon={<KeyRound className="size-3.5" />}
                            >
                              {st?.configured ? "تحديث" : "إضافة"}
                            </Button>
                            {st?.configured && (
                              <IconButton
                                label={`حذف مفتاح ${meta.name}`}
                                size="sm"
                                variant="ghost"
                                onClick={() => setRemoving(meta.id)}
                                className="text-ink-faint hover:text-danger"
                              >
                                <Trash2 className="size-3.5" aria-hidden />
                              </IconButton>
                            )}
                          </div>
                        </div>
                      </Panel>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ))}
        </div>
      )}

      <KeyDialog
        integrationId={editing}
        existingConfig={editing ? (stateOf(editing)?.config ?? {}) : {}}
        onClose={() => setEditing(null)}
        onSaved={async (persisted) => {
          setEditing(null);
          await reload();
          toast.success(
            "حُفظ المفتاح",
            persisted
              ? "مشفّر على الخادم. لن يظهر مرة أخرى."
              : "محفوظ في ذاكرة الخادم فقط — اضبط ABDO_VAULT_SECRET لحفظ دائم.",
          );
        }}
      />

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="حذف المفتاح"
        description="هذا الإجراء لا يمكن التراجع عنه. لن يعمل المزوّد حتى تضبط مفتاحًا جديدًا."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => removing && void confirmRemove(removing)}
              icon={<Trash2 className="size-3.5" />}
            >
              حذف نهائي
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          هل تريد حذف مفتاح{" "}
          <span className="font-semibold text-ink">
            {INTEGRATIONS.find((i) => i.id === removing)?.name}
          </span>{" "}
         ؟
        </p>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / update dialog
// ---------------------------------------------------------------------------

function KeyDialog({
  integrationId,
  existingConfig,
  onClose,
  onSaved,
}: {
  integrationId: IntegrationId | null;
  existingConfig?: Record<string, string>;
  onClose: () => void;
  onSaved: (persisted: boolean) => void;
}) {
  const meta = INTEGRATIONS.find((i) => i.id === integrationId);
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    if (integrationId) {
      setValue("");
      setShow(false);
      setError(null);
      setConfig({ ...(existingConfig ?? {}) });
    }
  }, [integrationId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!integrationId || !meta) return null;

  const submit = async () => {
    if (value.trim().length < 8) {
      setError("المفتاح قصير جدًا. تأكد من لصق المفتاح كاملًا.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Only send non-empty config fields so partial forms don't blank out
      // values the user didn't touch.
      const cfg = Object.fromEntries(
        Object.entries(config).filter(([, v]) => v.trim().length > 0),
      );
      const res = await saveKey(integrationId, value.trim(), cfg);
      setValue("");
      onSaved(res.persisted);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${meta.name} — المفتاح`}
      description={meta.description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={busy}>
            حفظ المفتاح
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-2xs font-medium text-ink-soft">
            <Check className="size-3 text-ok" aria-hidden />
            يُحفظ على الخادم فقط
          </p>
          <p className="mt-1 text-2xs leading-relaxed text-ink-mute">
            لا يُرسل المفتاح إلى المتصفح مرة أخرى بعد الحفظ، ولا يظهر في ملفات المشروع.
          </p>
        </div>

        <Field
          label="مفتاح API"
          required
          error={error}
          hint={meta.keyUrl ? undefined : "احصل على المفتاح من مزوّد الخدمة ثم الصقه هنا."}
        >
          {(id, desc) => (
            <div className="relative">
              <Input
                id={id}
                aria-describedby={desc}
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••••••••••••••"
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                mono
                className="pe-10 text-start"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "إخفاء المفتاح" : "إظهار المفتاح"}
                className="absolute end-1 top-1/2 -translate-y-1/2 rounded p-2 text-ink-faint transition-colors hover:text-ink"
              >
                {show ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
              </button>
            </div>
          )}
        </Field>

        {meta.requiredFields?.length ? (
          <div className="space-y-3 rounded-lg border border-line bg-panel px-3.5 py-3">
            <p className="text-2xs leading-relaxed text-ink-mute">
              هذا المزوّد يحتاج إعدادات إضافية. تُضبط من متغيّرات البيئة أو تُضاف لاحقًا في ملف التكامل.
            </p>
            {meta.requiredFields.map((f) => (
              <Field key={f.key} label={f.label}>
                {(id) => (
                  <Input
                    id={id}
                    value={config[f.key] ?? ""}
                    onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    dir="ltr"
                    mono
                  />
                )}
              </Field>
            ))}
          </div>
        ) : null}

        {meta.keyUrl && (
          <a
            href={meta.keyUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-2xs text-accent-soft hover:underline"
          >
            <ExternalLink className="size-3" aria-hidden />
            افتح لوحة {meta.name} للحصول على مفتاح
          </a>
        )}
      </div>
    </Modal>
  );
}
