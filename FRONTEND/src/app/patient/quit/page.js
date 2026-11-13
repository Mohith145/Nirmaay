"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  Award,
  DollarSign,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Form } from "@/components/ui/Form";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { getQuitProgress, setQuitProgress } from "@/lib/api/quit";
import { useToast } from "@/context/ToastContext";

export default function PatientQuitPage() {
  const { addToast } = useToast();

  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [quitDate, setQuitDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailySpend, setDailySpend] = useState("50");
  const [error, setError] = useState(null);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      const data = await getQuitProgress();
      setProgress(data);
      if (data && data.set_up) {
        setQuitDate(data.quit_date || new Date().toISOString().split("T")[0]);
      } else {
        setShowSetup(true);
      }
    } catch {
      // Fallback state
      setProgress({
        set_up: false,
        streak_days: 0,
        money_saved: 0,
        badges: [],
      });
      setShowSetup(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!quitDate || Number(dailySpend) < 0) {
      setError("Please provide a valid quit date and daily spend.");
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      await setQuitProgress({
        quit_date: quitDate,
        daily_spend: Number(dailySpend),
      });
      addToast("Quit tobacco tracker updated successfully!", "success");
      setShowSetup(false);
      await loadProgress();
    } catch (err) {
      setError(err.message || "Failed to update quit progress.");
    } finally {
      setIsUpdating(false);
    }
  };

  const recoveryMilestones = [
    { time: "20 Minutes", benefit: "Heart rate and blood pressure begin dropping towards normal levels." },
    { time: "24 Hours", benefit: "Carbon monoxide levels in your blood plummet; cellular oxygenation improves." },
    { time: "2 Weeks", benefit: "Oral mucosal blood supply rebounds; oral leukoplakia inflammation begins reversing." },
    { time: "1 Year", benefit: "Risk of oral, pharyngeal, and esophageal squamous cancer drops by nearly 50%." },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      <PageHeader
        title="Quit Tobacco & Recovery Tracker"
        description="Monitor your smoke-free streak, track money saved, and celebrate mucosal recovery milestones."
        badge={<Badge variant="brand" icon={<Heart className="w-3.5 h-3.5 text-emergency" />}>Wellness Tracker</Badge>}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSetup(!showSetup)}
          >
            {showSetup ? "Hide Settings" : "Update Quit Date & Spend"}
          </Button>
        }
      />

      <DisclaimerBanner variant="subtle" />

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-ink-600 font-medium">Loading quit tracker...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Smoke-Free Streak"
              value={`${progress?.streak_days || 0} Days`}
              sublabel={progress?.set_up ? `Quit on ${progress.quit_date}` : "Set quit date below"}
              icon={<Calendar className="w-5 h-5 text-brand-600" />}
            />
            <StatCard
              label="Money Saved (INR)"
              value={`₹${progress?.money_saved || 0}`}
              sublabel={progress?.money_saved_note || "Calculated from your daily spend"}
              icon={<DollarSign className="w-5 h-5 text-risk-low" />}
            />
            <StatCard
              label="Badges Unlocked"
              value={`${progress?.badges?.length || 0} / 4`}
              sublabel="Milestones achieved"
              icon={<Award className="w-5 h-5 text-demo" />}
            />
          </div>

          {/* Setup / Update Form */}
          {showSetup && (
            <Card variant="default">
              <Card.Header>
                <Card.Title>Configure Your Quit Journey</Card.Title>
                <Card.Description>
                  Enter the date you stopped tobacco and your prior estimated daily expenditure.
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <Form onSubmit={handleSaveProgress} className="flex flex-col gap-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-emergency-bg border border-emergency/30 text-emergency text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Quit Date"
                      type="date"
                      id="quitDate"
                      required
                      value={quitDate}
                      onChange={(e) => setQuitDate(e.target.value)}
                    />

                    <Input
                      label="Estimated Daily Spend on Tobacco (₹ INR)"
                      type="number"
                      id="dailySpend"
                      required
                      min={0}
                      max={10000}
                      placeholder="e.g. 60"
                      value={dailySpend}
                      onChange={(e) => setDailySpend(e.target.value)}
                      helperText="Cost of gutkha, bidi, cigarettes, or paan saved per day."
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <Button variant="secondary" type="button" onClick={() => setShowSetup(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={isUpdating}>
                      Save Tracker Settings
                    </Button>
                  </div>
                </Form>
              </Card.Content>
            </Card>
          )}

          {/* Badges Section */}
          <Card variant="default">
            <Card.Header>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-demo" />
                <Card.Title>Milestone Achievement Badges</Card.Title>
              </div>
              <Card.Description>
                Celebrate your health milestones as oral mucosal tissue recovers.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: "1 day", label: "Day 1 Smoke-Free", icon: "🌱" },
                  { name: "1 week", label: "1 Week Milestone", icon: "🌿" },
                  { name: "1 month", label: "1 Month Champion", icon: "🌳" },
                  { name: "100 days", label: "100 Days Clean", icon: "🏆" },
                ].map((b) => {
                  const isUnlocked = progress?.badges?.includes(b.name);
                  return (
                    <div
                      key={b.name}
                      className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                        isUnlocked
                          ? "bg-brand-50 border-brand-600 text-brand-900 shadow-xs"
                          : "bg-surface-50 border-line-200 text-ink-400 opacity-60"
                      }`}
                    >
                      <span className="text-3xl">{b.icon}</span>
                      <strong className="text-xs font-bold block">{b.label}</strong>
                      <span className="text-[10px] uppercase font-semibold">
                        {isUnlocked ? "Unlocked ✓" : "Locked"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card.Content>
          </Card>

          {/* Mucosal Health Recovery Timeline */}
          <Card variant="flat">
            <Card.Header>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                <Card.Title>Oral Mucosa Recovery Timeline</Card.Title>
              </div>
              <Card.Description>
                Clinical facts on how quitting stops carcinogenic insult and restores healthy epithelial cell turnover:
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recoveryMilestones.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-surface-0 border border-line-200 space-y-1">
                    <span className="text-xs font-bold text-brand-700 block">{m.time}</span>
                    <p className="text-xs text-ink-600 leading-relaxed">{m.benefit}</p>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
