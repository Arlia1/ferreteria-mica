import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rubros y Especialidades',
  description:
    'Rubros de Ferretería Mica en Quilmes Oeste: herramientas eléctricas y manuales, materiales de construcción, bulonería, sanitarios Awaduct, pinturas y carga de oxígeno y nitrógeno.',
  alternates: {
    canonical: 'https://ferreteria-mica.vercel.app/servicios',
  },
};

export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://ferreteria-mica.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: 'Rubros y Servicios', item: 'https://ferreteria-mica.vercel.app/servicios' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
