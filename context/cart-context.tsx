'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartItem, Product, ProductVariant } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, variant?: ProductVariant | null, quantity?: number, notes?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  hasConsultItems: boolean;
}

const STORAGE_KEY = 'mica_cart_v1';
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch {}
      hydratedRef.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addToCart = useCallback(
    (product: Product, variant?: ProductVariant | null, quantity = 1, notes?: string) => {
      const qty = Math.max(1, Math.round(quantity));
      const cartItemId = `${product.id}::${variant ? variant.id : 'base'}`;
      const price = variant ? Number(variant.price || 0) : Number(product.price || 0);
      const sku = variant?.sku || product.sku;

      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.id === cartItemId);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: next[existingIdx].quantity + qty,
            price,
            notes: notes ?? next[existingIdx].notes,
          };
          return next;
        }
        return [
          ...prev,
          {
            id: cartItemId,
            productId: product.id,
            sku,
            name: product.name,
            brand: product.brand,
            variantId: variant?.id,
            variantLabel: variant?.label,
            unit: product.unit || 'unidad',
            price: product.priceOnRequest ? 0 : price,
            priceOnRequest: Boolean(product.priceOnRequest),
            quantity: qty,
            notes,
            image: product.image,
          },
        ];
      });
    },
    []
  );

  const removeFromCart = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== cartItemId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === cartItemId ? { ...i, quantity: Math.round(quantity) } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.priceOnRequest ? 0 : i.price * i.quantity), 0);
  const hasConsultItems = items.some((i) => i.priceOnRequest);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        hasConsultItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return ctx;
}
