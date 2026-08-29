"use client";

interface RunningStateProps {
  sourceName: string | null;
}

export function RunningState({ sourceName }: RunningStateProps) {
  return (
    <div className="grid min-h-[calc(100vh-56px)] place-items-center p-10">
      <div className="w-[340px] text-center">
        <div className="mb-1 text-13 font-medium">Processing…</div>
        {sourceName && (
          <div className="mb-3.5 truncate font-mono text-11 text-text-muted">{sourceName}</div>
        )}
        <div className="h-[5px] overflow-hidden rounded-[3px] bg-border-subtle">
          <div className="h-full w-1/3 animate-pulse rounded-[3px] bg-accent" />
        </div>
      </div>
    </div>
  );
}
