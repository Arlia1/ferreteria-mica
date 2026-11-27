'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Clock } from 'lucide-react';
import { useStore } from '@/context/store-context';
import { useCart } from '@/context/cart-context';
import { STORE_INFO } from '@/lib/utils';

export default function Footer() {
  const pathname = usePathname();
  const { categories, settings } = useStore();
  const { totalItems } = useCart();

  if (pathname?.startsWith('/admin')) return null;

  const bottomPad = totalItems > 0 ? 'pb-24 md:pb-8' : 'pb-8';

  return (
    <footer className={`bg-slate-900 border-t border-slate-800 text-white mt-16 pt-12 ${bottomPad}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Identidad y datos del mostrador */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-4">
              <img
                src="/img/logo.png"
                alt="Ferretería Mica"
                width={96}
                height={48}
                className="w-24 h-12 object-contain"
              />
              <p className="text-slate-300 text-sm leading-relaxed">
                Más de 25 años en Quilmes Oeste acompañando obras, oficios y arreglos del hogar.
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-300 border-t border-slate-800 pt-4">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Av. San Martín 2652, Quilmes Oeste (B1879)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <a href="tel:+5491157124625" className="hover:text-amber-400 transition py-1">
                  11 5712-4625
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Lun a Vie 8:30 a 19:00 · Sáb 8:30 a 18:00 · Dom 9:00 a 13:00</span>
              </li>
            </ul>

            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${settings.whatsappNumber || STORE_INFO.whatsappDefault}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-emerald-700 transition flex items-center justify-center"
                aria-label="WhatsApp de Ferretería Mica"
              >
                <img src="/img/icons/whatsapp.svg" alt="" width={20} height={20} className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href={STORE_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-blue-700 transition flex items-center justify-center"
                aria-label="Facebook de Ferretería Mica"
              >
                <img src="/img/icons/facebook1.svg" alt="" width={20} height={20} className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href={STORE_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-pink-700 transition flex items-center justify-center"
                aria-label="Instagram de Ferretería Mica"
              >
                <img src="/img/icons/instagram.svg" alt="" width={20} height={20} className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Enlaces reales de tienda y rubros */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h2 className="text-amber-400 font-bold mb-3 text-sm">Secciones</h2>
              <ul className="space-y-1.5 text-sm text-slate-300">
                <li>
                  <Link href="/" className="hover:text-amber-400 transition inline-block py-1">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/catalogo" className="hover:text-amber-400 transition inline-block py-1">
                    Catálogo Online con Precios
                  </Link>
                </li>
                <li>
                  <Link href="/servicios" className="hover:text-amber-400 transition inline-block py-1">
                    Rubros y Especialidades
                  </Link>
                </li>
                <li>
                  <Link href="/nosotros" className="hover:text-amber-400 transition inline-block py-1">
                    Sobre Ferretería Mica
                  </Link>
                </li>
                <li>
                  <Link href="/contacto" className="hover:text-amber-400 transition inline-block py-1">
                    Contacto y Mapa
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-amber-400 font-bold mb-3 text-sm">Catálogo por Rubro</h2>
              <ul className="grid grid-cols-1 gap-1.5 text-sm text-slate-300">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link href={`/catalogo?rubro=${cat.id}`} className="hover:text-amber-400 transition inline-block py-1">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} Ferretería Mica · Av. San Martín 2652, Quilmes Oeste.</p>
          <Link href="/admin" className="hover:text-amber-400 transition py-1 px-2">
            Panel de Administración y Comandas
          </Link>
        </div>
      </div>
    </footer>
  );
}
