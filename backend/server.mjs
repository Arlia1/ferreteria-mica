import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseProductsCsv, serializeProductsCsv, slugifyText } from '../lib/csv-core.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const fullPath = path.join(ROOT_DIR, file);
      if (!fsSync.existsSync(fullPath)) continue;
      const content = fsSync.readFileSync(fullPath, 'utf-8');
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
loadEnv();

const AUTH_COOKIE_NAME = 'mica_admin_token';
const VALID_ORDER_STATUSES = new Set([
  'pendiente',
  'confirmado',
  'en_preparacion',
  'en_camino',
  'entregado',
  'cancelado',
]);

function getAuthSecret() {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  return 'ferreteria-mica-secret-key-2026';
}

function getMasterCredentials() {
  return {
    user: (process.env.ADMIN_USER || 'admin').trim().toLowerCase(),
    pass: process.env.ADMIN_PASSWORD || 'mica2026',
  };
}

function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return Boolean(url && key && !url.includes('tu-proyecto'));
}

async function supabaseFetch(endpoint, options = {}) {
  const base = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return fetch(`${base}/rest/v1${endpoint}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
}

function formatPriceAR(amount) {
  const num = Number(amount || 0);
  return `$ ${num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatComandaTime(date) {
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function formatComandaDate(date) {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

export function generateBackendComanda(order) {
  const now = order.createdAt ? new Date(order.createdAt) : new Date();
  const paymentLabels = {
    efectivo: 'EFECTIVO',
    debito: 'TARJETA DE DEBITO',
    transferencia: 'TRANSFERENCIA BANCARIA',
  };

  let msg = `FERRETERIA MICA - QUILMES OESTE\n`;
  msg += `COMANDA #${order.id}\n\n`;
  msg += `FECHA: ${formatComandaDate(now)} - HORA: ${formatComandaTime(now)} hs\n`;
  msg += `MODALIDAD: ${order.orderType === 'delivery' ? 'ENVIO EN EL DIA' : 'RETIRO EN LOCAL (Av. San Martin 2652)'}\n\n`;
  msg += `CLIENTE: ${order.customerName}\n`;
  msg += `TELEFONO: ${order.customerPhone}\n`;
  if (order.orderType === 'delivery') {
    msg += `DIRECCION: ${order.deliveryAddress || 'A coordinar'}\n`;
    if (order.deliveryNotes) msg += `INDICACIONES: ${order.deliveryNotes}\n`;
  }
  msg += `MEDIO DE PAGO: ${paymentLabels[order.paymentMethod] || String(order.paymentMethod || '').toUpperCase()}\n\n`;
  msg += `DETALLE DE PRODUCTOS\n`;

  for (let i = 0; i < (order.items || []).length; i++) {
    const it = order.items[i];
    const qty = Number(it.quantity || 1);
    const variantTxt = it.variantLabel ? ` [${it.variantLabel}]` : '';
    const skuTxt = it.sku ? ` (SKU: ${it.sku})` : '';
    const priceTxt = it.priceOnRequest
      ? 'A CONSULTAR'
      : formatPriceAR(Number(it.price || 0) * qty);
    msg += `- ${i + 1}. ${it.name || it.title}${variantTxt}${skuTxt} x${qty} (${it.unit || 'unidad'}) -> ${priceTxt}\n`;
    if (it.notes) msg += `  OBS: ${it.notes}\n`;
  }

  msg += `\nSUBTOTAL: ${formatPriceAR(order.subtotal)}\n`;
  if (order.orderType === 'delivery') {
    msg += `ENVIO: ${Number(order.deliveryCost || 0) === 0 ? 'SIN CARGO' : formatPriceAR(order.deliveryCost)}\n`;
  }
  msg += `TOTAL${order.hasConsultItems ? ' (PARCIAL + ITEMS A CONSULTAR)' : ''}: ${formatPriceAR(order.total)}\n`;
  return msg;
}

function roundPrice(value, roundingMode = 'none') {
  const num = Math.max(0, Number(value || 0));
  if (roundingMode === '10') return Math.round(num / 10) * 10;
  if (roundingMode === '50') return Math.round(num / 50) * 50;
  if (roundingMode === '100') return Math.round(num / 100) * 100;
  return Math.round(num * 100) / 100;
}

function normalizeProductInput(raw, existing = null) {
  const variants = Array.isArray(raw.variants)
    ? raw.variants
        .filter((v) => v && (v.label || v.id))
        .map((v, idx) => {
          const sq = Math.max(0, Math.round(Number(v.stockQuantity ?? 0)));
          const inStk = v.inStock !== undefined ? Boolean(v.inStock) : sq > 0;
          return {
            id: v.id || slugifyText(v.label) || `var-${idx + 1}`,
            label: String(v.label || `Opción ${idx + 1}`).trim(),
            sku: String(v.sku || '').trim(),
            price: Math.max(0, Number(v.price || 0)),
            stockQuantity: sq,
            inStock: inStk,
          };
        })
    : existing?.variants || [];

  const name = String(raw.name ?? existing?.name ?? '').trim();
  const baseStockQty =
    raw.stockQuantity !== undefined
      ? Math.max(0, Math.round(Number(raw.stockQuantity)))
      : variants.length > 0
      ? variants.reduce((sum, v) => sum + Number(v.stockQuantity || 0), 0)
      : Number(existing?.stockQuantity ?? 10);

  const inStock =
    raw.inStock !== undefined
      ? Boolean(raw.inStock)
      : variants.length > 0
      ? variants.some((v) => v.inStock)
      : baseStockQty > 0;

  const basePrice =
    raw.price !== undefined
      ? Math.max(0, Number(raw.price))
      : variants.length > 0
      ? Number(variants[0].price || 0)
      : Number(existing?.price ?? 0);

  const id =
    raw.id ||
    existing?.id ||
    `prod-${slugifyText(raw.sku || name).slice(0, 18)}-${crypto.randomBytes(2).toString('hex')}`;

  return {
    id,
    sku: String(raw.sku ?? existing?.sku ?? id.toUpperCase()).trim(),
    name,
    brand: String(raw.brand ?? existing?.brand ?? 'Genérico').trim(),
    category: slugifyText(raw.category ?? existing?.category ?? 'herramientas') || 'herramientas',
    description: String(raw.description ?? existing?.description ?? '').trim(),
    unit: String(raw.unit ?? existing?.unit ?? 'unidad').trim().toLowerCase() || 'unidad',
    price: basePrice,
    priceOnRequest: raw.priceOnRequest !== undefined ? Boolean(raw.priceOnRequest) : Boolean(existing?.priceOnRequest),
    inStock,
    stockQuantity: baseStockQty,
    minStockAlert: Math.max(0, Math.round(Number(raw.minStockAlert ?? existing?.minStockAlert ?? 3))),
    variants,
    image: String(raw.image ?? existing?.image ?? '').trim() || undefined,
    featured: raw.featured !== undefined ? Boolean(raw.featured) : Boolean(existing?.featured),
    updatedAt: new Date().toISOString(),
  };
}

function mapProductToSupabase(p) {
  return {
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
  };
}

export function createBackendApp(options = {}) {
  const dataFile = options.dataFile || path.join(ROOT_DIR, '.data', 'store.json');
  const fallbackDataFile = options.fallbackDataFile || path.join(ROOT_DIR, 'data', 'store.json');
  const useSupabase = options.disableSupabase ? false : isSupabaseConfigured();
  const authSecret = options.authSecret || getAuthSecret();

  let db = null;
  let customPasswords = {};
  const rateLimitMap = new Map();

  function isRateLimited(key, maxRequests, windowMs) {
    const now = Date.now();
    if (rateLimitMap.size > 5000) rateLimitMap.clear();
    const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + windowMs;
      rateLimitMap.set(key, entry);
      return false;
    }
    entry.count += 1;
    rateLimitMap.set(key, entry);
    return entry.count > maxRequests;
  }

  function extractClientIp(req) {
    const remote = req.socket?.remoteAddress || '127.0.0.1';
    const xff = req.headers['x-forwarded-for'];
    if ((remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1') && typeof xff === 'string') {
      return xff.split(',')[0].trim() || remote;
    }
    return remote;
  }

  function checkCredentials(username, password) {
    const { user, pass } = getMasterCredentials();
    const cleanUser = String(username || '').trim().toLowerCase();
    const expectedPass = customPasswords[cleanUser] || (cleanUser === user ? pass : '');
    if (!expectedPass || cleanUser !== user) return false;

    const uA = crypto.createHash('sha256').update(cleanUser).digest();
    const uB = crypto.createHash('sha256').update(user).digest();
    const pA = crypto.createHash('sha256').update(String(password || '')).digest();
    const pB = crypto.createHash('sha256').update(String(expectedPass)).digest();
    return crypto.timingSafeEqual(uA, uB) && crypto.timingSafeEqual(pA, pB);
  }

  function signToken(username) {
    const payload = `${username}:${Date.now()}`;
    const hmac = crypto.createHmac('sha256', authSecret).update(payload).digest('hex');
    return Buffer.from(`${payload}:${hmac}`).toString('base64');
  }

  function verifyToken(token) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      if (parts.length < 3) return null;
      const [username, timestampStr, hmac] = parts;
      const payload = `${username}:${timestampStr}`;
      const expected = crypto.createHmac('sha256', authSecret).update(payload).digest('hex');
      const a = Buffer.from(hmac);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
      const ts = parseInt(timestampStr, 10);
      if (!Number.isFinite(ts) || Date.now() - ts > 7 * 24 * 60 * 60 * 1000) return null;
      const { user } = getMasterCredentials();
      return username === user ? username : null;
    } catch {
      return null;
    }
  }

  function parseCookies(req) {
    const list = {};
    const rc = req.headers.cookie;
    if (!rc) return list;
    for (const part of rc.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      list[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
    return list;
  }

  function checkAuth(req) {
    const cookies = parseCookies(req);
    const cookieToken = cookies[AUTH_COOKIE_NAME];
    if (cookieToken) {
      const u = verifyToken(cookieToken);
      if (u) return u;
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const u = verifyToken(authHeader.slice(7).trim());
      if (u) return u;
    }
    return null;
  }

  async function saveDb() {
    if (!db) return;
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(db, null, 2), 'utf-8');
  }

  async function loadDb() {
    if (db) {
      if (db.customPasswords) customPasswords = { ...db.customPasswords };
      return db;
    }

    if (useSupabase) {
      try {
        const [prodsRes, ordersRes, settingsRes] = await Promise.all([
          supabaseFetch('/products?select=*&order=created_at.desc'),
          supabaseFetch('/orders?select=*&order=created_at.desc'),
          supabaseFetch('/store_settings?id=eq.default&select=*'),
        ]);

        if (prodsRes.ok) {
          const rawProds = await prodsRes.json();
          const rawOrders = ordersRes.ok ? await ordersRes.json() : [];
          const rawSettings = settingsRes.ok ? await settingsRes.json() : [];

          const products = rawProds.map((p) => ({
            id: p.id,
            sku: p.sku || '',
            name: p.name,
            brand: p.brand || '',
            category: p.category,
            description: p.description || '',
            unit: p.unit || 'unidad',
            price: Number(p.price || 0),
            priceOnRequest: Boolean(p.price_on_request),
            inStock: p.in_stock !== false,
            stockQuantity: Number(p.stock_quantity ?? 0),
            minStockAlert: Number(p.min_stock_alert ?? 3),
            variants: Array.isArray(p.variants) ? p.variants : [],
            image: p.image || undefined,
            featured: Boolean(p.featured),
            updatedAt: p.updated_at || new Date().toISOString(),
          }));

          const orders = rawOrders.map((o) => ({
            id: o.id,
            createdAt: o.created_at,
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            orderType: o.order_type,
            deliveryAddress: o.delivery_address || '',
            deliveryNotes: o.delivery_notes || '',
            paymentMethod: o.payment_method,
            items: Array.isArray(o.items) ? o.items : [],
            subtotal: Number(o.subtotal || 0),
            deliveryCost: Number(o.delivery_cost || 0),
            total: Number(o.total || 0),
            hasConsultItems: Boolean(o.has_consult_items),
            status: o.status || 'pendiente',
            whatsappMessage: o.whatsapp_message || '',
          }));

          const s = rawSettings[0] || {};
          if (s.custom_passwords && typeof s.custom_passwords === 'object') {
            customPasswords = { ...s.custom_passwords };
          }

          const fallbackRaw = await fs.readFile(fallbackDataFile, 'utf-8').catch(() => '{}');
          const fallbackParsed = JSON.parse(fallbackRaw || '{}');

          db = {
            products: products.length > 0 ? products : fallbackParsed.products || [],
            orders,
            settings: {
              whatsappNumber: s.whatsapp_number || fallbackParsed.settings?.whatsappNumber || '5491157124625',
              deliveryCost: Number(s.delivery_cost ?? fallbackParsed.settings?.deliveryCost ?? 2500),
              freeDeliveryThreshold: Number(s.free_delivery_threshold ?? fallbackParsed.settings?.freeDeliveryThreshold ?? 65000),
              sameDayDeliveryCutoff: s.same_day_delivery_cutoff || '17:00',
              isOpenOverride: s.is_open_override || 'auto',
              announcement: s.announcement || fallbackParsed.settings?.announcement || '',
              categories:
                Array.isArray(s.categories) && s.categories.length > 0
                  ? s.categories
                  : fallbackParsed.settings?.categories || [],
            },
            customPasswords,
          };
          await saveDb();
          return db;
        }
      } catch (err) {
        console.warn('[Backend] Error conectando con Supabase, usando JSON local:', err.message);
      }
    }

    try {
      const raw = await fs.readFile(dataFile, 'utf-8');
      db = JSON.parse(raw);
    } catch {
      const fallbackRaw = await fs.readFile(fallbackDataFile, 'utf-8');
      db = JSON.parse(fallbackRaw);
      await saveDb();
    }

    if (!Array.isArray(db.products)) db.products = [];
    if (!Array.isArray(db.orders)) db.orders = [];
    if (!db.settings) db.settings = {};
    if (!db.customPasswords) db.customPasswords = {};
    customPasswords = { ...db.customPasswords };
    return db;
  }

  function sendJson(res, status, data, extraHeaders = {}) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    });
    res.end(JSON.stringify(data));
  }

  async function readBody(req, maxBytes = 5 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxBytes) {
          reject(new Error('Payload demasiado grande'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        if (!raw) return resolve({});
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve({ raw });
        }
      });
      req.on('error', reject);
    });
  }

  function applyCors(req, res) {
    const origin = req.headers.origin;
    const allowedEnv = (process.env.FRONTEND_URL || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const isLocal = origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (origin && (isLocal || allowedEnv.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Vary', 'Origin');
    }
  }

  const server = http.createServer(async (req, res) => {
    try {
      applyCors(req, res);
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const urlObj = new URL(req.url || '/', 'http://localhost');
      const pathname = urlObj.pathname;
      const method = req.method || 'GET';
      const database = await loadDb();

      // Health check endpoint
      if (pathname === '/api/health' && method === 'GET') {
        return sendJson(res, 200, {
          ok: true,
          service: 'ferreteria-mica-backend',
          storage: useSupabase ? 'supabase+json' : 'json-local',
          productsCount: database.products.length,
          ordersCount: database.orders.length,
        });
      }

      // Session authentication via HMAC cookie and Bearer token
      if (pathname === '/api/admin/auth') {
        if (method === 'GET') {
          const user = checkAuth(req);
          if (!user) return sendJson(res, 401, { authenticated: false });
          return sendJson(res, 200, { authenticated: true, user });
        }

        if (method === 'POST') {
          const ip = extractClientIp(req);
          if (isRateLimited(`login:${ip}`, 15, 60 * 1000)) {
            return sendJson(res, 429, { error: 'Demasiados intentos de ingreso. Esperá un minuto.' });
          }
          const body = await readBody(req);
          const username = String(body.username || 'admin').trim().toLowerCase();
          const password = String(body.password || '');
          if (!checkCredentials(username, password)) {
            return sendJson(res, 401, { error: 'Usuario o contraseña incorrectos' });
          }
          const token = signToken(username);
          const isProd = process.env.NODE_ENV === 'production';
          const cookieParts = [
            `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
            'HttpOnly',
            'Path=/',
            'SameSite=Lax',
            `Max-Age=${7 * 24 * 60 * 60}`,
          ];
          if (isProd) cookieParts.push('Secure');
          return sendJson(
            res,
            200,
            { authenticated: true, user: username, token },
            { 'Set-Cookie': cookieParts.join('; ') }
          );
        }

        if (method === 'DELETE') {
          return sendJson(
            res,
            200,
            { authenticated: false },
            { 'Set-Cookie': `${AUTH_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0` }
          );
        }
      }

      // Password rotation for authenticated admin
      if (pathname === '/api/admin/change-password' && method === 'POST') {
        const authedUser = checkAuth(req);
        if (!authedUser) return sendJson(res, 401, { error: 'No autorizado' });
        const body = await readBody(req);
        const { currentPassword, newPassword } = body;
        if (!checkCredentials(authedUser, currentPassword)) {
          return sendJson(res, 400, { error: 'La contraseña actual no es correcta' });
        }
        if (!newPassword || String(newPassword).length < 6) {
          return sendJson(res, 400, { error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }
        customPasswords[authedUser] = String(newPassword);
        database.customPasswords = { ...customPasswords };
        await saveDb();

        if (useSupabase) {
          supabaseFetch('/store_settings?id=eq.default', {
            method: 'PATCH',
            body: JSON.stringify({ custom_passwords: database.customPasswords }),
          }).catch(() => {});
        }
        return sendJson(res, 200, { success: true });
      }

      // Catalog CSV export with UTF-8 BOM for Excel compatibility
      if (pathname === '/api/export/products.csv' && method === 'GET') {
        const csv = serializeProductsCsv(database.products, ';');
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="ferreteria-mica-catalogo.csv"',
        });
        res.end(csv);
        return;
      }

      // Bulk CSV/JSON upsert keyed by SKU or product id
      if (pathname === '/api/products/bulk-import' && method === 'POST') {
        if (!checkAuth(req)) return sendJson(res, 401, { error: 'No autorizado' });
        const body = await readBody(req, 10 * 1024 * 1024);

        let parsedRows = [];
        let errors = [];

        if (typeof body.csvText === 'string') {
          const parsed = parseProductsCsv(body.csvText);
          parsedRows = parsed.rows;
          errors = parsed.errors;
        } else if (Array.isArray(body.rows)) {
          parsedRows = body.rows;
        } else {
          return sendJson(res, 400, { error: 'Debe enviar csvText o rows' });
        }

        if (parsedRows.length === 0) {
          return sendJson(res, 400, { error: errors[0] || 'No se encontraron filas válidas para importar', errors });
        }

        let created = 0;
        let updated = 0;
        const touchedProducts = [];
        const newCategories = new Map((database.settings.categories || []).map((c) => [c.id, c]));

        for (const row of parsedRows) {
          if (!row.name) continue;
          const cleanSku = String(row.sku || '').trim().toLowerCase();
          const existingIdx = database.products.findIndex(
            (p) =>
              (row.id && p.id === row.id) ||
              (cleanSku && String(p.sku || '').trim().toLowerCase() === cleanSku)
          );

          if (existingIdx >= 0) {
            const updatedProd = normalizeProductInput(row, database.products[existingIdx]);
            database.products[existingIdx] = updatedProd;
            touchedProducts.push(updatedProd);
            updated++;
          } else {
            const newProd = normalizeProductInput(row, null);
            database.products.unshift(newProd);
            touchedProducts.push(newProd);
            created++;
          }

          if (row.category && !newCategories.has(row.category)) {
            const label = row.category.charAt(0).toUpperCase() + row.category.slice(1).replace(/-/g, ' ');
            newCategories.set(row.category, {
              id: row.category,
              name: label,
              description: `Productos de ${label}`,
            });
          }
        }

        database.settings.categories = Array.from(newCategories.values());
        await saveDb();

        if (useSupabase && touchedProducts.length > 0) {
          supabaseFetch('/products', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify(touchedProducts.map(mapProductToSupabase)),
          }).catch((err) => console.warn('[Supabase Bulk Import Warning]', err.message));
        }

        return sendJson(res, 200, {
          success: true,
          created,
          updated,
          errors,
          totalProducts: database.products.length,
          products: database.products,
          categories: database.settings.categories,
        });
      }

      // Percentage price adjustment across category or brand, skipping priceOnRequest items
      if (pathname === '/api/products/bulk-price-update' && method === 'POST') {
        if (!checkAuth(req)) return sendJson(res, 401, { error: 'No autorizado' });
        const body = await readBody(req);
        const percent = Number(body.percent);
        if (!Number.isFinite(percent) || percent <= -100 || percent > 1000) {
          return sendJson(res, 400, { error: 'Porcentaje inválido' });
        }

        const category = body.category && body.category !== 'todos' ? slugifyText(body.category) : null;
        const brand = body.brand && body.brand !== 'todas' ? String(body.brand).trim().toLowerCase() : null;
        const rounding = body.rounding || '10';
        const multiplier = 1 + percent / 100;

        let updatedCount = 0;
        const touched = [];

        database.products = database.products.map((p) => {
          const matchesCategory = !category || p.category === category;
          const matchesBrand = !brand || String(p.brand || '').trim().toLowerCase() === brand;
          if (!matchesCategory || !matchesBrand) return p;

          const updatedVariants = Array.isArray(p.variants)
            ? p.variants.map((v) => ({
                ...v,
                price: p.priceOnRequest ? Number(v.price || 0) : roundPrice(Number(v.price || 0) * multiplier, rounding),
              }))
            : [];

          const nextPrice = p.priceOnRequest
            ? Number(p.price || 0)
            : roundPrice(Number(p.price || 0) * multiplier, rounding);

          updatedCount++;
          const nextProd = {
            ...p,
            price: nextPrice,
            variants: updatedVariants,
            updatedAt: new Date().toISOString(),
          };
          touched.push(nextProd);
          return nextProd;
        });

        await saveDb();

        if (useSupabase && touched.length > 0) {
          supabaseFetch('/products', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates' },
            body: JSON.stringify(touched.map(mapProductToSupabase)),
          }).catch(() => {});
        }

        return sendJson(res, 200, {
          success: true,
          updatedCount,
          products: database.products,
        });
      }

      // Catalog CRUD
      if (pathname === '/api/products') {
        if (method === 'GET') {
          const q = (urlObj.searchParams.get('q') || '').trim().toLowerCase();
          const cat = (urlObj.searchParams.get('category') || '').trim().toLowerCase();
          const brand = (urlObj.searchParams.get('brand') || '').trim().toLowerCase();
          const onlyStock = urlObj.searchParams.get('inStock') === 'true';

          let items = database.products;
          if (cat && cat !== 'todos') items = items.filter((p) => p.category === cat);
          if (brand && brand !== 'todas') items = items.filter((p) => (p.brand || '').toLowerCase() === brand);
          if (onlyStock) items = items.filter((p) => p.inStock);
          if (q) {
            items = items.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.sku || '').toLowerCase().includes(q) ||
                (p.brand || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
          }

          return sendJson(res, 200, {
            total: items.length,
            products: items,
          });
        }

        if (method === 'POST') {
          if (!checkAuth(req)) return sendJson(res, 401, { error: 'No autorizado' });
          const body = await readBody(req);
          if (!body.name || !String(body.name).trim()) {
            return sendJson(res, 400, { error: 'El nombre del producto es obligatorio' });
          }
          const newProd = normalizeProductInput(body, null);
          database.products.unshift(newProd);
          await saveDb();

          if (useSupabase) {
            supabaseFetch('/products', {
              method: 'POST',
              headers: { Prefer: 'resolution=merge-duplicates' },
              body: JSON.stringify(mapProductToSupabase(newProd)),
            }).catch(() => {});
          }
          return sendJson(res, 201, { success: true, product: newProd });
        }

        if (method === 'PUT') {
          if (!checkAuth(req)) return sendJson(res, 401, { error: 'No autorizado' });
          const body = await readBody(req);
          const idx = database.products.findIndex((p) => p.id === body.id);
          if (idx === -1) return sendJson(res, 404, { error: 'Producto no encontrado' });

          const updated = normalizeProductInput(body, database.products[idx]);
          database.products[idx] = updated;
          await saveDb();

          if (useSupabase) {
            supabaseFetch(`/products?id=eq.${encodeURIComponent(updated.id)}`, {
              method: 'PATCH',
              body: JSON.stringify(mapProductToSupabase(updated)),
            }).catch(() => {});
          }
          return sendJson(res, 200, { success: true, product: updated });
        }

        if (method === 'DELETE') {
          if (!checkAuth(req)) return sendJson(res, 401, { error: 'No autorizado' });
          const id = urlObj.searchParams.get('id');
          if (!id) return sendJson(res, 400, { error: 'Falta id' });
          const before = database.products.length;
          database.products = database.products.filter((p) => p.id !== id);
          if (database.products.length === before) return sendJson(res, 404, { error: 'Producto no encontrado' });
          await saveDb();

          if (useSupabase) {
            supabaseFetch(`/products?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
          }
          return sendJson(res, 200, { success: true });
        }
      }

      // Inline stock update for product or variant
      if (pathname === '/api/stock' && method === 'PUT') {
        if (!checkAuth(req)) return sendJson(res, 401, { error: 'No autorizado' });
        const body = await readBody(req);
        const idx = database.products.findIndex((p) => p.id === body.productId);
        if (idx === -1) return sendJson(res, 404, { error: 'Producto no encontrado' });

        const prod = { ...database.products[idx] };
        if (body.variantId && Array.isArray(prod.variants)) {
          prod.variants = prod.variants.map((v) => {
            if (v.id !== body.variantId) return v;
            const qty = body.stockQuantity !== undefined ? Math.max(0, Math.round(Number(body.stockQuantity))) : v.stockQuantity;
            const inStk = body.inStock !== undefined ? Boolean(body.inStock) : qty > 0;
            return { ...v, stockQuantity: qty, inStock: inStk };
          });
          prod.stockQuantity = prod.variants.reduce((acc, v) => acc + Number(v.stockQuantity || 0), 0);
          prod.inStock = prod.variants.some((v) => v.inStock);
        } else {
          if (body.stockQuantity !== undefined) {
            prod.stockQuantity = Math.max(0, Math.round(Number(body.stockQuantity)));
          }
          prod.inStock = body.inStock !== undefined ? Boolean(body.inStock) : prod.stockQuantity > 0;
        }
        prod.updatedAt = new Date().toISOString();
        database.products[idx] = prod;
        await saveDb();

        if (useSupabase) {
          supabaseFetch(`/products?id=eq.${encodeURIComponent(prod.id)}`, {
            method: 'PATCH',
            body: JSON.stringify(mapProductToSupabase(prod)),
          }).catch(() => {});
        }
        return sendJson(res, 200, { success: true, product: prod });
      }

      // Orders and WhatsApp comandas
      if (pathname === '/api/pedidos') {
        if (method === 'GET') {
          if (!checkAuth(req)) return sendJson(res, 401, { error: 'No autorizado para ver comandas' });
          const statusFilter = urlObj.searchParams.get('status');
          let list = database.orders || [];
          if (statusFilter && statusFilter !== 'todos') {
            list = list.filter((o) => o.status === statusFilter);
          }
          return sendJson(res, 200, { total: list.length, pedidos: list });
        }

        if (method === 'POST') {
          const ip = extractClientIp(req);
          if (isRateLimited(`order:${ip}`, 20, 60 * 1000)) {
            return sendJson(res, 429, { error: 'Demasiados pedidos en poco tiempo. Intentá en un momento.' });
          }

          const body = await readBody(req);
          const customerName = String(body.customerName || '').trim();
          const customerPhone = String(body.customerPhone || '').trim();
          const items = Array.isArray(body.items) ? body.items : [];

          if (!customerName || !customerPhone || items.length === 0) {
            return sendJson(res, 400, { error: 'Completá nombre, teléfono y al menos un producto.' });
          }

          const orderType = body.orderType === 'takeaway' ? 'takeaway' : 'delivery';
          const paymentMethod = ['efectivo', 'debito', 'transferencia'].includes(body.paymentMethod)
            ? body.paymentMethod
            : 'efectivo';

          let subtotal = 0;
          let hasConsultItems = false;

          const resolvedItems = items.map((item) => {
            const qty = Math.max(1, Math.round(Number(item.quantity || 1)));
            const foundProd = database.products.find((p) => p.id === item.productId);
            let unitPrice = Number(item.price || 0);
            let priceOnRequest = Boolean(item.priceOnRequest);
            let variantLabel = item.variantLabel || '';
            let sku = item.sku || '';
            let unit = item.unit || 'unidad';
            let name = item.name || item.title || 'Producto';

            if (foundProd) {
              name = foundProd.name;
              unit = foundProd.unit || 'unidad';
              priceOnRequest = Boolean(foundProd.priceOnRequest);
              sku = foundProd.sku || '';
              if (item.variantId && Array.isArray(foundProd.variants)) {
                const foundVar = foundProd.variants.find((v) => v.id === item.variantId);
                if (foundVar) {
                  unitPrice = Number(foundVar.price || 0);
                  variantLabel = foundVar.label;
                  if (foundVar.sku) sku = foundVar.sku;
                } else {
                  unitPrice = Number(foundProd.price || 0);
                }
              } else {
                unitPrice = Number(foundProd.price || 0);
              }
            }

            if (priceOnRequest) {
              hasConsultItems = true;
              unitPrice = 0;
            } else {
              subtotal += unitPrice * qty;
            }

            return {
              id: item.id || `${item.productId}-${item.variantId || 'base'}`,
              productId: item.productId,
              sku,
              name,
              variantId: item.variantId || undefined,
              variantLabel: variantLabel || undefined,
              unit,
              price: unitPrice,
              priceOnRequest,
              quantity: qty,
              notes: item.notes ? String(item.notes).trim() : undefined,
            };
          });

          const baseDeliveryCost = Number(database.settings?.deliveryCost ?? 2500);
          const freeThreshold = Number(database.settings?.freeDeliveryThreshold ?? 0);
          const deliveryCost =
            orderType === 'delivery'
              ? freeThreshold > 0 && subtotal >= freeThreshold
                ? 0
                : baseDeliveryCost
              : 0;
          const total = subtotal + deliveryCost;

          const orderId =
            body.id ||
            `FM-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

          const newOrder = {
            id: orderId,
            createdAt: new Date().toISOString(),
            customerName,
            customerPhone,
            orderType,
            deliveryAddress: orderType === 'delivery' ? String(body.deliveryAddress || '').trim() : '',
            deliveryNotes: String(body.deliveryNotes || '').trim(),
            paymentMethod,
            items: resolvedItems,
            subtotal,
            deliveryCost,
            total,
            hasConsultItems,
            status: 'pendiente',
            whatsappMessage: '',
          };

          newOrder.whatsappMessage = body.whatsappMessage
            ? String(body.whatsappMessage)
            : generateBackendComanda(newOrder);

          database.orders.unshift(newOrder);
          await saveDb();

          if (useSupabase) {
            supabaseFetch('/orders', {
              method: 'POST',
              headers: { Prefer: 'resolution=merge-duplicates' },
              body: JSON.stringify({
                id: newOrder.id,
                customer_name: newOrder.customerName,
                customer_phone: newOrder.customerPhone,
                order_type: newOrder.orderType,
                delivery_address: newOrder.deliveryAddress,
                delivery_notes: newOrder.deliveryNotes,
                payment_method: newOrder.paymentMethod,
                items: newOrder.items,
                subtotal: newOrder.subtotal,
                delivery_cost: newOrder.deliveryCost,
                total: newOrder.total,
                has_consult_items: newOrder.hasConsultItems,
                status: newOrder.status,
                whatsapp_message: newOrder.whatsappMessage,
              }),
            }).catch((err) => console.warn('[Supabase Order Warning]', err.message));
          }

          return sendJson(res, 200, { success: true, pedido: newOrder });
        }
      }

      const pedidoMatch = pathname.match(/^\/api\/pedidos\/([^/]+)$/);
      if (pedidoMatch && method === 'PUT') {
        if (!checkAuth(req)) return sendJson(res, 401, { error: 'No autorizado' });
        const orderId = decodeURIComponent(pedidoMatch[1]);
        const idx = database.orders.findIndex((o) => o.id === orderId);
        if (idx === -1) return sendJson(res, 404, { error: 'Comanda no encontrada' });

        const body = await readBody(req);
        const patch = {};
        if (body.status !== undefined) {
          if (!VALID_ORDER_STATUSES.has(body.status)) {
            return sendJson(res, 400, { error: 'Estado de comanda inválido' });
          }
          patch.status = body.status;
        }
        if (body.deliveryNotes !== undefined) {
          patch.deliveryNotes = String(body.deliveryNotes);
        }

        database.orders[idx] = { ...database.orders[idx], ...patch };
        await saveDb();

        if (useSupabase) {
          const sbPatch = {};
          if (patch.status !== undefined) sbPatch.status = patch.status;
          if (patch.deliveryNotes !== undefined) sbPatch.delivery_notes = patch.deliveryNotes;
          supabaseFetch(`/orders?id=eq.${encodeURIComponent(orderId)}`, {
            method: 'PATCH',
            body: JSON.stringify(sbPatch),
          }).catch(() => {});
        }

        return sendJson(res, 200, { success: true, pedido: database.orders[idx] });
      }

      // Store configuration and categories
      if (pathname === '/api/settings') {
        if (method === 'GET') {
          return sendJson(res, 200, { settings: database.settings });
        }

        if (method === 'PUT') {
          if (!checkAuth(req)) return sendJson(res, 401, { error: 'No autorizado' });
          const body = await readBody(req);
          const allowed = {};
          if (body.whatsappNumber !== undefined) allowed.whatsappNumber = String(body.whatsappNumber).replace(/\D/g, '');
          if (body.deliveryCost !== undefined) allowed.deliveryCost = Math.max(0, Number(body.deliveryCost));
          if (body.freeDeliveryThreshold !== undefined)
            allowed.freeDeliveryThreshold = Math.max(0, Number(body.freeDeliveryThreshold));
          if (body.sameDayDeliveryCutoff !== undefined)
            allowed.sameDayDeliveryCutoff = String(body.sameDayDeliveryCutoff).trim();
          if (['auto', 'open', 'closed'].includes(body.isOpenOverride))
            allowed.isOpenOverride = body.isOpenOverride;
          if (body.announcement !== undefined) allowed.announcement = String(body.announcement).trim();
          if (Array.isArray(body.categories)) allowed.categories = body.categories;

          database.settings = { ...database.settings, ...allowed };
          await saveDb();

          if (useSupabase) {
            supabaseFetch('/store_settings?id=eq.default', {
              method: 'PATCH',
              body: JSON.stringify({
                whatsapp_number: database.settings.whatsappNumber,
                delivery_cost: database.settings.deliveryCost,
                free_delivery_threshold: database.settings.freeDeliveryThreshold,
                same_day_delivery_cutoff: database.settings.sameDayDeliveryCutoff,
                is_open_override: database.settings.isOpenOverride,
                announcement: database.settings.announcement,
                categories: database.settings.categories,
              }),
            }).catch(() => {});
          }
          return sendJson(res, 200, { success: true, settings: database.settings });
        }
      }

      return sendJson(res, 404, { error: 'Ruta no encontrada' });
    } catch (err) {
      console.error('[Backend Error]:', err);
      return sendJson(res, 500, { error: 'Error interno del servidor' });
    }
  });

  return server;
}

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '4000', 10);
  const server = createBackendApp();
  server.listen(PORT, '0.0.0.0', () => {
    console.log('=======================================================');
    console.log('  FERRETERIA MICA - BACKEND REST API ACTIVO            ');
    console.log(`  Puerto: http://127.0.0.1:${PORT}                     `);
    console.log(`  Persistencia: ${isSupabaseConfigured() ? 'Supabase + JSON local' : 'JSON local (.data/store.json)'}`);
    console.log('=======================================================');
  });
}
