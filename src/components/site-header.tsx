import { Scale } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border-color)] bg-[var(--surface-soft)]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--accent-color)] shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <Scale className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-[family:var(--font-display)] text-3xl leading-none text-[var(--text-color)]">
              CariPasal
            </span>
            <span className="block text-sm text-[var(--text-soft)]">
              Pencarian pasal untuk riset awal
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-[var(--border-color)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)] shadow-sm md:inline-flex">
            Cari, baca, verifikasi
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
