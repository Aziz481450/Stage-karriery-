import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);
  const start = (d) => { localStorage.setItem('token', d.token); setUser(d.user); };
  const login = async (f) => start((await api.post('/auth/login', f)).data);
  const register = async (f) => start((await api.post('/auth/register', f)).data);
  const refresh = async () => { const r = await api.get('/auth/me'); setUser(r.data); return r.data; };
  const logout = async () => { try { await api.post('/auth/logout'); } catch {} localStorage.removeItem('token'); setUser(null); };
  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}
