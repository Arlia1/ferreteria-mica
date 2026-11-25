# DESIGN.md — Ferretería Mica

## Design Read
Storefront y catálogo técnico online para Ferretería Mica (Av. San Martín 2652, Quilmes Oeste), orientado a vecinos, electricistas, plomeros, gasistas y obras de la zona. Lenguaje visual de taller y mostrador ferretero: directo, de lectura rápida y con foco operativo en stock, medidas y precio.

Dial: ENERGY 2 / RHYTHM 3 / MOTION 1

## Identidad y Paleta (R-29)
- **Neutros estructurales:** `#020617` (acero profundo de fondo), `#0F172A` (superficie de mostrador/tarjeta), `#1E293B` (borde mecánico), `#F8FAFC` / `#CBD5E1` / `#94A3B8` (texto verificado en WCAG AA contra fondo oscuro).
- **Acento principal de marca:** Ámbar de seguridad industrial (`#F59E0B` con texto `#020617` en `9.39:1`; `#FBBF24` sobre `#0F172A` en `10.69:1`). Reservado para acciones principales de compra, foco activo y datos clave de catálogo.
- **Acento funcional de estado y WhatsApp:** Esmeralda (`#047857` con texto blanco en `5.48:1`; `#34D399` sobre `#0F172A` en `9.29:1`) únicamente para estado "Abierto" y contacto directo por WhatsApp; Rosa (`#FDA4AF` / `#BE123C`) para sin stock y errores.

## Tipografía (R-06)
- **Titulares (`--font-display`):** `Barlow Condensed` (pesos 600, 700, 800). Evoca cartelería técnica de ferretería y rinde compacto en nombres largos de rubros y secciones.
- **Cuerpo e interfaz (`--font-sans`):** `Barlow` (pesos 400, 500, 600, 700). Clara en tablas de precios, medidas y descripciones técnicas.
- **Códigos SKU y comandas (`--font-mono`):** `JetBrains Mono` exclusivamente en códigos SKU y números de comanda `#FM-...` para lectura tabular inequívoca.

## Motivo e Intención de Layout (R-05, R-11, R-14)
- **Ritmo variado (RHYTHM 3):** Home asimétrica en dos columnas con imagen real del mostrador/herramientas a la vista, franja operativa continua dividida por filetes (en lugar de tarjetas repetidas), bloque editorial para servicios diferenciales (carga de oxígeno/nitrógeno y línea Awaduct/membranas), grilla de productos con variantes y directorio compacto de rubros.
- **Radios consistentes (R-11):** Esquinas contenidas (`rounded-lg` en botones/inputs y `rounded-xl` en fichas/paneles), reservando `rounded-full` solo para insignias reales de estado o filtros compactos.
- **Movimiento contenido (MOTION 1):** Transiciones breves en hover/focus y apertura del carrito; sin animaciones en bucle infinito ni efectos decorativos.
