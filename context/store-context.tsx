'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import seedStore from '@/data/store.json';
import { apiFetch } from '@/lib/api';
import { parseProductsCsv } from '@/lib/csv';
import { DEFAULT_CATEGORIES } from '@/lib/utils';
import { CategoryItem, Order, OrderStatus, Product, StoreSettings } from '@/lib/types';

interface BulkImportResponse {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}

interface BulkPriceResponse {
  success: boolean;
  updatedCount: number;
}

interface StoreContextType {
  products: Product[];
  categories: CategoryItem[];
  settings: StoreSettings;
  orders: Order[];
  isLoading: boolean;
  backendOnline: boolean;
  refreshCatalog: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product | null>;
  updateProduct: (product: Product) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  updateProductStock: (
    productId: string,
    payload: { variantId?: string; inStock?: boolean; stockQuantity?: number }
  ) => Promise<void>;
  bulkImportCsv: (csvText: string) => Promise<BulkImportResponse>;
  bulkUpdatePrices: (payload: {
    percent: number;
    category?: string;
    brand?: string;
    rounding?: 'none' | '10' | '50' | '100';
  }) => Promise<BulkPriceResponse>;
  createOrder: (orderPayload: Partial<Order>) => Promise<Order | null>;
  updateOrderStatus: (id: string, status: OrderStatus, deliveryNotes?: string) => Promise<void>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  addCategory: (category: CategoryItem) => Promise<void>;
}

const LOCAL_PRODUCTS_KEY = 'mica_local_products_v1';
const LOCAL_SETTINGS_KEY = 'mica_local_settings_v1';
const LOCAL_ORDERS_KEY = 'mica_local_orders_v1';

const DEFAULT_SETTINGS: StoreSettings = {
  whatsappNumber: seedStore.settings?.whatsappNumber || '5491157124625',
  deliveryCost: Number(seedStore.settings?.deliveryCost ?? 2500),
  freeDeliveryThreshold: Number(seedStore.settings?.freeDeliveryThreshold ?? 65000),
  sameDayDeliveryCutoff: seedStore.settings?.sameDayDeliveryCutoff || '17:00',
  isOpenOverride: (seedStore.settings?.isOpenOverride as 'auto' | 'open' | 'closed') || 'auto',
  announcement: seedStore.settings?.announcement || '',
  categories: (seedStore.settings?.categories as CategoryItem[]) || DEFAULT_CATEGORIES,
};

