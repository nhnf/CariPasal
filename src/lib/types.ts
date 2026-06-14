export type CategoryKey =
  | "pidana umum"
  | "siber"
  | "keluarga"
  | "konsumen"
  | "anak"
  | "narkotika"
  | "lalu lintas"
  | "konstitusi";

export type RelevanceLabel = "tinggi" | "sedang" | "rendah";

export type Sanction = {
  sanction_type: string;
  max_imprisonment: string | null;
  max_fine: string | null;
  notes: string | null;
};

export type SearchResult = {
  article_id: string;
  law_id: string;
  law_title: string;
  law_number: string;
  article_number: string;
  category: string;
  relevance_score: number;
  relevance_label: RelevanceLabel;
  match_reason: string;
  plain_summary: string;
  article_text: string;
  source_url: string;
  sanctions: Sanction[];
};

export type SearchResponse = {
  query: string;
  normalized_query: string;
  total_results: number;
  fallback_used: boolean;
  categories_considered: string[];
  results: SearchResult[];
};

export type ArticleDetail = {
  article_id: string;
  law: {
    id: string;
    title: string;
    law_number: string;
    year: number;
    category: string;
    source_url: string;
    is_active: boolean;
  };
  article: {
    article_number: string;
    article_text: string;
    plain_summary: string;
    category: string;
    relevance_reason: string;
  };
  sanctions: Sanction[];
};
