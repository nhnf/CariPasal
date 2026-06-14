create table if not exists public.legal_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  base_url text not null,
  source_type text not null,
  priority integer not null default 100,
  robots_policy_notes text,
  discovery_strategy text not null default 'html_listing',
  extractor_strategy text not null default 'html_detail',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.legal_sources(id) on delete set null,
  run_type text not null,
  status text not null default 'queued',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  check (run_type in ('discover', 'extract', 'canonicalize', 'parse_text')),
  check (status in ('queued', 'running', 'completed', 'failed', 'partial'))
);

create table if not exists public.source_documents_raw (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.legal_sources(id) on delete cascade,
  external_id text,
  listing_url text,
  detail_url text not null,
  document_hint text,
  source_document_type text,
  source_document_number text,
  source_document_year integer,
  discovery_payload jsonb not null default '{}'::jsonb,
  crawl_status text not null default 'discovered',
  discovered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, detail_url),
  check (crawl_status in ('discovered', 'fetched', 'parsed', 'canonicalized', 'ignored', 'failed'))
);

create table if not exists public.source_document_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.source_documents_raw(id) on delete cascade,
  ingest_run_id uuid references public.ingest_runs(id) on delete set null,
  snapshot_type text not null default 'html',
  http_status integer,
  response_headers jsonb not null default '{}'::jsonb,
  snapshot_hash text,
  snapshot_body text,
  extracted_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (snapshot_type in ('html', 'pdf', 'json', 'text'))
);

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  document_type text not null,
  document_number text,
  document_year integer,
  issuing_body text,
  title text not null,
  title_normalized text not null,
  category text,
  language text,
  promulgation_date date,
  enactment_date date,
  status text not null default 'draft',
  verification_status text not null default 'needs_review',
  source_of_truth_source_id uuid references public.legal_sources(id) on delete set null,
  source_of_truth_document_id uuid references public.source_documents_raw(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft', 'active', 'revoked', 'superseded', 'unknown')),
  check (verification_status in ('verified', 'needs_review', 'broken_source'))
);

create table if not exists public.document_sources (
  id uuid primary key default gen_random_uuid(),
  legal_document_id uuid not null references public.legal_documents(id) on delete cascade,
  source_document_id uuid not null references public.source_documents_raw(id) on delete cascade,
  confidence numeric(5,2) not null default 0.50,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (legal_document_id, source_document_id)
);

create table if not exists public.document_files (
  id uuid primary key default gen_random_uuid(),
  legal_document_id uuid references public.legal_documents(id) on delete cascade,
  source_document_id uuid references public.source_documents_raw(id) on delete cascade,
  file_url text not null,
  file_type text not null default 'pdf',
  mime_type text,
  checksum text,
  file_size_bytes bigint,
  storage_path text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (source_document_id, file_url)
);

create table if not exists public.document_relations (
  id uuid primary key default gen_random_uuid(),
  source_legal_document_id uuid not null references public.legal_documents(id) on delete cascade,
  target_legal_document_id uuid references public.legal_documents(id) on delete cascade,
  relation_type text not null,
  relation_label text,
  evidence_source_document_id uuid references public.source_documents_raw(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (relation_type in ('amends', 'revokes', 'implemented_by', 'references', 'clarifies', 'unknown'))
);

alter table public.legal_sources enable row level security;
alter table public.ingest_runs enable row level security;
alter table public.source_documents_raw enable row level security;
alter table public.source_document_snapshots enable row level security;
alter table public.legal_documents enable row level security;
alter table public.document_sources enable row level security;
alter table public.document_files enable row level security;
alter table public.document_relations enable row level security;

drop policy if exists "Public can read legal sources" on public.legal_sources;
create policy "Public can read legal sources"
  on public.legal_sources
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read legal documents" on public.legal_documents;
create policy "Public can read legal documents"
  on public.legal_documents
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read document relations" on public.document_relations;
create policy "Public can read document relations"
  on public.document_relations
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read document files" on public.document_files;
create policy "Public can read document files"
  on public.document_files
  for select
  to anon, authenticated
  using (true);

create index if not exists idx_legal_sources_active on public.legal_sources(is_active, priority);
create index if not exists idx_ingest_runs_source_run_type on public.ingest_runs(source_id, run_type, started_at desc);
create index if not exists idx_source_documents_raw_source_status on public.source_documents_raw(source_id, crawl_status, discovered_at desc);
create index if not exists idx_source_documents_raw_hint on public.source_documents_raw(source_document_type, source_document_year);
create index if not exists idx_source_document_snapshots_source_document on public.source_document_snapshots(source_document_id, created_at desc);
create index if not exists idx_legal_documents_type_year on public.legal_documents(document_type, document_year desc);
create index if not exists idx_legal_documents_verification on public.legal_documents(verification_status, status);
create index if not exists idx_document_sources_primary on public.document_sources(legal_document_id, is_primary);
create index if not exists idx_document_relations_source on public.document_relations(source_legal_document_id, relation_type);

insert into public.legal_sources (
  slug,
  name,
  base_url,
  source_type,
  priority,
  robots_policy_notes,
  discovery_strategy,
  extractor_strategy,
  is_active
)
values
  (
    'jdih-bpk',
    'JDIH BPK',
    'https://peraturan.bpk.go.id/',
    'jdih',
    10,
    'Content signal search=yes, ai-train=no. Gunakan untuk indeks dan sitasi, bukan training model.',
    'bpk_search',
    'bpk_detail',
    true
  ),
  (
    'jdihn',
    'JDIHN',
    'https://jdihn.go.id/',
    'aggregator',
    20,
    'Agregator nasional. Metadata lintas anggota dapat bervariasi dan perlu review.',
    'jdihn_listing',
    'jdihn_detail',
    true
  ),
  (
    'peraturan-go-id',
    'peraturan.go.id',
    'https://peraturan.go.id/',
    'official_portal',
    30,
    'Gunakan untuk verifikasi silang file peraturan pusat dan PDF resmi.',
    'peraturan_go_listing',
    'peraturan_go_detail',
    true
  ),
  (
    'jdih-setneg',
    'JDIH Setneg',
    'https://jdih.setneg.go.id/',
    'institutional_jdih',
    40,
    'Berguna untuk monitoring produk hukum pusat. Beberapa halaman dapat memakai challenge anti-bot.',
    'setneg_latest',
    'setneg_detail',
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  base_url = excluded.base_url,
  source_type = excluded.source_type,
  priority = excluded.priority,
  robots_policy_notes = excluded.robots_policy_notes,
  discovery_strategy = excluded.discovery_strategy,
  extractor_strategy = excluded.extractor_strategy,
  is_active = excluded.is_active,
  updated_at = now();
