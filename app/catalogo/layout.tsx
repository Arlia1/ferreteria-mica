import type { Metadata } from 'next';
import seedStore from '@/data/store.json';

const BASE_URL = 'https://ferreteria-mica.vercel.app';

export const metadata: Metadata = {
  title: 'Catálogo con Precios',
  description:
    'Buscá precios y stock de herramientas, bulonería, sanitarios Awaduct, electricidad y pinturas en Quilmes Oeste. Armá tu pedido por WhatsApp.',
  alternates: {
    canonical: `${BASE_URL}/catalogo`,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Ferretería Mica',
    title: 'Catálogo con Precios | Ferretería Mica',
    description:
      'Precios y stock en vivo en Quilmes Oeste. Herramientas, bulonería, sanitarios Awaduct y pinturas con envío en el día.',
    url: `${BASE_URL}/catalogo`,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Catálogo Online con Precios | Ferretería Mica',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo con Precios | Ferretería Mica',
    description: 'Precios actualizados, variantes y pedido directo por WhatsApp en Quilmes Oeste.',
    images: ['/opengraph-image'],
  },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Catálogo Online', item: `${BASE_URL}/catalogo` },
    ],
  };

  const offerCatalogLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo de Productos Ferretería Mica',
    numberOfItems: seedStore.products.length,
    itemListElement: seedStore.products.map((p, idx) => {
      const imagePath = p.image || '/img/productos/amoladora.jpg';
      const productUrl = `${BASE_URL}/catalogo?q=${encodeURIComponent(p.sku || p.name)}`;
      const availability = p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

      return {
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          sku: p.sku,
          description: p.description || `${p.name} - ${p.brand} en Ferretería Mica, Quilmes Oeste.`,
          image: imagePath.startsWith('http') ? imagePath : `${BASE_URL}${imagePath}`,
          url: productUrl,
          brand: { '@type': 'Brand', name: p.brand },
          offers: p.priceOnRequest
            ? {
                '@type': 'Offer',
                availability,
                url: productUrl,
                priceSpecification: {
                  '@type': 'PriceSpecification',
                  priceCurrency: 'ARS',
                },
                seller: { '@id': `${BASE_URL}/#store` },
              }
            : {
                '@type': 'Offer',
                priceCurrency: 'ARS',
                price: p.price,
                availability,
                url: productUrl,
                seller: { '@id': `${BASE_URL}/#store` },
              },
        },
      };
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogLd) }} />
      {children}
    </>
  );
}
