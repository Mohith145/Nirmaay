"use client";

import React from "react";
import clsx from "clsx";
import { Spinner } from "./Spinner";
import { EmptyState } from "./EmptyState";

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = "No records found.",
  onRowClick = null,
  className = "",
}) {
  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-3 bg-surface-0 border border-line-200 rounded-xl">
        <Spinner size="lg" />
        <span className="text-xs text-ink-600 font-medium">Loading records...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-surface-0 border border-line-200 rounded-xl p-6">
        <EmptyState title="No Records" description={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={clsx("w-full overflow-x-auto rounded-xl border border-line-200 bg-surface-0 shadow-xs", className)}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-line-200 bg-surface-50 text-ink-600 text-xs font-semibold uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                className={clsx("px-5 py-3.5 whitespace-nowrap", col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-200 text-ink-900">
          {data.map((row, rowIdx) => {
            const isClickable = Boolean(onRowClick);
            return (
              <tr
                key={row.id || rowIdx}
                onClick={() => isClickable && onRowClick(row)}
                className={clsx(
                  "transition-colors",
                  isClickable ? "hover:bg-brand-50/50 cursor-pointer" : "hover:bg-surface-50"
                )}
              >
                {columns.map((col, colIdx) => {
                  const val = col.accessor ? col.accessor(row) : row[col.key];
                  return (
                    <td
                      key={col.key || colIdx}
                      className={clsx("px-5 py-3.5 whitespace-nowrap", col.className)}
                    >
                      {col.render ? col.render(val, row) : val}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
