'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, PackageSearch, MessageCircle } from 'lucide-react';
import { useStore } from '@/context/store-context';
import ProductCard from '@/components/product-card';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import { DEFAULT_CATEGORIES, STORE_INFO } from '@/lib/utils';

const PAGE_SIZE = 24;

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

function CatalogoContent() {
  const searchParams = useSearchParams();
  const { products, categories, settings, isLoading } = useStore();

  const initialRubro = searchParams.get('rubro') || 'todos';
  const initialQuery = searchParams.get('q') || '';

  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialRubro);
  const [selectedBrand, setSelectedBrand] = useState('todas');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [products]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { todos: products.length };
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'todos' && p.category !== selectedCategory) return false;
      if (selectedBrand !== 'todas' && p.brand !== selectedBrand) return false;
      if (onlyInStock && !p.inStock) return false;
      if (q) {
        const matchVariant = p.variants?.some(
          (v) => v.label.toLowerCase().includes(q) || (v.sku || '').toLowerCase().includes(q)
        );
        const matches =
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          matchVariant;
        if (!matches) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => (a.priceOnRequest ? 1 : 0) - (b.priceOnRequest ? 1 : 0) || a.price - b.price);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => (a.priceOnRequest ? 1 : 0) - (b.priceOnRequest ? 1 : 0) || b.price - a.price);
    } else if (sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    } else {
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    }
    return sorted;
  }, [products, search, selectedCategory, selectedBrand, onlyInStock, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  function resetFilters() {
    setSearch('');
    setSelectedCategory('todos');
    setSelectedBrand('todas');
    setOnlyInStock(false);
    setSortBy('featured');
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <div className="text-xs sm:text-sm text-slate-300 font-medium">
          Mostrando <strong className="text-white">{displayedProducts.length}</strong> de{' '}
          <strong className="text-amber-400">{filteredProducts.length}</strong> artículos
        </div>
      </div>

      {/* Filtros y buscador */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="sm:col-span-2 lg:col-span-5 relative">
            <label htmlFor="catalog-search-input" className="sr-only">
              Buscar producto, medida, marca o SKU
            </label>
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="catalog-search-input"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Buscar producto, medida, marca o SKU..."
              className="w-full pl-10 pr-10 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setVisibleCount(PAGE_SIZE);
                }}
                aria-label="Limpiar búsqueda"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="catalog-brand-select" className="sr-only">
              Filtrar por marca
            </label>
            <select
              id="catalog-brand-select"
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
            >
              <option value="todas">Todas las marcas ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="catalog-sort-select" className="sr-only">
              Ordenar productos
            </label>
            <select
              id="catalog-sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setVisibleCount(PAGE_SIZE);
              }}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name-asc">Nombre A-Z</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-2 flex items-center">
            <label className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-200 font-semibold hover:border-amber-500/60">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => {
                  setOnlyInStock(e.target.checked);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="accent-amber-500 w-4 h-4"
              />
              <span>Solo en stock</span>
            </label>
          </div>
        </div>

        {/* Selector de rubros */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por rubro">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 mr-1" aria-hidden="true" />
          <button
            type="button"
            aria-pressed={selectedCategory === 'todos'}
            onClick={() => {
              setSelectedCategory('todos');
              setVisibleCount(PAGE_SIZE);
            }}
            className={`px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'todos'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-950 text-slate-200 border border-slate-800 hover:border-amber-500/60'
            }`}
          >
            Todos ({categoryCounts.todos || 0})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={selectedCategory === cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-200 border border-slate-800 hover:border-amber-500/60'
              }`}
            >
              {cat.name} ({categoryCounts[cat.id] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de productos con estados reales de carga y vacio */}
      {isLoading && products.length === 0 ? (
        <div className="space-y-4" role="status" aria-live="polite">
          <p className="text-sm text-slate-300 font-medium">Cargando productos del catálogo...</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-80 rounded-xl bg-slate-900 border border-slate-800" />
            ))}
          </div>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-4">
          <PackageSearch className="w-12 h-12 text-amber-400 mx-auto" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">No encontramos coincidencias para esa búsqueda</h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            Limpiá los filtros activos para ver todo el catálogo o consultanos directo por WhatsApp: trabajamos artículos de mostrador que podemos cotizarte en el acto.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm"
            >
              Limpiar filtros
            </button>
            <a
              href={getWhatsAppUrl(
                settings.whatsappNumber || STORE_INFO.whatsappDefault,
                `Hola Ferretería Mica! Estoy buscando: ${search || 'un producto del catálogo'}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        </div>
      ) : (
        <>
          <h2 className="sr-only">Listado de productos del catálogo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-8 py-3.5 min-h-[44px] rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-400 font-bold text-sm transition"
              >
                Cargar más productos ({filteredProducts.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <div className="pt-28 md:pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
      <header>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Catálogo Online con Precios</h1>
        <p className="text-slate-300 text-sm sm:text-base mt-1">
          Buscá por producto, código SKU, marca o rubro. Armá tu pedido y envialo directo por WhatsApp.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="py-6 space-y-4" role="status">
            <p className="text-slate-300">Cargando filtros y productos del catálogo...</p>
            <nav aria-label="Rubros disponibles" className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalogo?rubro=${cat.id}`}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-slate-200 border border-slate-800"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        }
      >
        <CatalogoContent />
      </Suspense>
    </div>
  );
}