function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function roundPriceWithStep(price: number, rounding: 'none' | '10' | '50' | '100' = 'none'): number {
  const safe = Math.max(0, Number(price || 0));
  if (rounding === '10') return Math.round(safe / 10) * 10;
  if (rounding === '50') return Math.round(safe / 50) * 50;
  if (rounding === '100') return Math.round(safe / 100) * 100;
  return Math.round(safe);
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedStore.products as Product[]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  const productsRef = useRef(products);
  const settingsRef = useRef(settings);
  const ordersRef = useRef(orders);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const commitProducts = useCallback((next: Product[]) => {
    productsRef.current = next;
    setProducts(next);
    writeLocalJson(LOCAL_PRODUCTS_KEY, next);
  }, []);

  const commitSettings = useCallback((next: StoreSettings) => {
    settingsRef.current = next;
    setSettings(next);
    writeLocalJson(LOCAL_SETTINGS_KEY, next);
  }, []);

  const commitOrders = useCallback((next: Order[]) => {
    ordersRef.current = next;
    setOrders(next);
    writeLocalJson(LOCAL_ORDERS_KEY, next);
  }, []);

  const refreshCatalog = useCallback(async () => {
    let loadedFromBackend = false;
    try {
      const [prodRes, setRes] = await Promise.all([
        apiFetch('/api/products'),
        apiFetch('/api/settings'),
      ]);
      if (prodRes.ok) {
        const data = await prodRes.json().catch(() => null);
        if (data && Array.isArray(data.products)) {
          loadedFromBackend = true;
          setProducts(data.products);
        }
      }
      if (setRes.ok) {
        const data = await setRes.json().catch(() => null);
        if (data?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
            categories:
              Array.isArray(data.settings.categories) && data.settings.categories.length > 0
                ? data.settings.categories
                : prev.categories,
          }));
        }
      }
    } catch {
      // Sin backend: continuamos con datos seed + cambios guardados localmente
    } finally {
      setBackendOnline(loadedFromBackend);
      if (!loadedFromBackend) {
        const localProds = readLocalJson<Product[] | null>(LOCAL_PRODUCTS_KEY, null);
        if (Array.isArray(localProds) && localProds.length > 0) {
          setProducts(localProds);
        }
        const localSettings = readLocalJson<Partial<StoreSettings> | null>(LOCAL_SETTINGS_KEY, null);
        if (localSettings) {
          setSettings((prev) => ({
            ...prev,
            ...localSettings,
            categories:
              Array.isArray(localSettings.categories) && localSettings.categories.length > 0
                ? localSettings.categories
                : prev.categories,
          }));
        }
      }
      setIsLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const res = await apiFetch('/api/pedidos');
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && Array.isArray(data.pedidos)) {
          setOrders(data.pedidos);
          return;
        }
      }
    } catch {}
    const localOrders = readLocalJson<Order[]>(LOCAL_ORDERS_KEY, []);
    if (Array.isArray(localOrders) && localOrders.length > 0) {
      setOrders(localOrders);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshCatalog();
      void refreshOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshCatalog, refreshOrders]);

  const addProduct = useCallback(
    async (product: Omit<Product, 'id'>): Promise<Product | null> => {
      try {
        const res = await apiFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.product) {
            commitProducts([data.product, ...productsRef.current]);
            return data.product;
          }
        }
      } catch {}

      const localProduct: Product = {
        ...product,
        id: `prod-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        updatedAt: new Date().toISOString(),
      };
      commitProducts([localProduct, ...productsRef.current]);
      return localProduct;
    },
    [commitProducts]
  );

  const updateProduct = useCallback(
    async (product: Product): Promise<Product | null> => {
      try {
        const res = await apiFetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.product) {
            commitProducts(productsRef.current.map((p) => (p.id === data.product.id ? data.product : p)));
            return data.product;
          }
        }
      } catch {}

      const updated: Product = { ...product, updatedAt: new Date().toISOString() };
      commitProducts(productsRef.current.map((p) => (p.id === updated.id ? updated : p)));
      return updated;
    },
    [commitProducts]
  );

  const deleteProduct = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await apiFetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          commitProducts(productsRef.current.filter((p) => p.id !== id));
          return true;
        }
      } catch {}

      commitProducts(productsRef.current.filter((p) => p.id !== id));
      return true;
    },
    [commitProducts]
  );

  const updateProductStock = useCallback(
    async (productId: string, payload: { variantId?: string; inStock?: boolean; stockQuantity?: number }) => {
      try {
        const res = await apiFetch('/api/stock', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, ...payload }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.product) {
            commitProducts(productsRef.current.map((p) => (p.id === data.product.id ? data.product : p)));
            return;
          }
        }
      } catch {}

      const next = productsRef.current.map((p) => {
        if (p.id !== productId) return p;
        if (payload.variantId && Array.isArray(p.variants)) {
          const variants = p.variants.map((v) => {
            if (v.id !== payload.variantId) return v;
            const qty = payload.stockQuantity !== undefined ? Math.max(0, payload.stockQuantity) : v.stockQuantity;
            const inStock = payload.inStock !== undefined ? payload.inStock : qty > 0;
            return { ...v, stockQuantity: qty, inStock };
          });
          const totalQty = variants.reduce((sum, v) => sum + Number(v.stockQuantity || 0), 0);
          return {
            ...p,
            variants,
            stockQuantity: totalQty,
            inStock: variants.some((v) => v.inStock),
            updatedAt: new Date().toISOString(),
          };
        }
        const qty = payload.stockQuantity !== undefined ? Math.max(0, payload.stockQuantity) : p.stockQuantity;
        const inStock = payload.inStock !== undefined ? payload.inStock : qty > 0;
        return { ...p, stockQuantity: qty, inStock, updatedAt: new Date().toISOString() };
      });
      commitProducts(next);
    },
    [commitProducts]
  );

  const bulkImportCsv = useCallback(
    async (csvText: string): Promise<BulkImportResponse> => {
      try {
        const res = await apiFetch('/api/products/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvText }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data) {
            if (Array.isArray(data.products)) commitProducts(data.products);
            if (Array.isArray(data.categories)) {
              commitSettings({ ...settingsRef.current, categories: data.categories });
            }
            return {
              success: Boolean(data.success),
              created: Number(data.created || 0),
              updated: Number(data.updated || 0),
              errors: Array.isArray(data.errors) ? data.errors : [],
            };
          }
        }
      } catch {}

      const { rows, errors } = parseProductsCsv(csvText);
      const next = [...productsRef.current];
      let created = 0;
      let updated = 0;

      for (const row of rows) {
        const existingIndex = next.findIndex(
          (p) => (row.sku && p.sku?.toLowerCase() === row.sku.toLowerCase()) || p.name.toLowerCase() === row.name.toLowerCase()
        );
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            ...row,
            updatedAt: new Date().toISOString(),
          };
          updated += 1;
        } else {
          next.unshift({
            ...row,
            id: `prod-csv-${Date.now().toString(36)}-${created}`,
            updatedAt: new Date().toISOString(),
          });
          created += 1;
        }
      }

      commitProducts(next);
      return { success: true, created, updated, errors };
    },
    [commitProducts, commitSettings]
  );

  const bulkUpdatePrices = useCallback(
    async (payload: {
      percent: number;
      category?: string;
      brand?: string;
      rounding?: 'none' | '10' | '50' | '100';
    }): Promise<BulkPriceResponse> => {
      try {
        const res = await apiFetch('/api/products/bulk-price-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data) {
            if (Array.isArray(data.products)) commitProducts(data.products);
            return {
              success: Boolean(data.success),
              updatedCount: Number(data.updatedCount || 0),
            };
          }
        }
      } catch {}

      const factor = 1 + Number(payload.percent || 0) / 100;
      let updatedCount = 0;
      const next = productsRef.current.map((p) => {
        const catOk = !payload.category || payload.category === 'todos' || p.category === payload.category;
        const brandOk = !payload.brand || payload.brand === 'todas' || p.brand === payload.brand;
        if (!catOk || !brandOk || p.priceOnRequest) return p;

        updatedCount += 1;
        const variants = Array.isArray(p.variants)
          ? p.variants.map((v) => ({
              ...v,
              price: roundPriceWithStep(v.price * factor, payload.rounding),
            }))
          : p.variants;

        return {
          ...p,
          price: roundPriceWithStep(p.price * factor, payload.rounding),
          variants,
          updatedAt: new Date().toISOString(),
        };
      });

      commitProducts(next);
      return { success: true, updatedCount };
    },
    [commitProducts]
  );

  const createOrder = useCallback(
    async (orderPayload: Partial<Order>): Promise<Order | null> => {
      try {
        const res = await apiFetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.pedido) {
            commitOrders([data.pedido, ...ordersRef.current]);
            return data.pedido;
          }
        }
      } catch {}

      const localOrder: Order = {
        id: orderPayload.id || `FM-${Date.now().toString(36).toUpperCase().slice(-4)}`,
        createdAt: orderPayload.createdAt || new Date().toISOString(),
        customerName: orderPayload.customerName || 'Cliente',
        customerPhone: orderPayload.customerPhone || '',
        orderType: orderPayload.orderType || 'delivery',
        deliveryAddress: orderPayload.deliveryAddress || '',
        deliveryNotes: orderPayload.deliveryNotes || '',
        paymentMethod: orderPayload.paymentMethod || 'efectivo',
        items: orderPayload.items || [],
        subtotal: Number(orderPayload.subtotal || 0),
        deliveryCost: Number(orderPayload.deliveryCost || 0),
        total: Number(orderPayload.total || 0),
        hasConsultItems: Boolean(orderPayload.hasConsultItems),
        status: 'pendiente',
        whatsappMessage: orderPayload.whatsappMessage || '',
      };
      commitOrders([localOrder, ...ordersRef.current]);
      return localOrder;
    },
    [commitOrders]
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus, deliveryNotes?: string) => {
      try {
        const res = await apiFetch(`/api/pedidos/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, ...(deliveryNotes !== undefined ? { deliveryNotes } : {}) }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.pedido) {
            commitOrders(ordersRef.current.map((o) => (o.id === id ? data.pedido : o)));
            return;
          }
        }
      } catch {}

      commitOrders(
        ordersRef.current.map((o) =>
          o.id === id
            ? { ...o, status, ...(deliveryNotes !== undefined ? { deliveryNotes } : {}) }
            : o
        )
      );
    },
    [commitOrders]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<StoreSettings>) => {
      try {
        const res = await apiFetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.settings) {
            commitSettings(data.settings);
            return;
          }
        }
      } catch {}

      commitSettings({ ...settingsRef.current, ...newSettings });
    },
    [commitSettings]
  );

  const addCategory = useCallback(
    async (category: CategoryItem) => {
      const nextCategories = [...settingsRef.current.categories, category];
      await updateSettings({ categories: nextCategories });
    },
    [updateSettings]
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        categories: settings.categories?.length ? settings.categories : DEFAULT_CATEGORIES,
        settings,
        orders,
        isLoading,
        backendOnline,
        refreshCatalog,
        refreshOrders,
        addProduct,
        updateProduct,
        deleteProduct,
        updateProductStock,
        bulkImportCsv,
        bulkUpdatePrices,
        createOrder,
        updateOrderStatus,
        updateSettings,
        addCategory,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore debe usarse dentro de StoreProvider');
  }
  return ctx;
}
