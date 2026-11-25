'use client';

import React, { useMemo, useState } from 'react';
import {
  RefreshCw,
  Search,
  Printer,
  MessageCircle,
  Truck,
  Store,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import {
  ORDER_STATUS_META,
  formatComandaDateTime,
  formatPrice,
  generateThermalTicketHtml,
} from '@/lib/utils';
import { getWhatsAppUrl } from '@/lib/whatsapp';

interface OrdersTabProps {
  orders: Order[];
  onRefresh: () => Promise<void>;
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
}

export default function OrdersTab({ orders, onRefresh, onUpdateStatus }: OrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'todos' && o.status !== statusFilter) return false;
      if (q) {
        return (
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          (o.deliveryAddress || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  const metrics = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pendiente').length;
    const active = orders.filter((o) => !['entregado', 'cancelado'].includes(o.status)).length;
    const revenue = orders
      .filter((o) => o.status !== 'cancelado')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { pending, active, revenue };
  }, [orders]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  function handlePrint(order: Order) {
    const win = window.open('', '_blank', 'width=380,height=640');
    if (!win) return;
    win.document.open();
    win.document.write(generateThermalTicketHtml(order));
    win.document.close();
    setTimeout(() => win.print(), 250);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-bold uppercase text-slate-300">Pendientes de confirmar</span>
          <p className="text-3xl font-extrabold text-amber-400 mt-1">{metrics.pending}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-bold uppercase text-slate-300">Comandas activas</span>
          <p className="text-3xl font-extrabold text-white mt-1">{metrics.active}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-bold uppercase text-slate-300">Facturación acumulada</span>
          <p className="text-3xl font-extrabold text-emerald-300 mt-1">{formatPrice(metrics.revenue)}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar comandas por estado">
          {(['todos', 'pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                aria-pressed={statusFilter === st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold transition ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 hover:border-amber-500/60'
                }`}
              >
                {st === 'todos' ? `Todas (${orders.length})` : ORDER_STATUS_META[st].label}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-64">
            <label htmlFor="orders-search" className="sr-only">
              Buscar comanda o cliente
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="orders-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar comanda o cliente..."
              className="w-full pl-9 pr-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3.5 py-2 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-2">
          <p className="text-base font-bold text-white">No hay comandas para mostrar</p>
          <p className="text-slate-300 text-sm">
            Cuando un cliente confirme un pedido en el carrito online, la comanda aparecerá aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pendiente;
            const clientWaUrl = getWhatsAppUrl(
              order.customerPhone,
              `Hola ${order.customerName}! Te escribimos de Ferretería Mica por tu comanda #${order.id}.`
            );

            return (
              <article
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-extrabold text-amber-400">#{order.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {formatComandaDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrint(order)}
                      className="px-3 py-2 min-h-[40px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Imprimir</span>
                    </button>
                    <a
                      href={clientWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 min-h-[40px] rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Contactar</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5 text-sm">
                    <p className="font-bold text-white text-base">{order.customerName}</p>
                    <p className="text-slate-300 flex items-center gap-1.5 text-xs">
                      <Phone className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                      <span>{order.customerPhone}</span>
                    </p>
                    <p className="text-slate-300 flex items-center gap-1.5 text-xs">
                      {order.orderType === 'delivery' ? (
                        <>
                          <Truck className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                          <span>Envío en el día</span>
                        </>
                      ) : (
                        <>
                          <Store className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                          <span>Retiro en local</span>
                        </>
                      )}
                    </p>
                    {order.orderType === 'delivery' && (
                      <p className="text-slate-300 flex items-start gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{order.deliveryAddress || 'A coordinar'}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-300 uppercase font-semibold pt-1">
                      Pago: <span className="text-amber-300">{order.paymentMethod}</span>
                    </p>
                    {order.deliveryNotes && (
                      <p className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mt-2">
                        Nota: {order.deliveryNotes}
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {order.items.map((it, idx) => (
                        <div
                          key={`${it.id}-${idx}`}
                          className="flex items-start justify-between gap-2 text-xs border-b border-slate-800/70 pb-1.5 last:border-none last:pb-0"
                        >
                          <div>
                            <span className="font-bold text-white">
                              {it.quantity}x {it.name}
                            </span>
                            {it.variantLabel && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
                                {it.variantLabel}
                              </span>
                            )}
                            {it.sku && <span className="ml-1.5 font-mono text-slate-400">[{it.sku}]</span>}
                          </div>
                          <span className="font-bold text-slate-200 shrink-0">
                            {it.priceOnRequest ? 'A consultar' : formatPrice(it.price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div className="text-xs text-slate-300">
                        Subtotal: {formatPrice(order.subtotal)}
                        {order.orderType === 'delivery' &&
                          ` · Envío: ${order.deliveryCost === 0 ? 'Sin cargo' : formatPrice(order.deliveryCost)}`}
                      </div>
                      <div className="text-base font-extrabold text-amber-400">
                        Total: {formatPrice(order.total)}
                        {order.hasConsultItems && <span className="text-xs font-normal ml-1">(+ a consultar)</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {meta.nextStatus && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order.id, meta.nextStatus!)}
                        className="px-3.5 py-2 min-h-[40px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{meta.nextLabel}</span>
                      </button>
                    )}
                    {order.status !== 'cancelado' && order.status !== 'entregado' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order.id, 'cancelado')}
                        className="px-3.5 py-2 min-h-[40px] rounded-lg bg-rose-950/70 hover:bg-rose-900/70 text-rose-200 border border-rose-500/40 font-semibold text-xs inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor={`order-status-${order.id}`} className="sr-only">
                      Cambiar estado de comanda {order.id}
                    </label>
                    <select
                      id={`order-status-${order.id}`}
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="px-3 py-2 min-h-[40px] rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-semibold"
                    >
                      {Object.entries(ORDER_STATUS_META).map(([k, v]) => (
                        <option key={k} value={k}>
                          Estado: {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
