"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { exportApkg } from "@/lib/api";
import type { ExportFormat } from "@/lib/store";
import type { Term } from "@/lib/types";

interface ExportModalProps {
  format: ExportFormat;
  terms: Term[];
  onSetFormat: (format: ExportFormat) => void;
  onClose: () => void;
}

/** Front: just the term — no reading, so the card still quizzes it.
 * Reading: the furigana, shown on the back only (see the Anki template
 * in ingo-api/pipeline/anki_export.py). Back: the definition. */
function toCard(term: Term) {
  return {
    front: term.term,
    reading: term.reading,
    back: term.definition,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  {
    id: "anki",
    label: "Anki deck (.apkg)",
    hint: "Front: term. Back: reading + definition.",
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

export function ExportModal({ format, terms, onSetFormat, onClose }: ExportModalProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (format !== "anki") {
      // TSV/CSV export isn't implemented yet.
      onClose();
      return;
    }
    setError(null);
    setExporting(true);
    try {
      const blob = await exportApkg(terms.map(toCard));
      downloadBlob(blob, "ingo-export.apkg");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

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

        {error && (
          <div className="mt-9 rounded-6 bg-danger-tint px-3 py-2 text-11.5 text-danger">
            {error}
          </div>
        )}

        <div className="mt-18 flex items-center gap-3 border-t border-border-subtle pt-[15px]">
          <span className="font-mono text-11 text-text-muted">{terms.length} terms in scope</span>
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
            disabled={exporting || terms.length === 0}
            onClick={handleExport}
            className="h-8 rounded-6 bg-accent px-[15px] text-12.5 font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? "Building…" : CTA_LABEL[format]}
          </button>
        </div>
      </div>
    </Modal>
  );
}
