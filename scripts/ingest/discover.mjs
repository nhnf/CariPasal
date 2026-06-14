import * as cheerio from "cheerio";

import { DISCOVERY_TARGETS, DEFAULT_SOURCE_SLUGS } from "./config.mjs";
import { getResponseIssue, requestText } from "./http.mjs";
import {
  completeIngestRun,
  createIngestRun,
  fetchLegalSources,
  upsertRawDocuments,
} from "./supabase-rest.mjs";

const sourceSlugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : DEFAULT_SOURCE_SLUGS;

async function main() {
  const sources = await fetchLegalSources(sourceSlugs);
  let hasFailedSource = false;

  for (const source of sources) {
    const run = await createIngestRun(source.id, "discover");

    try {
      const listingUrls = DISCOVERY_TARGETS[source.slug] ?? [source.base_url];
      const discoveredRecords = [];
      const seen = new Set();
      const listingResults = [];

      for (const listingUrl of listingUrls) {
        try {
          const page = await requestText(listingUrl);
          const issue = getResponseIssue(page);

          if (issue) {
            throw new Error(issue);
          }

          const urls = extractDetailUrls(source.slug, listingUrl, page.body);

          listingResults.push({
            listing_url: listingUrl,
            status: "completed",
            http_status: page.statusCode,
            transport: page.transport,
            discovered_count: urls.length,
          });

          for (const detail of urls) {
            const fingerprint = `${source.id}:${detail.detailUrl}`;

            if (seen.has(fingerprint)) {
              continue;
            }

            seen.add(fingerprint);
            discoveredRecords.push({
              source_id: source.id,
              external_id: detail.externalId ?? null,
              listing_url: listingUrl,
              detail_url: detail.detailUrl,
              document_hint: detail.documentHint ?? null,
              source_document_type: detail.documentType ?? null,
              source_document_number: detail.documentNumber ?? null,
              source_document_year: detail.documentYear ?? null,
              discovery_payload: {
                source_slug: source.slug,
                discovery_strategy: "html_listing",
                matched_from: listingUrl,
                http_status: page.statusCode,
                transport: page.transport,
              },
              crawl_status: "discovered",
              last_seen_at: new Date().toISOString(),
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";

          listingResults.push({
            listing_url: listingUrl,
            status: "failed",
            error: message,
          });

          console.warn(`[discover] ${source.slug}: listing gagal ${listingUrl} -> ${message}`);
        }
      }

      const successfulListings = listingResults.filter((item) => item.status === "completed");

      if (!successfulListings.length) {
        hasFailedSource = true;
        await completeIngestRun(
          run.id,
          "failed",
          {
            source_slug: source.slug,
            listing_urls: listingUrls.length,
            discovered_count: 0,
            upserted_count: 0,
            listing_results: listingResults,
          },
          "Semua listing URL gagal diambil.",
        );
        continue;
      }

      const upserted = await upsertRawDocuments(discoveredRecords);
      const runStatus =
        successfulListings.length === listingUrls.length ? "completed" : "partial";

      if (runStatus === "partial") {
        hasFailedSource = true;
      }

      await completeIngestRun(run.id, runStatus, {
        source_slug: source.slug,
        listing_urls: listingUrls.length,
        successful_listing_urls: successfulListings.length,
        discovered_count: discoveredRecords.length,
        upserted_count: upserted.length,
        listing_results: listingResults,
      });

      console.log(
        `[discover] ${source.slug}: discovered=${discoveredRecords.length}, upserted=${upserted.length}, listings_ok=${successfulListings.length}/${listingUrls.length}`,
      );
    } catch (error) {
      hasFailedSource = true;
      await completeIngestRun(
        run.id,
        "failed",
        { source_slug: source.slug },
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error(
        `[discover] ${source.slug}: source gagal -> ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  if (hasFailedSource) {
    process.exitCode = 1;
  }
}

function extractDetailUrls(sourceSlug, listingUrl, html) {
  switch (sourceSlug) {
    case "jdih-bpk":
      return extractBpkUrls(listingUrl, html);
    case "jdihn":
      return extractJdihnUrls(listingUrl, html);
    case "peraturan-go-id":
      return extractPeraturanGoUrls(listingUrl, html);
    case "jdih-setneg":
      return extractSetnegUrls(listingUrl, html);
    default:
      return [];
  }
}

function extractBpkUrls(listingUrl, html) {
  const $ = cheerio.load(html);
  const results = [];

  $("a[href*='/Details/']").each((_, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    const detailUrl = new URL(href, listingUrl).toString();
    const text = $(element).text().trim().replace(/\s+/g, " ");
    const detailMatch = detailUrl.match(/\/Details\/(\d+)\//i);
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const typeMatch = text.match(/\b(UU|PP|PERPRES|PERMEN|PERDA|INPRES|KEPPRES|PMK)\b/i);
    const numberMatch = text.match(/\bNo\.?\s*([0-9A-Za-z./-]+)\b/i);

    results.push({
      detailUrl,
      externalId: detailMatch?.[1] ?? null,
      documentHint: text || null,
      documentType: typeMatch?.[1]?.toUpperCase() ?? null,
      documentNumber: numberMatch?.[1] ?? null,
      documentYear: yearMatch ? Number(yearMatch[0]) : null,
    });
  });

  return results;
}

function extractJdihnUrls(listingUrl, html) {
  const $ = cheerio.load(html);
  const results = [];

  $("a[href*='/pencarian/detail/']").each((_, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    const detailUrl = new URL(href, listingUrl).toString();
    const text = $(element).text().trim().replace(/\s+/g, " ");
    const match = detailUrl.match(/\/detail\/(\d+)\//i);
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const typeMatch = text.match(/\b(UU|PP|PERPRES|PERMEN|PERDA|INPRES|KEPPRES)\b/i);

    results.push({
      detailUrl,
      externalId: match?.[1] ?? null,
      documentHint: text || null,
      documentType: typeMatch?.[1]?.toUpperCase() ?? null,
      documentNumber: null,
      documentYear: yearMatch ? Number(yearMatch[0]) : null,
    });
  });

  return results;
}

function extractPeraturanGoUrls(listingUrl, html) {
  const $ = cheerio.load(html);
  const results = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    if (!href || href.startsWith("#")) {
      return;
    }

    const detailUrl = new URL(href, listingUrl).toString();
    const text = $(element).text().trim().replace(/\s+/g, " ");

    if (
      !detailUrl.includes("peraturan.go.id") ||
      detailUrl.endsWith("/pp") ||
      detailUrl.endsWith("/permen") ||
      detailUrl.endsWith("/perban") ||
      detailUrl.endsWith("/perda") ||
      detailUrl.endsWith("/putusan")
    ) {
      return;
    }

    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const typeMatch = text.match(/\b(UU|PP|PERPRES|PERMEN|PERDA|PUTUSAN)\b/i);

    results.push({
      detailUrl,
      externalId: null,
      documentHint: text || null,
      documentType: typeMatch?.[1]?.toUpperCase() ?? null,
      documentNumber: null,
      documentYear: yearMatch ? Number(yearMatch[0]) : null,
    });
  });

  return results;
}

function extractSetnegUrls(listingUrl, html) {
  const $ = cheerio.load(html);
  const results = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const text = $(element).text().trim().replace(/\s+/g, " ");

    if (!href || !text) {
      return;
    }

    const detailUrl = new URL(href, listingUrl).toString();

    if (!detailUrl.includes("jdih.setneg.go.id") || detailUrl.includes("#")) {
      return;
    }

    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const typeMatch = text.match(/\b(UU|PP|PERPRES|INPRES|KEPPRES)\b/i);

    results.push({
      detailUrl,
      externalId: null,
      documentHint: text || null,
      documentType: typeMatch?.[1]?.toUpperCase() ?? null,
      documentNumber: null,
      documentYear: yearMatch ? Number(yearMatch[0]) : null,
    });
  });

  return results;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
