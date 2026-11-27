import type { Metadata } from 'next';

const BASE_URL = 'https://ferreteria-mica.vercel.app';

export const metadata: Metadata = {
  title: 'Nosotros y Horarios',
  description:
    'Más de 25 años en Av. San Martín 2652, Quilmes Oeste. Conocé nuestros horarios de lunes a domingo, medios de pago, envíos en el día y preguntas.',
  alternates: {
    canonical: `${BASE_URL}/nosotros`,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Ferretería Mica',
    title: 'Nosotros y Horarios | Ferretería Mica',
    description:
      'Más de 25 años en Quilmes Oeste. Horarios corridos lunes a domingo, pagos en efectivo/débito/transferencia y envíos en el día.',
    url: `${BASE_URL}/nosotros`,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Nosotros Ferretería Mica Quilmes Oeste' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nosotros y Horarios | Ferretería Mica',
    description: 'Trayectoria, horarios de lunes a domingo, medios de pago y preguntas frecuentes.',
    images: ['/opengraph-image'],
  },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Nosotros y Horarios', item: `${BASE_URL}/nosotros` },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Realizan envíos en el día?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, realizamos envíos rápidos en el día en Quilmes Oeste y zonas cercanas desde el carrito online.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué medios de pago aceptan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Aceptamos efectivo en el local o contraentrega, tarjeta de débito y transferencias bancarias.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cargan oxígeno y nitrógeno en el momento?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, realizamos suministro y recarga inmediata de tubos de oxígeno y nitrógeno en nuestro local de Av. San Martín 2652.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo funciona el pedido desde el catálogo online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Buscás tus productos, seleccionás la medida o cantidad, los agregás al pedido y al confirmar se registra tu comanda y se abre WhatsApp con el detalle completo.',
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      {children}
    </>
  );
}
