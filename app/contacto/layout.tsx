import type { Metadata } from 'next';

const BASE_URL = 'https://ferreteria-mica.vercel.app';

export const metadata: Metadata = {
  title: 'Contacto y Ubicación',
  description:
    'Ferretería Mica en Av. San Martín 2652, Quilmes Oeste. WhatsApp +54 9 11 5712-4625, mapa interactivo y formulario de presupuesto directo.',
  alternates: {
    canonical: `${BASE_URL}/contacto`,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Ferretería Mica',
    title: 'Contacto y Ubicación | Ferretería Mica',
    description:
      'Av. San Martín 2652, Quilmes Oeste. WhatsApp +54 9 11 5712-4625, teléfono y formulario directo de presupuestos.',
    url: `${BASE_URL}/contacto`,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Contacto Ferretería Mica Quilmes Oeste' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contacto y Ubicación | Ferretería Mica',
    description: 'Av. San Martín 2652, Quilmes Oeste · WhatsApp +54 9 11 5712-4625 y mapa del local.',
    images: ['/opengraph-image'],
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Contacto y Ubicación', item: `${BASE_URL}/contacto` },
    ],
  };

  const contactPageLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contacto y Ubicación - Ferretería Mica',
    url: `${BASE_URL}/contacto`,
    mainEntity: { '@id': `${BASE_URL}/#store` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageLd) }} />
      {children}
    </>
  );
}
