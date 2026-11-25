import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
        Error 404
      </span>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Página no encontrada</h1>
      <p className="text-slate-300 max-w-md mb-8">
        No pudimos encontrar la sección que buscabas. Podés volver al inicio o explorar nuestro catálogo online con precios.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/catalogo"
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition"
        >
          Ir al Catálogo Online
        </Link>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
