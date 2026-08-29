"use client";

import type { NgramLength } from "@/lib/types";
import type { PosChip } from "@/lib/store";

interface TuningPanelProps {
  enabled: boolean;
  cutoffLo: number;
  cutoffHi: number;
  minOcc: number;
  grams: Record<NgramLength, boolean>;
  noEntities: boolean;
  posOn: Record<PosChip, boolean>;
  onSetCutoffLo: (value: number) => void;
  onSetCutoffHi: (value: number) => void;
  onIncMinOcc: () => void;
  onDecMinOcc: () => void;
  onToggleGram: (ngram: NgramLength) => void;
  onToggleEntities: () => void;
  onTogglePos: (pos: PosChip) => void;
}

function windowLabel(value: number) {
  return (value / 1000).toFixed(1).replace(".0", "") + "k";
}

const NGRAMS: NgramLength[] = [1, 2, 3];
const POS_CHIPS: PosChip[] = ["NOUN", "VERB", "ADJ"];

export function TuningPanel({
  enabled,
  cutoffLo,
  cutoffHi,
  minOcc,
  grams,
  noEntities,
  posOn,
  onSetCutoffLo,
  onSetCutoffHi,
  onIncMinOcc,
  onDecMinOcc,
  onToggleGram,
  onToggleEntities,
  onTogglePos,
}: TuningPanelProps) {
  const windowLeft = ((cutoffLo - 1000) / 49000) * 100 + "%";
  const windowRight = ((50000 - cutoffHi) / 49000) * 100 + "%";

  return (
    <section
      className={`px-5 py-4.5 ${enabled ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-40"}`}
    >
      <div className="mb-4 text-10.5 font-semibold uppercase tracking-[0.09em] text-text-muted">
        Tuning
      </div>

      <div className="mb-5">
        <div className="mb-9 flex items-baseline justify-between">
          <span className="text-12.5 font-medium">Frequency window</span>
          <span className="font-mono text-11 text-accent">
            top {windowLabel(cutoffLo)}–{windowLabel(cutoffHi)}
          </span>
        </div>
        <div className="relative h-4">
          <div className="absolute left-0 right-0 top-[6.5px] h-[3px] rounded-2 bg-border-control" />
          <div
            className="absolute top-[6.5px] h-[3px] rounded-2 bg-accent"
            style={{ left: windowLeft, right: windowRight }}
          />
          <input
            type="range"
            data-dual="lo"
            min={1000}
            max={50000}
            step={500}
            value={cutoffLo}
            onChange={(e) => onSetCutoffLo(Number(e.target.value))}
            className="ingo-range ingo-range-dual cursor-pointer"
          />
          <input
            type="range"
            data-dual="hi"
            min={1000}
            max={50000}
            step={500}
            value={cutoffHi}
            onChange={(e) => onSetCutoffHi(Number(e.target.value))}
            className="ingo-range ingo-range-dual cursor-pointer"
          />
        </div>
        <div className="mt-1 flex justify-between text-10.5 text-text-muted">
          <span>1,000</span>
          <span>50,000</span>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <span className="text-12.5 font-medium">Min. occurrences</span>
        <div className="flex items-center overflow-hidden rounded-6 border border-border-control bg-white">
          <button
            type="button"
            onClick={onDecMinOcc}
            className="h-7 w-[27px] text-15 leading-none text-text-secondary hover:bg-surface-muted"
          >
            −
          </button>
          <span className="w-[30px] text-center font-mono text-12">≥{minOcc}</span>
          <button
            type="button"
            onClick={onIncMinOcc}
            className="h-7 w-[27px] text-15 leading-none text-text-secondary hover:bg-surface-muted"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-2 text-12.5 font-medium">N-gram length</div>
        <div className="flex gap-1.5">
          {NGRAMS.map((n) => {
            const on = grams[n];
            return (
              <button
                key={n}
                type="button"
                onClick={() => onToggleGram(n)}
                className={`h-30 flex-1 rounded-15 border text-11.5 ${
                  on
                    ? "border-accent bg-accent text-white"
                    : "border-border-control bg-white text-text-tertiary"
                }`}
              >
                {n}-word
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-9 text-12.5 font-medium">Filters</div>
        <div className="flex flex-col gap-9">
          <label
            onClick={onToggleEntities}
            className="flex cursor-pointer items-start gap-9 text-12.5 leading-[1.35] text-text-control"
          >
            <span
              className={`mt-px grid h-[15px] w-[15px] flex-none place-items-center rounded-4 border text-10 text-white ${
                noEntities ? "border-accent bg-accent" : "border-border-control bg-white"
              }`}
            >
              {noEntities ? "✓" : ""}
            </span>
            <span>Exclude named entities</span>
          </label>
          <label className="flex cursor-pointer items-start gap-9 text-12.5 leading-[1.35] text-text-control">
            <span className="mt-px grid h-[15px] w-[15px] flex-none place-items-center rounded-4 border border-accent bg-accent text-10 text-white">
              ✓
            </span>
            <span>Filter by part of speech</span>
          </label>
        </div>
        <div className="mt-11 flex gap-1.5 pl-6">
          {POS_CHIPS.map((pos) => {
            const on = posOn[pos];
            return (
              <button
                key={pos}
                type="button"
                onClick={() => onTogglePos(pos)}
                className={`h-[25px] rounded-5 border px-2.5 font-mono text-10 tracking-[0.04em] ${
                  on
                    ? "border-accent bg-accent text-white"
                    : "border-border-control bg-white text-text-tertiary"
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
