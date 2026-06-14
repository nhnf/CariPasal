create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists vector;

create table if not exists public.laws (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  law_number text not null unique,
  year integer not null,
  category text not null,
  source_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  law_id uuid not null references public.laws(id) on delete cascade,
  article_number text not null,
  article_text text not null,
  plain_summary text not null,
  category text not null,
  search_document text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (law_id, article_number)
);

create table if not exists public.sanctions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  sanction_type text not null,
  max_imprisonment text,
  max_fine text,
  notes text,
  created_at timestamptz not null default now(),
  unique (article_id, sanction_type)
);

create table if not exists public.article_keywords (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  term text not null,
  weight numeric(6,2) not null default 1.0,
  created_at timestamptz not null default now(),
  unique (article_id, term)
);

create table if not exists public.query_logs (
  id uuid primary key default gen_random_uuid(),
  raw_query text not null,
  normalized_query text not null,
  category text,
  result_count integer not null default 0,
  fallback_used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.laws enable row level security;
alter table public.articles enable row level security;
alter table public.sanctions enable row level security;
alter table public.article_keywords enable row level security;
alter table public.query_logs enable row level security;

drop policy if exists "Public can read laws" on public.laws;
create policy "Public can read laws"
  on public.laws
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read articles" on public.articles;
create policy "Public can read articles"
  on public.articles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read sanctions" on public.sanctions;
create policy "Public can read sanctions"
  on public.sanctions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read article keywords" on public.article_keywords;
create policy "Public can read article keywords"
  on public.article_keywords
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can insert query logs" on public.query_logs;
create policy "Public can insert query logs"
  on public.query_logs
  for insert
  to anon, authenticated
  with check (true);

create index if not exists idx_laws_category on public.laws(category);
create index if not exists idx_articles_law_id on public.articles(law_id);
create index if not exists idx_articles_category on public.articles(category);
create index if not exists idx_articles_search_document_fts on public.articles using gin (to_tsvector('simple', search_document));
create index if not exists idx_articles_article_text_trgm on public.articles using gin (article_text gin_trgm_ops);
create index if not exists idx_article_keywords_term on public.article_keywords(term);
create index if not exists idx_query_logs_created_at on public.query_logs(created_at desc);

create or replace function public.normalize_legal_query(input_query text)
returns text
language plpgsql
immutable
as $$
declare
  normalized text := lower(trim(coalesce(input_query, '')));
begin
  normalized := regexp_replace(normalized, '\s+', ' ', 'g');
  normalized := replace(normalized, 'ditipu', 'penipuan');
  normalized := replace(normalized, 'ketipu', 'penipuan');
  normalized := replace(normalized, 'tipu online', 'penipuan transaksi elektronik');
  normalized := replace(normalized, 'jual beli online', 'transaksi elektronik jual beli online');
  normalized := replace(normalized, 'marketplace', 'transaksi elektronik');
  normalized := replace(normalized, 'fitnah', 'pencemaran nama baik');
  normalized := replace(normalized, 'nama baik dicemarkan', 'pencemaran nama baik');
  normalized := replace(normalized, 'dipukul suami', 'kekerasan dalam rumah tangga kekerasan fisik');
  normalized := replace(normalized, 'kdrt', 'kekerasan dalam rumah tangga');
  normalized := replace(normalized, 'anak dipukul', 'kekerasan terhadap anak');
  normalized := replace(normalized, 'tabrak', 'kecelakaan lalu lintas');
  normalized := replace(normalized, 'narkoba', 'narkotika');
  return trim(normalized);
end;
$$;

create or replace function public.search_articles(
  raw_query text,
  selected_category text default null,
  result_limit integer default 8
)
returns table (
  article_id uuid,
  law_id uuid,
  law_title text,
  law_number text,
  article_number text,
  category text,
  relevance_score numeric,
  relevance_label text,
  match_reason text,
  plain_summary text,
  article_text text,
  source_url text,
  normalized_query text,
  sanctions jsonb
)
language plpgsql
as $$
declare
  normalized text := public.normalize_legal_query(raw_query);
begin
  return query
  with ranked as (
    select
      a.id as article_id,
      l.id as law_id,
      l.title as law_title,
      l.law_number,
      a.article_number,
      a.category,
      (
        ts_rank_cd(
          to_tsvector('simple', a.search_document),
          plainto_tsquery('simple', normalized)
        )
        + coalesce(kw.keyword_score, 0)
        + case
            when selected_category is not null and selected_category <> '' and a.category = selected_category then 0.18
            else 0
          end
        + greatest(similarity(a.search_document, normalized), 0) * 0.35
      )::numeric as relevance_score,
      case
        when coalesce(kw.keyword_score, 0) >= 0.8 then 'Kecocokan kuat pada istilah kunci kasus'
        when selected_category is not null and selected_category <> '' and a.category = selected_category then 'Kategori hukum sesuai filter pencarian'
        else 'Kecocokan berdasarkan isi pasal dan ringkasan'
      end as match_reason,
      a.plain_summary,
      a.article_text,
      l.source_url,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'sanction_type', s.sanction_type,
              'max_imprisonment', s.max_imprisonment,
              'max_fine', s.max_fine,
              'notes', s.notes
            )
          ),
          '[]'::jsonb
        )
        from public.sanctions s
        where s.article_id = a.id
      ) as sanctions
    from public.articles a
    join public.laws l on l.id = a.law_id
    left join lateral (
      select sum(ak.weight)::numeric as keyword_score
      from public.article_keywords ak
      where ak.article_id = a.id
        and normalized ilike '%' || ak.term || '%'
    ) kw on true
    where (
      selected_category is null
      or selected_category = ''
      or a.category = selected_category
    )
      and (
        to_tsvector('simple', a.search_document) @@ plainto_tsquery('simple', normalized)
        or coalesce(kw.keyword_score, 0) > 0
        or similarity(a.search_document, normalized) > 0.08
      )
    order by relevance_score desc, a.article_number asc
    limit greatest(result_limit, 1)
  )
  select
    ranked.article_id,
    ranked.law_id,
    ranked.law_title,
    ranked.law_number,
    ranked.article_number,
    ranked.category,
    round(ranked.relevance_score, 4),
    case
      when ranked.relevance_score >= 0.72 then 'tinggi'
      when ranked.relevance_score >= 0.36 then 'sedang'
      else 'rendah'
    end as relevance_label,
    ranked.match_reason,
    ranked.plain_summary,
    ranked.article_text,
    ranked.source_url,
    normalized as normalized_query,
    ranked.sanctions
  from ranked;
