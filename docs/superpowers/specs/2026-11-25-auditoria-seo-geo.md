# Auditoría SEO Técnico, Local y GEO — Ferretería Mica

**Fecha:** 2026-11-25  
**Dominio:** `https://ferreteria-mica.vercel.app`  
**Local:** Av. San Martín 2652, Quilmes Oeste, Buenos Aires (B1879)

---

## 1. Hallazgos Detectados Antes de la Auditoría

1. **Rutas secundarias sin `Metadata` propia ni `canonical`:** `/catalogo`, `/servicios`, `/nosotros` y `/contacto` eran componentes cliente sin `layout.tsx` en servidor, por lo que heredaban el `<title>`, `<meta description>` y URL canónica de la portada.
2. **Pérdida de etiquetas geo-locales al migrar desde HTML estático:** faltaban las meta etiquetas `geo.region`, `geo.placename`, `geo.position`, `ICBM`, además de `GeoCoordinates`, `areaServed`, `hasMap` y `paymentAccepted` dentro del esquema `HardwareStore`.
3. **Falta de datos estructurados de catálogo y preguntas frecuentes:** no había `ItemList`/`Product` en `/catalogo`, `BreadcrumbList` en rutas interiores ni `FAQPage` en `/nosotros`.
4. **Cobertura GEO (Generative Engine Optimization):** no existía `/llms.txt` ni reglas explícitas en `robots.ts` habilitando crawlers de búsqueda generativa (`OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`) mientras se bloquean `/admin` y `/api/`.
5. **Imágenes:** las tarjetas usaban ilustraciones genéricas en lugar de fotografías reales con texto alternativo descriptivo y dimensiones declaradas.

---

## 2. Correcciones Implementadas

- **SEO por ruta (`layout.tsx` en servidor):**
  - [app/layout.tsx](../../../app/layout.tsx): `canonical`, `twitter` card, etiquetas `geo.*` (`AR-B`, Quilmes Oeste, `-34.7719616;-58.3217796`), `robots` (`max-image-preview: large`) y esquema `HardwareStore` completo con `GeoCoordinates`, `areaServed` (Quilmes Oeste, Quilmes, Bernal, Ezpeleta, San Francisco Solano, Berazategui), `hasMap`, `paymentAccepted` y `sameAs`.
  - [app/catalogo/layout.tsx](../../../app/catalogo/layout.tsx): metadata única + `BreadcrumbList` + `ItemList` con `Product`/`Offer` (`ARS`) generado desde `data/store.json`.
  - [app/servicios/layout.tsx](../../../app/servicios/layout.tsx): metadata única + `BreadcrumbList`.
  - [app/nosotros/layout.tsx](../../../app/nosotros/layout.tsx): metadata única + `FAQPage` sincronizado con las 4 preguntas visibles de la página.
  - [app/contacto/layout.tsx](../../../app/contacto/layout.tsx): metadata única + `BreadcrumbList`.
- **GEO (AI Search & Local Discovery):**
  - [public/llms.txt](../../../public/llms.txt): documento estructurado en Markdown con datos verificados del local, horarios, teléfono/WhatsApp, modalidades de entrega, medios de pago y resumen de los 9 rubros.
  - [app/robots.ts](../../../app/robots.ts): habilitación explícita de buscadores tradicionales y motores generativos en rutas públicas y `/llms.txt`, manteniendo bloqueados `/admin` y `/api/`.
- **Activos visuales reales:** reemplazo completo por fotografías reales descargadas en `public/img/productos/` con dimensiones explícitas (`width`/`height`) y `alt` descriptivo.
