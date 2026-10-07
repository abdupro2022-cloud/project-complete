import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { AppProvider } from "@/lib/store/provider";
import { AppShell } from "@/components/shell/AppShell";
import { ToastProvider } from "@/components/ui/Toast";

// IBM Plex Sans Arabic covers Arabic *and* Latin, so mixed-script paragraphs
// share one font's metrics — no baseline jump mid-sentence.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-ar",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-jb",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ABDO CREATOR OS",
    template: "%s · ABDO CREATOR OS",
  },
  description:
    "نظام تشغيل شخصي بالذكاء الاصطناعي لصانع المحتوى: بحث، تحليل، سكربتات، ومصادر في مكان واحد.",
  applicationName: "ABDO CREATOR OS",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#060911",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <a
          href="#main"
          className="sr-only rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100]"
        >
          تخطَّ إلى المحتوى
        </a>
        <AppProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
