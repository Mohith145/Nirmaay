import React from "react";
import clsx from "clsx";
import { ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";
import { Badge } from "./Badge";

export function RiskBadge({ risk = "Low", size = "md", className = "" }) {
  const normalized = (risk || "Low").toLowerCase();

  const config = {
    low: {
      variant: "risk-low",
      label: "Low Risk",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    medium: {
      variant: "risk-med",
      label: "Medium Risk",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    high: {
      variant: "risk-high",
      label: "High Risk",
      icon: <AlertOctagon className="w-3.5 h-3.5" />,
    },
  }[normalized] || {
    variant: "default",
    label: risk,
    icon: null,
  };

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={config.icon}
      className={clsx("capitalize", className)}
    >
      {config.label}
    </Badge>
  );
}
