"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff, Image as ImageIcon, Sparkles } from "lucide-react";
import { DemoBadge } from "./DemoBadge";

export function HeatmapImage({
  imageUrl,
  heatmapB64,
  label,
  confidence,
  isDemo = false,
  className = "",
}) {
  const [showHeatmap, setShowHeatmap] = useState(true);

  const formattedHeatmapSrc = heatmapB64
    ? heatmapB64.startsWith("data:")
      ? heatmapB64
      : `data:image/jpeg;base64,${heatmapB64}`
    : null;

  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      <div className="relative rounded-xl overflow-hidden bg-surface-100 border border-line-200 aspect-video flex items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Oral lesion screening capture"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-ink-600 gap-2">
            <ImageIcon className="w-10 h-10 stroke-1 text-ink-400" />
            <span className="text-xs">No direct photo preview available</span>
          </div>
        )}

        {/* Heatmap Overlay */}
        {formattedHeatmapSrc && showHeatmap && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={formattedHeatmapSrc}
            alt="Grad-CAM visual focus heatmap"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen pointer-events-none transition-opacity duration-200"
          />
        )}

        {/* Demo badge overlay */}
        {isDemo && (
          <div className="absolute top-3 left-3">
            <DemoBadge label="demo heatmap" size="sm" />
          </div>
        )}

        {/* Overlay Toggle Control */}
        {formattedHeatmapSrc && (
          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-ink-900/80 text-surface-0 hover:bg-ink-900 text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs transition-colors"
          >
            {showHeatmap ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showHeatmap ? "Hide Focus Map" : "Show Focus Map"}</span>
          </button>
        )}
      </div>

      {/* Model explanation tag */}
      {(label || confidence) && (
        <div className="flex items-center justify-between text-xs text-ink-600 px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-demo" />
            <span>AI Screener Flag: <strong className="text-ink-900">{label || "Unspecified"}</strong></span>
          </div>
          {confidence !== undefined && confidence !== null && (
            <span>Confidence: <strong className="text-ink-900">{Math.round(confidence * 100)}%</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
