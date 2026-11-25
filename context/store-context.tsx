'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import seedStore from '@/data/store.json';
import { apiFetch } from '@/lib/api';
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

const DEFAULT_SETTINGS: StoreSettings = {
  whatsappNumber: seedStore.settings?.whatsappNumber || '5491157124625',
  deliveryCost: Number(seedStore.settings?.deliveryCost ?? 2500),
  freeDeliveryThreshold: Number(seedStore.settings?.freeDeliveryThreshold ?? 65000),
  sameDayDeliveryCutoff: seedStore.settings?.sameDayDeliveryCutoff || '17:00',
  isOpenOverride: (seedStore.settings?.isOpenOverride as 'auto' | 'open' | 'closed') || 'auto',
  announcement: seedStore.settings?.announcement || '',
  categories: (seedStore.settings?.categories as CategoryItem[]) || DEFAULT_CATEGORIES,
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedStore.products as Product[]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCatalog = useCallback(async () => {
    try {
      const [prodRes, setRes] = await Promise.all([
        apiFetch('/api/products'),
        apiFetch('/api/settings'),
      ]);
      if (prodRes.ok) {
        const data = await prodRes.json();
        if (Array.isArray(data.products)) {
          setProducts(data.products);
        }
      }
      if (setRes.ok) {
        const data = await setRes.json();
        if (data.settings) {
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
      // Fallback silencioso a datos locales seed si el backend no responde aun
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const res = await apiFetch('/api/pedidos');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.pedidos)) {
          setOrders(data.pedidos);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshCatalog();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshCatalog]);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    const res = await apiFetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'No se pudo crear el producto');
    }
    const data = await res.json();
    if (data.product) {
      setProducts((prev) => [data.product, ...prev]);
      return data.product;
    }
    return null;
  }, []);

  const updateProduct = useCallback(async (product: Product): Promise<Product | null> => {
    const res = await apiFetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'No se pudo actualizar el producto');
    }
    const data = await res.json();
    if (data.product) {
      setProducts((prev) => prev.map((p) => (p.id === data.product.id ? data.product : p)));
      return data.product;
    }
    return null;
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) return false;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return true;
  }, []);

  const updateProductStock = useCallback(
    async (productId: string, payload: { variantId?: string; inStock?: boolean; stockQuantity?: number }) => {
      const res = await apiFetch('/api/stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...payload }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          setProducts((prev) => prev.map((p) => (p.id === data.product.id ? data.product : p)));
        }
      }
    },
    []
  );

  const bulkImportCsv = useCallback(async (csvText: string): Promise<BulkImportResponse> => {
    const res = await apiFetch('/api/products/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Error importando archivo CSV');
    }
    if (Array.isArray(data.products)) {
      setProducts(data.products);
    }
    if (Array.isArray(data.categories)) {
      setSettings((prev) => ({ ...prev, categories: data.categories }));
    }
    return {
      success: Boolean(data.success),
      created: Number(data.created || 0),
      updated: Number(data.updated || 0),
      errors: Array.isArray(data.errors) ? data.errors : [],
    };
  }, []);

  const bulkUpdatePrices = useCallback(
    async (payload: {
      percent: number;
      category?: string;
      brand?: string;
      rounding?: 'none' | '10' | '50' | '100';
    }): Promise<BulkPriceResponse> => {
      const res = await apiFetch('/api/products/bulk-price-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo aplicar el aumento masivo');
      }
      if (Array.isArray(data.products)) {
        setProducts(data.products);
      }
      return {
        success: Boolean(data.success),
        updatedCount: Number(data.updatedCount || 0),
      };
    },
    []
  );

  const createOrder = useCallback(async (orderPayload: Partial<Order>): Promise<Order | null> => {
    const res = await apiFetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'No se pudo registrar el pedido');
    }
    if (data.pedido) {
      setOrders((prev) => [data.pedido, ...prev]);
      return data.pedido;
    }
    return null;
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus, deliveryNotes?: string) => {
    const res = await apiFetch(`/api/pedidos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(deliveryNotes !== undefined ? { deliveryNotes } : {}) }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.pedido) {
        setOrders((prev) => prev.map((o) => (o.id === id ? data.pedido : o)));
      }
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<StoreSettings>) => {
    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    }
  }, []);

  const addCategory = useCallback(
    async (category: CategoryItem) => {
      const nextCategories = [...settings.categories, category];
      await updateSettings({ categories: nextCategories });
    },
    [settings.categories, updateSettings]
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        categories: settings.categories?.length ? settings.categories : DEFAULT_CATEGORIES,
        settings,
        orders,
        isLoading,
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
