"use client";

import type { Phase } from "@/lib/store";

interface FileQueueProps {
  showQueue: boolean;
  onToggleQueue: () => void;
  phase: Phase;
  sourceNames: string[];
}

function queueEntry(phase: Phase) {
  if (phase === "results") {
    return { pct: 100, stage: "Done", stageColor: "text-accent", barColor: "bg-accent" };
  }
  if (phase === "error") {
    return { pct: 100, stage: "Error", stageColor: "text-danger", barColor: "bg-danger" };
  }
  return {
    pct: 60,
    stage: "Processing",
    stageColor: "text-text-tertiary",
    barColor: "bg-accent-light-alt",
  };
}

export function FileQueue({ showQueue, onToggleQueue, phase, sourceNames }: FileQueueProps) {
  const queueLabel =
    phase === "empty"
      ? "idle"
      : phase === "results"
        ? `${sourceNames.length} / ${sourceNames.length}`
        : phase === "error"
          ? "error"
          : "running";
  const entry = queueEntry(phase);

  return (
    <section className="border-b border-border-subtle px-5 py-4.5">
      <div
        onClick={onToggleQueue}
        className="mb-3 flex cursor-pointer select-none items-baseline justify-between"
      >
        <div className="text-10.5 font-semibold uppercase tracking-[0.09em] text-text-muted">
          Files
        </div>
        <div className="flex items-baseline gap-[7px]">
          <span className="font-mono text-10.5 text-text-muted">{queueLabel}</span>
          <span className="text-10 text-text-disabled">{showQueue ? "▾" : "▸"}</span>
        </div>
      </div>

      {showQueue && sourceNames.length > 0 && (
        <div className="flex flex-col gap-11">
          {sourceNames.map((name) => (
            <div key={name} className="flex flex-col gap-[5px]">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-mono text-11.5 text-text-control">{name}</span>
                <div className="flex-1" />
                <span className={`text-10.5 ${entry.stageColor}`}>{entry.stage}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-2 bg-border-subtle">
                <div
                  className={`h-full rounded-2 transition-[width] duration-500 ease-[ease] ${entry.barColor}`}
                  style={{ width: `${entry.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
