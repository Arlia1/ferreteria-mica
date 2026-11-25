export type ProductUnit = 'unidad' | 'metro' | 'kg' | 'litro' | 'caja' | 'pack' | 'carga';

export interface ProductVariant {
  id: string;
  label: string;
  sku?: string;
  price: number;
  stockQuantity: number;
  inStock: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  unit: ProductUnit | string;
  price: number;
  priceOnRequest: boolean;
  inStock: boolean;
  stockQuantity: number;
  minStockAlert: number;
  variants: ProductVariant[];
  image?: string;
  featured?: boolean;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  sku?: string;
  name: string;
  brand?: string;
  variantId?: string;
  variantLabel?: string;
  unit: string;
  price: number;
  priceOnRequest: boolean;
  quantity: number;
  notes?: string;
  image?: string;
}

export type OrderType = 'delivery' | 'takeaway';
export type PaymentMethod = 'efectivo' | 'debito' | 'transferencia';
export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress?: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  hasConsultItems?: boolean;
  status: OrderStatus;
  whatsappMessage?: string;
}

export interface StoreSettings {
  whatsappNumber: string;
  deliveryCost: number;
  freeDeliveryThreshold: number;
  sameDayDeliveryCutoff: string;
  isOpenOverride: 'auto' | 'open' | 'closed';
  announcement: string;
  categories: CategoryItem[];
}
