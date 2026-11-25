if (!globalThis.WebSocket) {
  globalThis.WebSocket = class DummyWebSocket {};
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function loadEnvFiles() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = await fs.readFile(path.join(ROOT_DIR, file), 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          const val = values.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val.trim();
          }
        }
      }
    } catch {}
  }
}

async function runSeed() {
  await loadEnvFiles();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env o .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const runtimePath = path.join(ROOT_DIR, '.data', 'store.json');
  const fallbackPath = path.join(ROOT_DIR, 'data', 'store.json');
  const raw = await fs.readFile(runtimePath, 'utf-8').catch(() => fs.readFile(fallbackPath, 'utf-8'));
  const storeData = JSON.parse(raw);

  const products = (storeData.products || []).map((p) => ({
    id: p.id,
    sku: p.sku || '',
    name: p.name,
    brand: p.brand || '',
    category: p.category,
    description: p.description || '',
    unit: p.unit || 'unidad',
    price: Number(p.price || 0),
    price_on_request: Boolean(p.priceOnRequest),
    in_stock: p.inStock !== false,
    stock_quantity: Number(p.stockQuantity ?? 0),
    min_stock_alert: Number(p.minStockAlert ?? 3),
    variants: Array.isArray(p.variants) ? p.variants : [],
    image: p.image || null,
    featured: Boolean(p.featured),
  }));

  const { error: prodErr } = await supabase.from('products').upsert(products, { onConflict: 'id' });
  if (prodErr) {
    console.error('Error migrando productos:', prodErr.message);
    process.exit(1);
  }
  console.log(`[OK] ${products.length} productos sincronizados en Supabase.`);

  if (storeData.settings) {
    const { error: setErr } = await supabase.from('store_settings').upsert(
      {
        id: 'default',
        whatsapp_number: storeData.settings.whatsappNumber || '5491157124625',
        delivery_cost: Number(storeData.settings.deliveryCost ?? 2500),
        free_delivery_threshold: Number(storeData.settings.freeDeliveryThreshold ?? 50000),
        same_day_delivery_cutoff: storeData.settings.sameDayDeliveryCutoff || '17:00',
        is_open_override: storeData.settings.isOpenOverride || 'auto',
        announcement: storeData.settings.announcement || '',
        categories: storeData.settings.categories || [],
      },
      { onConflict: 'id' }
    );
    if (setErr) {
      console.error('Error migrando configuracion:', setErr.message);
    } else {
      console.log('[OK] Configuracion general sincronizada en Supabase.');
    }
  }
}

runSeed().catch((err) => {
  console.error('Error inesperado en seed:', err);
  process.exit(1);
});
