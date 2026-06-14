import { ArrowRight, BookOpenText, Network, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { SearchComposer } from "@/components/search-composer";
import { CATEGORY_OPTIONS, HOME_METRICS } from "@/lib/constants";

const journeySteps = [
  {
    title: "Tulis kasus dengan bahasa biasa",
    description:
      "Gunakan istilah sehari-hari seperti penipuan, KDRT, pencemaran nama baik, atau kecelakaan.",
    icon: BookOpenText,
  },
  {
    title: "Sistem normalisasi dan ranking",
    description:
      "Query diubah ke istilah hukum yang lebih konsisten, lalu dicocokkan ke corpus pasal melalui full text dan keyword boost.",
    icon: Network,
  },
  {
    title: "Baca kandidat pasal dan sumber resmi",
    description:
      "Hasil menampilkan beberapa kandidat, ringkasan awam, ancaman sanksi, dan tautan untuk verifikasi ke dokumen resmi.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10 lg:px-8 lg:py-12">
      <section className="space-y-7 pt-4">
        <div className="space-y-7 text-center">
          <div className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--surface-strong)] px-4 py-1.5 text-sm text-[var(--text-soft)] shadow-sm backdrop-blur">
            Pencarian hukum yang lebih anggun dan mudah dipahami
          </div>
          <div className="space-y-4">
            <h1 className="mx-auto max-w-3xl font-[family:var(--font-display)] text-5xl leading-[0.95] text-balance text-[var(--text-color)] md:text-7xl">
              Temukan pasal yang relevan dari cerita kasus Anda.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-8 text-[var(--text-soft)] md:text-lg">
              Ceritakan kasus dengan bahasa sehari-hari, lalu lihat kandidat pasal,
              ringkasan singkat, dan sumber resmi untuk memulai riset.
            </p>
          </div>
          <div className="mx-auto max-w-5xl text-left">
            <SearchComposer />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {HOME_METRICS.map((item) => (
              <div key={item.label} className="surface-card rounded-[1.75rem] border border-[var(--border-color)] p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-color)]">{item.value}</p>
              </div>
            ))}
          </div>
          <DisclaimerBanner />
        </div>
      </section>

      <section className="surface-card grid gap-6 rounded-[2rem] border border-[var(--border-color)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)] md:p-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Pilih topik yang sering dicari
          </p>
          <h2 className="mt-2 font-[family:var(--font-display)] text-4xl leading-tight text-[var(--text-color)]">
            Mulai dari kategori yang paling dekat dengan kasus Anda.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CATEGORY_OPTIONS.map((item) => (
            <Link
              key={item.value}
              href={`/search?q=${encodeURIComponent(item.label)}&category=${encodeURIComponent(item.value)}`}
              className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--surface-strong)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-card-bg)]"
            >
              <p className="text-sm font-semibold text-[var(--text-color)]">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {journeySteps.map((step) => {
          const Icon = step.icon;

          return (
            <div key={step.title} className="surface-card rounded-[2rem] border border-[var(--border-color)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="inline-flex rounded-2xl border border-[var(--border-color)] bg-[var(--accent-soft)] p-3 text-[var(--accent-color)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-[family:var(--font-display)] text-3xl leading-none text-[var(--text-color)]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{step.description}</p>
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-5 rounded-[2rem] border border-[var(--border-strong)] bg-[var(--contrast-bg)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Mau lihat contoh?
          </p>
          <h2 className="mt-2 font-[family:var(--font-display)] text-4xl leading-tight text-[var(--contrast-text)]">
            Buka contoh hasil pencarian dan lihat cara kerjanya.
          </h2>
        </div>
        <Link
          href="/search?q=saya%20ditipu%20saat%20beli%20barang%20online"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-strong)] px-5 py-3 text-sm font-semibold text-[var(--text-color)] transition hover:brightness-105"
        >
          Lihat demo hasil
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
