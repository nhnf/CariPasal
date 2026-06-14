import { request as httpsRequest } from "node:https";

import { fallbackArticleDetail, fallbackSearchArticles } from "@/lib/mock-legal-data";
import { normalizeSearchQuery } from "@/lib/search";
import { getSupabaseConfig } from "@/lib/supabase/server";
import type { ArticleDetail, Sanction, SearchResponse, SearchResult } from "@/lib/types";

type SearchRow = {
  article_id: string;
  law_id: string;
  law_title: string;
  law_number: string;
  article_number: string;
  category: string;
  relevance_score: number;
  relevance_label: "tinggi" | "sedang" | "rendah";
  match_reason: string;
  plain_summary: string;
  article_text: string;
  source_url: string;
  normalized_query: string;
  sanctions: Sanction[] | null;
};

type DetailRow = {
  article_id: string;
  law_id: string;
  law_title: string;
  law_number: string;
  law_year: number;
  law_category: string;
  source_url: string;
  is_active: boolean;
  article_number: string;
  article_text: string;
  plain_summary: string;
  category: string;
  relevance_reason: string;
  sanctions: Sanction[] | null;
};

function mapSearchRow(row: SearchRow): SearchResult {
  return {
    article_id: row.article_id,
    law_id: row.law_id,
    law_title: row.law_title,
    law_number: row.law_number,
    article_number: row.article_number,
    category: row.category,
    relevance_score: Number(row.relevance_score),
    relevance_label: row.relevance_label,
    match_reason: row.match_reason,
    plain_summary: row.plain_summary,
    article_text: row.article_text,
    source_url: row.source_url,
    sanctions: row.sanctions ?? [],
  };
}

async function supabaseRpc<T>(functionName: string, payload: Record<string, unknown>) {
  const { url, key } = getSupabaseConfig();
  const endpoint = new URL(`/rest/v1/rpc/${functionName}`, url);

  return requestSupabase<T>(endpoint, key, payload);
}

async function persistQueryLog(
  query: string,
  normalizedQuery: string,
  category?: string,
  resultCount?: number,
  fallbackUsed?: boolean,
) {
  const { url, key } = getSupabaseConfig();
  const endpoint = new URL("/rest/v1/query_logs", url);

  await requestSupabase<null>(
    endpoint,
    key,
    [
      {
        raw_query: query,
        normalized_query: normalizedQuery,
        category: category ?? null,
        result_count: resultCount ?? 0,
        fallback_used: fallbackUsed ?? false,
      },
    ],
    "POST",
    {
      Prefer: "return=minimal",
    },
  );
}

export async function searchArticles(query: string, category?: string): Promise<SearchResponse> {
  try {
    const selectedCategory = category?.trim() || null;
    const primaryRows = await supabaseRpc<SearchRow[]>("search_articles", {
      raw_query: query,
      selected_category: selectedCategory,
      result_limit: 8,
    });
    let finalRows = primaryRows;
    let fallbackUsed = false;

    if (selectedCategory && primaryRows.length === 0) {
      finalRows = await supabaseRpc<SearchRow[]>("search_articles", {
        raw_query: query,
        selected_category: null,
        result_limit: 8,
      });
      fallbackUsed = true;
    }

    const normalizedQuery = finalRows[0]?.normalized_query ?? normalizeSearchQuery(query);
    const response: SearchResponse = {
      query,
      normalized_query: normalizedQuery,
      total_results: finalRows.length,
      fallback_used: fallbackUsed,
      categories_considered: selectedCategory ? [selectedCategory] : [],
      results: finalRows.map(mapSearchRow),
    };

    void persistQueryLog(
      query,
      normalizedQuery,
      selectedCategory ?? undefined,
      response.total_results,
      fallbackUsed,
    );

    return response;
  } catch {
    return fallbackSearchArticles(query, category);
  }
}

export async function getArticleDetail(articleId: string): Promise<ArticleDetail | null> {
  try {
    const row = (await supabaseRpc<DetailRow[]>("get_article_detail", {
      input_id: articleId,
    }))[0];

    if (!row) {
      return null;
    }

    return {
      article_id: row.article_id,
      law: {
        id: row.law_id,
        title: row.law_title,
        law_number: row.law_number,
        year: row.law_year,
        category: row.law_category,
        source_url: row.source_url,
        is_active: row.is_active,
      },
      article: {
        article_number: row.article_number,
        article_text: row.article_text,
        plain_summary: row.plain_summary,
        category: row.category,
        relevance_reason: row.relevance_reason,
      },
      sanctions: row.sanctions ?? [],
    };
  } catch {
    return fallbackArticleDetail(articleId);
  }
}

function requestSupabase<T>(
  endpoint: URL,
  key: string,
  payload?: unknown,
  method = "POST",
  extraHeaders?: Record<string, string>,
) {
  return new Promise<T>((resolve, reject) => {
    const request = httpsRequest(
      endpoint,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
          ...extraHeaders,
        },
      },
      (response) => {
        let raw = "";

        response.on("data", (chunk) => {
          raw += chunk;
        });

        response.on("end", () => {
          const statusCode = response.statusCode ?? 500;

          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(raw || `Permintaan Supabase gagal dengan status ${statusCode}.`));
            return;
          }

          if (!raw) {
            resolve(null as T);
            return;
          }

          resolve(JSON.parse(raw) as T);
        });
      },
    );

    request.on("error", reject);

    if (payload !== undefined) {
      request.write(JSON.stringify(payload));
    }

    request.end();
  });
}
