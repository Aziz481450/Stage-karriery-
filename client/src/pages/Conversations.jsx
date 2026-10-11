import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, photoUrl } from '../api';
import { useAuth } from '../AuthContext';
import { useSocket } from '../components/Socket';
import Icon from '../components/Icon';
import Loader from '../components/Loader';
import './messaging.css';

const initials = (n = '') => n.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const ago = (d) => {
  if (!d) return '';
  const h = (Date.now() - new Date(d)) / 36e5;
  if (h < 1) return 'à l’instant';
  if (h < 24) return `il y a ${Math.round(h)} h`;
  return new Date(d).toLocaleDateString('fr-FR');
};
const preview = (c) => (c || '').slice(0, 90) || 'Aucun échange — lancez la conversation !';

export default function Conversations() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  const load = () => api.get('/conversations').then((r) => { setRows(r.data); setErr(''); }).catch((e) => setErr(errMsg(e)));
  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const h = () => load();
    socket.on('new_notification', h);
    socket.on('notifications_maj', h);
    return () => { socket.off('new_notification', h); socket.off('notifications_maj', h); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const otherName = (r) => (user.role === 'candidat' ? r.redacteur_nom || 'Rédacteur' : r.candidat_nom || 'Candidat');
  const otherPhoto = (r) => {
    if (user.role === 'candidat') return photoUrl({ id: r.redacteur_id, photo: r.redacteur_photo });
    return photoUrl({ id: r.candidat_id, photo: r.candidat_photo });
  };
  const list = (rows || []).filter((r) => otherName(r).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="ms">
      <div className="ms-head">
        <div>
          <h1>Messagerie</h1>
          <p>Échangez directement avec {user.role === 'candidat' ? 'le rédacteur de votre dossier' : 'le candidat'} — les messages arrivent en temps réel.</p>
        </div>
      </div>

      <div className="ms-search">
        <Icon name="search" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une conversation…" aria-label="Rechercher une conversation" />
      </div>

      {err && (
        <div className="state">
          <p className="err" role="alert">{err}</p>
          <button className="ghost" onClick={load}>Réessayer</button>
        </div>
      )}
      {!err && !rows && [1, 2, 3].map((i) => <div key={i} className="ms-row sk" aria-hidden="true" />)}

      {!err && rows && list.length === 0 && (
        <div className="ms-empty">
          <p>{rows.length === 0
            ? (user.role === 'candidat' ? 'Aucune conversation. Déposez un CV : dès qu’un rédacteur accepte votre dossier, échangez ici.' : 'Aucune conversation. Acceptez une demande pour échanger avec le candidat.')
            : 'Aucun résultat pour cette recherche.'}</p>
        </div>
      )}

      <div className="ms-list">
        {rows && list.map((r) => {
          const av = otherPhoto(r);
          return (
            <Link to={`/demandes/${r.id}/messages`} className={`ms-row${r.non_lues ? ' hot' : ''}`} key={r.id}>
              <span className="ms-av">{av ? <img src={av} alt="" /> : initials(otherName(r))}</span>
              <span className="ms-main">
                <span className="ms-top">
                  <span className="ms-name">{otherName(r)}</span>
                  <span className="ms-time">{ago(r.dernier_at || r.created_at)}</span>
                </span>
                <span className="ms-prev">Dossier n°{r.id} · {preview(r.dernier)}</span>
              </span>
              {r.non_lues > 0 && <span className="ms-side"><span className="ms-badge">{r.non_lues}</span></span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