end;
$$;

create or replace function public.get_article_detail(input_id uuid)
returns table (
  article_id uuid,
  law_id uuid,
  law_title text,
  law_number text,
  law_year integer,
  law_category text,
  source_url text,
  is_active boolean,
  article_number text,
  article_text text,
  plain_summary text,
  category text,
  relevance_reason text,
  sanctions jsonb
)
language sql
as $$
  select
    a.id as article_id,
    l.id as law_id,
    l.title as law_title,
    l.law_number,
    l.year as law_year,
    l.category as law_category,
    l.source_url,
    l.is_active,
    a.article_number,
    a.article_text,
    a.plain_summary,
    a.category,
    'Hasil ini adalah kandidat pasal yang perlu diverifikasi pada sumber resmi.' as relevance_reason,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'sanction_type', s.sanction_type,
            'max_imprisonment', s.max_imprisonment,
            'max_fine', s.max_fine,
            'notes', s.notes
          )
        ),
        '[]'::jsonb
      )
      from public.sanctions s
      where s.article_id = a.id
    ) as sanctions
  from public.articles a
  join public.laws l on l.id = a.law_id
  where a.id = input_id
  limit 1;
$$;

grant execute on function public.search_articles(text, text, integer) to anon, authenticated;
grant execute on function public.get_article_detail(uuid) to anon, authenticated;
grant execute on function public.normalize_legal_query(text) to anon, authenticated;

