'use client';

import React, { useMemo, useState } from 'react';
import { Upload, Download, TrendingUp, CheckCircle2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { CategoryItem, Product } from '@/lib/types';
import { CSV_TEMPLATE_SAMPLE, parseProductsCsv } from '@/lib/csv';
import { formatPrice } from '@/lib/utils';

interface BulkTabProps {
  products: Product[];
  categories: CategoryItem[];
  onBulkImportCsv: (csvText: string) => Promise<{ created: number; updated: number; errors: string[] }>;
  onBulkPriceUpdate: (payload: {
    percent: number;
    category?: string;
    brand?: string;
    rounding?: 'none' | '10' | '50' | '100';
  }) => Promise<{ updatedCount: number }>;
}

export default function BulkTab({
  products,
  categories,
  onBulkImportCsv,
  onBulkPriceUpdate,
}: BulkTabProps) {
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  const [percent, setPercent] = useState<string>('10');
  const [targetCategory, setTargetCategory] = useState('todos');
  const [targetBrand, setTargetBrand] = useState('todas');
  const [rounding, setRounding] = useState<'none' | '10' | '50' | '100'>('10');
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [priceResult, setPriceResult] = useState('');

  const brands = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => {
      if (p.brand) s.add(p.brand);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'es'));
  }, [products]);

  const parsedPreview = useMemo(() => {
    if (!csvText.trim()) return null;
    return parseProductsCsv(csvText);
  }, [csvText]);

  const affectedProducts = useMemo(() => {
    return products.filter((p) => {
      const catOk = targetCategory === 'todos' || p.category === targetCategory;
      const brandOk = targetBrand === 'todas' || p.brand === targetBrand;
      return catOk && brandOk && !p.priceOnRequest;
    });
  }, [products, targetCategory, targetBrand]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ''));
      setImportResult('');
      setImportError('');
    };
    reader.readAsText(file, 'utf-8');
  }

  function downloadSampleTemplate() {
    const blob = new Blob(['\uFEFF' + CSV_TEMPLATE_SAMPLE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-ferreteria-mica.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleConfirmImport() {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportError('');
    setImportResult('');
    try {
      const res = await onBulkImportCsv(csvText);
      setImportResult(
        `Importación lista: ${res.created} productos nuevos creados, ${res.updated} actualizados por SKU.${
          res.errors.length > 0 ? ` (${res.errors.length} filas con advertencias)` : ''
        }`
      );
      setCsvText('');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al importar CSV');
    } finally {
      setImporting(false);
    }
  }

  async function handleApplyPercentage(e: React.FormEvent) {
    e.preventDefault();
    const pct = Number(percent);
    if (!Number.isFinite(pct) || pct === 0) return;
    setUpdatingPrices(true);
    setPriceResult('');
    try {
      const res = await onBulkPriceUpdate({
        percent: pct,
        category: targetCategory,
        brand: targetBrand,
        rounding,
      });
      setPriceResult(`Se actualizaron ${res.updatedCount} productos (${pct > 0 ? '+' : ''}${pct}%).`);
    } finally {
      setUpdatingPrices(false);
    }
  }

  const sampleProduct = affectedProducts[0];
  const pctNum = Number(percent || 0);
  const sampleNewPrice = sampleProduct
    ? Math.max(0, sampleProduct.price * (1 + pctNum / 100))
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <span>Importar / Exportar Planilla (CSV / Excel)</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Subí un archivo CSV (separado por punto y coma o coma) para cargar productos o actualizar precios por SKU.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href="/api/export/products.csv"
            className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Exportar Catálogo Actual (.csv)</span>
          </a>
          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500/60 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Descargar Plantilla de Ejemplo</span>
          </button>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="csv-file-input"
            className="block p-4 rounded-lg border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/60 text-center transition"
          >
            <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1.5" aria-hidden="true" />
            <span className="text-xs font-bold text-white block">Seleccionar archivo .CSV desde tu PC</span>
            <span className="text-[11px] text-slate-300">Compatible con planillas exportadas de Excel</span>
            <input id="csv-file-input" type="file" accept=".csv,.txt" onChange={handleFileChange} className="sr-only" />
          </label>

          <div>
            <label htmlFor="csv-textarea" className="block text-xs font-semibold text-slate-300 mb-1">
              O pegá directamente las filas CSV aquí:
            </label>
            <textarea
              id="csv-textarea"
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="sku;nombre;marca;rubro;unidad;precio;a_consultar;stock_disponible;cantidad_stock..."
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-400 font-mono text-xs"
            />
          </div>
        </div>

        {parsedPreview && (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <p className="text-xs font-bold text-amber-400">
              Vista previa: {parsedPreview.rows.length} productos listos para procesar
            </p>
            {parsedPreview.errors.length > 0 && (
              <div role="alert" className="text-xs text-rose-300 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{parsedPreview.errors.slice(0, 3).join(' | ')}</span>
              </div>
            )}
            <div className="max-h-36 overflow-y-auto text-xs space-y-1">
              {parsedPreview.rows.slice(0, 6).map((r, i) => (
                <div key={i} className="flex justify-between text-slate-300 border-b border-slate-800/60 pb-1">
                  <span>
                    <strong className="text-white">{r.sku}</strong> · {r.name}
                  </span>
                  <span className="font-bold text-amber-300">{formatPrice(r.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {importResult && (
          <div role="status" className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{importResult}</span>
          </div>
        )}

        {importError && (
          <div role="alert" className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-bold">
            {importError}
          </div>
        )}

        <button
          type="button"
          disabled={!csvText.trim() || importing}
          onClick={handleConfirmImport}
          className="w-full min-h-[44px] py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm transition"
        >
          {importing ? 'Importando catálogo...' : 'Confirmar e Importar al Catálogo'}
        </button>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <span>Aumento / Ajuste Porcentual Masivo</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Actualizá precios de todo un rubro, una marca específica o el catálogo entero en un clic (incluye variantes).
          </p>
        </div>

        <form onSubmit={handleApplyPercentage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="bulk-cat" className="block text-xs font-semibold text-slate-300 mb-1">
                Rubro objetivo
              </label>
              <select
                id="bulk-cat"
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
              >
                <option value="todos">Todos los rubros</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bulk-brand" className="block text-xs font-semibold text-slate-300 mb-1">
                Marca objetivo
              </label>
              <select
                id="bulk-brand"
                value={targetBrand}
                onChange={(e) => setTargetBrand(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
              >
                <option value="todas">Todas las marcas</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="bulk-percent" className="block text-xs font-semibold text-slate-300 mb-1">
                Porcentaje (% positivo sube, negativo baja)
              </label>
              <input
                id="bulk-percent"
                type="number"
                step="0.5"
                required
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-bold"
              />
            </div>
            <div>
              <label htmlFor="bulk-rounding" className="block text-xs font-semibold text-slate-300 mb-1">
                Redondeo
              </label>
              <select
                id="bulk-rounding"
                value={rounding}
                onChange={(e) => setRounding(e.target.value as 'none' | '10' | '50' | '100')}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
              >
                <option value="none">Exacto (sin redondeo)</option>
                <option value="10">Múltiplo de $10</option>
                <option value="50">Múltiplo de $50</option>
                <option value="100">Múltiplo de $100</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-1.5 text-xs">
            <p className="text-slate-200">
              Se modificarán <strong className="text-amber-400">{affectedProducts.length}</strong> productos con precio fijo (los marcados como a consultar no se modifican).
            </p>
            {sampleProduct && (
              <p className="text-slate-300">
                Ejemplo (<span className="text-white">{sampleProduct.name}</span>): {formatPrice(sampleProduct.price)} a{' '}
                <strong className="text-emerald-300">{formatPrice(sampleNewPrice)}</strong>
              </p>
            )}
          </div>

          {priceResult && (
            <div role="status" className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{priceResult}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={updatingPrices || affectedProducts.length === 0}
            className="w-full min-h-[44px] py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm transition"
          >
            {updatingPrices ? 'Aplicando ajuste...' : `Aplicar ${pctNum > 0 ? '+' : ''}${pctNum}% a ${affectedProducts.length} productos`}
          </button>
        </form>
      </section>
    </div>
  );
}
