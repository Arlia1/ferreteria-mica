'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatPrice } from '@/lib/utils';

export default function MobileCartBar() {
  const pathname = usePathname();
  const { totalItems, subtotal, setIsCartOpen } = useCart();

  if (pathname?.startsWith('/admin') || totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-40 md:hidden pb-[env(safe-area-inset-bottom)]">
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-xl flex items-center justify-between border border-amber-700/40"
      >
        <span className="inline-flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" aria-hidden="true" />
          <span>Ver Pedido ({totalItems})</span>
        </span>
        <span>{formatPrice(subtotal)}</span>
      </button>
    </div>
  );
}
