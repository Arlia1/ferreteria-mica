'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  LogOut,
  ShoppingBag,
  Boxes,
  FileSpreadsheet,
  Settings,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useStore } from '@/context/store-context';
import { apiFetch, setAdminToken } from '@/lib/api';
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
    refreshOrders,
    refreshCatalog,
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

  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('comandas');

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await apiFetch('/api/admin/auth');
        if (res.ok) {
          setAuthenticated(true);
          await Promise.all([refreshOrders(), refreshCatalog()]);
        }
      } catch {
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [refreshOrders, refreshCatalog]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await apiFetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.error || 'Credenciales incorrectas');
        return;
      }
      if (data.token) setAdminToken(data.token);
      setAuthenticated(true);
      await Promise.all([refreshOrders(), refreshCatalog()]);
    } catch {
      setLoginError('No se pudo conectar con el servidor backend (puerto 4000).');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await apiFetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {});
    setAdminToken(null);
    setAuthenticated(false);
    setPassword('');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 gap-2" role="status">
        <Loader2 className="w-5 h-5 animate-spin text-amber-400" aria-hidden="true" />
        <span>Verificando sesión de administrador...</span>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <img
              src="/img/logo.png"
              alt="Ferretería Mica"
              width={96}
              height={48}
              className="w-24 h-12 object-contain mx-auto"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/15 text-amber-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Panel Administrativo</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Ingreso Ferretería Mica</h1>
            <p className="text-xs text-slate-300">
              Gestioná comandas, precios, stock e importación de planillas.
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-xs font-semibold text-slate-300 mb-1">
                Usuario
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-300 mb-1">
                Contraseña
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá tu contraseña"
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
              />
            </div>

            {loginError && (
              <p role="alert" className="text-xs font-semibold text-rose-200 bg-rose-950/70 border border-rose-500/40 rounded-lg px-3 py-2">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full min-h-[44px] py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition"
            >
              {loggingIn ? 'Ingresando...' : 'Entrar al Panel'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-slate-300 hover:text-amber-400 inline-block py-2">
              Volver a la tienda pública
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <Link
              href="/catalogo"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>Ver Tienda</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 min-h-[44px] rounded-lg bg-rose-950/70 hover:bg-rose-900/70 text-rose-200 border border-rose-500/40 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
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
