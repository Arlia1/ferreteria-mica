'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useStore } from '@/context/store-context';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { STORE_INFO } from '@/lib/utils';

export default function ServiciosPage() {
  const { categories, products, settings } = useStore();

  return (
    <div className="pt-28 md:pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Rubros y Especialidades
        </h1>
        <p className="text-slate-300 text-base sm:text-lg">
          Herramientas, materiales de construcción, caños Awaduct, carga de oxígeno y nitrógeno en el momento, pinturas y electricidad en Quilmes Oeste.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Rubros de Ferretería Mica">
        {categories.map((cat) => {
          const count = products.filter((p) => p.category === cat.id).length;
          const waUrl = getWhatsAppUrl(
            settings.whatsappNumber || STORE_INFO.whatsappDefault,
            `Hola Ferretería Mica, quisiera consultar por el rubro ${cat.name}.`
          );

          return (
            <article
              key={cat.id}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl overflow-hidden flex flex-col justify-between transition"
            >
              <div>
                <div className="aspect-[16/9] bg-slate-950 overflow-hidden">
                  <img
                    src={cat.image || '/img/productos/amoladora.jpg'}
                    alt={cat.name}
                    width={640}
                    height={360}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {count} {count === 1 ? 'artículo' : 'artículos'} online
                  </span>
                  <h2 className="text-2xl font-bold text-white">{cat.name}</h2>
                  <p className="text-slate-300 text-sm leading-relaxed">{cat.description}</p>
                </div>
              </div>

              <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href={`/catalogo?rubro=${cat.id}`}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
                >
                  Ver precios en catálogo
                </Link>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
