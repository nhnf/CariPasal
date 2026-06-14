import { AlertTriangle } from "lucide-react";

type DisclaimerBannerProps = {
  dense?: boolean;
};

export function DisclaimerBanner({ dense = false }: DisclaimerBannerProps) {
  return (
    <div
      className={`rounded-[1.75rem] border border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--text-color)] shadow-[0_12px_30px_rgba(15,23,42,0.06)] ${
        dense ? "p-4" : "p-5 md:p-6"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-color)]" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Bukan keputusan hukum final</p>
          <p className="text-sm leading-6 text-[var(--text-soft)]">
            Hasil yang ditampilkan adalah kandidat pasal untuk riset awal. Tetap
            baca bunyi pasal asli dan sumber resmi, serta konsultasikan ke ahli
            hukum jika keputusan yang diambil berdampak serius.
          </p>
        </div>
      </div>
    </div>
  );
}
