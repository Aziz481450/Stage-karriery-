import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
export const API_BASE = api.defaults.baseURL;
export const photoUrl = (u) => (u && u.photo ? `${API_BASE}/users/${u.id}/photo?v=${encodeURIComponent(u.photo)}` : null);
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
export const errMsg = (e) => e.response?.data?.message || 'Impossible de joindre le serveur.';
export const download = async (url, filename = 'fichier') => {
  const r = await api.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
};
export const WS_URL = import.meta.env.VITE_WS_URL || undefined;
export default api;
