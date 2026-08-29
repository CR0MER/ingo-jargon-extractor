"use client";

import { useRef } from "react";

interface SourcePanelProps {
  onSubmitFile: (file: File) => void;
}

export function SourcePanel({ onSubmitFile }: SourcePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onSubmitFile(file);
  }

  return (
    <section className="border-b border-border-subtle p-5">
      <div className="mb-3 text-10.5 font-semibold uppercase tracking-[0.09em] text-text-muted">
        Source
      </div>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="cursor-pointer rounded-8 border-[1.5px] border-dashed border-text-disabled-alt bg-surface-sunken px-3.5 py-[22px] text-center hover:border-accent-light hover:bg-accent-tint"
      >
        <div className="mb-[5px] text-13 font-medium">Drop raw text</div>
        <div className="font-mono text-10.5 leading-[1.6] text-text-muted">
          .srt .vtt .txt
          <br />
          or click to browse
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".srt,.vtt,.txt"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </section>
  );
}
