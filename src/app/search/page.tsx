import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { CategoryFilters } from "@/components/category-filters";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { ResultCard } from "@/components/result-card";
import { SearchComposer } from "@/components/search-composer";
import { searchArticles } from "@/lib/supabase/queries";
import { sentenceCase } from "@/lib/search";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";

  const response = query ? await searchArticles(query, category) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-soft)] transition hover:text-[var(--text-color)]">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke beranda
      </Link>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Hasil pencarian
          </p>
          <h1 className="font-[family:var(--font-display)] text-5xl leading-[0.95] text-[var(--text-color)] md:text-6xl">
            Temukan kandidat pasal yang paling dekat dengan kasus Anda.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-[var(--text-soft)]">
            Hasil di bawah ini adalah titik awal. Baca isi pasal dan sumber resmi
            sebelum menggunakan hasilnya untuk keputusan penting.
          </p>
        </div>
        <SearchComposer initialQuery={query} initialCategory={category} compact />
      </section>

      <DisclaimerBanner dense />

      {!query ? (
        <section className="surface-card rounded-[2rem] border border-dashed border-[var(--border-color)] bg-[var(--surface-card-bg)] p-10 text-center">
          <SearchX className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
          <h2 className="mt-4 text-2xl font-semibold text-[var(--text-color)]">
            Mulai dengan menuliskan kasus Anda
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--text-soft)]">
            Gunakan bahasa sehari-hari. Contoh: saya ditipu saat beli barang online,
            dipukul suami, atau difitnah di media sosial.
          </p>
        </section>
      ) : response ? (
        <section className="space-y-6">
          <div className="surface-card rounded-[2rem] border border-[var(--border-color)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--text-muted)]">
                  Ringkasan pencarian
                </p>
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text-color)]">
                    {query}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                    Kata kunci yang dibaca sistem:{" "}
                    <span className="font-medium text-[var(--text-color)]">{response.normalized_query}</span>
                  </p>
                  <p className="text-sm leading-6 text-[var(--text-soft)]">
                    {response.total_results} kandidat ditemukan
                    {response.fallback_used ? " dengan mode fallback agar hasil tetap tersedia" : ""}.
                  </p>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--surface-soft)] px-4 py-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Filter aktif
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-color)]">
                  {category ? sentenceCase(category) : "Semua kategori"}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <CategoryFilters query={query} selectedCategory={category} />
            </div>
          </div>

          {response.results.length > 0 ? (
            <div className="space-y-5">
              {response.results.map((result) => (
                <ResultCard key={result.article_id} result={result} />
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-[2rem] border border-[var(--border-color)] p-10 text-center">
              <SearchX className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
              <h2 className="mt-4 text-2xl font-semibold text-[var(--text-color)]">
                Belum ada hasil yang kuat
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                Coba tambahkan konteks seperti media, hubungan pelaku-korban, atau
                dampak yang terjadi. Misalnya ubah menjadi “saya ditipu saat jual beli
                online di marketplace” atau “saya dipukul suami di rumah”.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
