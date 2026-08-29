"use client";

import { Trash2 } from "lucide-react";
import { corpusRank, paginate, type SortDir, type SortKey } from "@/lib/filter";
import type { Term } from "@/lib/types";

interface TermListProps {
  terms: Term[];
  sortKey: SortKey;
  sortDir: SortDir;
  page: number;
  pageSize: number;
  search: string;
  onSort: (key: SortKey) => void;
  onSetPage: (page: number) => void;
  onSetPageSize: (size: number) => void;
  onSearchChange: (query: string) => void;
  onIgnore: (term: string) => void;
}

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "term", label: "A–Z" },
  { key: "count", label: "Occurrences" },
  { key: "score", label: "Rarity" },
];

const PAGE_SIZES: { label: string; value: number }[] = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "All", value: 9999 },
];

export function TermList({
  terms,
  sortKey,
  sortDir,
  page,
  pageSize,
  search,
  onSort,
  onSetPage,
  onSetPageSize,
  onSearchChange,
  onIgnore,
}: TermListProps) {
  const { items, page: currentPage, pageCount, total } = paginate(terms, page, pageSize);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(total, currentPage * pageSize);

  return (
    <div className="px-6 pb-[60px] pt-[22px]">
      <div className="overflow-hidden rounded-9 border border-border bg-surface">
        <div className="flex h-10 items-center gap-4 border-b border-border bg-surface-alt px-18">
          <span className="text-10.5 font-semibold uppercase tracking-[0.08em] text-text-muted">
            Sort
          </span>
          {SORT_COLUMNS.map((col) => {
            const active = sortKey === col.key;
            return (
              <div
                key={col.key}
                onClick={() => onSort(col.key)}
                className={`cursor-pointer select-none text-10.5 font-semibold uppercase tracking-[0.08em] hover:text-text ${
                  active ? "text-text" : "text-text-muted"
                }`}
              >
                {col.label}
                {active ? (sortDir < 0 ? " ↓" : " ↑") : ""}
              </div>
            );
          })}
          <div className="flex-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search terms…"
            aria-label="Search terms"
            className="h-7 w-[180px] rounded-6 border border-border-control bg-white px-2.5 font-mono text-11 text-text-control placeholder:text-text-disabled-alt focus:border-accent-light focus:outline-none"
          />
        </div>

        {items.map((term) => {
          const rank = corpusRank(term);
          return (
            <div
              key={term.term}
              className="flex flex-col gap-[7px] border-b border-border-subtle-alt px-5 py-18 hover:bg-surface-alt"
            >
              <div className="flex min-w-0 items-baseline gap-9">
                <span className="text-19 font-medium tracking-[-0.015em] text-accent-hover">
                  {term.reading ? (
                    <ruby>
                      {term.term}
                      <rt className="text-9.5 font-normal tracking-normal text-text-muted">
                        {term.reading}
                      </rt>
                    </ruby>
                  ) : (
                    term.term
                  )}
                </span>
                <span className="flex-none rounded-4 bg-surface-badge px-1.5 py-0.5 font-mono text-9.5 tracking-[0.05em] text-text-tertiary">
                  {term.pos}
                </span>
                {term.ngram > 1 && (
                  <span className="flex-none font-mono text-9.5 text-text-disabled">
                    {term.ngram}-gram
                  </span>
                )}
                <div className="flex-1" />
                <span className="flex-none font-mono text-11 text-text-muted">
                  Top {rank.toLocaleString()}
                </span>
                <span
                  title="Times seen in the uploaded text"
                  className="flex-none font-mono text-11 text-text-muted"
                >
                  ×{term.count}
                </span>
                <button
                  type="button"
                  title="Move to ignored"
                  onClick={() => onIgnore(term.term)}
                  className="flex h-34 w-34 flex-none items-center justify-center rounded-7 text-danger hover:bg-danger-tint"
                >
                  <Trash2 size={19} />
                </button>
              </div>
              <div className="text-pretty text-13.5 leading-normal text-text-secondary">
                {term.definition}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="px-5 py-[44px] text-center text-13 text-text-muted">
            {search.trim()
              ? `No terms match "${search.trim()}".`
              : "No terms pass the current thresholds. Loosen aggression or lower the minimum occurrence."}
          </div>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
        <div className="flex items-center gap-2">
          <span className="text-12 text-text-tertiary">Rows per page</span>
          <div className="flex gap-1">
            {PAGE_SIZES.map((size) => {
              const on = pageSize === size.value;
              return (
                <button
                  key={size.label}
                  type="button"
                  onClick={() => onSetPageSize(size.value)}
                  className={`h-7 min-w-[34px] rounded-6 px-9 font-mono text-11 ${
                    on
                      ? "bg-accent text-white"
                      : "border border-border-control bg-white text-text-tertiary"
                  }`}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1" />

        <span className="font-mono text-11 text-text-muted">
          {total === 0 ? "0 of 0" : `${start}–${end} of ${total}`}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onSetPage(currentPage - 1)}
            className={`h-7 rounded-6 border border-border-control bg-white px-11 text-12 ${
              currentPage > 1 ? "text-text-control" : "text-text-disabled-alt"
            }`}
          >
            Prev
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
            const on = n === currentPage;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onSetPage(n)}
                className={`h-7 min-w-[28px] rounded-6 px-2 font-mono text-11 ${
                  on
                    ? "bg-accent text-white"
                    : "border border-border-control bg-white text-text-tertiary"
                }`}
              >
                {n}
              </button>
            );
          })}
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => onSetPage(currentPage + 1)}
            className={`h-7 rounded-6 border border-border-control bg-white px-11 text-12 ${
              currentPage < pageCount ? "text-text-control" : "text-text-disabled-alt"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
