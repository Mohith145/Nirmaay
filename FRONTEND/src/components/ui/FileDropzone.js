"use client";

import React, { useState, useRef } from "react";
import clsx from "clsx";
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { Button } from "./Button";

export function FileDropzone({
  onFileSelect,
  selectedFile = null,
  onClear = null,
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMb = 10,
  label = "Upload Oral Photo",
  instruction = "Drag and drop your mouth/lesion photo here, or browse",
  guidanceTips = [
    "Ensure bright, even lighting inside the mouth",
    "Focus closely on the lesion or affected area",
    "Hold the camera still to avoid blur",
  ],
  error = null,
  className = "",
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const inputRef = useRef(null);

  const validateAndHandle = (file) => {
    setInternalError(null);
    if (!file) return;

    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      setInternalError(`File size exceeds maximum allowed ${maxSizeMb} MB.`);
      return;
    }

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandle(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className={clsx("flex flex-col gap-3 w-full", className)}>
      {label && <span className="text-sm font-medium text-ink-900">{label}</span>}

      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            "p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 bg-surface-0",
            isDragOver
              ? "border-brand-600 bg-brand-50"
              : "border-line-200 hover:border-brand-600 hover:bg-surface-50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                validateAndHandle(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-ink-900">{instruction}</span>
            <span className="text-xs text-ink-600">Supports JPEG, PNG, WebP (up to {maxSizeMb}MB)</span>
          </div>

          <Button variant="secondary" size="sm" type="button" className="mt-1 pointer-events-none">
            Browse File
          </Button>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-line-200 bg-surface-0 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-ink-900 truncate">
                {selectedFile.name}
              </span>
              <span className="text-xs text-ink-600">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Remove selected image"
              className="p-1.5 rounded-lg text-ink-600 hover:text-emergency hover:bg-emergency-bg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Guidance checklist */}
      {guidanceTips && guidanceTips.length > 0 && (
        <div className="p-3.5 rounded-lg bg-surface-50 border border-line-200 flex flex-col gap-1.5 text-xs text-ink-600">
          <span className="font-semibold text-ink-900">Tips for an accurate screening:</span>
          <ul className="list-disc list-inside space-y-0.5">
            {guidanceTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {(error || internalError) && (
        <div className="flex items-center gap-2 text-xs font-medium text-emergency">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error || internalError}</span>
        </div>
      )}
    </div>
  );
}
