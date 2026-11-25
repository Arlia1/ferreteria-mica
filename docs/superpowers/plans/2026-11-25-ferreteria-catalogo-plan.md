# Plan de Implementación — Catálogo Online y Backend Ferretería Mica

1. **Preparación del proyecto Next.js y activos:**
   - Copiar `img/` y `manifest.json` a `public/`.
   - Limpiar archivos estáticos heredados (`index.html`, `404.html`, `nosotros/index.html`, `servicios/index.html`, `contacto/index.html`, `src/`, `tailwind.config.js`, `robots.txt`, `sitemap.xml`) una vez migrados sus contenidos a Next.js App Router.
   - Configurar `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vercel.json`, `.env.example`, `.gitignore`.
   - Instalar dependencias (`next`, `react`, `react-dom`, `lucide-react`, `@supabase/supabase-js`, `tailwindcss`, `@tailwindcss/postcss`, `typescript`, etc.).

2. **Capa de datos y Backend Node puro:**
   - Crear `supabase/schema.sql` con tablas `products`, `orders`, `store_settings`, triggers y políticas RLS.
   - Crear `data/store.json` con ~50 productos reales de los 9 rubros de Ferretería Mica (incluyendo variantes de bulonería, sanitarios Awaduct, pinturas y membranas, electricidad, herramientas, gases).
   - Implementar `backend/server.mjs` sin dependencias externas con auth HMAC, CRUD productos/variantes, importación CSV masiva, ajuste porcentual masivo, exportación CSV, comandas, settings y sincronización dual Supabase/JSON.
   - Implementar `scripts/admin-server.mjs`, `scripts/start-production.mjs`, `scripts/seed-supabase.mjs`.

3. **Librerías compartidas y Contextos React:**
   - Implementar `lib/types.ts`, `lib/utils.ts`, `lib/api.ts`, `lib/whatsapp.ts`, `lib/csv.ts` (parser/generador CSV compatible con `,` y `;` de Excel).
   - Implementar `context/store-context.tsx` y `context/cart-context.tsx`.

4. **Storefront, Catálogo y Carrito:**
   - `app/layout.tsx`, `app/globals.css`, `app/not-found.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`.
   - Componentes: `Navbar`, `Footer`, `BusinessStatusBadge`, `ProductCard` (con selector de variante/medida y stock), `CartDrawer` (carrito + checkout WhatsApp + comanda), `MobileCartBar`.
   - Páginas: `/` (Home + rubros + destacados + accesos al catálogo), `/catalogo` (buscador, filtros por rubro/marca/stock, orden y paginación), `/servicios`, `/nosotros`, `/contacto`.

5. **Panel `/admin`:**
   - Login HMAC, pestaña Comandas (filtros, cambio de estado, impresión ticket, reenvío WhatsApp), pestaña Catálogo y Stock (búsqueda, edición inline de precio/stock, CRUD producto y variantes), pestaña Actualización Masiva (importación CSV con vista previa, descarga plantilla/exportación, aumento porcentual por rubro/marca), pestaña Rubros y Ajustes.

6. **Verificación integral:**
   - Pruebas unitarias/integración con `node --test` para parser CSV, formateador de comanda WhatsApp y endpoints de `backend/server.mjs` (auth, CRUD, bulk-import, bulk-price-update, comandas).
   - `npm run lint` y `npm run build` sin errores.
   - Prueba de humo real levantando backend + storefront y verificando endpoints HTTP.
