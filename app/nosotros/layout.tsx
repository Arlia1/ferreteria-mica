import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nosotros, Horarios y Preguntas Frecuentes',
  description:
    'Conocé Ferretería Mica en Av. San Martín 2652, Quilmes Oeste. Más de 25 años de trayectoria, horarios corridos de lunes a domingo, envíos en el día y medios de pago.',
  alternates: {
    canonical: 'https://ferreteria-mica.vercel.app/nosotros',
  },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      {children}
    </>
  );
}