insert into public.laws (title, law_number, year, category, source_url, is_active)
values
  ('Kitab Undang-Undang Hukum Pidana', 'KUHP', 2023, 'pidana umum', 'https://peraturan.bpk.go.id/Details/247597/uu-no-1-tahun-2023', true),
  ('Undang-Undang Informasi dan Transaksi Elektronik', 'UU No. 19 Tahun 2016', 2016, 'siber', 'https://peraturan.bpk.go.id/Details/37582/uu-no-19-tahun-2016', true),
  ('Undang-Undang Penghapusan Kekerasan Dalam Rumah Tangga', 'UU No. 23 Tahun 2004', 2004, 'keluarga', 'https://peraturan.bpk.go.id/Details/40597/uu-no-23-tahun-2004', true),
  ('Undang-Undang Perlindungan Konsumen', 'UU No. 8 Tahun 1999', 1999, 'konsumen', 'https://peraturan.bpk.go.id/Details/45383/uu-no-8-tahun-1999', true),
  ('Undang-Undang Perlindungan Anak', 'UU No. 35 Tahun 2014', 2014, 'anak', 'https://peraturan.bpk.go.id/Details/38723/uu-no-35-tahun-2014', true),
  ('Undang-Undang Narkotika', 'UU No. 35 Tahun 2009', 2009, 'narkotika', 'https://peraturan.bpk.go.id/Details/38776/uu-no-35-tahun-2009', true),
  ('Undang-Undang Lalu Lintas dan Angkutan Jalan', 'UU No. 22 Tahun 2009', 2009, 'lalu lintas', 'https://peraturan.bpk.go.id/Details/38767/uu-no-22-tahun-2009', true)
on conflict (law_number) do update
set
  title = excluded.title,
  year = excluded.year,
  category = excluded.category,
  source_url = excluded.source_url,
  is_active = excluded.is_active;

