import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/catalogo', '/servicios', '/nosotros', '/contacto', '/llms.txt'],
        disallow: ['/admin', '/api/'],
      },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
        allow: ['/', '/catalogo', '/servicios', '/nosotros', '/contacto', '/llms.txt'],
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: 'https://ferreteria-mica.vercel.app/sitemap.xml',
  };
}
