# Diseño: Sistema de Catálogo Online, Carrito WhatsApp y Backend de Comandas — Ferretería Mica

**Fecha:** 2026-11-25  
**Proyecto:** `/home/y/Escritorio/ferreteria/ferreteria-mica`  
**Referencia arquitectónica:** Heladería Brissari (`/home/y/Escritorio/brissari`)

---

## 1. Propósito y Alcance
Transformar el sitio estático actual de **Ferretería Mica** (Av. San Martín 2652, Quilmes Oeste) en una aplicación web completa con catálogo online con precios, variantes, control de stock, carrito de compras con envío de pedido por WhatsApp, y backend REST propio con panel `/admin` para gestionar productos, precios masivos y comandas.

### Objetivos
- Mantener la identidad visual oscura (`#020617` / `#0f172a`) con acentos ámbar (`#f59e0b`) y esmeralda, junto con la información comercial real del local (horarios, mapa, +25 años de trayectoria, WhatsApp `+5491157124625`).
- Soportar un catálogo grande de ferretería (cientos/miles de artículos) mediante búsqueda instantánea (nombre, marca, SKU), filtros por rubro/marca/stock, paginación progresiva y variantes agrupadas por producto (medidas, litros, pulgadas, etc.).
- Permitir al cliente armar un carrito y enviar el pedido/cotización por WhatsApp registrando simultáneamente la **comanda** en el backend.
- Brindar un panel `/admin` protegido para ver y actualizar estados de comandas, imprimir tickets de mostrador, gestionar stock/precios individuales, importar/exportar planillas CSV compatibles con Excel y aplicar aumentos porcentuales masivos por rubro o marca.

### Restricciones y Decisiones de Arquitectura
- **Opción elegida:** Arquitectura desacoplada idéntica a Brissari:
  - **Storefront + Admin UI:** Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS v4) con `rewrites` de `/api/*` hacia `BACKEND_URL` (por defecto `http://127.0.0.1:4000` en local).
  - **Backend REST API:** `backend/server.mjs` en Node.js puro sin dependencias externas (`node:http`, `node:crypto`, `node:fs/promises`), autenticación por token HMAC-SHA256 con `crypto.timingSafeEqual`, cookie `HttpOnly` + header `Bearer`, y rate limiting por IP.
  - **Persistencia Dual:** Supabase PostgreSQL (`supabase/schema.sql`) cuando están configuradas las credenciales (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`), con fallback automático a JSON local (`.data/store.json` y semilla inicial `data/store.json`) para funcionar 100% offline/local.
  - **Pasarela Admin y Producción:** `scripts/admin-server.mjs` (puerto `3001` que redirige `/` a `/admin` y proxéa `/api/*` al puerto `4000`) y `scripts/start-production.mjs`, además de `scripts/seed-supabase.mjs`.

---

## 2. Modelo de Datos
### Categorías / Rubros iniciales
1. `herramientas` — Herramientas
2. `construccion` — Materiales de Construcción
3. `buloneria` — Bulonería y Tornillería
4. `gases` — Oxígeno y Nitrógeno
5. `sanitarios` — Sanitarios y Plomería
6. `pinturas` — Pinturas y Membranas
7. `electricidad` — Materiales Eléctricos
8. `herrajes` — Herrajes y Accesorios
9. `jardineria` — Jardinería y Riego

### Producto (`Product`)
- `id`: string único
- `sku`: string (código interno o de proveedor, usado como clave de upsert en importación CSV)
- `name`: string
- `brand`: string
- `category`: string (id del rubro)
- `description`: string
- `unit`: `'unidad' | 'metro' | 'kg' | 'litro' | 'caja' | 'pack' | 'carga'`
- `price`: number (`>= 0`)
- `priceOnRequest`: boolean (`true` para ítems con precio "A consultar", ej. cargas especiales)
- `inStock`: boolean
- `stockQuantity`: number (`>= 0`)
- `minStockAlert`: number (umbral para alerta visual en `/admin`)
- `variants`: `ProductVariant[]` (`id`, `label`, `sku?`, `price`, `stockQuantity`, `inStock`)
- `image`: string (opcional; fallback automático a la imagen del rubro en `/img/...`)
- `featured`: boolean
- `updatedAt`: ISO string

### Comanda (`Order`)
- `id`: string (`FM-XXXXX-YYYY`)
- `createdAt`: ISO string
- `customerName`: string
- `customerPhone`: string
- `orderType`: `'delivery' | 'takeaway'`
- `deliveryAddress`: string
- `deliveryNotes`: string
- `paymentMethod`: `'efectivo' | 'debito' | 'transferencia'`
- `items`: `CartItem[]` (incluyendo `variantId`, `variantLabel`, `sku`, `unit`, `priceOnRequest`)
- `subtotal`: number
- `deliveryCost`: number (0 si retiro en local o si supera `freeDeliveryThreshold`)
- `total`: number
- `hasConsultItems`: boolean
- `status`: `'pendiente' | 'confirmado' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado'`
- `whatsappMessage`: string

### Configuración (`StoreSettings`)
- `whatsappNumber`: `'5491157124625'`
- `deliveryCost`: number (ej. `2500`)
- `freeDeliveryThreshold`: number (ej. `50000`, `0` para desactivar)
- `sameDayDeliveryCutoff`: string (ej. `'17:00'`)
- `isOpenOverride`: `'auto' | 'open' | 'closed'`
- `announcement`: string
- `categories`: `CategoryItem[]`

---

## 3. Endpoints REST (`backend/server.mjs`)
- `GET /api/health`
- `GET / POST / DELETE /api/admin/auth`
- `POST /api/admin/change-password`
- `GET / POST / PUT / DELETE /api/products`
- `POST /api/products/bulk-import` (CSV/JSON upsert por `sku` o `id`)
- `POST /api/products/bulk-price-update` (ajuste `%` por rubro, marca o todo el catálogo con redondeo)
- `GET /api/export/products.csv` (descarga CSV UTF-8 con `;`)
- `PUT /api/stock`
- `GET / POST /api/pedidos` y `PUT /api/pedidos/:id`
- `GET / PUT /api/settings`
