"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, AlertCircle, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Form } from "@/components/ui/Form";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useI18n } from "@/context/I18nContext";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { registerPatient } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await registerPatient({ email, password, full_name: fullName });
      addToast("Account created successfully! Welcome to Nirmay.", "success");
    } catch (err) {
      setError(err.message || "Failed to create patient account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell showSidebar={false} showFooter={false}>
      <div className="max-w-md w-full mx-auto flex flex-col gap-6 py-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-surface-0 flex items-center justify-center shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">{t("auth.register_title", "Patient Registration")}</h1>
          <p className="text-xs sm:text-sm text-ink-600">
            {t("auth.register_subtitle", "Create your confidential account to begin oral cancer screening.")}
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
                label={t("auth.fullname", "Full Name")}
                type="text"
                id="fullName"
                required
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                label={t("auth.email", "Email Address")}
                type="email"
                id="email"
                required
                placeholder="e.g. ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <Input
                label={t("auth.password", "Create Password")}
                type="password"
                id="password"
                required
                placeholder="At least 8 characters"
                helperText="Must be at least 8 characters."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <div className="p-3 rounded-lg bg-surface-50 border border-line-200 text-xs text-ink-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                <span>
                  {t("Public registration creates patient accounts only. Your medical entries remain private and confidential.", "Public registration creates patient accounts only. Your medical entries remain private and confidential.")}
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                {t("Create Account & Continue", "Create Account & Continue")}
              </Button>
            </Form>

            <div className="mt-6 pt-5 border-t border-line-200 text-center text-xs text-ink-600">
              <span>{t("Already registered?", "Already registered?")} </span>
              <Link href={ROUTES.LOGIN} className="text-brand-600 font-semibold hover:underline">
                {t("nav.login", "Sign In")}
              </Link>
            </div>
          </Card.Content>
        </Card>

        {/* Staff Notice */}
        <div className="p-4 rounded-xl bg-surface-0 border border-line-200 shadow-xs text-center flex flex-col gap-1.5 text-xs text-ink-600">
          <span className="font-semibold text-ink-900 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-ink-400" />
            {t("Healthcare Staff & Doctors", "Healthcare Staff & Doctors")}
          </span>
          <span>
            {t("Staff accounts (Clinicians, Health Workers, Admins) are provisioned through administrator management.", "Staff accounts (Clinicians, Health Workers, Admins) are provisioned through administrator management.")}
          </span>
        </div>

        <DisclaimerBanner variant="subtle" />
      </div>
    </AppShell>
  );
}
