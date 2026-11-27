import seedStore from '@/data/store.json';
import { DEFAULT_CATEGORIES } from '@/lib/utils';
import { CategoryItem, Product } from '@/lib/types';

export const revalidate = 300;

async function getLiveCatalog(): Promise<{ products: Product[]; categories: CategoryItem[] }> {
  const backendUrl = (
    process.env.BACKEND_URL ||
    (process.env.VERCEL || process.env.RENDER ? 'https://ferreteria-mica.onrender.com' : '')
  ).replace(/\/$/, '');

  if (backendUrl) {
    try {
      const [prodRes, setRes] = await Promise.all([
        fetch(`${backendUrl}/api/products`, { next: { revalidate: 300 } }),
        fetch(`${backendUrl}/api/settings`, { next: { revalidate: 300 } }),
      ]);
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        const setJson = setRes.ok ? await setRes.json().catch(() => null) : null;
        if (Array.isArray(prodJson?.products)) {
          return {
            products: prodJson.products,
            categories:
              Array.isArray(setJson?.settings?.categories) && setJson.settings.categories.length > 0
                ? setJson.settings.categories
                : DEFAULT_CATEGORIES,
          };
        }
      }
    } catch {}
  }

  return {
    products: seedStore.products as Product[],
    categories: (seedStore.settings?.categories as CategoryItem[]) || DEFAULT_CATEGORIES,
  };
}

export async function GET() {
  const { products, categories } = await getLiveCatalog();
  const baseUrl = 'https://ferreteria-mica.vercel.app';

  const lines: string[] = [
    '# Ferretería Mica | Catálogo Completo Online',
    '',
    '> Av. San Martín 2652, Quilmes Oeste, Buenos Aires (B1879), Argentina | Tel/WhatsApp: +54 9 11 5712-4625',
    '> Horarios: Lunes a Viernes 08:30–19:00 | Sábados 08:30–18:00 | Domingos 09:00–13:00',
    '> Medios de pago: Efectivo, Tarjeta de Débito, Transferencia Bancaria | Envíos en el día en Quilmes Oeste y Zona Sur.',
    '',
    `Total de artículos indexados: ${products.length}`,
    '',
  ];

  for (const cat of categories) {
    const items = products.filter((p) => p.category === cat.id);
    if (items.length === 0) continue;

    lines.push(`## ${cat.name} (${items.length})`);
    if (cat.description) lines.push(`${cat.description}`);
    lines.push(`URL del rubro: ${baseUrl}/catalogo?rubro=${cat.id}`);
    lines.push('');

    for (const p of items) {
      const priceText = p.priceOnRequest
        ? 'Precio a consultar'
        : `$${Number(p.price || 0).toLocaleString('es-AR')} ARS / ${p.unit}`;
      const stockText = p.inStock ? 'En stock' : 'Sin stock';
      const variantsText =
        Array.isArray(p.variants) && p.variants.length > 0
          ? ` | Variantes: ${p.variants
              .map((v) => `${v.label} ($${Number(v.price || 0).toLocaleString('es-AR')})`)
              .join(', ')}`
          : '';
      lines.push(
        `- **${p.name}** (${p.brand}${p.sku ? `, SKU: ${p.sku}` : ''}) | ${priceText} | ${stockText}${variantsText}`
      );
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
