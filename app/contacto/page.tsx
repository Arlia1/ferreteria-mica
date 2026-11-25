'use client';

import React, { useState } from 'react';
import { MessageCircle, Phone, MapPin, Share2 } from 'lucide-react';
import BusinessStatusBadge from '@/components/business-status-badge';
import { useStore } from '@/context/store-context';
import { STORE_INFO } from '@/lib/utils';
import { getWhatsAppUrl } from '@/lib/whatsapp';

export default function ContactoPage() {
  const { categories, settings } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Materiales de Construcción');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const waNumber = settings.whatsappNumber || STORE_INFO.whatsappDefault;

  function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || !message.trim()) {
      setFormError('Completá tu nombre y el detalle de la consulta para continuar.');
      return;
    }

    let text = 'Hola Ferretería Mica! Quiero consultar presupuesto / stock:\n\n';
    text += `• Nombre: ${name.trim()}\n`;
    if (phone.trim()) text += `• Teléfono: ${phone.trim()}\n`;
    if (category) text += `• Rubro: ${category}\n`;
    text += `• Consulta: ${message.trim()}`;

    window.open(getWhatsAppUrl(waNumber, text), '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="pt-28 md:pt-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Contactate con Ferretería Mica
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
          Consultá presupuestos, stock de materiales y herramientas, o coordiná envíos en el día en Quilmes Oeste.
        </p>
        <BusinessStatusBadge className="flex justify-center" />
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <a
          href={getWhatsAppUrl(waNumber, 'Hola Ferretería Mica, quiero hacer una consulta.')}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 p-6 rounded-xl flex flex-col items-center text-center transition"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center mb-3">
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-white">WhatsApp</h2>
          <span className="text-emerald-300 text-sm font-semibold mt-1">+54 9 11 5712-4625</span>
          <p className="text-slate-400 text-xs mt-1">Respuesta rápida en horario comercial</p>
        </a>

        <a
          href="tel:+5491157124625"
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 p-6 rounded-xl flex flex-col items-center text-center transition"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
            <Phone className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-white">Llamanos</h2>
          <span className="text-amber-400 text-sm font-semibold mt-1">11 5712-4625</span>
          <p className="text-slate-400 text-xs mt-1">Atención telefónica directa</p>
        </a>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-sky-500/15 text-sky-300 flex items-center justify-center mb-3">
            <Share2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-white mb-3">Redes Sociales</h2>
          <div className="flex gap-2">
            <a
              href={STORE_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <img src="/img/icons/instagram.svg" alt="" width={14} height={14} className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Instagram</span>
            </a>
            <a
              href={STORE_INFO.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <img src="/img/icons/facebook1.svg" alt="" width={14} height={14} className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Facebook</span>
            </a>
          </div>
        </div>

        <a
          href={STORE_INFO.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 p-6 rounded-xl flex flex-col items-center text-center transition"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-300 flex items-center justify-center mb-3">
            <MapPin className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-white">Local a la Calle</h2>
          <span className="text-amber-400 text-xs font-semibold mt-1">Av. San Martín 2652</span>
          <p className="text-slate-400 text-xs mt-1">Quilmes Oeste, Buenos Aires</p>
        </a>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Consultá Stock o Pedí tu Cotización</h2>
            <p className="text-slate-400 text-sm mt-1">
              Completá los datos y enviá la consulta directa al WhatsApp del local.
            </p>
          </div>

          <form onSubmit={handleQuoteSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quote-name" className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Tu Nombre *
                </label>
                <input
                  id="quote-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
                />
              </div>
              <div>
                <label htmlFor="quote-phone" className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Teléfono o WhatsApp
                </label>
                <input
                  id="quote-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="11 5555-0000"
                  className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="quote-category" className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Rubro de Interés
              </label>
              <select
                id="quote-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="Otro">Otro / Consulta General</option>
              </select>
            </div>

            <div>
              <label htmlFor="quote-message" className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Detalle de la Consulta *
              </label>
              <textarea
                id="quote-message"
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Indicá qué producto, medida o cantidad necesitás..."
                className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
              />
            </div>

            {formError && (
              <p role="alert" className="text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              <span>Enviar Consulta por WhatsApp</span>
            </button>
          </form>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Nuestra Ubicación</h2>
            <p className="text-slate-300 text-sm mt-1">{STORE_INFO.address}</p>
          </div>
          <a
            href={STORE_INFO.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
          >
            <MapPin className="w-4 h-4" aria-hidden="true" />
            <span>Abrir en Google Maps</span>
          </a>
        </div>
        <div className="w-full aspect-[16/9] max-h-96 rounded-xl overflow-hidden border border-slate-800">
          <iframe
            title="Ubicación de Ferretería Mica"
            src={STORE_INFO.mapsEmbedUrl}
            width={1000}
            height={420}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        </div>
      </section>
    </div>
  );
}
