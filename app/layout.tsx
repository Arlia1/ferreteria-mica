import type { Metadata, Viewport } from 'next';
import { Barlow, Barlow_Condensed, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/context/store-context';
import { CartProvider } from '@/context/cart-context';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import MobileCartBar from '@/components/mobile-cart-bar';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f59e0b',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://ferreteria-mica.vercel.app'),
  title: {
    default: 'Ferretería Mica | Catálogo y Envíos en Quilmes Oeste',
    template: '%s | Ferretería Mica',
  },
  description:
    'Catálogo online con precios actualizados en herramientas, bulonería, sanitarios Awaduct, electricidad y pinturas en Quilmes Oeste. Envíos en el día.',
  keywords: [
    'ferreteria quilmes oeste',
    'ferreteria mica',
    'catalogo ferreteria precios online',
    'materiales de construccion quilmes',
    'herramientas electricas quilmes',
    'sanitarios awaduct',
    'membrana gel con caucho',
    'carga oxigeno nitrogeno quilmes',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Ferretería Mica',
    url: 'https://ferreteria-mica.vercel.app/',
    title: 'Ferretería Mica | Catálogo y Envíos en Quilmes Oeste',
    description:
      'Catálogo online con precios actualizados en herramientas, materiales, sanitarios Awaduct y carga de gases en Quilmes Oeste.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Ferretería Mica | Catálogo Online con Precios en Quilmes Oeste',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ferretería Mica | Catálogo y Envíos en Quilmes Oeste',
    description:
      'Herramientas, materiales, sanitarios Awaduct, recarga de oxígeno/nitrógeno y envíos en el día.',
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: 'https://ferreteria-mica.vercel.app/',
  },
  other: {
    'geo.region': 'AR-B',
    'geo.placename': 'Quilmes Oeste, Buenos Aires',
    'geo.position': '-34.7719616;-58.3217796',
    ICBM: '-34.7719616, -58.3217796',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/img/logo2.png',
    apple: '/img/logo2.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'HardwareStore',
      '@id': 'https://ferreteria-mica.vercel.app/#store',
      name: 'Ferretería Mica',
      description:
        'Ferretería industrial y comercial en Quilmes Oeste con más de 25 años de trayectoria. Catálogo online con precios, envíos en el día y recarga de oxígeno y nitrógeno en el momento.',
      image: 'https://ferreteria-mica.vercel.app/opengraph-image',
      logo: 'https://ferreteria-mica.vercel.app/img/logo.png',
      url: 'https://ferreteria-mica.vercel.app/',
      telephone: '+5491157124625',
      priceRange: '$$',
      paymentAccepted: 'Efectivo, Tarjeta de Débito, Transferencia Bancaria',
      currenciesAccepted: 'ARS',
      knowsAbout: [
        'Ferretería Industrial',
        'Materiales de Construcción',
        'Herramientas Eléctricas y Manuales',
        'Sanitarios Awaduct',
        'Termofusión Acqua System',
        'Pinturas y Membranas con Caucho',
        'Bulonería y Tornillería',
        'Recarga de Oxígeno y Nitrógeno',
      ],
      hasMap:
        'https://www.google.com/maps/search/?api=1&query=Av.+San+Mart%C3%ADn+2652%2C+Quilmes+Oeste%2C+Buenos+Aires',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. San Martín 2652',
        addressLocality: 'Quilmes Oeste',
        addressRegion: 'Buenos Aires',
        postalCode: 'B1879',
        addressCountry: 'AR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -34.7719616,
        longitude: -58.3217796,
      },
      areaServed: [
        { '@type': 'City', name: 'Quilmes Oeste' },
        { '@type': 'City', name: 'Quilmes' },
        { '@type': 'AdministrativeArea', name: 'Bernal' },
        { '@type': 'AdministrativeArea', name: 'Ezpeleta' },
        { '@type': 'AdministrativeArea', name: 'San Francisco Solano' },
        { '@type': 'AdministrativeArea', name: 'Berazategui' },
      ],
      sameAs: [
        'https://www.facebook.com/ferreteriamica',
        'https://www.instagram.com/ferreteria_mica',
        'https://wa.me/5491157124625',
      ],
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '08:30',
          closes: '19:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Saturday',
          opens: '08:30',
          closes: '18:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Sunday',
          opens: '09:00',
          closes: '13:00',
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://ferreteria-mica.vercel.app/#website',
      url: 'https://ferreteria-mica.vercel.app/',
      name: 'Ferretería Mica',
      inLanguage: 'es-AR',
      publisher: { '@id': 'https://ferreteria-mica.vercel.app/#store' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://ferreteria-mica.vercel.app/catalogo?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`scroll-smooth ${barlow.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-slate-950 text-slate-100 antialiased overflow-x-hidden">
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <StoreProvider>
          <CartProvider>
            <Navbar />
            <main id="main-content" tabIndex={-1} className="min-h-screen outline-none">
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <MobileCartBar />
          </CartProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
