import { CartItem, OrderType, PaymentMethod } from './types';
import { formatPrice } from './utils';

export interface OrderCheckoutData {
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress?: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
}

export function normalizeWhatsAppPhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '5491157124625';
  if (digits.startsWith('549')) return digits;
  if (digits.startsWith('54')) return `549${digits.slice(2)}`;
  if (digits.startsWith('0')) return `549${digits.slice(1)}`;
  return `549${digits}`;
}

export function generateWhatsAppMessage(
  items: CartItem[],
  checkoutData: OrderCheckoutData,
  subtotal: number,
  deliveryCost: number,
  orderNumber?: string
): string {
  const hasConsultItems = items.some((i) => i.priceOnRequest);
  const appliedDelivery = checkoutData.orderType === 'delivery' ? deliveryCost : 0;
  const total = subtotal + appliedDelivery;

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  const timeStr = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });

  const orderNum =
    orderNumber || `FM-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const paymentLabels: Record<PaymentMethod, string> = {
    efectivo: 'EFECTIVO',
    debito: 'TARJETA DE DEBITO',
    transferencia: 'TRANSFERENCIA BANCARIA',
  };

  let msg = `FERRETERIA MICA - QUILMES OESTE\n`;
  msg += `COMANDA DE PEDIDO #${orderNum}\n\n`;
  msg += `FECHA: ${dateStr} - HORA: ${timeStr} hs\n`;
  msg += `MODALIDAD: ${
    checkoutData.orderType === 'delivery' ? 'ENVIO EN EL DIA' : 'RETIRO EN LOCAL (Av. San Martin 2652)'
  }\n\n`;
  msg += `DATOS DEL CLIENTE\n`;
  msg += `NOMBRE: ${checkoutData.customerName}\n`;
  msg += `TELEFONO: ${checkoutData.customerPhone}\n`;

  if (checkoutData.orderType === 'delivery') {
    msg += `DIRECCION: ${checkoutData.deliveryAddress?.trim() || 'A coordinar'}\n`;
    if (checkoutData.deliveryNotes?.trim()) {
      msg += `INDICACIONES: ${checkoutData.deliveryNotes.trim()}\n`;
    }
  } else if (checkoutData.deliveryNotes?.trim()) {
    msg += `OBSERVACIONES: ${checkoutData.deliveryNotes.trim()}\n`;
  }

  msg += `MEDIO DE PAGO: ${paymentLabels[checkoutData.paymentMethod] || 'EFECTIVO'}\n\n`;
  msg += `DETALLE DE PRODUCTOS\n`;

  items.forEach((item, index) => {
    const variantTxt = item.variantLabel ? ` [${item.variantLabel}]` : '';
    const skuTxt = item.sku ? ` (SKU: ${item.sku})` : '';
    const linePrice = item.priceOnRequest ? 'A CONSULTAR' : formatPrice(item.price * item.quantity);
    msg += `[ ] ${index + 1}. ${item.name}${variantTxt}${skuTxt} x${item.quantity} (${item.unit}) - ${linePrice}\n`;
    if (item.notes) {
      msg += `    OBS: ${item.notes}\n`;
    }
  });

  msg += `\nLIQUIDACION\n`;
  msg += `SUBTOTAL: ${formatPrice(subtotal)}\n`;
  if (checkoutData.orderType === 'delivery') {
    msg += `ENVIO EN EL DIA: ${appliedDelivery === 0 ? 'SIN CARGO' : formatPrice(appliedDelivery)}\n`;
  }
  msg += `TOTAL${hasConsultItems ? ' (PARCIAL + A CONSULTAR)' : ''}: ${formatPrice(total)}\n\n`;
  msg += `Hola Ferreteria Mica, acabo de enviar este pedido desde el catalogo web. Aguardo confirmacion de stock y horario. Muchas gracias!`;

  return msg;
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(cleanText)}`;
}
