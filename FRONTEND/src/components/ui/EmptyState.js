import React from "react";
import clsx from "clsx";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  title = "No records yet",
  description = "There are no entries to display at this moment.",
  icon = null,
  actionLabel = null,
  onAction = null,
  actionIcon = null,
  className = "",
}) {
  return (
    <div
      className={clsx(
        "py-12 px-6 flex flex-col items-center justify-center text-center gap-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-surface-100 text-ink-400 flex items-center justify-center">
        {icon || <FolderOpen className="w-6 h-6 stroke-1" />}
      </div>
      <div className="flex flex-col gap-1 max-w-sm">
        <h4 className="text-base font-semibold text-ink-900">{title}</h4>
        <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} icon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
