'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MessageCircle, MapPin, Clock, Flame } from 'lucide-react';
import { useStore } from '@/context/store-context';
import BusinessStatusBadge from '@/components/business-status-badge';
import ProductCard from '@/components/product-card';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { STORE_INFO } from '@/lib/utils';

const QUICK_SEARCHES = ['Awaduct', 'Membrana', 'Amoladora', 'Tornillo', 'Cable'];

export default function HomePage() {
  const router = useRouter();
  const { products, categories, settings } = useStore();
  const [heroSearch, setHeroSearch] = useState('');

  const featuredProducts = products.filter((p) => p.featured).slice(0, 8);
  const shownProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = heroSearch.trim();
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo');
  }

  const waUrl = getWhatsAppUrl(
    settings.whatsappNumber || STORE_INFO.whatsappDefault,
    'Hola Ferretería Mica, quisiera pedir un presupuesto.'
  );

  return (
    <div className="pt-28 md:pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Hero asimetrico: buscador de mostrador + foto real */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center pt-4">
        <div className="lg:col-span-7 space-y-6">
          <BusinessStatusBadge />

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
            Materiales de construcción y herramientas con precios online
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Más de 25 años atendiendo obras, oficios y hogares en Quilmes Oeste. Buscá el artículo, elegí la medida y mandá tu pedido por WhatsApp con retiro en local o envío en el día.
          </p>

          <form onSubmit={handleSearchSubmit} className="space-y-2.5 max-w-2xl">
            <label htmlFor="hero-catalog-search" className="sr-only">
              Buscar productos en el catálogo
            </label>
            <div className="flex flex-col sm:flex-row gap-2 bg-slate-900 border border-slate-700 p-2 rounded-xl">
              <div className="flex-1 flex items-center gap-2.5 px-3">
                <Search className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
                <input
                  id="hero-catalog-search"
                  type="search"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Buscá por producto, marca o SKU (ej: Awaduct, membrana)..."
                  className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base py-2.5"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-sm sm:text-base transition shrink-0"
              >
                Buscar precios
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>Búsquedas frecuentes:</span>
              {QUICK_SEARCHES.map((term) => (
                <Link
                  key={term}
                  href={`/catalogo?q=${encodeURIComponent(term)}`}
                  className="px-2.5 py-1 min-h-[32px] inline-flex items-center rounded-md bg-slate-900 border border-slate-800 hover:border-amber-500/60 text-slate-200 font-medium transition"
                >
                  {term}
                </Link>
              ))}
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center px-6 py-3.5 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition"
            >
              Ver catálogo completo ({products.length} artículos)
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[44px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base transition"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              <span>Cotizar por WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <img
              src="/img/productos/taladro.jpg"
              alt="Taladro inalámbrico y herramientas reales en Ferretería Mica"
              width={800}
              height={540}
              fetchPriority="high"
              className="w-full aspect-[16/11] object-cover"
            />
            <div className="p-4 sm:p-5 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-bold text-white block">Local Quilmes Oeste</span>
                  <span className="text-slate-400">Av. San Martín 2652</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-bold text-white block">Abierto Lun a Dom</span>
                  <span className="text-slate-400">Envíos en el día</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Franja operativa continua (reemplaza las 4 cards identicas) */}
      <section
        aria-label="Condiciones de compra y entrega"
        className="border-y border-slate-800 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-slate-800"
      >
        <div className="lg:pr-6">
          <h2 className="text-lg font-bold text-amber-400">Envíos en el día</h2>
          <p className="text-sm text-slate-300 mt-1">
            Despacho en Quilmes Oeste y zonas cercanas. Retiro sin demora en mostrador.
          </p>
        </div>
        <div className="lg:px-6">
          <h2 className="text-lg font-bold text-amber-400">Medios de pago</h2>
          <p className="text-sm text-slate-300 mt-1">
            Efectivo contraentrega o en local, tarjeta de débito y transferencia bancaria.
          </p>
        </div>
        <div className="lg:px-6">
          <h2 className="text-lg font-bold text-amber-400">Oxígeno y nitrógeno</h2>
          <p className="text-sm text-slate-300 mt-1">
            Suministro y recarga en el momento para soldadura autógena y refrigeración.
          </p>
        </div>
        <div className="lg:pl-6">
          <h2 className="text-lg font-bold text-amber-400">Medidas y variantes</h2>
          <p className="text-sm text-slate-300 mt-1">
            Elegí diámetro, largo o presentación directo en la ficha antes de sumar al pedido.
          </p>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-extrabold text-white">Productos con precio actualizado</h2>
            <p className="text-slate-400 text-sm mt-1">
              Sumalos al carrito para generar tu comanda y enviarla directo a mostrador.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="text-amber-400 hover:text-amber-300 font-bold text-sm py-2 inline-block"
          >
            Ver los {products.length} productos del catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {shownProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Bloque editorial asimetrico: Gases en el momento + Awaduct */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 bg-slate-950">
          <img
            src="/img/productos/tubo-oxigeno.jpg"
            alt="Tubos de oxígeno y nitrógeno con recarga en el momento en Ferretería Mica"
            width={640}
            height={480}
            loading="lazy"
            className="w-full h-full min-h-[240px] object-cover"
          />
        </div>
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-4 h-4" aria-hidden="true" />
            <span>Servicio Técnico en Mostrador</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Carga de oxígeno y nitrógeno en el momento, y línea completa Awaduct
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Además de herramientas y bulonería, recargamos tubos en el acto para talleres, refrigeración y soldadura, y contamos con caños Awaduct originales, termofusión y pintura de membrana en gel con caucho.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/catalogo?rubro=gases"
              className="px-5 py-2.5 min-h-[44px] inline-flex items-center rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
            >
              Consultar recarga de gases
            </Link>
            <Link
              href="/catalogo?rubro=sanitarios"
              className="px-5 py-2.5 min-h-[44px] inline-flex items-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition"
            >
              Ver Sanitarios Awaduct
            </Link>
          </div>
        </div>
      </section>

      {/* Directorio compacto de rubros */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h2 className="text-3xl font-extrabold text-white">Rubros disponibles</h2>
          <Link href="/servicios" className="text-sm font-semibold text-amber-400 hover:text-amber-300 py-1">
            Detalle de especialidades
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            return (
              <Link
                key={cat.id}
                href={`/catalogo?rubro=${cat.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl p-3.5 flex items-center gap-3.5 transition group min-h-[76px]"
              >
                <img
                  src={cat.image || '/img/productos/amoladora.jpg'}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  aria-hidden="true"
                  className="w-16 h-16 rounded-lg object-cover shrink-0 bg-slate-950"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition truncate">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{cat.description}</p>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 shrink-0 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Cierre de alto contraste (slate-950 sobre amber-500 = 9.39:1) */}
      <section className="bg-amber-500 text-slate-950 rounded-xl p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
            ¿Necesitás presupuesto para obra o compra por cantidad?
          </h2>
          <p className="text-slate-900 font-medium text-base">
            Escribinos con el listado de materiales o armá el carrito online para recibir confirmación directa desde Av. San Martín 2652.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            href="/catalogo"
            className="px-6 py-3.5 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-sm transition"
          >
            Armar pedido online
          </Link>
          <Link
            href="/contacto"
            className="px-6 py-3.5 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm transition"
          >
            Ver mapa y teléfono
          </Link>
        </div>
      </section>
    </div>
  );
}
