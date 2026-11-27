'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Boxes,
  FileSpreadsheet,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '@/context/store-context';
import OrdersTab from '@/components/admin/orders-tab';
import CatalogTab from '@/components/admin/catalog-tab';
import BulkTab from '@/components/admin/bulk-tab';
import SettingsTab from '@/components/admin/settings-tab';

type AdminTab = 'comandas' | 'catalogo' | 'masivo' | 'ajustes';

export default function AdminPage() {
  const {
    products,
    categories,
    settings,
    orders,
    backendOnline,
    refreshOrders,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    bulkImportCsv,
    bulkUpdatePrices,
    updateOrderStatus,
    updateSettings,
    addCategory,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('catalogo');

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode; badge?: number }> = [
    {
      id: 'comandas',
      label: 'Comandas',
      icon: <ShoppingBag className="w-4 h-4" aria-hidden="true" />,
      badge: orders.filter((o) => o.status === 'pendiente').length || undefined,
    },
    { id: 'catalogo', label: `Catálogo (${products.length})`, icon: <Boxes className="w-4 h-4" aria-hidden="true" /> },
    { id: 'masivo', label: 'Carga Masiva y %', icon: <FileSpreadsheet className="w-4 h-4" aria-hidden="true" /> },
    { id: 'ajustes', label: 'Ajustes', icon: <Settings className="w-4 h-4" aria-hidden="true" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/img/logo.png"
              alt="Ferretería Mica"
              width={80}
              height={40}
              className="w-20 h-10 object-contain"
            />
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                Panel de Administración
              </h1>
              <span className="text-[11px] text-amber-400 font-semibold">Ferretería Mica · Quilmes Oeste</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
                backendOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-amber-300 border-slate-700'
              }`}
            >
              {backendOnline ? 'Backend conectado' : 'Acceso directo (sin backend)'}
            </span>
            <Link
              href="/catalogo"
              className="px-3.5 py-2 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>Ver Catálogo</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div role="tablist" aria-label="Secciones de administración" className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-bold inline-flex items-center gap-2 transition ${
                activeTab === t.id
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-200 border border-slate-800 hover:border-amber-500/60'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-950 text-amber-400">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'comandas' && (
          <OrdersTab orders={orders} onRefresh={refreshOrders} onUpdateStatus={updateOrderStatus} />
        )}
        {activeTab === 'catalogo' && (
          <CatalogTab
            products={products}
            categories={categories}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
            onUpdateStock={updateProductStock}
          />
        )}
        {activeTab === 'masivo' && (
          <BulkTab
            products={products}
            categories={categories}
            onBulkImportCsv={bulkImportCsv}
            onBulkPriceUpdate={bulkUpdatePrices}
          />
        )}
        {activeTab === 'ajustes' && (
          <SettingsTab
            settings={settings}
            categories={categories}
            onUpdateSettings={updateSettings}
            onAddCategory={addCategory}
          />
        )}
      </div>
    </div>
  );
}
