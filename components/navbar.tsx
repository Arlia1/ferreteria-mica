'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useStore } from '@/context/store-context';
import { getWhatsAppUrl } from '@/lib/whatsapp';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Catálogo Online' },
  { href: '/servicios', label: 'Rubros' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { settings } = useStore();

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  if (pathname?.startsWith('/admin')) return null;

  const waUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    'Hola Ferretería Mica, te contacto desde la página web.'
  );

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-amber-500 text-slate-950 border-b border-amber-700/30 shadow-md">
      {settings.announcement && (
        <div className="bg-slate-950 text-amber-300 text-xs font-medium text-center py-1.5 px-4 border-b border-slate-800 truncate">
          {settings.announcement}
        </div>
      )}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Navegación principal">
        <div className="flex items-center justify-between h-16 gap-2">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 min-h-[44px]" aria-label="Ferretería Mica, ir al inicio">
            <img
              src="/img/logo.png"
              alt="Ferretería Mica"
              width={96}
              height={48}
              className="w-24 h-12 object-contain"
            />
          </Link>

          <div className="hidden md:flex items-center gap-1.5">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3.5 py-2.5 min-h-[44px] inline-flex items-center rounded-lg text-sm font-bold transition ${
                    active
                      ? 'bg-amber-700 text-white'
                      : 'text-slate-950 hover:bg-amber-400 active:bg-amber-600'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Abrir pedido online (${totalItems} productos)`}
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-lg bg-slate-950 hover:bg-slate-900 active:bg-slate-800 text-amber-400 font-bold text-sm transition"
            >
              <ShoppingCart className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Pedido</span>
              {totalItems > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold">
                  {totalItems}
                </span>
              )}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm transition"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
              <span>Menú</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="mobile-nav-menu" className="md:hidden pb-4 pt-2 border-t border-amber-700/30">
            <div className="flex flex-col space-y-1.5">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`px-3.5 py-3 min-h-[44px] rounded-lg text-sm font-bold flex items-center transition ${
                      active ? 'bg-amber-700 text-white' : 'text-slate-950 hover:bg-amber-400'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-3 min-h-[44px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Escribir por WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
