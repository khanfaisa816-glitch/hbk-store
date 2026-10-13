import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';

const KEY = 'hbk_cart';
const MAX_PER_ITEM = 20;
const Ctx = createContext(null);

function load() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

// The cart lives in the browser (localStorage). The server checks every price and the
// stock again when the order is placed, so the browser copy cannot be used to cheat.
export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((product, quantity = 1) => {
    if (product.stock <= 0) return false;
    setItems((list) => {
      const limit = Math.min(product.stock, MAX_PER_ITEM);
      const existing = list.find((i) => i.productId === product.id);
      if (existing) {
        return list.map((i) =>
          i.productId === product.id ? { ...i, stock: product.stock, quantity: Math.min(i.quantity + quantity, limit) } : i
        );
      }
      return [
        ...list,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          emoji: product.emoji,
          image: product.image,
          categorySlug: product.category.slug,
          stock: product.stock,
          quantity: Math.min(quantity, limit),
        },
      ];
    });
    return true;
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((list) =>
      list.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock, MAX_PER_ITEM)) } : i))
    );
  }, []);

  const remove = useCallback((productId) => setItems((list) => list.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  // Refreshes prices and stock from the server (used when the cart page opens).
  // Returns a list of messages about things that changed.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const sync = useCallback(async () => {
    const current = itemsRef.current;
    const notes = [];

    // product: the fresh data, null = no longer sold, undefined = could not check (network problem)
    const checked = await Promise.all(
      current.map(async (item) => {
        try {
          return { item, product: (await api.get(`/products/${item.productId}`)).product };
        } catch (e) {
          return { item, product: e.status === 404 ? null : undefined };
        }
      })
    );

    const next = [];
    for (const { item, product } of checked) {
      if (product === undefined) {
        next.push(item);
        continue;
      }
      if (product === null || product.stock === 0) {
        notes.push(`${item.name} is no longer available and was removed.`);
        continue;
      }
      if (product.price !== item.price) {
        notes.push(`The price of ${product.name} changed to Rs ${product.price.toLocaleString('en-PK')}.`);
      }
      const quantity = Math.min(item.quantity, product.stock, MAX_PER_ITEM);
      if (quantity < item.quantity) notes.push(`Only ${product.stock} of ${product.name} left. Quantity updated.`);
      next.push({
        ...item,
        name: product.name,
        slug: product.slug,
        price: product.price,
        emoji: product.emoji,
        image: product.image,
        stock: product.stock,
        quantity,
      });
    }
    setItems(next);
    return notes;
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      sync,
    }),
    [items, add, setQuantity, remove, clear, sync]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx);
