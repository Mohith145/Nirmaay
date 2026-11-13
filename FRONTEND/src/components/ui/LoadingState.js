import React from "react";
import clsx from "clsx";
import { Spinner } from "./Spinner";

export function LoadingState({
  message = "Loading data...",
  description = null,
  size = "lg",
  className = "",
}) {
  return (
    <div
      role="status"
      className={clsx(
        "py-16 px-6 flex flex-col items-center justify-center text-center gap-3",
        className
      )}
    >
      <Spinner size={size} color="brand" />
      <div className="flex flex-col gap-1 max-w-sm">
        <p className="text-sm font-semibold text-ink-900">{message}</p>
        {description && <p className="text-xs text-ink-600">{description}</p>}
      </div>
    </div>
  );
}
