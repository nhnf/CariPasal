'use client';

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { CATEGORY_OPTIONS, HERO_EXAMPLES } from "@/lib/constants";
import { buildSearchUrl } from "@/lib/search";
import { useSearchStore } from "@/store/search-store";

type SearchComposerProps = {
  initialQuery?: string;
  initialCategory?: string;
  compact?: boolean;
};

export function SearchComposer({
  initialQuery = "",
  initialCategory = "",
  compact = false,
}: SearchComposerProps) {
  const router = useRouter();
  const rememberQuery = useSearchStore((state) => state.rememberQuery);
  const recentQueries = useSearchStore((state) => state.recentQueries);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [isPending, startTransition] = useTransition();

  const quickPrompts = useMemo(
    () => Array.from(new Set(recentQueries.slice(0, 3).concat(HERO_EXAMPLES))).slice(0, 4),
    [recentQueries],
  );

  function submitSearch(nextQuery: string, nextCategory: string) {
    const cleanQuery = nextQuery.trim();

    if (!cleanQuery) {
      return;
    }

    rememberQuery(cleanQuery);
    startTransition(() => {
      router.push(buildSearchUrl(cleanQuery, nextCategory || undefined));
    });
  }

  return (
    <div className="surface-card rounded-[2rem] border border-[var(--border-color)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-6">
      <div className="mb-5 space-y-2">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
          Intelligent legal search
        </p>
        <h2 className="font-[family:var(--font-display)] text-3xl leading-none text-[var(--text-color)] md:text-4xl">
          {compact ? "Ubah pencarian" : "Cari pasal dari cerita kasus"}
        </h2>
        <p className="text-sm text-[var(--text-soft)]">
          Tulis masalah dengan bahasa sehari-hari. Sistem akan mencarikan kandidat pasal yang paling relevan.
        </p>
      </div>
      <div className={`grid gap-4 ${compact ? "lg:grid-cols-[1fr_180px]" : "lg:grid-cols-[1fr_200px]"}`}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--text-color)]">
            Cerita singkat kasus
          </span>
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Contoh: saya ditipu saat beli barang online"
            className="min-h-32 w-full resize-none rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-color)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-strong)]"
          />
        </label>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--text-color)]">
              Kategori
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 w-full rounded-[1.25rem] border border-[var(--border-color)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text-color)] outline-none focus:border-[var(--border-strong)]"
            >
              <option value="">Semua kategori</option>
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => submitSearch(query, category)}
            disabled={isPending || !query.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--contrast-bg)] px-5 text-sm font-semibold text-[var(--contrast-text)] shadow-[0_16px_36px_rgba(15,23,42,0.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {isPending ? "Mencari..." : "Cari Pasal"}
          </button>
        </div>
      </div>
      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-[var(--text-color)]">Contoh cepat</p>
        <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              setQuery(prompt);
              submitSearch(prompt, category);
            }}
            className="rounded-full border border-[var(--border-color)] bg-[var(--surface-strong)] px-3 py-2 text-left text-xs text-[var(--text-color)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)]"
          >
            {prompt}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
