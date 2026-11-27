import type { Metadata } from 'next';
import seedStore from '@/data/store.json';

const BASE_URL = 'https://ferreteria-mica.vercel.app';

export const metadata: Metadata = {
  title: 'Rubros y Especialidades',
  description:
    'Herramientas eléctricas, materiales de construcción, bulonería, sanitarios Awaduct, pinturas y recarga de oxígeno y nitrógeno en Quilmes Oeste.',
  alternates: {
    canonical: `${BASE_URL}/servicios`,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Ferretería Mica',
    title: 'Rubros y Especialidades | Ferretería Mica',
    description:
      'Descubrí nuestros 9 rubros y servicios técnicos: herramientas, Awaduct, membranas con caucho y recarga de oxígeno y nitrógeno.',
    url: `${BASE_URL}/servicios`,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Rubros y Especialidades Ferretería Mica' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rubros y Especialidades | Ferretería Mica',
    description: 'Herramientas, sanitarios Awaduct, pinturas con caucho y recarga de gases en Quilmes Oeste.',
    images: ['/opengraph-image'],
  },
};

export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Rubros y Especialidades', item: `${BASE_URL}/servicios` },
    ],
  };

  const servicesLd = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Rubros y Servicios de Ferretería Mica',
    url: `${BASE_URL}/servicios`,
    provider: { '@id': `${BASE_URL}/#store` },
    itemListElement: (seedStore.settings?.categories || []).map((cat, index) => ({
      '@type': 'OfferCatalog',
      position: index + 1,
      name: cat.name,
      description: cat.description,
      url: `${BASE_URL}/catalogo?rubro=${cat.id}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesLd) }} />
      {children}
    </>
  );
}
