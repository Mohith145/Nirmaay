import React from "react";
import clsx from "clsx";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "./Badge";

export function UrgencyBadge({
  urgency = "routine",
  emergency = false,
  size = "md",
  className = "",
}) {
  if (emergency) {
    return (
      <Badge
        variant="emergency"
        size={size}
        icon={<AlertCircle className="w-3.5 h-3.5" />}
        className={clsx("uppercase font-bold tracking-wider", className)}
      >
        Emergency
      </Badge>
    );
  }

  const normalized = (urgency || "routine").toLowerCase();

  const config = {
    urgent: {
      variant: "risk-high",
      label: "Urgent",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    soon: {
      variant: "risk-med",
      label: "Soon",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    routine: {
      variant: "risk-low",
      label: "Routine",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  }[normalized] || {
    variant: "default",
    label: urgency,
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
