"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  Database,
  Gauge,
  Globe,
  KeyRound,
  Palette,
  RotateCcw,
  Trash2,
  User,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { Panel, PanelHeader, Section, StatusDot } from "@/components/ui/Surface";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/lib/store/provider";
import { timeAgo } from "@/lib/utils";

/** Main settings. Everything that is a preference, not a secret. */
export default function SettingsPage() {
  const { state, actions, isDemo } = useApp();
  const toast = useToast();
  const s = state.settings;
  const [confirmWipe, setConfirmWipe] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">الإعدادات</h1>
        <p className="mt-1.5 text-xs text-ink-mute">تُحفظ تلقائيًا على جهازك فور التغيير.</p>
      </header>

      <div className="space-y-6">
        {/* --- profile ------------------------------------------------------ */}
        <Panel>
          <PanelHeader title="الملف الشخصي" icon={<User className="size-4" />} />
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Field label="اسمك">
              {(id) => (
                <Input
                  id={id}
                  value={s.displayName}
                  onChange={(e) => actions.updateSettings({ displayName: e.target.value })}
                />
              )}
            </Field>
            <Field label="اسم القناة">
              {(id) => (
                <Input
                  id={id}
                  value={s.channelName}
                  onChange={(e) => actions.updateSettings({ channelName: e.target.value })}
                  placeholder="مثال: قناة الرؤية"
                />
              )}
            </Field>
            <Field label="رابط القناة" className="sm:col-span-2" hint="يُستخدم في تحليل المنافسين ومقارنة الأداء.">
              {(id, desc) => (
                <Input
                  id={id}
                  aria-describedby={desc}
                  dir="ltr"
                  value={s.channelUrl}
                  onChange={(e) => actions.updateSettings({ channelUrl: e.target.value })}
                  placeholder="https://youtube.com/@yourchannel"
                />
              )}
            </Field>
          </div>
        </Panel>

        {/* --- language ------------------------------------------------------ */}
        <Panel>
          <PanelHeader title="اللغة والاتجاه" icon={<Globe className="size-4" />} subtitle="اللغة العربية هي الافتراضية" />
          <div className="space-y-4 p-4">
            <Field label="لغة الواجهة">
              {() => (
                <Segmented
                  aria-label="لغة الواجهة"
                  value={s.locale}
                  onChange={(v) => actions.updateSettings({ locale: v })}
                  options={[
                    { value: "ar", label: "العربية" },
                    { value: "en", label: "English" },
                  ]}
                />
              )}
            </Field>
            <Field label="لغة الكتابة الافتراضية" hint="تُستخدم عند إنشاء محتوى جديد ما لم تحدّد غيرها.">
              {(id) => (
                <Select
                  id={id}
                  value={s.primaryLanguage}
                  onChange={(e) => actions.updateSettings({ primaryLanguage: e.target.value as "ar" | "en" })}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </Select>
              )}
            </Field>
            <Field label="أسلوب المحتوى" hint="يؤثر في نبرة المخرجات التي يكتبها المساعد.">
              {(id) => (
                <Select
                  id={id}
                  value={s.contentStyle}
                  onChange={(e) => actions.updateSettings({ contentStyle: e.target.value as "narrator" | "thinker" | "friend" })}
                >
                  <option value="narrator">الراوي — سردي، يبني المشهد</option>
                  <option value="thinker">المفكّر — تحليلي، يقود بالحجة</option>
                  <option value="friend">الصديق — مباشر، قريب</option>
                </Select>
              )}
            </Field>
          </div>
        </Panel>

        {/* --- appearance ----------------------------------------------------- */}
        <Panel>
          <PanelHeader title="المظهر والحركة" icon={<Palette className="size-4" />} />
          <div className="space-y-4 p-4">
            <Field label="الحركة" hint="اختر «تقليل الحركة» إن كانت الحركة تسبب لك إزعاجًا.">
              {() => (
                <Segmented
                  aria-label="إعداد الحركة"
                  value={s.reducedMotion}
                  onChange={(v) => actions.updateSettings({ reducedMotion: v })}
                  options={[
                    { value: "system", label: "حسب النظام" },
                    { value: "on", label: "تقليل الحركة" },
                    { value: "off", label: "حركة كاملة" },
                  ]}
                />
              )}
            </Field>
            <Checkbox
              label="تفعيل الذاكرة"
              description="عند التشغيل، تُحقن تفضيلاتك في كل طلب. يمكن إيقافها بالكامل في أي وقت."
              checked={s.memoryEnabled}
              onChange={(v) => actions.updateSettings({ memoryEnabled: v })}
            />
            <Checkbox
              label="الإشعارات"
              description="تنبيهات عند اكتمال المهام أو فشل الاتصال بمزوّد."
              checked={s.notificationsEnabled}
              onChange={(v) => actions.updateSettings({ notificationsEnabled: v })}
            />
          </div>
        </Panel>

        {/* --- shortcuts ------------------------------------------------------ */}
        <Panel>
          <PanelHeader title="الاختصارات" icon={<Zap className="size-4" />} />
          <ul className="divide-y divide-line-soft">
            {[
              ["فتح لوحة الأوامر", "Ctrl / ⌘ + K"],
              ["فتح لوحة الأوامر (بديل)", "/"],
              ["إرسال في مركز القيادة", "Enter"],
              ["سطر جديد داخل الكتابة", "Shift + Enter"],
              ["إغلاق أي نافذة", "Esc"],
            ].map(([label, keys]) => (
              <li key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-ink-soft">{label}</span>
                <kbd className="rounded border border-line bg-panel-2 px-2 py-0.5 font-mono text-[10px] text-ink-mute">
                  {keys}
                </kbd>
              </li>
            ))}
          </ul>
        </Panel>

        {/* --- pointers ------------------------------------------------------- */}
        <Panel>
          <PanelHeader title="روابط" />
          <ul className="grid gap-px bg-line sm:grid-cols-2">
            {[
              { href: "/settings/integrations", label: "التكاملات", icon: Zap, sub: "اربط مزوّدًا" },
              { href: "/settings/keys", label: "مفاتيح API", icon: KeyRound, sub: "أضف أو حدّث مفتاحًا" },
              { href: "/settings/usage", label: "الاستهلاك", icon: Gauge, sub: "تتبّع الطلبات" },
              { href: "/settings/logs", label: "السجلات", icon: Bell, sub: "كل ما حدث" },
              { href: "/settings/data", label: "البيانات", icon: Database, sub: "تصدير وحذف" },
            ].map((l) => {
              const Icon = l.icon;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex items-center gap-3 bg-panel px-4 py-3.5 transition-colors hover:bg-panel-2"
                  >
                    <Icon className="size-4 shrink-0 text-ink-mute" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink">{l.label}</span>
                      <span className="block text-2xs text-ink-mute">{l.sub}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* --- danger --------------------------------------------------------- */}
        <Panel className="border-danger/25">
          <PanelHeader title="منطقة الخطر" subtitle="إجراءات لا يمكن التراجع عنها" />
          <div className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">حذف كل البيانات</p>
              <p className="mt-0.5 text-2xs leading-relaxed text-ink-mute">
                يحذف كل المشاريع والمصادر والسكربتات والذاكرة من هذا الجهاز. المفاتيح لا تتأثر.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirmWipe(true)} icon={<Trash2 className="size-3.5" />}>
              حذف كل شيء
            </Button>
          </div>
        </Panel>
      </div>

      <Modal
        open={confirmWipe}
        onClose={() => setConfirmWipe(false)}
        title="حذف كل البيانات"
        description="لا رجعة في هذه الخطوة."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmWipe(false)}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="size-3.5" />}
              onClick={async () => {
                await actions.wipeAll();
                setConfirmWipe(false);
                toast.success("حُذفت كل البيانات", "ابدأ من جديد بمشروع فارغ.");
              }}
            >
              نعم، احذف نهائيًا
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          سيُحذف {state.projects.length} مشروع و{state.sources.length} مصدر و
          {state.scriptSections.length} مقطع سكربت و{state.memories.length} ذاكرة.
        </p>
        {isDemo && (
          <p className="mt-2 text-2xs text-ink-mute">
            البيانات الحالية تجريبية. يمكنك بدلًا من ذلك استعادة البيانات التجريبية.
          </p>
        )}
      </Modal>

      <p className="mt-6 text-center text-2xs text-ink-faint">
        آخر حفظ تلقائي: {timeAgo(new Date().toISOString())} · البيانات محفوظة محليًا على جهازك
      </p>
    </div>
  );
}
