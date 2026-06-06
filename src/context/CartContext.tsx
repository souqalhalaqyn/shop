import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "@barbers-shop:cart";

export interface CartItem {
  containerId: string;
  productIndex: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (containerId: string, productIndex: number) => void;
  updateQuantity: (containerId: string, productIndex: number, qty: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

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
        const idx = prev.findIndex(
          (i) => i.containerId === item.containerId && i.productIndex === item.productIndex,
        );
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
    (containerId: string, productIndex: number) => {
      setItems((prev) => {
        const next = prev.filter(
          (i) => !(i.containerId === containerId && i.productIndex === productIndex),
        );
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (containerId: string, productIndex: number, qty: number) => {
      if (qty < 1) return;
      setItems((prev) => {
        const next = prev.map((i) =>
          i.containerId === containerId && i.productIndex === productIndex
            ? { ...i, quantity: qty }
            : i,
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

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
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
