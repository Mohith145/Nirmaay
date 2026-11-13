import React from "react";
import clsx from "clsx";

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = "",
  tabClassName = "",
}) {
  return (
    <div
      role="tablist"
      className={clsx(
        "flex items-center gap-1 border-b border-line-200 overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap min-h-touch select-none",
              isActive
                ? "border-brand-600 text-brand-600 font-semibold"
                : "border-transparent text-ink-600 hover:text-ink-900 hover:border-line-200",
              tabClassName
            )}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  "px-2 py-0.5 text-xs rounded-full",
                  isActive ? "bg-brand-50 text-brand-700" : "bg-surface-100 text-ink-600"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
