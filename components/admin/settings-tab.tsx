'use client';

import React, { useState } from 'react';
import { Save, FolderPlus, Lock, CheckCircle2 } from 'lucide-react';
import { CategoryItem, StoreSettings } from '@/lib/types';
import { apiFetch } from '@/lib/api';

interface SettingsTabProps {
  settings: StoreSettings;
  categories: CategoryItem[];
  onUpdateSettings: (patch: Partial<StoreSettings>) => Promise<void>;
  onAddCategory: (cat: CategoryItem) => Promise<void>;
}

export default function SettingsTab({
  settings,
  categories,
  onUpdateSettings,
  onAddCategory,
}: SettingsTabProps) {
  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber);
  const [deliveryCost, setDeliveryCost] = useState(String(settings.deliveryCost));
  const [freeThreshold, setFreeThreshold] = useState(String(settings.freeDeliveryThreshold));
  const [cutoff, setCutoff] = useState(settings.sameDayDeliveryCutoff);
  const [openOverride, setOpenOverride] = useState<'auto' | 'open' | 'closed'>(settings.isOpenOverride);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateSettings({
        whatsappNumber: whatsapp.replace(/\D/g, ''),
        deliveryCost: Math.max(0, Number(deliveryCost || 0)),
        freeDeliveryThreshold: Math.max(0, Number(freeThreshold || 0)),
        sameDayDeliveryCutoff: cutoff,
        isOpenOverride: openOverride,
        announcement,
      });
      setSavedMsg('Configuración guardada.');
      setTimeout(() => setSavedMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const id = newCatName
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    await onAddCategory({
      id,
      name: newCatName.trim(),
      description: newCatDesc.trim() || `Artículos de ${newCatName.trim()}`,
      image: '/img/productos/amoladora.jpg',
    });
    setNewCatName('');
    setNewCatDesc('');
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');
    const res = await apiFetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPassErr(data.error || 'No se pudo cambiar la contraseña.');
      return;
    }
    setPassMsg('Contraseña actualizada correctamente.');
    setCurrentPassword('');
    setNewPassword('');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-extrabold text-white">Configuración de Tienda y Envíos</h2>

        <div>
          <label htmlFor="set-wa" className="block text-xs font-semibold text-slate-300 mb-1">
            WhatsApp Receptor de Pedidos (ej: 5491157124625)
          </label>
          <input
            id="set-wa"
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="set-delivery" className="block text-xs font-semibold text-slate-300 mb-1">
              Costo Envío en el Día ($)
            </label>
            <input
              id="set-delivery"
              type="number"
              min={0}
              value={deliveryCost}
              onChange={(e) => setDeliveryCost(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label htmlFor="set-threshold" className="block text-xs font-semibold text-slate-300 mb-1">
              Envío Gratis Desde ($ · 0 = desactivado)
            </label>
            <input
              id="set-threshold"
              type="number"
              min={0}
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="set-cutoff" className="block text-xs font-semibold text-slate-300 mb-1">
              Corte Envío en el Día
            </label>
            <input
              id="set-cutoff"
              type="text"
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label htmlFor="set-open" className="block text-xs font-semibold text-slate-300 mb-1">
              Estado del Local
            </label>
            <select
              id="set-open"
              value={openOverride}
              onChange={(e) => setOpenOverride(e.target.value as 'auto' | 'open' | 'closed')}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
            >
              <option value="auto">Automático según horario</option>
              <option value="open">Forzar Abierto</option>
              <option value="closed">Forzar Cerrado</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="set-announcement" className="block text-xs font-semibold text-slate-300 mb-1">
            Banner / Aviso Superior
          </label>
          <input
            id="set-announcement"
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
          />
        </div>

        {savedMsg && (
          <p role="status" className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {savedMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
        </button>
      </form>

      <div className="space-y-6">
        <form onSubmit={handleCreateCategory} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <span>Rubros ({categories.length})</span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span
                key={c.id}
                className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200 font-semibold"
              >
                {c.name}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <div>
              <label htmlFor="cat-name" className="sr-only">
                Nombre del nuevo rubro
              </label>
              <input
                id="cat-name"
                type="text"
                placeholder="Nuevo rubro (ej: Soldadura)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
              />
            </div>
            <div>
              <label htmlFor="cat-desc" className="sr-only">
                Descripción corta del nuevo rubro
              </label>
              <input
                id="cat-desc"
                type="text"
                placeholder="Descripción corta"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs"
          >
            + Agregar Rubro
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <span>Seguridad Administrador</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="pass-current" className="sr-only">
                Contraseña actual
              </label>
              <input
                id="pass-current"
                type="password"
                required
                placeholder="Contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
              />
            </div>
            <div>
              <label htmlFor="pass-new" className="sr-only">
                Nueva contraseña
              </label>
              <input
                id="pass-new"
                type="password"
                required
                minLength={6}
                placeholder="Nueva contraseña (mín. 6)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
              />
            </div>
          </div>
          {passErr && (
            <p role="alert" className="text-xs text-rose-300 font-semibold">
              {passErr}
            </p>
          )}
          {passMsg && (
            <p role="status" className="text-xs text-emerald-300 font-semibold">
              {passMsg}
            </p>
          )}
          <button
            type="submit"
            className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Actualizar Contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
