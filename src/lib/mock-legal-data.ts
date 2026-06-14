import type { ArticleDetail, SearchResponse, SearchResult, Sanction } from "@/lib/types";
import { normalizeSearchQuery } from "@/lib/search";

type SeedArticle = {
  article_id: string;
  law_id: string;
  law_title: string;
  law_number: string;
  law_year: number;
  category: string;
  article_number: string;
  article_text: string;
  plain_summary: string;
  source_url: string;
  search_document: string;
  keywords: Array<{ term: string; weight: number }>;
  sanctions: Sanction[];
};

const DATASET: SeedArticle[] = [
  {
    article_id: "article-kuhp-378",
    law_id: "law-kuhp",
    law_title: "Kitab Undang-Undang Hukum Pidana",
    law_number: "KUHP",
    law_year: 2023,
    category: "pidana umum",
    article_number: "Pasal 378",
    article_text:
      "Barang siapa dengan maksud untuk menguntungkan diri sendiri atau orang lain secara melawan hukum, dengan nama palsu, dengan tipu muslihat, ataupun rangkaian kebohongan, menggerakkan orang lain untuk menyerahkan barang, memberi utang, atau menghapuskan piutang, dipidana karena penipuan.",
    plain_summary:
      "Pasal ini menjadi rujukan utama untuk kasus penipuan, termasuk ketika seseorang dibujuk dengan tipu muslihat hingga mengalami kerugian.",
    source_url: "https://peraturan.bpk.go.id/Details/247597/uu-no-1-tahun-2023",
    search_document:
      "kuhp pasal 378 penipuan tipu muslihat rangkaian kebohongan kerugian korban penipuan jual beli",
    keywords: [
      { term: "penipuan", weight: 0.7 },
      { term: "tipu muslihat", weight: 0.65 },
      { term: "jual beli", weight: 0.35 },
    ],
    sanctions: [
      {
        sanction_type: "pidana penjara",
        max_imprisonment: "4 tahun",
        max_fine: null,
        notes: "Ancaman dasar penipuan dalam KUHP.",
      },
    ],
  },
  {
    article_id: "article-ite-28-1",
    law_id: "law-ite",
    law_title: "Undang-Undang Informasi dan Transaksi Elektronik",
    law_number: "UU No. 19 Tahun 2016",
    law_year: 2016,
    category: "siber",
    article_number: "Pasal 28 ayat (1)",
    article_text:
      "Setiap Orang dengan sengaja dan tanpa hak menyebarkan berita bohong dan menyesatkan yang mengakibatkan kerugian konsumen dalam transaksi elektronik.",
    plain_summary:
      "Pasal ini sering dikaitkan dengan penipuan atau informasi bohong dalam transaksi elektronik dan jual beli online.",
    source_url: "https://peraturan.bpk.go.id/Details/37582/uu-no-19-tahun-2016",
    search_document:
      "uu ite pasal 28 ayat 1 berita bohong transaksi elektronik jual beli online marketplace penipuan konsumen",
    keywords: [
      { term: "transaksi elektronik", weight: 0.8 },
      { term: "marketplace", weight: 0.7 },
      { term: "berita bohong", weight: 0.65 },
    ],
    sanctions: [
      {
        sanction_type: "pidana penjara",
        max_imprisonment: "6 tahun",
        max_fine: "Rp1.000.000.000",
        notes: "Dibaca bersama ketentuan sanksi UU ITE.",
      },
    ],
  },
  {
    article_id: "article-ite-27-3",
    law_id: "law-ite",
    law_title: "Undang-Undang Informasi dan Transaksi Elektronik",
    law_number: "UU No. 19 Tahun 2016",
    law_year: 2016,
    category: "siber",
    article_number: "Pasal 27 ayat (3)",
    article_text:
      "Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.",
    plain_summary:
      "Pasal ini relevan untuk dugaan penghinaan atau pencemaran nama baik di internet dan media sosial.",
    source_url: "https://peraturan.bpk.go.id/Details/37582/uu-no-19-tahun-2016",
    search_document:
      "uu ite pasal 27 ayat 3 pencemaran nama baik penghinaan internet media sosial fitnah online",
    keywords: [
      { term: "pencemaran nama baik", weight: 0.9 },
      { term: "fitnah", weight: 0.7 },
      { term: "penghinaan", weight: 0.6 },
    ],
    sanctions: [
      {
        sanction_type: "pidana penjara",
        max_imprisonment: "4 tahun",
        max_fine: "Rp750.000.000",
        notes: "Terkait muatan penghinaan atau pencemaran nama baik elektronik.",
      },
    ],
  },
  {
    article_id: "article-kdrt-44",
    law_id: "law-kdrt",
    law_title: "Undang-Undang Penghapusan Kekerasan Dalam Rumah Tangga",
    law_number: "UU No. 23 Tahun 2004",
    law_year: 2004,
    category: "keluarga",
    article_number: "Pasal 44",
    article_text:
      "Setiap orang yang melakukan perbuatan kekerasan fisik dalam lingkup rumah tangga dipidana sesuai akibat yang ditimbulkan.",
    plain_summary:
      "Pasal ini menjadi titik awal untuk kasus KDRT yang melibatkan kekerasan fisik oleh pasangan atau anggota keluarga dalam rumah tangga.",
    source_url: "https://peraturan.bpk.go.id/Details/40597/uu-no-23-tahun-2004",
    search_document:
      "uu kdrt pasal 44 kekerasan fisik rumah tangga dipukul suami istri keluarga",
    keywords: [
      { term: "kdrt", weight: 0.95 },
      { term: "dipukul suami", weight: 0.7 },
      { term: "kekerasan fisik", weight: 0.85 },
    ],
    sanctions: [
      {
        sanction_type: "pidana penjara",
        max_imprisonment: "5 tahun",
        max_fine: "Rp15.000.000",
        notes: "Besar ancaman bergantung akibat kekerasan yang ditimbulkan.",
      },
    ],
  },
  {
    article_id: "article-konsumen-8",
    law_id: "law-konsumen",
    law_title: "Undang-Undang Perlindungan Konsumen",
    law_number: "UU No. 8 Tahun 1999",
    law_year: 1999,
    category: "konsumen",
    article_number: "Pasal 8",
    article_text:
      "Pelaku usaha dilarang memproduksi dan/atau memperdagangkan barang dan/atau jasa yang tidak sesuai dengan standar, kondisi, jaminan, atau keterangan sebagaimana dinyatakan.",
    plain_summary:
      "Pasal ini sering dipakai saat konsumen menerima barang yang tidak sesuai, cacat, atau menyesatkan dalam transaksi.",
    source_url: "https://peraturan.bpk.go.id/Details/45383/uu-no-8-tahun-1999",
    search_document:
      "uu perlindungan konsumen pasal 8 barang tidak sesuai cacat menyesatkan konsumen jual beli",
    keywords: [
      { term: "barang tidak sesuai", weight: 0.75 },
      { term: "konsumen", weight: 0.6 },
      { term: "jual beli", weight: 0.4 },
    ],
    sanctions: [
      {
        sanction_type: "pidana penjara",
        max_imprisonment: "5 tahun",
        max_fine: "Rp2.000.000.000",
        notes: "Sanksi pidana konsumen umumnya dibaca bersama ketentuan pasal sanksi dalam UU yang sama.",
      },
    ],
  },
  {
    article_id: "article-anak-80",
    law_id: "law-anak",
    law_title: "Undang-Undang Perlindungan Anak",
    law_number: "UU No. 35 Tahun 2014",
    law_year: 2014,
    category: "anak",
    article_number: "Pasal 80",
    article_text:
      "Setiap orang yang melakukan kekejaman, kekerasan, ancaman kekerasan, atau penganiayaan terhadap anak dipidana dengan pidana penjara dan/atau denda.",
    plain_summary:
      "Pasal ini relevan untuk kekerasan terhadap anak, baik di rumah, sekolah, maupun lingkungan sekitar.",
    source_url: "https://peraturan.bpk.go.id/Details/38723/uu-no-35-tahun-2014",
    search_document:
      "uu perlindungan anak pasal 80 kekerasan terhadap anak penganiayaan ancaman kekerasan",
    keywords: [
      { term: "anak dipukul", weight: 0.8 },
      { term: "kekerasan terhadap anak", weight: 0.9 },
    ],
    sanctions: [
      {
        sanction_type: "pidana penjara",
        max_imprisonment: "3 tahun 6 bulan",
        max_fine: "Rp72.000.000",
        notes: "Ancaman meningkat bila korban luka berat atau meninggal dunia.",
      },
    ],
  },
  {
    article_id: "article-narkotika-127",
    law_id: "law-narkotika",
    law_title: "Undang-Undang Narkotika",
    law_number: "UU No. 35 Tahun 2009",
    law_year: 2009,
    category: "narkotika",
    article_number: "Pasal 127",
    article_text:
      "Setiap penyalah guna Narkotika Golongan I, II, atau III bagi diri sendiri dipidana dengan pidana penjara sesuai golongannya.",
    plain_summary:
      "Pasal ini biasa muncul untuk kasus penggunaan narkotika bagi diri sendiri dan sering dibaca bersama ketentuan rehabilitasi.",
    source_url: "https://peraturan.bpk.go.id/Details/38776/uu-no-35-tahun-2009",
    search_document:
      "uu narkotika pasal 127 penyalah guna narkotika pemakai narkoba untuk diri sendiri",
    keywords: [
      { term: "narkotika", weight: 0.75 },
      { term: "narkoba", weight: 0.75 },
      { term: "pemakai", weight: 0.4 },
    ],
    sanctions: [
      {
        sanction_type: "pidana penjara",
        max_imprisonment: "4 tahun",
        max_fine: null,
        notes: "Pertimbangkan juga ketentuan rehabilitasi sesuai perkara.",
      },
    ],
  },
  {
    article_id: "article-llaj-310",
    law_id: "law-llaj",
    law_title: "Undang-Undang Lalu Lintas dan Angkutan Jalan",
    law_number: "UU No. 22 Tahun 2009",
    law_year: 2009,
    category: "lalu lintas",
    article_number: "Pasal 310",
    article_text:
      "Setiap orang yang karena kelalaiannya mengemudikan kendaraan bermotor mengakibatkan kecelakaan lalu lintas dengan kerusakan, luka, atau meninggal dunia dipidana sesuai akibatnya.",
    plain_summary:
      "Pasal ini umum dipakai untuk kecelakaan lalu lintas akibat kelalaian pengemudi.",
    source_url: "https://peraturan.bpk.go.id/Details/38767/uu-no-22-tahun-2009",
    search_document:
      "uu lalu lintas pasal 310 kecelakaan lalu lintas tabrak kelalaian pengemudi luka meninggal",
    keywords: [
      { term: "kecelakaan lalu lintas", weight: 0.9 },
      { term: "tabrak", weight: 0.65 },
      { term: "kelalaian pengemudi", weight: 0.55 },
    ],
    sanctions: [
      {
        sanction_type: "pidana penjara",
        max_imprisonment: "6 tahun",
        max_fine: "Rp12.000.000",
        notes: "Besaran ancaman bertingkat sesuai akibat kecelakaan.",
      },
    ],
  },
  {
    article_id: "article-uud-27-1",
    law_id: "law-uud-1945",
    law_title: "Undang-Undang Dasar Negara Republik Indonesia Tahun 1945",
    law_number: "UUD 1945",
    law_year: 1945,
    category: "konstitusi",
    article_number: "Pasal 27 ayat (1)",
    article_text:
      "Segala warga negara bersamaan kedudukannya di dalam hukum dan pemerintahan dan wajib menjunjung hukum dan pemerintahan itu dengan tidak ada kecualinya.",
    plain_summary:
      "Pasal ini menjadi dasar konstitusional bahwa setiap warga negara berhak diperlakukan sama di depan hukum dan pemerintahan.",
    source_url: "https://peraturan.bpk.go.id/Details/101646/",
    search_document:
      "uud 1945 pasal 27 ayat 1 persamaan di depan hukum sama di depan hukum diskriminasi warga negara perlakuan sama",
    keywords: [
      { term: "persamaan di depan hukum", weight: 0.95 },
      { term: "sama di depan hukum", weight: 0.9 },
      { term: "diskriminasi", weight: 0.55 },
    ],
    sanctions: [],
  },
  {
    article_id: "article-uud-28e-3",
    law_id: "law-uud-1945",
    law_title: "Undang-Undang Dasar Negara Republik Indonesia Tahun 1945",
    law_number: "UUD 1945",
    law_year: 1945,
    category: "konstitusi",
    article_number: "Pasal 28E ayat (3)",
    article_text:
      "Setiap orang berhak atas kebebasan berserikat, berkumpul, dan mengeluarkan pendapat.",
    plain_summary:
      "Pasal ini melindungi kebebasan berorganisasi, berkumpul, dan menyampaikan pendapat sebagai hak dasar warga negara.",
    source_url: "https://peraturan.bpk.go.id/Details/101646/",
    search_document:
      "uud 1945 pasal 28e ayat 3 kebebasan berpendapat kebebasan berserikat kebebasan berkumpul demonstrasi organisasi pendapat",
    keywords: [
      { term: "kebebasan berpendapat", weight: 0.95 },
      { term: "berserikat", weight: 0.7 },
      { term: "demo", weight: 0.45 },
    ],
    sanctions: [],
  },
  {
    article_id: "article-uud-28g-1",
    law_id: "law-uud-1945",
    law_title: "Undang-Undang Dasar Negara Republik Indonesia Tahun 1945",
    law_number: "UUD 1945",
    law_year: 1945,
    category: "konstitusi",
    article_number: "Pasal 28G ayat (1)",
    article_text:
      "Setiap orang berhak atas perlindungan diri pribadi, keluarga, kehormatan, martabat, dan harta benda yang di bawah kekuasaannya, serta berhak atas rasa aman dan perlindungan dari ancaman ketakutan untuk berbuat atau tidak berbuat sesuatu yang merupakan hak asasi.",
    plain_summary:
      "Pasal ini menegaskan hak atas rasa aman, perlindungan diri, dan perlindungan dari ancaman yang mengganggu hak asasi seseorang.",
    source_url: "https://peraturan.bpk.go.id/Details/101646/",
    search_document:
      "uud 1945 pasal 28g ayat 1 perlindungan diri rasa aman ancaman kehormatan martabat keluarga harta benda hak asasi",
    keywords: [
      { term: "rasa aman", weight: 0.9 },
      { term: "ancaman", weight: 0.6 },
      { term: "perlindungan diri", weight: 0.8 },
    ],
    sanctions: [],
  },
];