with seeded_articles as (
  insert into public.articles (law_id, article_number, article_text, plain_summary, category, search_document)
  values
    (
      (select id from public.laws where law_number = 'KUHP'),
      'Pasal 378',
      'Barang siapa dengan maksud untuk menguntungkan diri sendiri atau orang lain secara melawan hukum, dengan nama palsu, dengan tipu muslihat, ataupun rangkaian kebohongan, menggerakkan orang lain untuk menyerahkan barang, memberi utang, atau menghapuskan piutang, dipidana karena penipuan.',
      'Pasal ini menjadi rujukan utama untuk kasus penipuan, termasuk ketika seseorang dibujuk dengan tipu muslihat hingga mengalami kerugian.',
      'pidana umum',
      'kphpasal 378 penipuan tipu muslihat rangkaian kebohongan kerugian korban penipuan jual beli'
    ),
    (
      (select id from public.laws where law_number = 'UU No. 19 Tahun 2016'),
      'Pasal 28 ayat (1)',
      'Setiap Orang dengan sengaja dan tanpa hak menyebarkan berita bohong dan menyesatkan yang mengakibatkan kerugian konsumen dalam transaksi elektronik.',
      'Pasal ini sering dikaitkan dengan penipuan atau informasi bohong dalam transaksi elektronik dan jual beli online.',
      'siber',
      'uu ite pasal 28 ayat 1 berita bohong transaksi elektronik jual beli online marketplace penipuan konsumen'
    ),
    (
      (select id from public.laws where law_number = 'UU No. 19 Tahun 2016'),
      'Pasal 27 ayat (3)',
      'Setiap Orang dengan sengaja dan tanpa hak mendistribusikan dan/atau mentransmisikan dan/atau membuat dapat diaksesnya Informasi Elektronik yang memiliki muatan penghinaan dan/atau pencemaran nama baik.',
      'Pasal ini relevan untuk dugaan penghinaan atau pencemaran nama baik di internet dan media sosial.',
      'siber',
      'uu ite pasal 27 ayat 3 pencemaran nama baik penghinaan internet media sosial fitnah online'
    ),
    (
      (select id from public.laws where law_number = 'UU No. 23 Tahun 2004'),
      'Pasal 44',
      'Setiap orang yang melakukan perbuatan kekerasan fisik dalam lingkup rumah tangga dipidana sesuai akibat yang ditimbulkan.',
      'Pasal ini menjadi titik awal untuk kasus KDRT yang melibatkan kekerasan fisik oleh pasangan atau anggota keluarga dalam rumah tangga.',
      'keluarga',
      'uu kdrt pasal 44 kekerasan fisik rumah tangga dipukul suami istri keluarga'
    ),
    (
      (select id from public.laws where law_number = 'UU No. 8 Tahun 1999'),
      'Pasal 8',
      'Pelaku usaha dilarang memproduksi dan/atau memperdagangkan barang dan/atau jasa yang tidak sesuai dengan standar, kondisi, jaminan, atau keterangan sebagaimana dinyatakan.',
      'Pasal ini sering dipakai saat konsumen menerima barang yang tidak sesuai, cacat, atau menyesatkan dalam transaksi.',
      'konsumen',
      'uu perlindungan konsumen pasal 8 barang tidak sesuai cacat menyesatkan konsumen jual beli'
    ),
    (
      (select id from public.laws where law_number = 'UU No. 35 Tahun 2014'),
      'Pasal 80',
      'Setiap orang yang melakukan kekejaman, kekerasan, ancaman kekerasan, atau penganiayaan terhadap anak dipidana dengan pidana penjara dan/atau denda.',
      'Pasal ini relevan untuk kekerasan terhadap anak, baik di rumah, sekolah, maupun lingkungan sekitar.',
      'anak',
      'uu perlindungan anak pasal 80 kekerasan terhadap anak penganiayaan ancaman kekerasan'
    ),
    (
      (select id from public.laws where law_number = 'UU No. 35 Tahun 2009'),
      'Pasal 127',
      'Setiap penyalah guna Narkotika Golongan I, II, atau III bagi diri sendiri dipidana dengan pidana penjara sesuai golongannya.',
      'Pasal ini biasa muncul untuk kasus penggunaan narkotika bagi diri sendiri dan sering dibaca bersama ketentuan rehabilitasi.',
      'narkotika',
      'uu narkotika pasal 127 penyalah guna narkotika pemakai narkoba untuk diri sendiri'
    ),
    (
      (select id from public.laws where law_number = 'UU No. 22 Tahun 2009'),
      'Pasal 310',
      'Setiap orang yang karena kelalaiannya mengemudikan kendaraan bermotor mengakibatkan kecelakaan lalu lintas dengan kerusakan, luka, atau meninggal dunia dipidana sesuai akibatnya.',
      'Pasal ini umum dipakai untuk kecelakaan lalu lintas akibat kelalaian pengemudi.',
      'lalu lintas',
      'uu lalu lintas pasal 310 kecelakaan lalu lintas tabrak kelalaian pengemudi luka meninggal'
    )
  on conflict (law_id, article_number) do update
  set
    article_text = excluded.article_text,
    plain_summary = excluded.plain_summary,
    category = excluded.category,
    search_document = excluded.search_document
  returning id, article_number
)
insert into public.sanctions (article_id, sanction_type, max_imprisonment, max_fine, notes)
values
  ((select id from seeded_articles where article_number = 'Pasal 378'), 'pidana penjara', '4 tahun', null, 'Ancaman dasar penipuan dalam KUHP.'),
  ((select id from seeded_articles where article_number = 'Pasal 28 ayat (1)'), 'pidana penjara', '6 tahun', 'Rp1.000.000.000', 'Dibaca bersama ketentuan sanksi UU ITE.'),
  ((select id from seeded_articles where article_number = 'Pasal 27 ayat (3)'), 'pidana penjara', '4 tahun', 'Rp750.000.000', 'Terkait muatan penghinaan atau pencemaran nama baik elektronik.'),
  ((select id from seeded_articles where article_number = 'Pasal 44'), 'pidana penjara', '5 tahun', 'Rp15.000.000', 'Besar ancaman bergantung akibat kekerasan yang ditimbulkan.'),
  ((select id from seeded_articles where article_number = 'Pasal 8'), 'pidana penjara', '5 tahun', 'Rp2.000.000.000', 'Sanksi pidana konsumen umumnya dibaca bersama ketentuan pasal sanksi dalam UU yang sama.'),
  ((select id from seeded_articles where article_number = 'Pasal 80'), 'pidana penjara', '3 tahun 6 bulan', 'Rp72.000.000', 'Ancaman meningkat bila korban luka berat atau meninggal dunia.'),
  ((select id from seeded_articles where article_number = 'Pasal 127'), 'pidana penjara', '4 tahun', null, 'Pertimbangkan juga ketentuan rehabilitasi sesuai perkara.'),
  ((select id from seeded_articles where article_number = 'Pasal 310'), 'pidana penjara', '6 tahun', 'Rp12.000.000', 'Besaran ancaman bertingkat sesuai akibat kecelakaan.')
