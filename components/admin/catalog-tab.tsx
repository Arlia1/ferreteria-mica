'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, Save, X, AlertTriangle, CheckCircle2, Upload, Image as ImageIcon } from 'lucide-react';
import { CategoryItem, Product, ProductVariant } from '@/lib/types';
import { formatPrice, getCategoryMeta, getProductImage, uploadToCloudinary } from '@/lib/utils';

interface CatalogTabProps {
  products: Product[];
  categories: CategoryItem[];
  onAddProduct: (prod: Omit<Product, 'id'>) => Promise<Product | null>;
  onUpdateProduct: (prod: Product) => Promise<Product | null>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onUpdateStock: (
    productId: string,
    payload: { variantId?: string; inStock?: boolean; stockQuantity?: number }
  ) => Promise<void>;
}

const EMPTY_FORM: Omit<Product, 'id'> = {
  sku: '',
  name: '',
  brand: '',
  category: 'herramientas',
  description: '',
  unit: 'unidad',
  price: 0,
  priceOnRequest: false,
  inStock: true,
  stockQuantity: 10,
  minStockAlert: 3,
  variants: [],
  image: '',
  featured: false,
};

export default function CatalogTab({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateStock,
}: CatalogTabProps) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('todos');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [pageSize, setPageSize] = useState(30);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadHint, setUploadHint] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== 'todos' && p.category !== catFilter) return false;
      if (lowStockOnly && p.inStock && p.stockQuantity > (p.minStockAlert || 3)) return false;
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, search, catFilter, lowStockOnly]);

  const visible = filtered.slice(0, pageSize);

  function openNewModal() {
    setEditingId(null);
    setUploadHint('');
    setForm({ ...EMPTY_FORM, category: categories[0]?.id || 'herramientas' });
    setModalOpen(true);
  }

  function openEditModal(p: Product) {
    setEditingId(p.id);
    setUploadHint('');
    setForm({
      sku: p.sku || '',
      name: p.name,
      brand: p.brand || '',
      category: p.category,
      description: p.description || '',
      unit: p.unit || 'unidad',
      price: p.price,
      priceOnRequest: Boolean(p.priceOnRequest),
      inStock: p.inStock,
      stockQuantity: p.stockQuantity,
      minStockAlert: p.minStockAlert ?? 3,
      variants: Array.isArray(p.variants) ? p.variants.map((v) => ({ ...v })) : [],
      image: p.image || '',
      featured: Boolean(p.featured),
    });
    setModalOpen(true);
  }

  async function saveQuickPrice(p: Product) {
    const parsed = Math.max(0, Number(priceDraft || 0));
    await onUpdateProduct({ ...p, price: parsed });
    setEditingPriceId(null);
    setFeedback(`Precio de "${p.name}" actualizado.`);
    setTimeout(() => setFeedback(''), 2500);
  }

  async function handleSaveModal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await onUpdateProduct({ ...form, id: editingId });
        setFeedback('Producto actualizado correctamente.');
      } else {
        await onAddProduct(form);
        setFeedback('Producto agregado al catálogo.');
      }
      setModalOpen(false);
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  function addVariantRow() {
    const newVar: ProductVariant = {
      id: `var-${Date.now().toString(36)}`,
      label: '',
      sku: '',
      price: form.price || 0,
      stockQuantity: 10,
      inStock: true,
    };
    setForm((prev) => ({ ...prev, variants: [...prev.variants, newVar] }));
  }

  function updateVariantRow(idx: number, patch: Partial<ProductVariant>) {
    setForm((prev) => {
      const next = [...prev.variants];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, variants: next };
    });
  }

  function removeVariantRow(idx: number) {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    setUploadHint('');
    try {
      const { url, mode } = await uploadToCloudinary(file);
      if (url) {
        setForm((prev) => ({ ...prev, image: url }));
        setUploadHint(
          mode === 'cloudinary'
            ? 'Imagen subida a Cloudinary.'
            : 'Cloudinary sin configurar aún: guardada optimizada en WebP local.'
        );
      }
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-5">
      {feedback && (
        <div role="status" className="px-4 py-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
          <div className="relative flex-1">
            <label htmlFor="admin-catalog-search" className="sr-only">
              Buscar producto por nombre, SKU o marca
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="admin-catalog-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU o marca..."
              className="w-full pl-9 pr-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm"
            />
          </div>

          <label htmlFor="admin-catalog-cat" className="sr-only">
            Filtrar por rubro
          </label>
          <select
            id="admin-catalog-cat"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
          >
            <option value="todos">Todos los rubros ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="accent-amber-500 w-4 h-4"
            />
            <span>Stock bajo / sin stock</span>
          </label>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="px-4 py-2.5 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-xs uppercase text-slate-300 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">SKU / Producto</th>
                <th className="py-3 px-4">Rubro</th>
                <th className="py-3 px-4">Precio Base</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-300 text-sm">
                    No hay productos que coincidan con el filtro aplicado.
                  </td>
                </tr>
              ) : (
                visible.map((p) => {
                  const isLow = p.stockQuantity <= (p.minStockAlert || 3);
                  const cat = getCategoryMeta(p.category, categories);
                  return (
                    <tr key={p.id} className="hover:bg-slate-950/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(p, categories)}
                            alt=""
                            width={44}
                            height={44}
                            className="w-11 h-11 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
                            aria-hidden="true"
                          />
                          <div>
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="text-xs text-slate-300 flex flex-wrap gap-2 mt-0.5">
                              <span className="font-mono text-amber-300">{p.sku}</span>
                              <span>· {p.brand}</span>
                              {p.variants?.length > 0 && (
                                <span className="text-sky-300">· {p.variants.length} medidas/variantes</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-200">{cat.name}</td>

                      <td className="py-3 px-4">
                        {p.priceOnRequest ? (
                          <span className="text-xs font-bold text-amber-300">A consultar</span>
                        ) : editingPriceId === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <label htmlFor={`quick-price-${p.id}`} className="sr-only">
                              Nuevo precio para {p.name}
                            </label>
                            <input
                              id={`quick-price-${p.id}`}
                              type="number"
                              value={priceDraft}
                              onChange={(e) => setPriceDraft(e.target.value)}
                              className="w-24 px-2 py-1.5 min-h-[36px] rounded-lg bg-slate-950 border border-amber-500 text-white text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => saveQuickPrice(p)}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
                              aria-label="Guardar precio"
                            >
                              <Save className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPriceId(null)}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-slate-800 text-slate-200"
                              aria-label="Cancelar edición de precio"
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceId(p.id);
                              setPriceDraft(String(p.price));
                            }}
                            className="font-bold text-white hover:text-amber-400 inline-flex items-center gap-1.5 py-1.5"
                            aria-label={`Editar precio de ${p.name}`}
                          >
                            <span>{formatPrice(p.price)}</span>
                            <Edit className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateStock(p.id, { inStock: !p.inStock })}
                            className={`px-2.5 py-1.5 min-h-[36px] rounded-md text-[11px] font-bold ${
                              p.inStock
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
                            }`}
                          >
                            {p.inStock ? 'Activo' : 'Sin stock'}
                          </button>
                          <label htmlFor={`stock-qty-${p.id}`} className="sr-only">
                            Stock numérico de {p.name}
                          </label>
                          <input
                            id={`stock-qty-${p.id}`}
                            type="number"
                            min={0}
                            value={p.stockQuantity}
                            onChange={(e) =>
                              onUpdateStock(p.id, {
                                stockQuantity: Math.max(0, Number(e.target.value || 0)),
                              })
                            }
                            className="w-16 px-2 py-1.5 min-h-[36px] rounded-lg bg-slate-950 border border-slate-700 text-white text-xs text-center"
                          />
                          {isLow && <AlertTriangle className="w-4 h-4 text-amber-400" aria-label="Stock bajo" />}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="px-3 py-2 min-h-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar "${p.name}" del catálogo?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg bg-rose-950/70 hover:bg-rose-900/70 text-rose-200"
                          aria-label={`Eliminar ${p.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > pageSize && (
          <div className="p-4 text-center border-t border-slate-800">
            <button
              type="button"
              onClick={() => setPageSize((s) => s + 30)}
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold"
            >
              Mostrar 30 más ({filtered.length - pageSize} restantes)
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 id="product-modal-title" className="text-lg font-extrabold text-white">
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar ventana"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="prod-name" className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    id="prod-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="prod-sku" className="block text-xs font-semibold text-slate-300 mb-1">
                    SKU / Código
                  </label>
                  <input
                    id="prod-sku"
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prod-brand" className="block text-xs font-semibold text-slate-300 mb-1">
                    Marca
                  </label>
                  <input
                    id="prod-brand"
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="prod-category" className="block text-xs font-semibold text-slate-300 mb-1">
                    Rubro
                  </label>
                  <select
                    id="prod-category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prod-unit" className="block text-xs font-semibold text-slate-300 mb-1">
                    Unidad
                  </label>
                  <select
                    id="prod-unit"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    {['unidad', 'metro', 'kg', 'litro', 'caja', 'pack', 'carga'].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prod-price" className="block text-xs font-semibold text-slate-300 mb-1">
                    Precio Base ($)
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={form.priceOnRequest}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="prod-stock" className="block text-xs font-semibold text-slate-300 mb-1">
                    Cantidad en Stock
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    min={0}
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="prod-alert" className="block text-xs font-semibold text-slate-300 mb-1">
                    Alerta Stock Bajo
                  </label>
                  <input
                    id="prod-alert"
                    type="number"
                    min={0}
                    value={form.minStockAlert}
                    onChange={(e) => setForm({ ...form, minStockAlert: Number(e.target.value) })}
                    className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prod-desc" className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  id="prod-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              {/* Imagen del producto + Cloudinary */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" aria-hidden="true" />
                    <span>Imagen del Producto (Cloudinary o URL)</span>
                  </span>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, image: '' }));
                        setUploadHint('');
                      }}
                      className="text-xs text-rose-300 hover:text-rose-200 font-semibold px-2 py-1"
                    >
                      Usar imagen del rubro
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <img
                    src={form.image || getProductImage({ image: '', category: form.category }, categories)}
                    alt="Vista previa del producto"
                    width={96}
                    height={64}
                    className="w-24 h-16 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <label
                        htmlFor="prod-img-file"
                        className="px-3.5 py-2 min-h-[40px] rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{uploadingImg ? 'Subiendo...' : 'Subir foto'}</span>
                        <input
                          id="prod-img-file"
                          type="file"
                          accept="image/*"
                          disabled={uploadingImg}
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <input
                        id="prod-img-url"
                        type="url"
                        aria-label="URL de imagen del producto"
                        value={form.image || ''}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="https://res.cloudinary.com/... (o vacío para usar ficha del rubro)"
                        className="flex-1 min-w-[200px] px-3 py-2 min-h-[40px] rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-400 text-xs"
                      />
                    </div>
                    {uploadHint && <p className="text-[11px] text-emerald-300 font-semibold">{uploadHint}</p>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span>Disponible para venta</span>
                </label>
                <label className="inline-flex items-center gap-2 min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={form.priceOnRequest}
                    onChange={(e) => setForm({ ...form, priceOnRequest: e.target.checked })}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span>Precio a consultar</span>
                </label>
                <label className="inline-flex items-center gap-2 min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={Boolean(form.featured)}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span>Destacar en Inicio</span>
                </label>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">Medidas / Variantes (opcional)</h4>
                    <p className="text-xs text-slate-400">
                      Ideal para tornillos por pulgada, caños por diámetro o pinturas por litros.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="px-3 py-2 min-h-[40px] rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold"
                  >
                    + Agregar medida
                  </button>
                </div>

                {form.variants.map((v, idx) => (
                  <div key={v.id || idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <input
                      type="text"
                      aria-label={`Medida variante ${idx + 1}`}
                      placeholder="Medida (ej: 63mm x 4m)"
                      value={v.label}
                      onChange={(e) => updateVariantRow(idx, { label: e.target.value })}
                      className="col-span-4 px-2.5 py-1.5 min-h-[38px] rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                    <input
                      type="text"
                      aria-label={`SKU variante ${idx + 1}`}
                      placeholder="SKU"
                      value={v.sku || ''}
                      onChange={(e) => updateVariantRow(idx, { sku: e.target.value })}
                      className="col-span-3 px-2.5 py-1.5 min-h-[38px] rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                    <input
                      type="number"
                      aria-label={`Precio variante ${idx + 1}`}
                      placeholder="Precio"
                      value={v.price}
                      onChange={(e) => updateVariantRow(idx, { price: Number(e.target.value) })}
                      className="col-span-2 px-2.5 py-1.5 min-h-[38px] rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                    <input
                      type="number"
                      aria-label={`Stock variante ${idx + 1}`}
                      placeholder="Stock"
                      value={v.stockQuantity}
                      onChange={(e) => {
                        const sq = Math.max(0, Number(e.target.value));
                        updateVariantRow(idx, { stockQuantity: sq, inStock: sq > 0 });
                      }}
                      className="col-span-2 px-2.5 py-1.5 min-h-[38px] rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="col-span-1 min-h-[38px] text-rose-300 hover:text-rose-200 flex items-center justify-center"
                      aria-label={`Quitar variante ${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 text-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {saving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