function scoreArticle(article: SeedArticle, normalizedQuery: string, selectedCategory?: string) {
  const keywordScore = article.keywords.reduce((sum, item) => {
    return normalizedQuery.includes(item.term) ? sum + item.weight : sum;
  }, 0);

  const tokenHits = normalizedQuery
    .split(" ")
    .filter((token) => token.length > 2 && article.search_document.includes(token)).length;

  const textScore = tokenHits * 0.08;
  const categoryBoost =
    selectedCategory && article.category === selectedCategory ? 0.18 : 0;

  return Number((keywordScore + textScore + categoryBoost).toFixed(4));
}

export function fallbackSearchArticles(query: string, category?: string): SearchResponse {
  const normalizedQuery = normalizeSearchQuery(query);
  const selectedCategory = category?.trim() || "";

  const scored = DATASET.filter((article) => {
    if (selectedCategory && article.category !== selectedCategory) {
      return false;
    }

    return scoreArticle(article, normalizedQuery, selectedCategory) > 0;
  })
    .map((article) => {
      const relevanceScore = scoreArticle(article, normalizedQuery, selectedCategory);

      const relevanceLabel =
        relevanceScore >= 0.72 ? "tinggi" : relevanceScore >= 0.36 ? "sedang" : "rendah";

      const result: SearchResult = {
        article_id: article.article_id,
        law_id: article.law_id,
        law_title: article.law_title,
        law_number: article.law_number,
        article_number: article.article_number,
        category: article.category,
        relevance_score: relevanceScore,
        relevance_label: relevanceLabel,
        match_reason:
          article.keywords.some((item) => normalizedQuery.includes(item.term))
            ? "Kecocokan kuat pada istilah kunci kasus"
            : "Kecocokan berdasarkan isi pasal dan ringkasan",
        plain_summary: article.plain_summary,
        article_text: article.article_text,
        source_url: article.source_url,
        sanctions: article.sanctions,
      };

      return result;
    })
    .sort((left, right) => right.relevance_score - left.relevance_score);

  return {
    query,
    normalized_query: normalizedQuery,
    total_results: scored.length,
    fallback_used: true,
    categories_considered: selectedCategory ? [selectedCategory] : [],
    results: scored.slice(0, 8),
  };
}

export function fallbackArticleDetail(articleId: string): ArticleDetail | null {
  const article = DATASET.find((item) => item.article_id === articleId);

  if (!article) {
    return null;
  }

  return {
    article_id: article.article_id,
    law: {
      id: article.law_id,
      title: article.law_title,
      law_number: article.law_number,
      year: article.law_year,
      category: article.category,
      source_url: article.source_url,
      is_active: true,
    },
    article: {
      article_number: article.article_number,
      article_text: article.article_text,
      plain_summary: article.plain_summary,
      category: article.category,
      relevance_reason:
        "Data ditampilkan dari fallback corpus lokal karena koneksi backend pencarian sedang tidak stabil.",
    },
    sanctions: article.sanctions,
  };
}
