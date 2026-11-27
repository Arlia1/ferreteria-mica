import { ImageResponse } from 'next/og';

export const alt = 'Ferretería Mica | Catálogo Online con Precios en Quilmes Oeste';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e293b 100%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
          borderBottom: '12px solid #f59e0b',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(245, 158, 11, 0.16)',
              border: '2px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '10px',
              padding: '10px 22px',
              color: '#fbbf24',
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.06em',
            }}
          >
            FERRETERÍA MICA · +25 AÑOS EN QUILMES OESTE
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#94a3b8',
              fontWeight: 700,
            }}
          >
            AV. SAN MARTÍN 2652
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            Catálogo Online con Precios y Envíos en el Día
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#cbd5e1',
              lineHeight: 1.35,
            }}
          >
            Herramientas · Materiales de Construcción · Bulonería · Sanitarios Awaduct · Pinturas · Oxígeno y Nitrógeno
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid #334155',
            paddingTop: '24px',
            fontSize: '24px',
            fontWeight: 700,
          }}
        >
          <span style={{ color: '#fbbf24' }}>Pedidos directos por WhatsApp · 11 5712-4625</span>
          <span style={{ color: '#cbd5e1' }}>ferreteria-mica.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
