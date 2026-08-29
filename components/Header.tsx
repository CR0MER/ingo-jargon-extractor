"use client";

interface HeaderProps {
  showPanel: boolean;
  onTogglePanel: () => void;
  visibleCount: number;
  totalCount: number;
  ignoredCount: number;
  onOpenIgnored: () => void;
  onOpenExport: () => void;
}

export function Header({
  showPanel,
  onTogglePanel,
  visibleCount,
  totalCount,
  ignoredCount,
  onOpenIgnored,
  onOpenExport,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-header items-center gap-5 border-b border-border bg-surface px-6">
      <button
        type="button"
        onClick={onTogglePanel}
        title="Toggle panel"
        aria-label="Toggle panel"
        aria-pressed={showPanel}
        className="grid h-7 w-7 place-items-center rounded-6 border border-border-control bg-white text-13 text-text-secondary hover:border-text-muted hover:bg-surface-alt"
      >
        ☰
      </button>

      <div className="flex items-baseline gap-9">
        <span className="text-15 font-semibold tracking-[-0.01em]">Ingo</span>
        <span className="text-12 text-text-muted">Jargon Extractor</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5">
        <span className="font-mono text-11 text-text-tertiary">
          {visibleCount} / {totalCount} terms
        </span>
        <button
          type="button"
          onClick={onOpenIgnored}
          className="h-30 rounded-6 border border-border-control bg-white px-3 text-12.5 text-text-control hover:border-text-muted"
        >
          Ignored <span className="font-mono text-text-muted">{ignoredCount}</span>
        </button>
        <button
          type="button"
          onClick={onOpenExport}
          className="h-30 rounded-6 bg-accent px-3.5 text-12.5 font-medium text-white hover:bg-accent-hover"
        >
          Export
        </button>
      </div>
    </header>
  );
}
