import { APP_PREFIX } from "@/config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = `${APP_PREFIX}:cart`;

export interface CartItem {
  containerId: string;
  productIndex: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  currency?: string;
  color?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (containerId: string, productIndex: number, color?: string) => void;
  updateQuantity: (containerId: string, productIndex: number, qty: number, color?: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function itemKey(item: { containerId: string; productIndex: number; color?: string }) {
  return `${item.containerId}-${item.productIndex}-${item.color ?? ""}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setItems(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, qty = 1) => {
      setItems((prev) => {
        const key = itemKey(item);
        const idx = prev.findIndex((i) => itemKey(i) === key);
        let next: CartItem[];
        if (idx >= 0) {
          next = prev.map((i, index) =>
            index === idx ? { ...i, quantity: i.quantity + qty } : i,
          );
        } else {
          next = [...prev, { ...item, quantity: qty }];
        }
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback(
    (containerId: string, productIndex: number, color?: string) => {
      const key = `${containerId}-${productIndex}-${color ?? ""}`;
      setItems((prev) => {
        const next = prev.filter((i) => itemKey(i) !== key);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (containerId: string, productIndex: number, qty: number, color?: string) => {
      if (qty < 1) return;
      const key = `${containerId}-${productIndex}-${color ?? ""}`;
      setItems((prev) => {
        const next = prev.map((i) =>
          itemKey(i) === key ? { ...i, quantity: qty } : i,
        );
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