on conflict (article_id, sanction_type) do update
set
  max_imprisonment = excluded.max_imprisonment,
  max_fine = excluded.max_fine,
  notes = excluded.notes;

with article_refs as (
  select id, article_number from public.articles
)
insert into public.article_keywords (article_id, term, weight)
values
  ((select id from article_refs where article_number = 'Pasal 378'), 'penipuan', 0.70),
  ((select id from article_refs where article_number = 'Pasal 378'), 'tipu muslihat', 0.65),
  ((select id from article_refs where article_number = 'Pasal 378'), 'jual beli', 0.35),
  ((select id from article_refs where article_number = 'Pasal 28 ayat (1)'), 'transaksi elektronik', 0.80),
  ((select id from article_refs where article_number = 'Pasal 28 ayat (1)'), 'marketplace', 0.70),
  ((select id from article_refs where article_number = 'Pasal 28 ayat (1)'), 'berita bohong', 0.65),
  ((select id from article_refs where article_number = 'Pasal 27 ayat (3)'), 'pencemaran nama baik', 0.90),
  ((select id from article_refs where article_number = 'Pasal 27 ayat (3)'), 'fitnah', 0.70),
  ((select id from article_refs where article_number = 'Pasal 27 ayat (3)'), 'penghinaan', 0.60),
  ((select id from article_refs where article_number = 'Pasal 44'), 'kdrt', 0.95),
  ((select id from article_refs where article_number = 'Pasal 44'), 'dipukul suami', 0.70),
  ((select id from article_refs where article_number = 'Pasal 44'), 'kekerasan fisik', 0.85),
  ((select id from article_refs where article_number = 'Pasal 8'), 'barang tidak sesuai', 0.75),
  ((select id from article_refs where article_number = 'Pasal 8'), 'konsumen', 0.60),
  ((select id from article_refs where article_number = 'Pasal 8'), 'jual beli', 0.40),
  ((select id from article_refs where article_number = 'Pasal 80'), 'anak dipukul', 0.80),
  ((select id from article_refs where article_number = 'Pasal 80'), 'kekerasan terhadap anak', 0.90),
  ((select id from article_refs where article_number = 'Pasal 127'), 'narkotika', 0.75),
  ((select id from article_refs where article_number = 'Pasal 127'), 'narkoba', 0.75),
  ((select id from article_refs where article_number = 'Pasal 127'), 'pemakai', 0.40),
  ((select id from article_refs where article_number = 'Pasal 310'), 'kecelakaan lalu lintas', 0.90),
  ((select id from article_refs where article_number = 'Pasal 310'), 'tabrak', 0.65),
  ((select id from article_refs where article_number = 'Pasal 310'), 'kelalaian pengemudi', 0.55)
on conflict (article_id, term) do update
set weight = excluded.weight;
