import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const Ctx = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);

  // Load the saved list when someone logs in, clear it when they log out
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    api
      .get('/wishlist')
      .then((d) => setItems(d.items))
      .catch(() => {});
  }, [user]);

  const ids = useMemo(() => new Set(items.map((p) => p.id)), [items]);

  // Add or remove. Sends logged-out visitors to the login page first.
  const toggle = useCallback(
    async (product) => {
      if (!user) {
        navigate('/login', {
          state: { from: location.pathname + location.search, notice: 'Log in to save items to your wishlist.' },
        });
        return;
      }
      try {
        const d = ids.has(product.id) ? await api.del(`/wishlist/${product.id}`) : await api.post(`/wishlist/${product.id}`);
        setItems(d.items);
        toast.success(ids.has(product.id) ? 'Removed from wishlist' : 'Saved to wishlist');
      } catch (e) {
        toast.error(e.message);
      }
    },
    [user, ids, navigate, location, toast]
  );

  const value = useMemo(() => ({ items, has: (id) => ids.has(id), toggle }), [items, ids, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWishlist = () => useContext(Ctx);
