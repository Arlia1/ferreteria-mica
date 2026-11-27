'use client';

import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Check, Package, AlertTriangle } from 'lucide-react';
import { Product, ProductVariant } from '@/lib/types';
import { useCart } from '@/context/cart-context';
import { useStore } from '@/context/store-context';
import { formatPrice, getCategoryMeta, getProductImage } from '@/lib/utils';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { categories } = useStore();

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const firstAvailableVariant = hasVariants
    ? product.variants.find((v) => v.inStock) || product.variants[0]
    : null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(firstAvailableVariant);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant = hasVariants
    ? product.variants.find((v) => v.id === selectedVariant?.id) || firstAvailableVariant
    : null;

  const displayPrice = activeVariant ? activeVariant.price : product.price;
  const displaySku = activeVariant?.sku || product.sku;
  const isAvailable = product.inStock && (!activeVariant || activeVariant.inStock);
  const stockQty = activeVariant ? activeVariant.stockQuantity : product.stockQuantity;
  const catMeta = getCategoryMeta(product.category, categories);
  const imgSrc = getProductImage(product, categories);

  function handleAdd() {
    if (!isAvailable) return;
    addToCart(product, activeVariant, qty);
    setJustAdded(true);
    setQty(1);
    setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <article className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl overflow-hidden flex flex-col justify-between transition group">
      <div>
        <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
          <img
            src={imgSrc}
            alt={product.name}
            width={480}
            height={300}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide bg-slate-950/90 text-amber-300 border border-amber-500/40">
              {catMeta.name}
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5">
            {isAvailable ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                Stock: {stockQty}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-950/90 text-rose-200 border border-rose-500/40">
                Sin stock
              </span>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-amber-300">{product.brand}</span>
            {displaySku && <span className="font-mono text-[11px] text-slate-400">SKU: {displaySku}</span>}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white leading-snug">{product.name}</h3>
            {product.description && (
              <p className="text-slate-300 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {hasVariants && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Medida / Presentación:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const selected = activeVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold border transition ${
                        selected
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : variant.inStock
                          ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-amber-500/60'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {variant.label}
                      {!variant.inStock && ' (agotado)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-slate-800 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          {product.priceOnRequest ? (
            <div>
              <span className="text-base font-extrabold text-amber-400">Precio a consultar</span>
              <span className="block text-[11px] text-slate-400">Se cotiza al confirmar pedido</span>
            </div>
          ) : (
            <div>
              <span className="text-2xl font-extrabold text-white">{formatPrice(displayPrice)}</span>
              <span className="text-xs text-slate-400 ml-1">/ {product.unit}</span>
            </div>
          )}
          {isAvailable && stockQty > 0 && stockQty <= (product.minStockAlert || 3) && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Últimas {stockQty}</span>
            </span>
          )}
        </div>

        {isAvailable ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label={`Restar cantidad de ${product.name}`}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-200 hover:text-amber-400 transition"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-white" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label={`Sumar cantidad de ${product.name}`}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-200 hover:text-amber-400 transition"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-lg font-bold text-sm inline-flex items-center justify-center gap-1.5 transition ${
                justAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Agregado</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                  <span>{product.priceOnRequest ? 'Sumar consulta' : 'Agregar'}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="min-h-[44px] py-2.5 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
            <Package className="w-4 h-4" aria-hidden="true" />
            <span>Momentáneamente sin stock</span>
          </div>
        )}
      </div>
    </article>
  );
}
