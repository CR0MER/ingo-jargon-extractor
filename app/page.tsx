"use client";

import { useMemo, useReducer } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ExportModal } from "@/components/ExportModal";
import { FileQueue } from "@/components/FileQueue";
import { Header } from "@/components/Header";
import { IgnoredModal } from "@/components/IgnoredModal";
import { RunningState } from "@/components/RunningState";
import { SourcePanel } from "@/components/SourcePanel";
import { TermList } from "@/components/TermList";
import { TuningPanel } from "@/components/TuningPanel";
import { ingest } from "@/lib/api";
import { filterTerms, sortTerms } from "@/lib/filter";
import { ingoReducer, initialState } from "@/lib/store";

export default function Page() {
  const [state, dispatch] = useReducer(ingoReducer, initialState);

  async function runIngest(sourceName: string, input: { file?: File; text?: string }) {
    dispatch({ type: "INGEST_START", sourceName });
    try {
      const terms = await ingest(input);
      dispatch({ type: "INGEST_SUCCESS", terms });
    } catch (err) {
      dispatch({
        type: "INGEST_ERROR",
        message: err instanceof Error ? err.message : "Ingest failed.",
      });
    }
  }

  const visibleTerms = useMemo(() => {
    if (state.phase !== "results") return [];
    const filtered = filterTerms(state.terms, {
      cutoffLo: state.cutoffLo,
      cutoffHi: state.cutoffHi,
      minOcc: state.minOcc,
      grams: state.grams,
      noEntities: state.noEntities,
      noSlang: state.noSlang,
      posOn: state.posOn,
      ignored: state.ignored,
    });
    return sortTerms(filtered, state.sortKey, state.sortDir);
  }, [state]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        showPanel={state.showPanel}
        onTogglePanel={() => dispatch({ type: "TOGGLE_PANEL" })}
        visibleCount={visibleTerms.length}
        totalCount={state.terms.length}
        ignoredCount={state.ignored.length}
        onOpenIgnored={() => dispatch({ type: "OPEN_MODAL", modal: "ignored" })}
        onOpenExport={() => dispatch({ type: "OPEN_MODAL", modal: "export" })}
      />

      <div
        className={`flex-1 grid items-start ${
          state.showPanel ? "grid-cols-[296px_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)]"
        }`}
      >
        {state.showPanel && (
          <aside className="no-scrollbar sticky top-[56px] flex max-h-[calc(100vh-56px)] flex-col overflow-y-auto border-r border-border bg-surface">
            <SourcePanel onSubmitFile={(file) => runIngest(file.name, { file })} />
            <FileQueue
              showQueue={state.showQueue}
              onToggleQueue={() => dispatch({ type: "TOGGLE_QUEUE" })}
              phase={state.phase}
              sourceName={state.sourceName}
            />
            <TuningPanel
              enabled={state.phase === "results"}
              cutoffLo={state.cutoffLo}
              cutoffHi={state.cutoffHi}
              minOcc={state.minOcc}
              grams={state.grams}
              noEntities={state.noEntities}
              posOn={state.posOn}
              onSetCutoffLo={(value) => dispatch({ type: "SET_CUTOFF_LO", value })}
              onSetCutoffHi={(value) => dispatch({ type: "SET_CUTOFF_HI", value })}
              onIncMinOcc={() => dispatch({ type: "INC_MIN_OCC" })}
              onDecMinOcc={() => dispatch({ type: "DEC_MIN_OCC" })}
              onToggleGram={(ngram) => dispatch({ type: "TOGGLE_GRAM", ngram })}
              onToggleEntities={() => dispatch({ type: "TOGGLE_ENTITIES" })}
              onTogglePos={(pos) => dispatch({ type: "TOGGLE_POS", pos })}
            />
          </aside>
        )}

        <main>
          {state.phase === "empty" && <EmptyState />}
          {state.phase === "running" && <RunningState sourceName={state.sourceName} />}
          {state.phase === "error" && (
            <ErrorState
              message={state.error ?? "Something went wrong."}
              onRetry={() => dispatch({ type: "RETRY" })}
            />
          )}
          {state.phase === "results" && (
            <TermList
              terms={visibleTerms}
              sortKey={state.sortKey}
              sortDir={state.sortDir}
              page={state.page}
              pageSize={state.pageSize}
              onSort={(key) => dispatch({ type: "SET_SORT", key })}
              onSetPage={(page) => dispatch({ type: "SET_PAGE", page })}
              onSetPageSize={(size) => dispatch({ type: "SET_PAGE_SIZE", size })}
              onIgnore={(term) => dispatch({ type: "IGNORE_TERM", term })}
            />
          )}
        </main>
      </div>

      {state.modal === "export" && (
        <ExportModal
          format={state.format}
          visibleCount={visibleTerms.length}
          onSetFormat={(format) => dispatch({ type: "SET_FORMAT", format })}
          onClose={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
      {state.modal === "ignored" && (
        <IgnoredModal
          ignored={state.ignored}
          terms={state.terms}
          onRestore={(term) => dispatch({ type: "RESTORE_TERM", term })}
          onClose={() => dispatch({ type: "CLOSE_MODAL" })}
        />
      )}
    </div>
  );
}
