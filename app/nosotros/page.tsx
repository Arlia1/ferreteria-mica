'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, Lightbulb, Zap, Banknote, CreditCard, ArrowLeftRight, Truck, ChevronDown } from 'lucide-react';
import BusinessStatusBadge from '@/components/business-status-badge';

const FAQS = [
  {
    q: '¿Realizan envíos en el día?',
    a: 'Sí, realizamos envíos rápidos en el día en Quilmes Oeste y zonas cercanas. Podés elegir envío a domicilio directo desde el carrito online.',
  },
  {
    q: '¿Qué medios de pago aceptan?',
    a: 'Aceptamos efectivo en el local o contraentrega, tarjeta de débito y transferencias bancarias.',
  },
  {
    q: '¿Cargan oxígeno y nitrógeno en el momento?',
    a: 'Sí, realizamos suministro y recarga inmediata de tubos de oxígeno y nitrógeno en nuestro local de Av. San Martín 2652.',
  },
  {
    q: '¿Cómo funciona el pedido desde el catálogo online?',
    a: 'Buscás tus productos, seleccionás la medida o cantidad, los agregás al pedido y al confirmar se registra tu comanda y se abre WhatsApp con el detalle completo.',
  },
];

export default function NosotrosPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="pt-28 md:pt-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="max-w-3xl space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Sobre Ferretería Mica
        </h1>
        <p className="text-lg text-slate-300">
          Más de 25 años brindando materiales de construcción, herramientas y asesoramiento de mostrador en Quilmes Oeste.
        </p>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-10 space-y-6">
        <h2 className="text-3xl font-extrabold text-white">Trayectoria, Compromiso y Calidad</h2>
        <div className="space-y-4 text-slate-300 text-base sm:text-lg leading-relaxed">
          <p>
            En <strong className="text-amber-400">Ferretería Mica</strong> somos un comercio familiar y técnico dedicado a proveer soluciones completas en materiales de construcción, herramientas y suministros para el hogar y la industria.
          </p>
          <p>
            Con más de <strong className="text-white">25 años de presencia ininterrumpida en Quilmes Oeste</strong>, acompañamos a vecinos, maestros mayores de obra, electricistas, plomeros y talleres con asesoramiento honesto y stock permanente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-slate-800">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <Award className="w-6 h-6 text-amber-400 mb-3" aria-hidden="true" />
            <h3 className="text-white font-bold text-lg mb-1">+25 años en el barrio</h3>
            <p className="text-slate-300 text-sm">Trayectoria consolidada acompañando cada proyecto en Quilmes Oeste.</p>
          </div>
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <Lightbulb className="w-6 h-6 text-amber-400 mb-3" aria-hidden="true" />
            <h3 className="text-white font-bold text-lg mb-1">Asesoramiento técnico</h3>
            <p className="text-slate-300 text-sm">Te orientamos con la medida, herramienta y material exacto para tu trabajo.</p>
          </div>
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <Zap className="w-6 h-6 text-amber-400 mb-3" aria-hidden="true" />
            <h3 className="text-white font-bold text-lg mb-1">Stock permanente</h3>
            <p className="text-slate-300 text-sm">Bulonería, sanitarios Awaduct, electricidad, gases, máquinas y pinturas.</p>
          </div>
        </div>
      </section>

      {/* Horarios con alto contraste (slate-950 sobre amber-500) */}
      <section className="bg-amber-500 text-slate-950 rounded-xl p-6 sm:p-10 text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-3xl font-extrabold text-slate-950">Horarios de Atención</h2>
          <BusinessStatusBadge className="flex justify-center" />
          <div className="bg-slate-950 text-white rounded-xl p-6 text-base space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-medium text-amber-300">Lunes a Viernes</span>
              <span className="font-bold">08:30 - 19:00 (Corrido)</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-medium text-amber-300">Sábados</span>
              <span className="font-bold">08:30 - 18:00 (Corrido)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-amber-300">Domingos</span>
              <span className="font-bold text-amber-300">09:00 - 13:00</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold text-white">Medios de Pago y Envíos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <Banknote className="w-7 h-7 text-amber-400 mx-auto mb-2" aria-hidden="true" />
              <h3 className="text-white font-semibold text-base">Efectivo</h3>
              <p className="text-slate-300 text-xs mt-1">Local o contraentrega</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <CreditCard className="w-7 h-7 text-amber-400 mx-auto mb-2" aria-hidden="true" />
              <h3 className="text-white font-semibold text-base">Débito</h3>
              <p className="text-slate-300 text-xs mt-1">Todas las tarjetas</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <ArrowLeftRight className="w-7 h-7 text-amber-400 mx-auto mb-2" aria-hidden="true" />
              <h3 className="text-white font-semibold text-base">Transferencias</h3>
              <p className="text-slate-300 text-xs mt-1">CBU / CVU al instante</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <Truck className="w-7 h-7 text-amber-400 mx-auto mb-2" aria-hidden="true" />
              <h3 className="text-white font-semibold text-base">Envíos en el Día</h3>
              <p className="text-slate-300 text-xs mt-1">Quilmes Oeste y zonas</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold text-white text-center">Preguntas Frecuentes</h2>
        <div className="space-y-3 max-w-3xl mx-auto">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${idx}`}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 min-h-[48px] text-left flex items-center justify-between gap-4 font-bold text-white hover:text-amber-400 transition"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition ${isOpen ? 'rotate-180 text-amber-400' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div
                    id={`faq-panel-${idx}`}
                    className="px-5 pb-4 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-3"
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center pt-4">
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center px-7 py-3.5 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
          >
            Ir al Catálogo Online
          </Link>
        </div>
      </section>
    </div>
  );
}
