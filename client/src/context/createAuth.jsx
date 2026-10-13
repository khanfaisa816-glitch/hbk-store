import { createContext, useContext, useEffect, useState } from 'react';

// Builds a login system for one API client. Used twice:
// once for shop customers and once for the admin panel (they are kept separate).
export function createAuth(client, { loginPath, role }) {
  const Ctx = createContext(null);

  function Provider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(Boolean(client.getToken()));

    useEffect(() => {
      client.onUnauthorized = () => setUser(null);
      if (!client.getToken()) return;
      client
        .get('/auth/me')
        .then((d) => {
          if (d.user.role === role) setUser(d.user);
          else client.setToken(null);
        })
        .catch(() => client.setToken(null))
        .finally(() => setLoading(false));
    }, []);

    const startSession = (d) => {
      client.setToken(d.token);
      setUser(d.user);
      return d.user;
    };

    const value = {
      user,
      loading,
      setUser,
      login: async (email, password) => startSession(await client.post(loginPath, { email, password })),
      register: async (form) => startSession(await client.post('/auth/register', form)),
      logout: () => {
        client.setToken(null);
        setUser(null);
      },
    };
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  return { Provider, useAuth: () => useContext(Ctx) };
}
