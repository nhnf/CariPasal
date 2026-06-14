import { describe, expect, it } from "vitest";

import {
  buildSearchUrl,
  getRelevanceAccent,
  normalizeSearchQuery,
  sentenceCase,
} from "./search";

describe("normalizeSearchQuery", () => {
  it("menormalkan sinonim hukum umum", () => {
    expect(normalizeSearchQuery("Saya ditipu di marketplace")).toBe(
      "saya penipuan di transaksi elektronik",
    );
  });

  it("membersihkan spasi berlebih", () => {
    expect(normalizeSearchQuery("  anak   dipukul  ")).toBe(
      "kekerasan terhadap anak",
    );
  });
});

describe("buildSearchUrl", () => {
  it("membentuk URL pencarian dengan kategori", () => {
    expect(buildSearchUrl("penipuan jual beli online", "siber")).toBe(
      "/search?q=penipuan+jual+beli+online&category=siber",
    );
  });
});

describe("presentational helpers", () => {
  it("mengembalikan aksen relevansi", () => {
    expect(getRelevanceAccent("tinggi")).toBe("emerald");
    expect(getRelevanceAccent("sedang")).toBe("amber");
    expect(getRelevanceAccent("rendah")).toBe("slate");
  });

  it("mengubah huruf awal menjadi kapital", () => {
    expect(sentenceCase("pidana umum")).toBe("Pidana umum");
  });
});
