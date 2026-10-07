"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, CircleHelp, ShieldQuestion, TriangleAlert, X } from "lucide-react";

import { Badge, ClaimStatusBadge, CredibilityBadge, Panel, PanelHeader, Section, Tone } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { ProjectPicker } from "@/components/research/SourceList";
import { useApp } from "@/lib/store/provider";
import { cn, timeAgo } from "@/lib/utils";
import type { Claim, ClaimStatus, Contradiction } from "@/lib/types";

/**
 * Fact check.
 *
 * The rule this screen enforces: a claim is never presented as confirmed on
 * the strength of one source. Source count is shown on every claim, and the
 * status of anything below two sources says so in words, not just in colour.
 */
export function FactCheckView({
  claims,
  contradictions,
}: {
  claims: Claim[];
  contradictions: Contradiction[];
}) {
  const { state, actions } = useApp();
  const [openCon, setOpenCon] = useState<string | null>(null);
  const [openClaim, setOpenClaim] = useState<string | null>(null);

  const summary = useMemo(() => {
    const s: Record<ClaimStatus, number> = {
      supported: 0,
      contradicted: 0,
      unclear: 0,
      needs_verification: 0,
    };
    for (const c of claims) s[c.status]++;
    return s;
  }, [claims]);

  const unresolved = contradictions.filter((c) => !c.resolved);

  const setStatus = (id: string, status: ClaimStatus) =>
    actions.patch("claims", id, { status });

  if (claims.length === 0 && contradictions.length === 0) {
    return (
      <EmptyState
        icon={<ShieldQuestion className="size-4" />}
        title="لا ادعاءات بعد"
        description="الادعاءات تُستخرج من المصادر تلقائيًا. بدون ادعاءات لا يوجد ما يمكن التحقق منه."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* --- summary --------------------------------------------------------- */}
      <Panel className="sheen overflow-hidden">
        <PanelHeader
          title="ملخّص التحقق"
          subtitle="مصدر واحد لا يكفي لتأكيد رقم في فيديو"
          icon={<ShieldQuestion className="size-4" />}
        />
        <div className="grid gap-px bg-line sm:grid-cols-5">
          <Cell label="الإجمالي" value={claims.length} />
          <Cell label="مؤكد" value={summary.supported} tone="ok" />
          <Cell label="غير واضح" value={summary.unclear} tone="warn" />
          <Cell label="يحتاج تحقق" value={summary.needs_verification} tone="accent" />
          <Cell label="متناقض" value={summary.contradicted} tone="danger" />
        </div>
        {claims.some((c) => c.sourceIds.length < 2) && (
          <p className="border-t border-line bg-attention-tint/30 px-4 py-2.5 text-2xs leading-relaxed text-attention">
            {claims.filter((c) => c.sourceIds.length < 2).length} ادعاءًا يعتمد على مصدر واحد فقط. لا تعرضها
            في الفيديو كحقيقة قبل مصدر ثانٍ مستقل.
          </p>
        )}
      </Panel>

      {/* --- contradictions ---------------------------------------------------- */}
      <Section
        title="التناقضات"
        aside={
          unresolved.length > 0 ? (
            <Badge tone="warn">
              {unresolved.length} غير محسوم
            </Badge>
          ) : contradictions.length > 0 ? (
            <Badge tone="ok">كلها محسومة</Badge>
          ) : null
        }
      >
        {contradictions.length === 0 ? (
          <EmptyState
            compact
            title="لا تعارض بين المصادر"
            description="كل رقم ظهر في أكثر من مصدر يتفق مع بقية المصادر."
          />
        ) : (
          <ul className="space-y-2.5">
            {contradictions.map((c) => {
              const open = openCon === c.id;
              const sev: Tone = c.severity === "high" ? "danger" : c.severity === "medium" ? "warn" : "neutral";
              return (
                <li key={c.id}>
                  <Panel className={cn("overflow-hidden", !c.resolved && "border-attention/25")}>
                    <button
                      type="button"
                      onClick={() => setOpenCon(open ? null : c.id)}
                      aria-expanded={open}
                      className="flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-panel-2"
                    >
                      <TriangleAlert
                        className={cn("mt-0.5 size-4 shrink-0", c.resolved ? "text-ok" : "text-attention")}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-ink">{c.summary}</h3>
                          <Badge tone={c.resolved ? "ok" : sev}>{c.resolved ? "محسوم" : `خطورة ${c.severity}`}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-2xs leading-relaxed text-ink-mute">{c.whatDiffers}</p>
                      </div>
                      <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-ink-faint transition-transform", open && "rotate-180")} aria-hidden />
                    </button>

                    {open && (
                      <div className="space-y-3.5 border-t border-line bg-surface px-4 py-3.5">
                        <Detail label="ما الذي اختلف؟" body={c.whatDiffers} />
                        <Detail label="لماذا قد يختلف المصدران؟" body={c.whyItMayDiffer} />
                        <Detail
                          label="ما الرقم الذي يمكن الاعتماد عليه؟"
                          body={
                            c.recommendedValue
                              ? `${c.recommendedValue}\n${c.recommendedReason ?? ""}`
                              : "لا يوجد رقم يمكن الاعتماد عليه بثقة — اذكر النقطتين كما هما."
                          }
                          accent
                        />

                        {c.claimIds.length > 0 && (
                          <div>
                            <h4 className="label mb-1.5">الادعاءات المرتبطة</h4>
                            <ul className="space-y-1.5">
                              {c.claimIds.map((cid) => {
                                const claim = claims.find((x) => x.id === cid);
                                if (!claim) return null;
                                return (
                                  <li key={cid} className="rounded-lg border border-line bg-panel px-3 py-2">
                                    <p className="text-2xs text-ink-soft">{claim.text}</p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                      <ClaimStatusBadge status={claim.status} />
                                      <span className="num text-[10px] text-ink-faint">
                                        {claim.sourceIds.length} مصدر
                                      </span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 border-t border-line pt-3">
                          <Button
                            size="sm"
                            variant={c.resolved ? "subtle" : "primary"}
                            icon={c.resolved ? <X className="size-3.5" /> : <Check className="size-3.5" />}
                            onClick={() => actions.patch("contradictions", c.id, { resolved: !c.resolved })}
                          >
                            {c.resolved ? "إعادة الفتح" : "اعتبره محسومًا"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Panel>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* --- claims ------------------------------------------------------------ */}
      <Section title="الادعاءات" aside={<Badge tone="neutral">{claims.length}</Badge>}>
        {claims.length === 0 ? (
          <EmptyState compact title="لا ادعاءات" description="استخرجت من المصادر بعد تشغيل بحث." />
        ) : (
          <Panel className="overflow-hidden">
            <ul className="divide-y divide-line-soft">
              {claims.map((c) => {
                const open = openClaim === c.id;
                const sources = c.sourceIds
                  .map((id) => state.sources.find((s) => s.id === id) ?? state.sources.find((s) => s.url === id))
                  .filter((s): s is NonNullable<typeof s> => Boolean(s));
                const weak = sources.length < 2;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setOpenClaim(open ? null : c.id)}
                      aria-expanded={open}
                      className="flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-panel-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-ink">{c.text}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <ClaimStatusBadge status={c.status} />
                          {weak ? (
                            <Badge tone="warn" icon={<CircleHelp className="size-2.5" />}>
                              مصدر واحد
                            </Badge>
                          ) : (
                            <Badge tone="ok" mono>
                              {sources.length} مصادر
                            </Badge>
                          )}
                          {c.value !== null && <Badge tone="neutral" mono>{c.value}</Badge>}
                        </div>
                      </div>
                      <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-ink-faint transition-transform", open && "rotate-180")} aria-hidden />
                    </button>

                    {open && (
                      <div className="space-y-3 border-t border-line bg-surface px-4 py-3.5">
                        {c.resolution && <Detail label="الحل" body={c.resolution} />}

                        <div>
                          <h4 className="label mb-1.5">المصادر ({sources.length})</h4>
                          {sources.length === 0 ? (
                            <p className="text-2xs text-danger">لا مصدر مرتبط بهذا الادعاء — لا يمكن عرضه.</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {sources.map((s) => (
                                <li key={s.id} className="flex items-center gap-2">
                                  <CredibilityBadge tier={s.credibility} />
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="min-w-0 flex-1 truncate text-2xs text-accent-soft hover:underline"
                                  >
                                    {s.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {weak && (
                          <p className="rounded-lg border border-attention/25 bg-attention-tint/30 px-3 py-2 text-2xs leading-relaxed text-attention">
                            مصدر واحد لا يجعل الادعاء مؤكدًا. إما أن تجد مصدرًا مستقلًا يطابقه، أو أن تذكره
                            في الفيديو بوصفه ادعاءً غير محسوم.
                          </p>
                        )}

                        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-3">
                          {(["supported", "unclear", "needs_verification", "contradicted"] as ClaimStatus[]).map((st) => (
                            <Button
                              key={st}
                              size="sm"
                              variant={c.status === st ? "primary" : "ghost"}
                              onClick={() => setStatus(c.id, st)}
                            >
                              {st === "supported" ? "مؤكد" : st === "unclear" ? "غير واضح" : st === "contradicted" ? "متناقض" : "يحتاج تحقق"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
      </Section>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: number; tone?: Tone }) {
  return (
    <div className="bg-panel px-4 py-3.5">
      <p className="text-2xs text-ink-mute">{label}</p>
      <p
        className={cn(
          "num mt-1 text-lg font-semibold",
          value === 0 ? "text-ink-faint" : tone === "ok" ? "text-ok" : tone === "warn" ? "text-attention" : tone === "danger" ? "text-danger" : tone === "accent" ? "text-accent" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Detail({ label, body, accent }: { label: string; body: string; accent?: boolean }) {
  return (
    <div>
      <h4 className="label mb-1">{label}</h4>
      <p
        className={cn(
          "whitespace-pre-wrap text-xs leading-relaxed",
          accent ? "rounded-lg border border-accent/25 bg-accent-tint/40 px-3 py-2.5 text-ink" : "text-ink-soft",
        )}
      >
        {body}
      </p>
    </div>
  );
}

export function CrossProjectFactCheck() {
  const { state } = useApp();
  const [picked, setPicked] = useState("");
  const claims = state.claims.filter((c) => !picked || c.projectId === picked);
  const contradictions = state.contradictions.filter((c) => !picked || c.projectId === picked);

  return (
    <div className="space-y-5">
      <ProjectPicker value={picked} onChange={setPicked} />
      <FactCheckView claims={claims} contradictions={contradictions} />
    </div>
  );
}

export { timeAgo };
