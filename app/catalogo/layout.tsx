import type { Metadata } from 'next';
import seedStore from '@/data/store.json';

export const metadata: Metadata = {
  title: 'Catálogo Online con Precios',
  description:
    'Explorá precios y stock actualizado en herramientas, bulonería, sanitarios Awaduct, pinturas con caucho, electricidad y carga de oxígeno/nitrógeno en Quilmes Oeste.',
  alternates: {
    canonical: 'https://ferreteria-mica.vercel.app/catalogo',
  },
  openGraph: {
    title: 'Catálogo Online con Precios | Ferretería Mica',
    description:
      'Consultá precios y medidas disponibles en Ferretería Mica y armá tu pedido por WhatsApp con envío en el día.',
    url: 'https://ferreteria-mica.vercel.app/catalogo',
  },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://ferreteria-mica.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo Online', item: 'https://ferreteria-mica.vercel.app/catalogo' },
    ],
  };

  const offerCatalogLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo de Productos Ferretería Mica',
    numberOfItems: seedStore.products.length,
    itemListElement: seedStore.products.slice(0, 20).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        sku: p.sku,
        brand: { '@type': 'Brand', name: p.brand },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'ARS',
          price: p.priceOnRequest ? undefined : p.price,
          availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogLd) }} />
      {children}
    </>
  );
}
