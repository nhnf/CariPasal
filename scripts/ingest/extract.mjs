import {
  completeIngestRun,
  createIngestRun,
  fetchLegalSources,
  fetchRawDocumentsForExtraction,
  insertSnapshots,
  updateRawDocument,
} from "./supabase-rest.mjs";
import { getResponseIssue, requestText } from "./http.mjs";
import { extractMetadata } from "./extractors.mjs";

const sourceSlugs = process.argv.slice(2);

async function main() {
  const sources = await fetchLegalSources(sourceSlugs.length ? sourceSlugs : undefined);

  for (const source of sources) {
    const run = await createIngestRun(source.id, "extract");

    try {
      const pendingDocuments = await fetchRawDocumentsForExtraction(source.id, 10);
      let parsedCount = 0;
      let failedCount = 0;

      for (const doc of pendingDocuments) {
        try {
          const page = await requestText(doc.detail_url);
          const issue = getResponseIssue(page);

          if (issue) {
            throw new Error(issue);
          }

          const extracted = extractMetadata(source.slug, doc.detail_url, page.body);

          await insertSnapshots([
            {
              source_document_id: doc.id,
              ingest_run_id: run.id,
              snapshot_type: "html",
              http_status: page.statusCode,
              response_headers: page.headers,
              snapshot_hash: page.hash,
              snapshot_body: page.body.slice(0, 200000),
              extracted_payload: extracted,
            },
          ]);

          await updateRawDocument(doc.id, {
            crawl_status: "parsed",
            last_error: null,
            updated_at: new Date().toISOString(),
          });

          parsedCount += 1;
        } catch (error) {
          await updateRawDocument(doc.id, {
            crawl_status: "failed",
            last_error: error instanceof Error ? error.message : "Unknown error",
            updated_at: new Date().toISOString(),
          });
          failedCount += 1;
        }
      }

      await completeIngestRun(run.id, failedCount > 0 ? "partial" : "completed", {
        source_slug: source.slug,
        extracted_count: parsedCount,
        failed_count: failedCount,
      });

      console.log(
        `[extract] ${source.slug}: parsed=${parsedCount}, failed=${failedCount}`,
      );
    } catch (error) {
      await completeIngestRun(
        run.id,
        "failed",
        { source_slug: source.slug },
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
