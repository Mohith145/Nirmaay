import React from "react";
import clsx from "clsx";

export function Card({
  children,
  variant = "default",
  className = "",
  onClick,
  ...props
}) {
  const variantStyles = {
    default: "bg-surface-0 border border-line-200 shadow-xs",
    flat: "bg-surface-50 border border-line-200",
    elevated: "bg-surface-0 border border-line-200 shadow-md",
    interactive:
      "bg-surface-0 border border-line-200 hover:border-brand-600 hover:shadow-md cursor-pointer transition-all",
    brand: "bg-brand-50 border border-brand-100",
  }[variant] || "bg-surface-0 border border-line-200 shadow-xs";

  return (
    <div
      onClick={onClick}
      className={clsx("rounded-xl overflow-hidden", variantStyles, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={clsx("px-6 py-4 border-b border-line-200 flex flex-col gap-1", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={clsx("text-base font-semibold text-ink-900 leading-snug", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }) {
  return <p className={clsx("text-xs text-ink-600 leading-relaxed", className)}>{children}</p>;
}

export function CardContent({ children, className = "" }) {
  return <div className={clsx("p-6 text-sm text-ink-900", className)}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return (
    <div
      className={clsx(
        "px-6 py-3.5 bg-surface-50 border-t border-line-200 flex items-center justify-between gap-3 text-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;
