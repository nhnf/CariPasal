const QUERY_REPLACEMENTS: Array<[string, string]> = [
  ["ditipu", "penipuan"],
  ["ketipu", "penipuan"],
  ["tipu online", "penipuan transaksi elektronik"],
  ["jual beli online", "transaksi elektronik jual beli online"],
  ["marketplace", "transaksi elektronik"],
  ["fitnah", "pencemaran nama baik"],
  ["nama baik dicemarkan", "pencemaran nama baik"],
  ["dipukul suami", "kekerasan dalam rumah tangga kekerasan fisik"],
  ["kdrt", "kekerasan dalam rumah tangga"],
  ["anak dipukul", "kekerasan terhadap anak"],
  ["tabrak", "kecelakaan lalu lintas"],
  ["narkoba", "narkotika"],
];

export function normalizeSearchQuery(input: string) {
  let normalized = input.trim().toLowerCase().replace(/\s+/g, " ");

  for (const [source, replacement] of QUERY_REPLACEMENTS) {
    normalized = normalized.replaceAll(source, replacement);
  }

  return normalized;
}

export function getRelevanceAccent(label: string) {
  if (label === "tinggi") {
    return "emerald";
  }

  if (label === "sedang") {
    return "amber";
  }

  return "slate";
}

export function buildSearchUrl(query: string, category?: string) {
  const searchParams = new URLSearchParams();

  if (query.trim()) {
    searchParams.set("q", query.trim());
  }

  if (category) {
    searchParams.set("category", category);
  }

  return `/search?${searchParams.toString()}`;
}

export function sentenceCase(text: string) {
  if (!text) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}
