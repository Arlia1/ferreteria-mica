import { CategoryItem, Order, OrderStatus, Product } from './types';

export const STORE_INFO = {
  name: 'Ferretería Mica',
  address: 'Av. San Martín 2652, Quilmes Oeste, Buenos Aires (B1879)',
  phoneDisplay: '11 5712-4625',
  whatsappDefault: '5491157124625',
  instagramUrl: 'https://www.instagram.com/ferreteria_mica',
  facebookUrl: 'https://www.facebook.com/ferreteriamica',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Av.+San+Mart%C3%ADn+2652%2C+Quilmes+Oeste%2C+Buenos+Aires',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=Av.+San+Mart%C3%ADn+2652,+Quilmes+Oeste,+Buenos+Aires&t=&z=16&ie=UTF8&iwloc=&output=embed',
};

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'herramientas', name: 'Herramientas', description: 'Eléctricas, inalámbricas Ronix, llaves Lusqtoff, escaleras y cajas', image: '/img/productos/amoladora.jpg' },
  { id: 'pinturas', name: 'Pinturas y Enduidos', description: 'Látex Take, convertidores, colores por grupo, enduidos, fijadores, pinceles y rodillos', image: '/img/productos/pintura-latex.jpg' },
  { id: 'electricidad', name: 'Electricidad e Iluminación', description: 'Cables unipolares/taller, módulos Jeluz y lámparas LED estándar y alta potencia', image: '/img/productos/cable-electrico.jpg' },
  { id: 'buloneria', name: 'Bulonería y Tornillería', description: 'Tornillos negros drywall #6, #8, #10 y punta mecha por unidad o caja', image: '/img/productos/tornillos.jpg' },
  { id: 'construccion', name: 'Construcción y Máquinas', description: 'Hormigoneras Duroll, carretillas, andamios, motores, caballetes y telgopor', image: '/img/logo.png' },
  { id: 'sanitarios', name: 'Sanitarios y Tanques', description: 'Tanques, cisternas y biodigestores Factumplast más accesorios sanitarios', image: '/img/productos/cano-pvc.jpg' },
  { id: 'gases', name: 'Gases y Refrigeración', description: 'Recargas de nitrógeno, CO2, gases industriales y garrafas refrigerantes', image: '/img/productos/tubo-oxigeno.jpg' },
  { id: 'herrajes', name: 'Adhesivos y Selladores', description: 'La Gotita, Poxipol, Poxilina, Fastix, Poxirran, Ecole y acero líquido', image: '/img/productos/pegamento.jpg' },
  { id: 'jardineria', name: 'Jardinería y Palas', description: 'Desmalezadoras, bordeadoras Indeplast y palas forjadas/estampadas Gherardi', image: '/img/productos/desmalezadora.jpg' },
];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; badgeClass: string; nextStatus?: OrderStatus; nextLabel?: string }
> = {
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    nextStatus: 'confirmado',
    nextLabel: 'Confirmar comanda',
  },
  confirmado: {
    label: 'Confirmado',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    nextStatus: 'en_preparacion',
    nextLabel: 'Pasar a preparación',
  },
  en_preparacion: {
    label: 'En preparación',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    nextStatus: 'en_camino',
    nextLabel: 'Marcar en camino',
  },
  en_camino: {
    label: 'En camino / Listo',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    nextStatus: 'entregado',
    nextLabel: 'Marcar entregado',
  },
  entregado: {
    label: 'Entregado',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
};

