"use client";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="grid min-h-[calc(100vh-56px)] place-items-center p-10">
      <div className="max-w-[470px] text-center">
        <h1 className="mb-2.5 text-26 font-semibold tracking-[-0.02em]">Ingest failed</h1>
        <p className="mb-22 text-pretty text-14 leading-[1.65] text-text-tertiary">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="h-9 rounded-7 bg-danger px-18 text-13 font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
