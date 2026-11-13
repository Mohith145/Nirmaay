import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { I18nProvider } from "@/context/I18nContext";

export const metadata = {
  title: "Nirmay — AI-Assisted Oral Cancer Screening & Triage Platform",
  description:
    "An AI-assisted oral cancer early-screening, triage support, and clinical handoff research prototype.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-surface-50 text-ink-900 selection:bg-brand-100 selection:text-brand-700">
        <AuthProvider>
          <I18nProvider>
            <ToastProvider>{children}</ToastProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