export function formatPrice(amount: number): string {
  const num = Number(amount || 0);
  return `$ ${num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Sube una imagen a Cloudinary (unsigned preset) si esta configurado en el entorno;
 * en local o sin credenciales comprime a WebP (max 800px) para guardar sin dependencias.
 */
export async function uploadToCloudinary(file: File): Promise<{ url: string; mode: 'cloudinary' | 'local' }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'gopc60ca';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ferrreteria-mica';

  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.secure_url || data.url;
        if (url) return { url, mode: 'cloudinary' };
      }
    } catch {
      // Fallback local si falla la red hacia Cloudinary
    }
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ url: String(reader.result || ''), mode: 'local' });
      reader.onerror = () => resolve({ url: '', mode: 'local' });
      reader.readAsDataURL(file);
      return;
    }

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve({ url: canvas.toDataURL('image/webp', 0.84), mode: 'local' });
      } else {
        resolve({ url: '', mode: 'local' });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ url: '', mode: 'local' });
    };
    img.src = objectUrl;
  });
}

export function getCategoryMeta(categoryId: string, categories: CategoryItem[] = DEFAULT_CATEGORIES): CategoryItem {
  return (
    categories.find((c) => c.id === categoryId) ||
    DEFAULT_CATEGORIES.find((c) => c.id === categoryId) || {
      id: categoryId,
      name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace(/-/g, ' '),
      image: '/img/productos/amoladora.jpg',
    }
  );
}

export function getProductImage(product: Pick<Product, 'image' | 'category'>, categories: CategoryItem[] = DEFAULT_CATEGORIES): string {
  if (product.image) return product.image;
  return getCategoryMeta(product.category, categories).image || '/img/productos/amoladora.jpg';
}

export function getBusinessStatusInfo(override: 'auto' | 'open' | 'closed' = 'auto'): {
  isOpen: boolean;
  message: string;
} {
  if (override === 'open') {
    return { isOpen: true, message: 'Abierto ahora · Atención online activa' };
  }
  if (override === 'closed') {
    return { isOpen: false, message: 'Cerrado temporalmente · Podés dejar tu consulta' };
  }

  try {
    const now = new Date();
    const argStr = now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
    const argDate = new Date(argStr);
    const day = argDate.getDay();
    const timeVal = argDate.getHours() * 60 + argDate.getMinutes();

    if (day >= 1 && day <= 5) {
      if (timeVal >= 510 && timeVal < 1140) return { isOpen: true, message: 'Abierto ahora · Cierra 19:00 hs' };
      if (timeVal < 510) return { isOpen: false, message: 'Cerrado · Abre hoy 8:30 hs' };
      return {
        isOpen: false,
        message: day === 5 ? 'Cerrado · Abre mañana sábado 8:30 hs' : 'Cerrado · Abre mañana 8:30 hs',
      };
    }

    if (day === 6) {
      if (timeVal >= 510 && timeVal < 1080) return { isOpen: true, message: 'Abierto ahora · Corrido hasta 18:00 hs' };
      if (timeVal < 510) return { isOpen: false, message: 'Cerrado · Abre hoy sábado 8:30 hs' };
      return { isOpen: false, message: 'Cerrado · Abre mañana domingo 9:00 hs' };
    }

    if (timeVal >= 540 && timeVal < 780) return { isOpen: true, message: 'Abierto ahora · Cierra 13:00 hs' };
    if (timeVal < 540) return { isOpen: false, message: 'Cerrado · Abre hoy domingo 9:00 hs' };
    return { isOpen: false, message: 'Cerrado · Abre el lunes 8:30 hs' };
  } catch {
    return { isOpen: true, message: 'Lun a Vie 8:30-19:00 · Sáb 8:30-18:00 · Dom 9:00-13:00' };
  }
}

export function formatComandaDateTime(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const dateStr = d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  const timeStr = d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  return `${dateStr} · ${timeStr} hs`;
}

export function generateThermalTicketHtml(order: Order): string {
  const esc = (s: string) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const itemsHtml = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:4px 0;vertical-align:top;">
          <strong>${esc(it.name)}</strong>
          ${it.variantLabel ? `<br><small>${esc(it.variantLabel)}</small>` : ''}
          ${it.sku ? `<br><small>SKU: ${esc(it.sku)}</small>` : ''}
          ${it.notes ? `<br><small>Obs: ${esc(it.notes)}</small>` : ''}
        </td>
        <td style="padding:4px 6px;text-align:center;vertical-align:top;">${it.quantity}</td>
        <td style="padding:4px 0;text-align:right;vertical-align:top;">${
          it.priceOnRequest ? 'A consultar' : esc(formatPrice(it.price * it.quantity))
        }</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Comanda ${esc(order.id)}</title>
    <style>
      body { font-family: ui-monospace, Menlo, monospace; width: 300px; margin: 12px auto; color: #111; font-size: 12px; }
      h1 { font-size: 15px; margin: 0 0 2px; text-align: center; }
      .sub { text-align: center; font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #333; padding-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; border-top: 1px dashed #333; border-bottom: 1px dashed #333; }
      .tot { font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 8px; }
      .row { display: flex; justify-content: space-between; margin: 3px 0; }
      @media print { body { margin: 0; } }
    </style>
  </head>
  <body>
    <h1>FERRETERIA MICA</h1>
    <div class="sub">Av. San Martin 2652 · Quilmes Oeste<br>COMANDA #${esc(order.id)}<br>${esc(
    formatComandaDateTime(order.createdAt)
  )}</div>
    <div><strong>Cliente:</strong> ${esc(order.customerName)}</div>
    <div><strong>Tel:</strong> ${esc(order.customerPhone)}</div>
    <div><strong>Modalidad:</strong> ${order.orderType === 'delivery' ? 'Envío en el día' : 'Retiro en local'}</div>
    ${order.orderType === 'delivery' ? `<div><strong>Dirección:</strong> ${esc(order.deliveryAddress || 'A coordinar')}</div>` : ''}
    ${order.deliveryNotes ? `<div><strong>Notas:</strong> ${esc(order.deliveryNotes)}</div>` : ''}
    <div><strong>Pago:</strong> ${esc(order.paymentMethod.toUpperCase())}</div>
    <table>
      <thead><tr><th align="left">Detalle</th><th>Cant</th><th align="right">Importe</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="row"><span>Subtotal:</span><span>${esc(formatPrice(order.subtotal))}</span></div>
    ${
      order.orderType === 'delivery'
        ? `<div class="row"><span>Envío:</span><span>${
            order.deliveryCost === 0 ? 'SIN CARGO' : esc(formatPrice(order.deliveryCost))
          }</span></div>`
        : ''
    }
    <div class="tot"><span>TOTAL:</span><span>${esc(formatPrice(order.total))}</span></div>
    ${order.hasConsultItems ? '<p style="font-size:11px">* Incluye ítems con precio a consultar.</p>' : ''}
  </body>
  </html>`;
}
