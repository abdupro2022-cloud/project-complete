"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plug, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Surface";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";
import { cn } from "@/lib/utils";

/**
 * Onboarding.
 *
 * Four steps, skippable at every point. The product is fully usable before any
 * of them is completed, so nothing here is a gate — it is orientation.
 */

const GOALS = [
  { id: "channel", label: "قناة YouTube", hint: "بحث، تحليل، سكربت، ونشر" },
  { id: "research", label: "بحث عميق", hint: "أدلة ومصادر وخط زمني" },
  { id: "assistant", label: "مساعد شخصي", hint: "أفكار وكتابة وتخطيط" },
  { id: "studio", label: "استوديو محتوى", hint: "إنتاج متكامل بمخرجات متعددة" },
] as const;

const STEPS = ["ما الذي تبنيه", "الذاكرة", "المزوّدون", "أول مشروع"] as const;

export default function OnboardingPage() {
  const { state, actions, ready, isDemo } = useApp();
  const toast = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string>("");
  const [name, setName] = useState(state.settings.displayName);

  // If onboarding was already completed, don't re-run it.
  useEffect(() => {
    if (ready && state.settings.onboardedAt) {
      router.replace("/");
    }
  }, [ready, state.settings.onboardedAt, router]);

  const finish = async (openSettings = false) => {
    actions.updateSettings({ displayName: name.trim() || "عبده" });
    actions.completeOnboarding();
    if (openSettings) router.push("/settings/integrations");
    else router.push("/");
    toast.success("كل شيء جاهز", "ابدأ من مركز القيادة");
  };

  return (
    <div className="flex min-h-dvh flex-col px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        {/* progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xs text-ink-faint">
              الخطوة {step + 1} من {STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => void finish(false)}
              className="text-2xs text-ink-mute underline-offset-2 hover:text-ink hover:underline"
            >
              تخطّي
            </button>
          </div>
          <ol className="flex gap-1" aria-hidden>
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors duration-300",
                  i <= step ? "bg-accent" : "bg-panel-3",
                )}
              />
            ))}
          </ol>
        </div>

        {/* steps */}
        <div className="flex-1">
          {step === 0 && (
            <section>
              <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
                ما الذي تبنيه؟
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-ink-mute">
                يحدّد هذا ما يقترحه النظام عليك أولًا. يمكنك تغييره متى شئت.
              </p>
              <ul className="mt-6 space-y-2">
                {GOALS.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => setGoal(g.id)}
                      aria-pressed={goal === g.id}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start transition-colors",
                        goal === g.id
                          ? "border-accent/45 bg-accent-tint"
                          : "border-line bg-panel hover:border-line-strong",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full border",
                          goal === g.id ? "border-accent bg-accent text-white" : "border-line-strong",
                        )}
                        aria-hidden
                      >
                        {goal === g.id && <Check className="size-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-ink">{g.label}</span>
                        <span className="block text-2xs text-ink-mute">{g.hint}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {step === 1 && (
            <section>
              <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">اسمك</h1>
              <p className="mt-2 text-xs leading-relaxed text-ink-mute">
                يُستخدم في التحية فقط. كل شيء آخر يُحفظ على جهازك.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["عبده", "صانع محتوى", "أنا"].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setName(n)}
                    className={cn(
                      "rounded-lg border px-3.5 py-2 text-xs transition-colors",
                      name === n ? "border-accent/45 bg-accent-tint text-accent-soft" : "border-line text-ink-mute hover:text-ink",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">المزوّدون</h1>
              <p className="mt-2 text-xs leading-relaxed text-ink-mute">
                التطبيق يعمل الآن بالكامل في الوضع التجريبي. اربط مفتاحًا واحدًا على الأقل لتفعيل البحث
                الحقيقي.
              </p>
              <Panel className="mt-6">
                <PanelHeader
                  title="لماذا الوضع التجريبي مقبول؟"
                  icon={<Sparkles className="size-4" />}
                />
                <ul className="space-y-2 p-4 text-2xs leading-relaxed text-ink-mute">
                  <li className="flex gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                    ترى شكل كل أداة قبل أن تدفع مقابل أي خدمة.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                    كل ما تنشئه يُحفظ محليًا ويبقى كما هو عند الربط.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                    المفاتيح تُخزَّن على الخادم ولا تظهر بعد الحفظ.
                  </li>
                </ul>
                <div className="border-t border-line p-4">
                  <Button variant="secondary" size="sm" icon={<Plug className="size-3.5" />} onClick={() => router.push("/settings/integrations")}>
                    افتح التكاملات
                  </Button>
                </div>
              </Panel>
              {isDemo && (
                <p className="mt-3 text-2xs text-ink-faint">
                  البيانات التجريبية جاهزة — تصفّحها من مركز القيادة قبل أن تربط أي شيء.
                </p>
              )}
            </section>
          )}

          {step === 3 && (
            <section>
              <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">جاهز</h1>
              <p className="mt-2 text-xs leading-relaxed text-ink-mute">
                اكتب فكرتك في مركز القيادة وسيحوّلها النظام إلى بحث كامل ثم سكربت. ابدأ من هناك.
              </p>
              <Panel className="sheen mt-6 p-5">
                <p className="text-sm font-medium text-ink">أول ما ستفعله</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
                  «أريد فيديو عن سبب سقوط شركة…»
                </p>
                <p className="mt-3 text-2xs leading-relaxed text-ink-faint">
                  النظام يفهم الطلب، يعرض خطته، ينفّذها خطوة بخطوة، ويضع كل نتيجة في مشروعك.
                </p>
              </Panel>
            </section>
          )}
        </div>

        {/* nav */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            رجوع
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={() => setStep((s) => s + 1)} iconEnd={<ArrowLeft className="size-4" />}>
              {step === 0 && !goal ? "تخطّي" : "التالي"}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => void finish(true)} iconEnd={<ArrowLeft className="size-4" />}>
              إلى مركز القيادة
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
