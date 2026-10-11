import { useEffect, useState } from 'react';
import api from '../api';
import { useSocket } from './Socket';

const date = (d) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export default function Bell() {
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [count, setCount] = useState(0);

  const load = async () => {
    try {
      const [l, c] = await Promise.all([api.get('/notifications'), api.get('/notifications/unread-count')]);
      setItems(l.data.items);
      setCount(Number(c.data.count) || 0);
    } catch { setItems([]); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const h = () => { setCount((c) => c + 1); load(); };
    const maj = () => load();
    socket.on('new_notification', h);
    socket.on('notifications_maj', maj);
    return () => { socket.off('new_notification', h); socket.off('notifications_maj', maj); };
  }, [socket]);

  const markAll = async () => { await api.post('/notifications/lues'); load(); };
  const markOne = async (id) => { await api.put(`/notifications/${id}/read`); load(); };

  return (
    <div className="bell-wrap">
      <button type="button" className="bell" aria-label="Notifications" onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {count > 0 && <span className="bell-n">{count}</span>}
      </button>
      {open && (
        <div className="bell-drop">
          <div className="bell-head">
            <strong>Notifications</strong>
            <button type="button" className="link" onClick={markAll}>Tout marquer lu</button>
          </div>
          {items === null
            ? <p className="muted pad-sm">Chargement…</p>
            : items.length === 0
              ? <p className="muted pad-sm">Aucune notification.</p>
              : items.map((n) => (
                <button type="button" key={n.id} className={`bell-item${n.lue ? ' lue' : ''}`} onClick={() => !n.lue && markOne(n.id)}>
                  <span className="bell-box">
                    <strong>{n.titre}</strong>
                    <span className="muted">{n.message}</span>
                    <time className="muted">{date(n.created_at)}</time>
                  </span>
                </button>
              ))}
        </div>
      )}
    </div>
  );
}