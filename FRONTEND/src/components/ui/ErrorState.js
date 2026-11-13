import React from "react";
import clsx from "clsx";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an issue while loading this section.",
  onRetry = null,
  retryLabel = "Try Again",
  className = "",
}) {
  return (
    <div
      role="alert"
      className={clsx(
        "py-12 px-6 flex flex-col items-center justify-center text-center gap-4 bg-surface-0 border border-line-200 rounded-xl",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-emergency-bg text-emergency flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="flex flex-col gap-1 max-w-sm">
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
