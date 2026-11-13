"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Sparkles, ChevronDown, ChevronUp, Bot, Volume2 } from "lucide-react";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { VoiceButton } from "./VoiceButton";
import { explainResult } from "../../lib/api/explain";

export function ExplainPanel({
  result,
  initialExplanation = null,
  title = "AI Plain-Language Explanation",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState(initialExplanation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExplanation = async () => {
    if (explanation) {
      setIsOpen(!isOpen);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await explainResult(result);
      setExplanation(data.explanation);
      setIsOpen(true);
    } catch (err) {
      setError("AI explainer service is currently busy. Please review the structured factors below.");
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={clsx("rounded-xl border border-line-200 bg-surface-0 shadow-xs overflow-hidden", className)}>
      <button
        type="button"
        onClick={fetchExplanation}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-50 transition-colors min-h-touch"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-demo-bg text-demo flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-ink-900 block">{title}</span>
            <span className="text-xs text-ink-600">Translates medical rules into clear guidance</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && <Spinner size="sm" />}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-ink-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-ink-600" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-line-200 flex flex-col gap-3.5 bg-surface-50/50">
          {error ? (
            <p className="text-xs text-emergency">{error}</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-line flex-1">
                  {explanation || "Generating plain-language explanation..."}
                </p>
                {explanation && (
                  <VoiceButton mode="speak" textToSpeak={explanation} size="sm" />
                )}
              </div>
              <DisclaimerBanner />
            </>
          )}
        </div>
      )}
    </div>
  );
}
