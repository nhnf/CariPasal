import { getResponseIssue, requestJson } from "./http.mjs";

function getEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi.`);
  }

  return value;
}

export function getSupabaseAdminConfig() {
  return {
    url: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export async function requestSupabase(pathname, method = "GET", body, extraHeaders = {}) {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  const target = new URL(pathname, url);
  const response = await requestJson(target.toString(), {
    method,
    body,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...extraHeaders,
    },
  });
  const issue = getResponseIssue(response);

  if (issue) {
    throw new Error(
      `Supabase ${method} ${pathname} gagal: ${issue} ${response.body || "tanpa body"}`.trim(),
    );
  }

  return response.data;
}

export async function fetchLegalSources(slugs) {
  const params = new URLSearchParams();
  params.set("select", "id,slug,name,base_url");

  if (slugs?.length) {
    params.set("slug", `in.(${slugs.map((item) => `"${item}"`).join(",")})`);
  }

  return requestSupabase(`/rest/v1/legal_sources?${params.toString()}`);
}

export async function createIngestRun(sourceId, runType) {
  const payload = [
    {
      source_id: sourceId,
      run_type: runType,
      status: "running",
    },
  ];

  const data = await requestSupabase("/rest/v1/ingest_runs", "POST", payload, {
    Prefer: "return=representation",
  });

  return data[0];
}

export async function completeIngestRun(runId, status, summary, errorMessage = null) {
  const params = new URLSearchParams();
  params.set("id", `eq.${runId}`);

  return requestSupabase(
    `/rest/v1/ingest_runs?${params.toString()}`,
    "PATCH",
    {
      status,
      finished_at: new Date().toISOString(),
      summary,
      error_message: errorMessage,
    },
    {
      Prefer: "return=minimal",
    },
  );
}

export async function upsertRawDocuments(records) {
  if (!records.length) {
    return [];
  }

  const params = new URLSearchParams();
  params.set("on_conflict", "source_id,detail_url");

  return requestSupabase(`/rest/v1/source_documents_raw?${params.toString()}`, "POST", records, {
    Prefer: "resolution=merge-duplicates,return=representation",
  });
}

export async function fetchRawDocumentsForExtraction(sourceId, limit = 10) {
  const params = new URLSearchParams();
  params.set(
    "select",
    "id,source_id,detail_url,document_hint,source_document_type,source_document_number,source_document_year,discovery_payload",
  );
  params.set("source_id", `eq.${sourceId}`);
  params.set("crawl_status", "in.(discovered,fetched,failed)");
  params.set("order", "discovered_at.asc");
  params.set("limit", String(limit));

  return requestSupabase(`/rest/v1/source_documents_raw?${params.toString()}`);
}

export async function insertSnapshots(records) {
  if (!records.length) {
    return [];
  }

  return requestSupabase("/rest/v1/source_document_snapshots", "POST", records, {
    Prefer: "return=representation",
  });
}

export async function updateRawDocument(id, payload) {
  const params = new URLSearchParams();
  params.set("id", `eq.${id}`);

  return requestSupabase(`/rest/v1/source_documents_raw?${params.toString()}`, "PATCH", payload, {
    Prefer: "return=minimal",
  });
}
