"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Check, FlaskConical, Link2, Plus, Sparkles, X } from "lucide-react";

import { ProjectWorkspace, ViewHeader } from "@/components/projects/ProjectWorkspace";
import { Composer, WorkflowPanel } from "@/components/ai/Composer";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Panel, PanelHeader, Section, Badge, DemoTag } from "@/components/ui/Surface";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ApiError, scrapePage } from "@/lib/api/client";
import { buildPlan, runPlan, type RunStep } from "@/lib/workflow/runner";
import { useActiveMemories, useApp, useProjectBundle } from "@/lib/store/provider";
import { domainOf, uid } from "@/lib/utils";
import type { ResearchAngle } from "@/lib/types";

/**
 * Research Lab.
 *
 * Order of work: brief → evidence → structure. The brief is editable because a
 * research session that answers the wrong question is worse than no research.
 */
export default function ResearchLabPage() {
  const { id } = useParams<{ id: string }>();
  const { state, actions } = useApp();
  const toast = useToast();
  const bundle = useProjectBundle(id);
  const project = state.projects.find((p) => p.id === id) ?? null;
  const memories = useActiveMemories();
  const brief = bundle.brief;

  const [question, setQuestion] = useState("");
  const [steps, setSteps] = useState<RunStep[]>([]);
  const [running, setRunning] = useState(false);
  const [answer, setAnswer] = useState("");

  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<ApiError | null>(null);

  const [angleId, setAngleId] = useState<string | null>(null);

  const persistBrief = (changes: Partial<typeof brief>) => {
    if (!project) return;
    actions.upsertBrief({
      ...(brief ?? {
        id: uid("brf"),
        projectId: id,
        topic: project.title,
        mainQuestion: "",
        subQuestions: [],
        researchGoal: "",
        targetAudience: project.audience,
        contentType: project.contentType,
        suggestedAngles: [],
      }),
      ...changes,
    });
  };

  const runResearch = async () => {
    if (!question.trim() || running) return;
    setRunning(true);
    setAnswer("");
    setSteps([]);
    try {
      const plan = await buildPlan(question.trim());
      const result = await runPlan(
        plan,
        { project, memories: memories.map((m) => ({ key: m.key, value: m.value })) },
        (s) => setSteps((prev) => {
          const i = prev.findIndex((x) => x.id === s.id);
          if (i < 0) return [...prev, s];
          const next = [...prev];
          next[i] = s;
          return next;
        }),
      );
      if (project) {
        const created = (result.output.sources ?? []).map((s) => actions.addSource({ ...s, projectId: project.id }));
        (result.output.claims ?? []).forEach((c) => actions.addClaim({ ...c, projectId: project.id }));
        (result.output.events ?? []).forEach((e) => actions.addEvent({ ...e, projectId: project.id }));
        if (created.length) {
          actions.logActivity({
            what: `بحث ويب: ${created.length} مصدر`,
            projectId: project.id,
            projectTitle: project.title,
            toolName: "search_web",
            outcome: "success",
            detail: "من مختبر البحث",
          });
          actions.setProjectStage(project.id, "research");
        }
      }
      setAnswer(result.answer);
      if (result.serverUnavailable) {
        toast.warning("الوضع التجريبي", "اربط مزوّد بحث للحصول على نتائج حقيقية.");
      }
    } finally {
      setRunning(false);
    }
  };

  const addSource = async () => {
    if (!/^https?:\/\//i.test(url.trim())) {
      setAddError(new ApiError("validation", "أدخل رابطًا كاملًا يبدأ بـ https://"));
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const page = await scrapePage(url.trim());
      if (project) {
        actions.addSource({
          projectId: project.id,
          researchSessionId: null,
          title: page.title,
          url: page.url,
          domain: domainOf(page.url),
          sourceType: "other",
          publishedAt: null,
          credibility: "unknown",
          summary: page.markdown.slice(0, 700),
          quotes: [],
          extractedFacts: [],
          isDemo: page.demo,
        });
        actions.logActivity({
          what: "أضاف مصدرًا يدويًا",
          projectId: project.id,
          projectTitle: project.title,
          toolName: "scrape_page",
          outcome: "success",
          detail: domainOf(page.url),
        });
      }
      setUrl("");
      toast.success("أُضيف المصدر");
    } catch (e) {
      setAddError(e as ApiError);
    } finally {
      setAdding(false);
    }
  };

  if (!project) return null;

  return (
    <ProjectWorkspace>
      <ViewHeader
        title="مختبر البحث"
        description="ابدأ من السؤال، لا من البحث. كل مصدر يُحفظ داخل المشروع ويُستخدم لاحقًا في السكربت والتحقق."
        badge={bundle.sources.length > 0 ? <Badge tone="accent">{bundle.sources.length} مصدر</Badge> : undefined}
      />

      {/* --- run research ------------------------------------------------- */}
      <Panel className="sheen mb-5 overflow-hidden">
        <PanelHeader
          title="ابدأ البحث"
          subtitle="اكتب السؤال لا الكلمة المفتاحية — النتائج أدق"
          icon={<FlaskConical className="size-4" />}
        />
        <div className="space-y-4 p-4">
          <Field label="السؤال أو الموضوع">
            {(fid, desc) => (
              <Textarea
                id={fid}
                aria-describedby={desc}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                placeholder="لماذا فشلت شركة X رغم نجاح جولتها الأخيرة؟"
              />
            )}
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => void runResearch()} loading={running} icon={<Sparkles className="size-4" />}>
              ابدأ البحث
            </Button>
            {brief?.mainQuestion && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuestion(brief.mainQuestion)}
              >
                استخدم سؤال الموجز
              </Button>
            )}
          </div>

          {steps.length > 0 && <WorkflowPanel steps={steps} running={running} />}
          {answer && (
            <div className="rounded-lg border border-line bg-surface p-3.5">
              <h3 className="label mb-2">الملخّص</h3>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">{answer.split("\n---\n")[0]}</p>
            </div>
          )}
        </div>
      </Panel>

      {/* --- add source manually -------------------------------------------- */}
      <Panel className="mb-5">
        <PanelHeader title="أضف مصدرًا يدويًا" subtitle="رابط تقرؤه بنفسك وتريد_keepه" icon={<Link2 className="size-4" />} />
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="الرابط" className="min-w-[240px] flex-1">
              {(fid, desc) => (
                <Input
                  id={fid}
                  aria-describedby={desc}
                  dir="ltr"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setAddError(null);
                  }}
                  placeholder="https://example.com/article"
                />
              )}
            </Field>
            <Button variant="secondary" onClick={() => void addSource()} loading={adding} icon={<Plus className="size-4" />}>
              استخراج وإضافة
            </Button>
          </div>
          {addError && <ErrorState error={addError} compact onRetry={() => void addSource()} />}
        </div>
      </Panel>

      {/* --- brief ------------------------------------------------------------ */}
      <Section title="موجز البحث" aside={<Badge tone="neutral">قابل للتعديل</Badge>}>
        <Panel className="space-y-4 p-4">
          <Field label="الموضوع">
            {(fid) => (
              <Input
                id={fid}
                defaultValue={brief?.topic ?? project.title}
                onBlur={(e) => persistBrief({ topic: e.target.value })}
              />
            )}
          </Field>
          <Field label="السؤال الرئيسي" hint="ما الذي تحاول أن تجيب عنه فعليًا؟">
            {(fid, desc) => (
              <Textarea
                id={fid}
                aria-describedby={desc}
                defaultValue={brief?.mainQuestion ?? ""}
                onBlur={(e) => persistBrief({ mainQuestion: e.target.value })}
                rows={2}
                placeholder="ما الذي كسر هذه الشركة خلال 24 شهرًا قبل إفلاسها؟"
              />
            )}
          </Field>
          <Field label="أسئلة فرعية" hint="كل سطر سؤال.">
            {(fid, desc) => (
              <Textarea
                id={fid}
                aria-describedby={desc}
                defaultValue={(brief?.subQuestions ?? []).join("\n")}
                onBlur={(e) => persistBrief({ subQuestions: e.target.value.split("\n").filter(Boolean) })}
                rows={4}
                placeholder={"كم خسرت في كل ربع؟\nمتى بدأت المشاكل؟\nمن التدقيق المالي؟"}
              />
            )}
          </Field>
          <Field label="هدف البحث">
            {(fid) => (
              <Input
                id={fid}
                defaultValue={brief?.researchGoal ?? ""}
                onBlur={(e) => persistBrief({ researchGoal: e.target.value })}
                placeholder="تحليل مالي وسلوكي لا يكرّر الرواية الرسمية"
              />
            )}
          </Field>
        </Panel>
      </Section>

      {/* --- angles ----------------------------------------------------------- */}
      <Section title="الزوايا المقترحة" className="mt-6" aside={<Badge tone="neutral">اختر ما يخدم فرضيتك</Badge>}>
        {!brief?.suggestedAngles?.length ? (
          <EmptyState
            compact
            title="لا زوايا بعد"
            description="الزوايا تظهر بعد تشغيل بحث، أو أضفها يدويًا لتثبيت زاوية السكربت."
            action={{
              label: "أضف زاوية",
              icon: <Plus className="size-3.5" />,
              onClick: () => {
                const angle: ResearchAngle = {
                  id: uid("ang"),
                  title: "زاوية جديدة",
                  thesis: "",
                  rationale: "",
                  risk: null,
                  selected: true,
                };
                persistBrief({ suggestedAngles: [...(brief?.suggestedAngles ?? []), angle] });
                setAngleId(angle.id);
              },
            }}
          />
        ) : (
          <ul className="space-y-2.5">
            {brief.suggestedAngles.map((a) => {
              const open = angleId === a.id;
              return (
                <li key={a.id}>
                  <Panel className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setAngleId(open ? null : a.id)}
                      aria-expanded={open}
                      className="flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-panel-2"
                    >
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          persistBrief({
                            suggestedAngles: brief!.suggestedAngles.map((x) =>
                              x.id === a.id ? { ...x, selected: !x.selected } : x,
                            ),
                          });
                        }}
                        role="checkbox"
                        aria-checked={a.selected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.stopPropagation();
                            persistBrief({
                              suggestedAngles: brief!.suggestedAngles.map((x) =>
                                x.id === a.id ? { ...x, selected: !x.selected } : x,
                              ),
                            });
                          }
                        }}
                        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          a.selected ? "border-accent bg-accent text-white" : "border-line-strong"
                        }`}
                      >
                        {a.selected && <Check className="size-3" aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{a.title}</span>
                        {a.thesis && <span className="mt-0.5 block text-2xs leading-relaxed text-ink-mute">{a.thesis}</span>}
                      </span>
                    </button>

                    {open && (
                      <div className="space-y-3 border-t border-line bg-surface px-4 py-3">
                        <Field label="الحجة">
                          {(fid) => (
                            <Textarea
                              id={fid}
                              defaultValue={a.thesis}
                              rows={2}
                              onBlur={(e) =>
                                persistBrief({
                                  suggestedAngles: brief!.suggestedAngles.map((x) =>
                                    x.id === a.id ? { ...x, thesis: e.target.value } : x,
                                  ),
                                })
                              }
                            />
                          )}
                        </Field>
                        <Field label="لماذا هذه الزاوية؟">
                          {(fid) => (
                            <Input
                              id={fid}
                              defaultValue={a.rationale}
                              onBlur={(e) =>
                                persistBrief({
                                  suggestedAngles: brief!.suggestedAngles.map((x) =>
                                    x.id === a.id ? { ...x, rationale: e.target.value } : x,
                                  ),
                                })
                              }
                            />
                          )}
                        </Field>
                        <Field label="المخاطرة" hint="ما الذي قد يجعل هذه الزاوية مضلّلة؟">
                          {(fid) => (
                            <Input
                              id={fid}
                              defaultValue={a.risk ?? ""}
                              onBlur={(e) =>
                                persistBrief({
                                  suggestedAngles: brief!.suggestedAngles.map((x) =>
                                    x.id === a.id ? { ...x, risk: e.target.value || null } : x,
                                  ),
                                })
                              }
                            />
                          )}
                        </Field>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<X className="size-3.5" />}
                            onClick={() => {
                              persistBrief({ suggestedAngles: brief!.suggestedAngles.filter((x) => x.id !== a.id) });
                              setAngleId(null);
                            }}
                          >
                            حذف الزاوية
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

      {/* --- results summary -------------------------------------------------- */}
      <Section title="ما جمعه البحث" className="mt-6">
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
          {[
            ["مصادر", bundle.sources.length, "sources"],
            ["ادعاءات", bundle.claims.length, "fact-check"],
            ["تناقضات", bundle.contradictions.length, "fact-check"],
            ["أحداث", bundle.events.length, "timeline"],
          ].map(([label, n, href]) => (
            <a key={label as string} href={`#${href}`} className="bg-panel px-4 py-3 transition-colors hover:bg-panel-2">
              <p className="text-2xs text-ink-mute">{label}</p>
              <p className="num mt-1 text-lg font-semibold text-ink">{n}</p>
            </a>
          ))}
        </div>
      </Section>
    </ProjectWorkspace>
  );
}
