import type { CategoryKey } from "@/lib/types";

export const CATEGORY_OPTIONS: Array<{
  value: CategoryKey;
  label: string;
  description: string;
}> = [
  {
    value: "pidana umum",
    label: "Pidana Umum",
    description: "Penipuan, penggelapan, dan delik umum lain.",
  },
  {
    value: "siber",
    label: "Siber",
    description: "Transaksi elektronik, pencemaran nama baik, dan konten digital.",
  },
  {
    value: "keluarga",
    label: "Keluarga",
    description: "KDRT dan kekerasan dalam lingkup rumah tangga.",
  },
  {
    value: "konsumen",
    label: "Konsumen",
    description: "Barang tidak sesuai, kerugian konsumen, dan larangan pelaku usaha.",
  },
  {
    value: "anak",
    label: "Perlindungan Anak",
    description: "Kekerasan atau ancaman terhadap anak.",
  },
  {
    value: "narkotika",
    label: "Narkotika",
    description: "Penyalahgunaan dan kepemilikan narkotika.",
  },
  {
    value: "lalu lintas",
    label: "Lalu Lintas",
    description: "Kecelakaan lalu lintas dan kelalaian pengemudi.",
  },
];

export const HERO_EXAMPLES = [
  "saya ditipu saat beli barang online",
  "saya dipukul suami di rumah",
  "nama baik saya difitnah di media sosial",
  "anak saya mengalami kekerasan di sekolah",
];

export const HOME_METRICS = [
  { label: "Corpus awal", value: "7 UU prioritas" },
  { label: "Mode hasil", value: "multi-kandidat" },
  { label: "Sumber", value: "tautan resmi" },
];
