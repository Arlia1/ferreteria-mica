import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto y Ubicación en Quilmes Oeste',
  description:
    'Contactate con Ferretería Mica en Av. San Martín 2652, Quilmes Oeste. Teléfono y WhatsApp +54 9 11 5712-4625, mapa de ubicación y formulario de presupuesto directo.',
  alternates: {
    canonical: 'https://ferreteria-mica.vercel.app/contacto',
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://ferreteria-mica.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'Contacto', item: 'https://ferreteria-mica.vercel.app/contacto' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
