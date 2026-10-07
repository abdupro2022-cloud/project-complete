# ABDO Creator OS

مساحة عمل عربية (RTL) لصنّاع محتوى YouTube، مع أتمتة قائمة على النية، وبحث، وفحص حقائق، وتتبع مصادر، ومخطط كيانات، ومحرر سكربت، ومولّد عناوين/شورتس/صور مصغّرة.

## Deploy على Vercel من الموبايل

١. افتح [github.com/new](https://github.com/new) من متصفح الموبايل وأنشئ مستودعًا جديدًا باسم `abdo-creator-os` (Public أو Private، اختر ما يناسبك).

٢. ارفع الملفات: في صفحة المستودع الجديدة اضغط **Add file → Upload files** واسحب كل الملفات من الحزمة `abdo-creator-os-source.zip` (ستجدها مرفقة في ردّي السابق). **مهم:** ارفع كل الملفات والمجلدات دون `node_modules` ودون `.next` ودون `.data`.

٣. افتح [vercel.com/new](https://vercel.com/new) من متصفح الموبايل.

٤. اضغط **Import** بجانب المستودع `abdo-creator-os`.

٥. في شاشة الإعدادات:
   - **Framework Preset**: Next.js (تلقائي).
   - **Build Command**: اتركه فارغاً (الإعداد من `package.json`).
   - **Output Directory**: اتركه فارغاً.
   - **Environment Variables**: اختياري — لو تريد حفظ مفاتيح API مشفّرة على قرص Vercel، أضف:
     - `ABDO_VAULT_SECRET` = سلسلة طويلة وعشوائية (مثل: `openssl rand -hex 32`).
     - ودون `ABDO_VAULT_SECRET` التطبيق يعمل لكن المفاتيح تبقى في ذاكرة العملية فقط وتُفقد عند إعادة التشغيل.

٦. اضغط **Deploy**. انتظر دقيقة أو دقيقتين.

٧. ستحصل على رابط عام مثل `https://abdo-creator-os-xxxx.vercel.app`. افتحه من الموبايل.

## تشغيل محلي (لو عندك جهاز)

```bash
npm install
ABDO_VAULT_SECRET="ضع-قيمة-قوية" npm run build
npm start           # http://localhost:3000
```

لإنتاج نسخة ثابتة بدون خادم (للنشر على أي استضافة ثابتة):

```bash
ABDO_STATIC=1 npm run build
# النتيجة في out/ — ارفعها على Vercel من تبويب "Static" أو على أي CDN.
```

## الخصوصية

- بيانات المستخدم (المشاريع، الأفكار، السكربتات، الذاكرة) تُحفظ محلياً في المتصفح (IndexedDB → localStorage → ذاكرة).
- المفاتيح لا تغادر الخادم أبداً: تُحفظ في خزنة AES-256-GCM مشفّرة عند ضبط `ABDO_VAULT_SECRET`.
- أدوات AI/بحث/YouTube/تفريغ النص تعمل من جهة الخادم فقط — المتصفح لا يرى المفاتيح.

## المصادر

- العقد الكامل: `CONTRACT.md`
- الفحص النصّي: `python3 scripts/check-text.py`