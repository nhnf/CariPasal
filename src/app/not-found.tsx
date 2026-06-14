import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">404</p>
      <h1 className="mt-4 font-[family:var(--font-display)] text-6xl text-white">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-stone-400">
        Jalur yang Anda buka belum tersedia atau data pasal yang diminta tidak
        ditemukan dalam corpus MVP saat ini.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-200"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
