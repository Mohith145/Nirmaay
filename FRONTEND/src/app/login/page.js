"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Activity, Lock, Mail, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Form } from "@/components/ui/Form";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useI18n } from "@/context/I18nContext";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const user = await login({ email, password, redirectTo: nextUrl });
      addToast(`Welcome back, ${user.email}!`, "success");
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword("demo-password");
    setError(null);
  };

  return (
    <div className="max-w-md w-full mx-auto flex flex-col gap-6 py-6">
      <div className="text-center flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-surface-0 flex items-center justify-center shadow-md">
          <Activity className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-ink-900">{t("auth.signin_title", "Sign in to Nirmay")}</h1>
        <p className="text-xs sm:text-sm text-ink-600">
          {t("auth.signin_subtitle", "Access your clinical workspace, patient portal, or camp mode.")}
        </p>
      </div>

      <Card variant="default">
        <Card.Content className="p-6 sm:p-8">
          <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-emergency-bg border border-emergency/30 text-emergency text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label={t("auth.email", "Email Address")}
              type="email"
              id="email"
              required
              placeholder="e.g. doctor@demo.nirmay.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label={t("auth.password", "Password")}
              type="password"
              id="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {t("nav.login", "Sign In")}
            </Button>
          </Form>

          <div className="mt-6 pt-5 border-t border-line-200 text-center text-xs text-ink-600">
            <span>{t("auth.no_account", "Don't have an account?")} </span>
            <Link href={ROUTES.REGISTER} className="text-brand-600 font-semibold hover:underline">
              {t("auth.register_patient_link", "Register as Patient")}
            </Link>
          </div>
        </Card.Content>
      </Card>

      {/* Demo Credentials Quick Fill */}
      <div className="p-4 rounded-xl bg-surface-0 border border-line-200 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-demo" />
            {t("auth.quick_demo", "Quick Demo Logins")}
          </span>
          <DemoBadge label={t("auth.auto_fill", "auto fill")} size="sm" />
        </div>
        <p className="text-[11px] text-ink-600 leading-tight">
          {t("auth.quick_demo_desc", "Select any seeded role below to populate credentials (Password: demo-password):")}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickFill("patient@demo.nirmay.test")}
            className="text-xs justify-start px-2.5"
          >
            👤 {t("roles.patient", "Patient")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickFill("doctor@demo.nirmay.test")}
            className="text-xs justify-start px-2.5"
          >
            🩺 {t("roles.doctor", "Doctor")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickFill("healthworker@demo.nirmay.test")}
            className="text-xs justify-start px-2.5"
          >
            📋 {t("roles.health_worker", "Health Worker")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickFill("admin@demo.nirmay.test")}
            className="text-xs justify-start px-2.5"
          >
            🛡️ {t("roles.admin", "Admin")}
          </Button>
        </div>
      </div>

      <DisclaimerBanner variant="subtle" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AppShell showSidebar={false} showFooter={false}>
      <Suspense fallback={<div className="py-20 text-center text-sm text-ink-600">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </AppShell>
  );
}
