"use client";

import { Modal } from "@/components/Modal";
import type { Term } from "@/lib/types";

interface IgnoredModalProps {
  ignored: string[];
  terms: Term[];
  onRestore: (term: string) => void;
  onClose: () => void;
}

export function IgnoredModal({ ignored, terms, onRestore, onClose }: IgnoredModalProps) {
  return (
    <Modal title="Ignored terms" onClose={onClose}>
      <div className="px-22 pb-5 pt-2.5">
        {ignored.map((term) => {
          const meta = terms.find((t) => t.term === term);
          return (
            <div
              key={term}
              className="flex items-center gap-2.5 border-b border-border-subtle-alt py-2.5"
            >
              <span className="text-13.5 font-medium">{term}</span>
              {meta && (
                <span className="rounded-4 bg-surface-badge px-[5px] py-0.5 font-mono text-9.5 text-text-tertiary">
                  {meta.pos}
                </span>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => onRestore(term)}
                className="h-26 rounded-6 border border-border-control px-2.5 text-11.5 text-accent-hover hover:border-accent-light"
              >
                Restore
              </button>
            </div>
          );
        })}

        {ignored.length === 0 && (
          <div className="py-[30px] text-center text-13 text-text-muted">
            Nothing hidden yet. Dismissed terms land here.
          </div>
        )}
      </div>
    </Modal>
  );
}
