'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Truck,
  Store,
  CheckCircle2,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useStore } from '@/context/store-context';
import { Order, OrderType, PaymentMethod } from '@/lib/types';
import { formatPrice, STORE_INFO } from '@/lib/utils';
import { generateWhatsAppMessage, getWhatsAppUrl } from '@/lib/whatsapp';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, subtotal, hasConsultItems } =
    useCart();
  const { settings, createOrder } = useStore();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<{ order: Order; waUrl: string } | null>(null);

  useEffect(() => {
    if (!isCartOpen) return;
    closeBtnRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setConfirmedOrder(null);
        setErrorMsg('');
        setIsCartOpen(false);
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const baseDelivery = Number(settings.deliveryCost ?? 2500);
  const freeThreshold = Number(settings.freeDeliveryThreshold ?? 0);
  const appliedDelivery =
    orderType === 'delivery'
      ? freeThreshold > 0 && subtotal >= freeThreshold
        ? 0
        : baseDelivery
      : 0;
  const total = subtotal + appliedDelivery;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Ingresá tu nombre y teléfono/WhatsApp.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Ingresá la dirección de envío en Quilmes Oeste o alrededores.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tempNumber = `FM-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const draftWaMessage = generateWhatsAppMessage(
        items,
        {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          orderType,
          deliveryAddress: deliveryAddress.trim(),
          deliveryNotes: deliveryNotes.trim(),
          paymentMethod,
        },
        subtotal,
        appliedDelivery,
        tempNumber
      );

      let savedOrder: Order | null = null;
      try {
        savedOrder = await createOrder({
          id: tempNumber,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          orderType,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : '',
          deliveryNotes: deliveryNotes.trim(),
          paymentMethod,
          items,
          subtotal,
          deliveryCost: appliedDelivery,
          total,
          hasConsultItems,
          whatsappMessage: draftWaMessage,
        });
      } catch {
        // Fallback: si el backend local no esta activo, igual permitimos enviar la comanda por WhatsApp
      }

      const finalMessage = savedOrder?.whatsappMessage || draftWaMessage;
      const waUrl = getWhatsAppUrl(settings.whatsappNumber || STORE_INFO.whatsappDefault, finalMessage);

      setConfirmedOrder({
        order: savedOrder || {
          id: tempNumber,
          createdAt: new Date().toISOString(),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          orderType,
          deliveryAddress: deliveryAddress.trim(),
          deliveryNotes: deliveryNotes.trim(),
          paymentMethod,
          items,
          subtotal,
          deliveryCost: appliedDelivery,
          total,
          hasConsultItems,
          status: 'pendiente',
          whatsappMessage: finalMessage,
        },
        waUrl,
      });

      clearCart();
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ocurrió un error al enviar el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setConfirmedOrder(null);
    setErrorMsg('');
    setIsCartOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h2 id="cart-drawer-title" className="text-lg font-extrabold text-white">
              Tu Pedido Online
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            aria-label="Cerrar carrito de pedido"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {confirmedOrder ? (
            <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Comanda registrada #{confirmedOrder.order.id}
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-1">Pedido listo para WhatsApp</h3>
                <p className="text-slate-300 text-sm mt-2">
                  Tu comanda ya quedó guardada en el mostrador. Si no se abrió WhatsApp automáticamente, usá el botón de abajo.
                </p>
              </div>
              <div className="space-y-2.5 pt-2">
                <a
                  href={confirmedOrder.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] py-3 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  <span>Abrir WhatsApp con mi Comanda</span>
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full min-h-[44px] py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm transition"
                >
                  Seguir viendo el catálogo
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-14 space-y-4">
              <div className="w-16 h-16 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Tu pedido está vacío</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Agregá herramientas, bulonería, sanitarios o materiales desde el catálogo con precios actualizados.
                </p>
              </div>
              <Link
                href="/catalogo"
                onClick={handleClose}
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
              >
                Explorar Catálogo
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white leading-snug">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-1">
                        {item.variantLabel && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold">
                            {item.variantLabel}
                          </span>
                        )}
                        {item.sku && <span className="font-mono text-slate-400">SKU: {item.sku}</span>}
                      </div>
                      <p className="text-sm font-bold text-amber-400 mt-1.5">
                        {item.priceOnRequest
                          ? 'Precio a consultar'
                          : `${formatPrice(item.price * item.quantity)} (${formatPrice(item.price)} c/u)`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Eliminar ${item.name}`}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-300 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={`Restar cantidad de ${item.name}`}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-200 hover:text-amber-400"
                        >
                          <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Sumar cantidad de ${item.name}`}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-200 hover:text-amber-400"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form id="checkout-form" onSubmit={handleCheckout} noValidate className="space-y-4 pt-3 border-t border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Datos para la Comanda y WhatsApp
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="checkout-name" className="block text-xs font-semibold text-slate-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-phone" className="block text-xs font-semibold text-slate-300 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="11 5555-0000"
                      className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
                    />
                  </div>
                </div>

                <fieldset className="space-y-1.5">
                  <legend className="block text-xs font-semibold text-slate-300 mb-1">Modalidad de entrega</legend>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      aria-pressed={orderType === 'delivery'}
                      onClick={() => setOrderType('delivery')}
                      className={`p-3 min-h-[56px] rounded-lg border text-left transition ${
                        orderType === 'delivery'
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Truck className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <span>Envío en el día</span>
                      </div>
                      <span className="text-[11px] text-slate-300 block mt-0.5">
                        {freeThreshold > 0 && subtotal >= freeThreshold
                          ? 'Envío sin cargo'
                          : `Costo: ${formatPrice(baseDelivery)}`}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={orderType === 'takeaway'}
                      onClick={() => setOrderType('takeaway')}
                      className={`p-3 min-h-[56px] rounded-lg border text-left transition ${
                        orderType === 'takeaway'
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Store className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <span>Retiro en local</span>
                      </div>
                      <span className="text-[11px] text-slate-300 block mt-0.5">Av. San Martín 2652</span>
                    </button>
                  </div>
                </fieldset>

                {orderType === 'delivery' && (
                  <div>
                    <label htmlFor="checkout-address" className="block text-xs font-semibold text-slate-300 mb-1">
                      Dirección de entrega (Quilmes Oeste y zonas) *
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Calle, altura, entre calles o piso"
                      className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
                    />
                  </div>
                )}

                <fieldset className="space-y-1.5">
                  <legend className="block text-xs font-semibold text-slate-300 mb-1">Medio de pago</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'efectivo', label: 'Efectivo' },
                      { id: 'debito', label: 'Débito' },
                      { id: 'transferencia', label: 'Transferencia' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={paymentMethod === m.id}
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`py-2.5 px-2 min-h-[44px] rounded-lg border text-xs font-bold transition ${
                          paymentMethod === m.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="checkout-notes" className="block text-xs font-semibold text-slate-300 mb-1">
                    Notas o aclaraciones (opcional)
                  </label>
                  <textarea
                    id="checkout-notes"
                    rows={2}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Horario preferido, factura o detalle de medida"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
                  />
                </div>

                {errorMsg && (
                  <p role="alert" className="text-xs font-semibold text-rose-200 bg-rose-950/70 border border-rose-500/40 rounded-lg px-3 py-2">
                    {errorMsg}
                  </p>
                )}
              </form>
            </>
          )}
        </div>

        {!confirmedOrder && items.length > 0 && (
          <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal productos</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between text-slate-300">
                  <span>Envío en el día</span>
                  <span>{appliedDelivery === 0 ? 'SIN CARGO' : formatPrice(appliedDelivery)}</span>
                </div>
              )}
              {freeThreshold > 0 && orderType === 'delivery' && subtotal < freeThreshold && (
                <p className="text-[11px] text-amber-300">
                  Te faltan {formatPrice(freeThreshold - subtotal)} para envío sin cargo.
                </p>
              )}
              <div className="flex justify-between text-lg font-extrabold text-white pt-1 border-t border-slate-800">
                <span>Total{hasConsultItems ? ' (parcial)' : ''}</span>
                <span className="text-amber-400">{formatPrice(total)}</span>
              </div>
              {hasConsultItems && (
                <p className="text-[11px] text-amber-300">
                  Incluye ítems a consultar que confirmamos por WhatsApp.
                </p>
              )}
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full min-h-[48px] py-3.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  <span>Registrando comanda...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  <span>Confirmar y Enviar por WhatsApp</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
