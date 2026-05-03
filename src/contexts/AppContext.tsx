import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  stock: number;
};

type Theme = "light" | "dark";

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQty: (productId: string, color: string | undefined, size: string | undefined, qty: number) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const sameItem = (a: CartItem, b: Pick<CartItem, "productId" | "selectedColor" | "selectedSize">) =>
  a.productId === b.productId && a.selectedColor === b.selectedColor && a.selectedSize === b.selectedSize;

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [theme, setTheme] = useState<Theme>("light");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedLang = (localStorage.getItem("royal_lang") as Lang) || "ar";
    const savedTheme = (localStorage.getItem("royal_theme") as Theme) || "light";
    const savedCart = localStorage.getItem("royal_cart");
    setLangState(savedLang);
    setTheme(savedTheme);
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch { /* noop */ }
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("royal_lang", lang);
  }, [lang]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("royal_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("royal_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((p) => sameItem(p, item));
      if (existing) {
        return prev.map((p) =>
          sameItem(p, item) ? { ...p, quantity: Math.min(p.quantity + item.quantity, p.stock) } : p
        );
      }
      return [...prev, item];
    });
  };

  const updateQty = (productId: string, color: string | undefined, size: string | undefined, qty: number) => {
    setCart((prev) =>
      prev.map((p) =>
        sameItem(p, { productId, selectedColor: color, selectedSize: size })
          ? { ...p, quantity: Math.max(1, Math.min(qty, p.stock)) }
          : p
      )
    );
  };

  const removeFromCart = (productId: string, color?: string, size?: string) => {
    setCart((prev) => prev.filter((p) => !sameItem(p, { productId, selectedColor: color, selectedSize: size })));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang: setLangState,
        theme,
        toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
        cart,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
