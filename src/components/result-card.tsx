import { ArrowRight, BookOpenText, ExternalLink, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { getRelevanceAccent, sentenceCase } from "@/lib/search";
import type { SearchResult } from "@/lib/types";

type ResultCardProps = {
  result: SearchResult;
};

const accentMap = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--accent-color)]",
  slate: "border-[var(--border-color)] bg-[var(--surface-soft)] text-[var(--text-color)]",
};

export function ResultCard({ result }: ResultCardProps) {
  const accent = getRelevanceAccent(result.relevance_label);

  return (
    <article className="surface-card rounded-[2rem] border border-[var(--border-color)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${accentMap[accent]}`}>
              Relevansi {result.relevance_label}
            </span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--text-soft)]">
              {sentenceCase(result.category)}
            </span>
          </div>
          <div>
            <p className="text-sm text-[var(--text-soft)]">
              {result.law_number}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-color)]">
              {result.article_number}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
              {result.law_title}
            </p>
          </div>
        </div>
        <div className="rounded-[1.4rem] border border-[var(--border-color)] bg-[var(--surface-soft)] px-4 py-3 text-right">
          <p className="text-xs text-[var(--text-muted)]">
            Skor
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-color)]">
            {result.relevance_score.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--surface-soft)] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
              <BookOpenText className="h-4 w-4" />
              Ringkasan awam
            </div>
            <p className="text-sm leading-6 text-[var(--text-color)]">{result.plain_summary}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--accent-soft)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Alasan kecocokan
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{result.match_reason}</p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--surface-strong)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <ShieldAlert className="h-4 w-4" />
            Sanksi
          </div>
          <div className="mt-4 space-y-3">
            {result.sanctions.length > 0 ? (
              result.sanctions.map((sanction) => (
                <div key={`${result.article_id}-${sanction.sanction_type}`} className="rounded-[1.25rem] border border-[var(--border-color)] bg-[var(--surface-soft)] p-3">
                  <p className="text-sm font-semibold text-[var(--text-color)]">{sanction.sanction_type}</p>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">
                    Maks penjara: {sanction.max_imprisonment ?? "tidak tercantum"}
                  </p>
                  <p className="text-sm text-[var(--text-soft)]">
                    Maks denda: {sanction.max_fine ?? "tidak tercantum"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Belum ada data sanksi terstruktur untuk hasil ini.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/articles/${result.article_id}`}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--contrast-bg)] px-4 py-2 text-sm font-semibold text-[var(--contrast-text)] shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition hover:brightness-110"
        >
          Buka detail pasal
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href={result.source_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-color)]"
        >
          Sumber resmi
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}
