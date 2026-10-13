import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const DEFAULT_STORE = {
  name: 'HBK',
  tagline: '',
  address: '',
  city: '',
  phone: '',
  whatsapp: '',
  email: '',
  hours: [],
  currency: 'Rs',
  freeShippingMin: 3000,
  shippingFee: 250,
  mapQuery: '',
};

const Ctx = createContext(null);

// Loads store details, home page banners and categories once for the whole app
export function StoreProvider({ children }) {
  const [state, setState] = useState({ store: DEFAULT_STORE, offers: [], categories: [], loading: true, error: null });

  useEffect(() => {
    Promise.all([api.get('/store'), api.get('/categories')])
      .then(([s, c]) =>
        setState({ store: { ...DEFAULT_STORE, ...s.store }, offers: s.offers, categories: c.categories, loading: false, error: null })
      )
      .catch((error) => setState((st) => ({ ...st, loading: false, error })));
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
