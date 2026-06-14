# Ingest Corpus Hukum

Pipeline ini adalah fondasi untuk mengimpor corpus hukum Indonesia dari beberapa sumber resmi secara bertahap. Tujuannya bukan mengklaim bahwa semua dokumen langsung selesai sekali jalan, tetapi menyiapkan proses yang bisa diskalakan untuk mencapai cakupan seluas mungkin dengan jejak audit dan review.

## Sumber yang didukung saat ini
- `jdih-bpk`
- `jdihn`
- `peraturan-go-id`
- `jdih-setneg`

## Prasyarat
Isi environment berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Gunakan `service role key` karena pipeline ingest perlu menulis ke tabel staging dan tabel review internal.

## Perintah
### 1. Discovery URL detail
```bash
npm run ingest:discover
```

Untuk sumber tertentu saja:

```bash
npm run ingest:discover -- jdih-bpk
```

### 2. Ekstraksi metadata halaman detail
```bash
npm run ingest:extract
```

Untuk sumber tertentu saja:

```bash
npm run ingest:extract -- jdihn
```

## Alur data
1. `legal_sources` menyimpan registry sumber resmi.
2. `source_documents_raw` menyimpan URL detail yang ditemukan.
3. `source_document_snapshots` menyimpan HTML dan payload ekstraksi.
4. Tahap berikutnya dapat menambahkan:
   - canonicalization ke `legal_documents`
   - unduh file PDF ke `document_files`
   - parsing teks per pasal ke `laws`, `articles`, `article_paragraphs`
   - deduplikasi lintas sumber dan relasi perubahan/pencabutan

## Catatan
- Mode sekarang adalah `draft + review`.
- Hasil ekstraksi awal perlu ditinjau sebelum dinormalisasi sebagai corpus final.
- Situs sumber dapat berubah sewaktu-waktu, jadi extractor dibuat per sumber dan perlu dirawat berkala.
