"use client";

import { Modal } from "@/components/Modal";
import type { ExportFormat } from "@/lib/store";

interface ExportModalProps {
  format: ExportFormat;
  visibleCount: number;
  onSetFormat: (format: ExportFormat) => void;
  onClose: () => void;
}

const FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  {
    id: "anki",
    label: "Anki deck (.apkg)",
    hint: "Front: term + audio timestamp. Back: definition + context line.",
  },
  {
    id: "tsv",
    label: "Anki TSV",
    hint: "Plain tab-separated import for existing note types.",
  },
  {
    id: "csv",
    label: "Spreadsheet (CSV)",
    hint: "Term, POS, rarity multiplier, raw count, source episode.",
  },
];

const CTA_LABEL: Record<ExportFormat, string> = {
  anki: "Build .apkg",
  tsv: "Download TSV",
  csv: "Download CSV",
};

export function ExportModal({
  format,
  visibleCount,
  onSetFormat,
  onClose,
}: ExportModalProps) {
  return (
    <Modal title="Export list" onClose={onClose}>
      <div className="px-22 py-4.5">
        <div className="flex flex-col gap-9">
          {FORMATS.map((f) => {
            const selected = format === f.id;
            return (
              <label
                key={f.id}
                onClick={() => onSetFormat(f.id)}
                className={`flex cursor-pointer gap-11 rounded-8 border px-3.5 py-[13px] ${
                  selected ? "border-accent bg-accent-tint" : "border-border bg-white"
                }`}
              >
                <span
                  className={`mt-0.5 h-3.5 w-3.5 flex-none rounded-full border-[1.5px] ${
                    selected
                      ? "border-accent bg-accent shadow-[inset_0_0_0_2px_#fff]"
                      : "border-[#ccc7c2] bg-white"
                  }`}
                />
                <span className="block">
                  <span className="mb-[3px] block text-13 font-medium">{f.label}</span>
                  <span className="block text-11.5 leading-normal text-text-tertiary">
                    {f.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-18 flex items-center gap-3 border-t border-border-subtle pt-[15px]">
          <span className="font-mono text-11 text-text-muted">
            {visibleCount} terms in scope
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-6 border border-border-control bg-white px-[13px] text-12.5 text-text-control"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-6 bg-accent px-[15px] text-12.5 font-medium text-white hover:bg-accent-hover"
          >
            {CTA_LABEL[format]}
          </button>
        </div>
      </div>
    </Modal>
  );
}
