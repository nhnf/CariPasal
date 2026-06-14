import Link from "next/link";

import { CATEGORY_OPTIONS } from "@/lib/constants";
import { sentenceCase } from "@/lib/search";

type CategoryFiltersProps = {
  query: string;
  selectedCategory?: string;
};

export function CategoryFilters({
  query,
  selectedCategory = "",
}: CategoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/search?q=${encodeURIComponent(query)}`}
        className={`rounded-full border px-4 py-2 text-sm transition ${
          !selectedCategory
            ? "border-[var(--contrast-bg)] bg-[var(--contrast-bg)] text-[var(--contrast-text)] shadow-sm"
            : "border-[var(--border-color)] bg-[var(--surface-strong)] text-[var(--text-soft)] hover:border-[var(--border-strong)] hover:text-[var(--text-color)]"
        }`}
      >
        Semua kategori
      </Link>
      {CATEGORY_OPTIONS.map((item) => {
        const isActive = selectedCategory === item.value;
        return (
          <Link
            key={item.value}
            href={`/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(item.value)}`}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              isActive
                ? "border-[var(--contrast-bg)] bg-[var(--contrast-bg)] text-[var(--contrast-text)] shadow-sm"
                : "border-[var(--border-color)] bg-[var(--surface-strong)] text-[var(--text-soft)] hover:border-[var(--border-strong)] hover:text-[var(--text-color)]"
            }`}
          >
            {sentenceCase(item.value)}
          </Link>
        );
      })}
    </div>
  );
}
