"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 7);
      const newToast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const typeStyles = {
            success: "bg-surface-0 border-risk-low text-ink-900 border-l-4",
            error: "bg-surface-0 border-emergency text-ink-900 border-l-4",
            warning: "bg-surface-0 border-risk-med text-ink-900 border-l-4",
            info: "bg-surface-0 border-brand-600 text-ink-900 border-l-4",
          }[toast.type] || "bg-surface-0 border-line-200 text-ink-900 border-l-4";

          const icon = {
            success: <CheckCircle2 className="w-5 h-5 text-risk-low flex-shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-emergency flex-shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-risk-med flex-shrink-0" />,
            info: <Info className="w-5 h-5 text-brand-600 flex-shrink-0" />,
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto p-4 rounded-lg shadow-lg border border-line-200 flex items-start gap-3 transition-all transform ease-out duration-200 ${typeStyles}`}
            >
              {icon}
              <div className="flex-1 text-sm font-medium">{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-ink-600 hover:text-ink-900 p-1 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
