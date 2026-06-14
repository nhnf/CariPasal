import * as cheerio from "cheerio";

export function extractMetadata(sourceSlug, url, html) {
  switch (sourceSlug) {
    case "jdih-bpk":
      return extractBpkDetail(url, html);
    case "jdihn":
      return extractJdihnDetail(url, html);
    case "peraturan-go-id":
      return extractPeraturanGoDetail(url, html);
    case "jdih-setneg":
      return extractSetnegDetail(url, html);
    default:
      return minimalPayload(url, html);
  }
}

function extractBpkDetail(url, html) {
  const $ = cheerio.load(html);
  const title = $("h1,h2").first().text().trim().replace(/\s+/g, " ");
  const text = $("body").text().replace(/\s+/g, " ");
  const relationHints = collectRelations(text);
  const fileLinks = collectLinks($, url, [".pdf"]);

  return {
    title,
    title_normalized: normalizeTitle(title),
    issuer: extractField(text, /(?:Sumber|Instansi)\s*:?\s*([A-Za-z0-9 ,./()-]{3,120})/i),
    document_type: extractField(text, /\b(UU|PP|PERPRES|PERMEN|PERDA|KEPPRES|INPRES|PMK)\b/i),
    document_number: extractField(text, /\bNo\.?\s*([0-9A-Za-z./-]+)\b/i),
    document_year: extractYear(text),
    file_links: fileLinks,
    relation_hints: relationHints,
    detail_url: url,
  };
}

function extractJdihnDetail(url, html) {
  const $ = cheerio.load(html);
  const title = $("h1,h2").first().text().trim().replace(/\s+/g, " ");
  const text = $("body").text().replace(/\s+/g, " ");
  const fileLinks = collectLinks($, url, [".pdf", "/file/download/"]);

  return {
    title,
    title_normalized: normalizeTitle(title),
    issuer: extractField(text, /(?:Sumber|Instansi)\s*:?\s*([A-Za-z0-9 ,./()-]{3,120})/i),
    document_type: extractField(text, /\b(UU|PP|PERPRES|PERMEN|PERDA|KEPPRES|INPRES)\b/i),
    document_number: extractField(text, /\bNomor\s*:?\s*([0-9A-Za-z./-]+)\b/i),
    document_year: extractYear(text),
    file_links: fileLinks,
    relation_hints: collectRelations(text),
    detail_url: url,
  };
}

function extractPeraturanGoDetail(url, html) {
  const $ = cheerio.load(html);
  const title = $("h1,h2,h3").first().text().trim().replace(/\s+/g, " ");
  const text = $("body").text().replace(/\s+/g, " ");
  const fileLinks = collectLinks($, url, [".pdf", "/files/"]);

  return {
    title,
    title_normalized: normalizeTitle(title),
    issuer: null,
    document_type: extractField(text, /\b(UU|PP|PERPRES|PERMEN|PERDA|PUTUSAN)\b/i),
    document_number: extractField(text, /\bNomor\s*:?\s*([0-9A-Za-z./-]+)\b/i),
    document_year: extractYear(text),
    file_links: fileLinks,
    relation_hints: collectRelations(text),
    detail_url: url,
  };
}

function extractSetnegDetail(url, html) {
  const $ = cheerio.load(html);
  const title = $("h1,h2,h3").first().text().trim().replace(/\s+/g, " ");
  const text = $("body").text().replace(/\s+/g, " ");
  const fileLinks = collectLinks($, url, [".pdf"]);

  return {
    title,
    title_normalized: normalizeTitle(title),
    issuer: "Setneg",
    document_type: extractField(text, /\b(UU|PP|PERPRES|INPRES|KEPPRES)\b/i),
    document_number: extractField(text, /\bNomor\s*:?\s*([0-9A-Za-z./-]+)\b/i),
    document_year: extractYear(text),
    file_links: fileLinks,
    relation_hints: collectRelations(text),
    detail_url: url,
  };
}

function minimalPayload(url, html) {
  const text = html.replace(/\s+/g, " ");
  return {
    title: "",
    title_normalized: "",
    issuer: null,
    document_type: extractField(text, /\b(UU|PP|PERPRES|PERMEN|PERDA|KEPPRES|INPRES)\b/i),
    document_number: extractField(text, /\bNomor\s*:?\s*([0-9A-Za-z./-]+)\b/i),
    document_year: extractYear(text),
    file_links: [],
    relation_hints: collectRelations(text),
    detail_url: url,
  };
}

function collectLinks($, baseUrl, markers) {
  const links = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    if (!href) {
      return;
    }

    const absolute = new URL(href, baseUrl).toString();

    if (markers.some((marker) => absolute.includes(marker))) {
      links.push(absolute);
    }
  });

  return Array.from(new Set(links));
}

function collectRelations(text) {
  const matches = [];
  const patterns = [
    { type: "amends", regex: /perubahan (?:atas|kedua atas|ketiga atas|keempat atas) [^.]{0,180}/gi },
    { type: "revokes", regex: /mencabut [^.]{0,180}/gi },
    { type: "references", regex: /undang-undang nomor [^.]{0,140}/gi },
  ];

  for (const pattern of patterns) {
    const found = text.match(pattern.regex) ?? [];

    for (const item of found.slice(0, 10)) {
      matches.push({
        relation_type: pattern.type,
        snippet: item.trim(),
      });
    }
  }

  return matches;
}

function extractField(text, regex) {
  const match = text.match(regex);
  return match?.[1]?.trim() ?? null;
}

function extractYear(text) {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function normalizeTitle(title) {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}
