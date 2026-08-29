"use client";

export function EmptyState() {
  return (
    <div className="grid min-h-[calc(100vh-56px)] place-items-center p-10">
      <div className="max-w-[470px] text-center">
        <h1 className="mb-2.5 text-26 font-semibold tracking-[-0.02em]">
          No corpus loaded
        </h1>
        <p className="text-pretty text-14 leading-[1.65] text-text-tertiary">
          Drop a subtitle file in the panel on the left. Ingo tokenizes the
          transcript, lemmatizes it, and scores every term against a
          reference frequency list to surface domain jargon.
        </p>
      </div>
    </div>
  );
}
