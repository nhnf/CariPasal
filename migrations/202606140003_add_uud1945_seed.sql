insert into public.laws (title, law_number, year, category, source_url, is_active)
values (
  'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
  'UUD 1945',
  1945,
  'konstitusi',
  'https://peraturan.bpk.go.id/Details/101646/',
  true
)
on conflict (law_number) do update
set
  title = excluded.title,
  year = excluded.year,
  category = excluded.category,
  source_url = excluded.source_url,
  is_active = excluded.is_active;

insert into public.articles (law_id, article_number, article_text, plain_summary, category, search_document)
values
  (
    (select id from public.laws where law_number = 'UUD 1945'),
    'Pasal 27 ayat (1)',
    'Segala warga negara bersamaan kedudukannya di dalam hukum dan pemerintahan dan wajib menjunjung hukum dan pemerintahan itu dengan tidak ada kecualinya.',
    'Pasal ini menjadi dasar konstitusional bahwa setiap warga negara berhak diperlakukan sama di depan hukum dan pemerintahan.',
    'konstitusi',
    'uud 1945 pasal 27 ayat 1 persamaan di depan hukum sama di depan hukum diskriminasi warga negara perlakuan sama'
  ),
  (
    (select id from public.laws where law_number = 'UUD 1945'),
    'Pasal 28E ayat (3)',
    'Setiap orang berhak atas kebebasan berserikat, berkumpul, dan mengeluarkan pendapat.',
    'Pasal ini melindungi kebebasan berorganisasi, berkumpul, dan menyampaikan pendapat sebagai hak dasar warga negara.',
    'konstitusi',
    'uud 1945 pasal 28e ayat 3 kebebasan berpendapat kebebasan berserikat kebebasan berkumpul demonstrasi organisasi pendapat'
  ),
  (
    (select id from public.laws where law_number = 'UUD 1945'),
    'Pasal 28G ayat (1)',
    'Setiap orang berhak atas perlindungan diri pribadi, keluarga, kehormatan, martabat, dan harta benda yang di bawah kekuasaannya, serta berhak atas rasa aman dan perlindungan dari ancaman ketakutan untuk berbuat atau tidak berbuat sesuatu yang merupakan hak asasi.',
    'Pasal ini menegaskan hak atas rasa aman, perlindungan diri, dan perlindungan dari ancaman yang mengganggu hak asasi seseorang.',
    'konstitusi',
    'uud 1945 pasal 28g ayat 1 perlindungan diri rasa aman ancaman kehormatan martabat keluarga harta benda hak asasi'
  )
on conflict (law_id, article_number) do update
set
  article_text = excluded.article_text,
  plain_summary = excluded.plain_summary,
  category = excluded.category,
  search_document = excluded.search_document;

insert into public.article_keywords (article_id, term, weight)
values
  (
    (
      select a.id
      from public.articles a
      join public.laws l on l.id = a.law_id
      where l.law_number = 'UUD 1945' and a.article_number = 'Pasal 27 ayat (1)'
    ),
    'persamaan di depan hukum',
    0.95
  ),
  (
    (
      select a.id
      from public.articles a
      join public.laws l on l.id = a.law_id
      where l.law_number = 'UUD 1945' and a.article_number = 'Pasal 27 ayat (1)'
    ),
    'sama di depan hukum',
    0.90
  ),
  (
    (
      select a.id
      from public.articles a
      join public.laws l on l.id = a.law_id
      where l.law_number = 'UUD 1945' and a.article_number = 'Pasal 27 ayat (1)'
    ),
    'diskriminasi',
    0.55
  ),
  (
    (
      select a.id
      from public.articles a
      join public.laws l on l.id = a.law_id
      where l.law_number = 'UUD 1945' and a.article_number = 'Pasal 28E ayat (3)'
    ),
    'kebebasan berpendapat',
    0.95
  ),
  (
    (
      select a.id
      from public.articles a
      join public.laws l on l.id = a.law_id
      where l.law_number = 'UUD 1945' and a.article_number = 'Pasal 28E ayat (3)'
    ),
    'berserikat',
    0.70
  ),
  (
    (
      select a.id
      from public.articles a
      join public.laws l on l.id = a.law_id
      where l.law_number = 'UUD 1945' and a.article_number = 'Pasal 28E ayat (3)'
    ),
    'demo',
    0.45
  ),
  (
    (
      select a.id
      from public.articles a
      join public.laws l on l.id = a.law_id
      where l.law_number = 'UUD 1945' and a.article_number = 'Pasal 28G ayat (1)'
    ),
    'rasa aman',
    0.90
  ),
  (
    (
      select a.id
      from public.articles a
      join public.laws l on l.id = a.law_id
      where l.law_number = 'UUD 1945' and a.article_number = 'Pasal 28G ayat (1)'
    ),
    'ancaman',
    0.60
  ),
  (
    (
      select a.id
      from public.articles a
      join public.laws l on l.id = a.law_id
      where l.law_number = 'UUD 1945' and a.article_number = 'Pasal 28G ayat (1)'
    ),
    'perlindungan diri',
    0.80
  )
on conflict (article_id, term) do update
set weight = excluded.weight;
