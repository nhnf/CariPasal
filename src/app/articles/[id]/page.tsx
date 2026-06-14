import { BookOpenText, ExternalLink, Scale, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { getArticleDetail } from "@/lib/supabase/queries";
import { sentenceCase } from "@/lib/search";

type ArticlePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticleDetail(id);

  if (!article) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-soft)]">
        <Link href="/" className="transition hover:text-[var(--text-color)]">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/search" className="transition hover:text-[var(--text-color)]">
          Hasil
        </Link>
        <span>/</span>
        <span>{article.article.article_number}</span>
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-color)]">
              {sentenceCase(article.article.category)}
            </span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--surface-strong)] px-3 py-1 text-xs font-medium text-[var(--text-soft)]">
              {article.law.law_number}
            </span>
          </div>
          <div>
            <p className="text-sm text-[var(--text-soft)]">
              {article.law.title}
            </p>
            <h1 className="mt-2 font-[family:var(--font-display)] text-5xl leading-[0.95] text-[var(--text-color)] md:text-6xl">
              {article.article.article_number}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
              {article.article.relevance_reason}
            </p>
          </div>
        </div>

        <div className="surface-card rounded-[2rem] border border-[var(--border-color)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <Scale className="h-4 w-4" />
            Metadata
          </div>
          <dl className="mt-5 space-y-4 text-sm text-[var(--text-color)]">
            <div className="flex justify-between gap-4 border-b border-[var(--border-color)] pb-3">
              <dt>Status UU</dt>
              <dd>{article.law.is_active ? "Aktif" : "Perlu verifikasi"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--border-color)] pb-3">
              <dt>Tahun</dt>
              <dd>{article.law.year}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--border-color)] pb-3">
              <dt>Kategori</dt>
              <dd>{sentenceCase(article.law.category)}</dd>
            </div>
          </dl>
          <a
            href={article.law.source_url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--text-soft)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-color)]"
          >
            Buka sumber resmi
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      <DisclaimerBanner dense />

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="surface-card rounded-[2rem] border border-[var(--border-color)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <BookOpenText className="h-4 w-4" />
            Ringkasan awam
          </div>
          <p className="mt-4 text-base leading-7 text-[var(--text-color)]">
            {article.article.plain_summary}
          </p>
        </article>

        <article className="surface-card rounded-[2rem] border border-[var(--border-color)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <Scale className="h-4 w-4" />
            Teks pasal
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--text-color)]">
            {article.article.article_text}
          </p>
        </article>
      </section>

      <section className="surface-card rounded-[2rem] border border-[var(--border-color)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
          <ShieldAlert className="h-4 w-4" />
          Sanksi
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {article.sanctions.map((sanction) => (
            <div key={`${article.article_id}-${sanction.sanction_type}`} className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--surface-soft)] p-5">
              <p className="text-base font-semibold text-[var(--text-color)]">{sanction.sanction_type}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-color)]">
                Maks penjara: {sanction.max_imprisonment ?? "tidak tercantum"}
              </p>
              <p className="text-sm leading-6 text-[var(--text-color)]">
                Maks denda: {sanction.max_fine ?? "tidak tercantum"}
              </p>
              {sanction.notes ? (
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{sanction.notes}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
