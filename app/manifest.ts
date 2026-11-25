import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ferretería Mica',
    short_name: 'Ferretería Mica',
    description:
      'Catálogo online con precios, materiales de construcción, herramientas y envíos en el día en Quilmes Oeste.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020617',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/img/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/img/logo2.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
