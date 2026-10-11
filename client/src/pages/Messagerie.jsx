import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg, download, photoUrl } from '../api';
import { useAuth } from '../AuthContext';
import { useSocket } from '../components/Socket';
import Icon from '../components/Icon';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import './messaging.css';

const initials = (n = '') => n.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const hhmm = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const dayKey = (d) => new Date(d).toDateString();
const dayLabel = (d) => {
  const t = new Date(d);
  if (t.toDateString() === new Date().toDateString()) return 'Aujourd’hui';
  if (t.toDateString() === new Date(Date.now() - 864e5).toDateString()) return 'Hier';
  return t.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};
const MAX = 10 * 1024 * 1024;

export default function Messagerie() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [detail, setDetail] = useState(null);
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [err, setErr] = useState(null);
  const [sent, setSent] = useState(null);
  const fileRef = useRef(null);
  const boxRef = useRef(null);

  const scroll = () => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight }); };
  const push = (m) => setItems((prev) => {
    const p = prev || [];
    return p.some((x) => x.id === m.id) ? p : [...p, m];
  });

  const load = async () => {
    try {
      const [dt, ms] = await Promise.all([api.get(`/demandes/${id}`), api.get(`/demandes/${id}/messages`)]);
      setDetail(dt.data);
      setItems(ms.data);
      api.put(`/notifications/demande/${id}/lues`).catch(() => {});
    } catch (e) { setErr(errMsg(e)); }
  };
  useEffect(() => { load().then(scroll); }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_demande', Number(id));
    const onMsg = (m) => { push(m); setSent(null); scroll(); };
    const onTyping = (t) => { if (t.userId !== user.id) setTyping(t.isTyping); };
    socket.on('new_message', onMsg);
    socket.on('typing', onTyping);
    return () => { socket.off('new_message', onMsg); socket.off('typing', onTyping); socket.emit('leave_demande', Number(id)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, id]);

  const send = async (e) => {
    e.preventDefault();
    const f = fileRef.current?.files?.[0];
    const okText = text.trim();
    if (!okText && !f) return;
    if (f && f.size > MAX) { setSent({ err: 'Fichier trop lourd (10 Mo max).' }); return; }
    setBusy(true); setSent(null);
    try {
      const fd = new FormData();
      if (okText) fd.append('contenu', okText);
      if (f) fd.append('fichier', f);
      const r = await api.post(`/demandes/${id}/messages`, fd);
      push(r.data.messageRow);
      setText(''); if (fileRef.current) fileRef.current.value = '';
      socket?.emit('stop_typing', Number(id));
      scroll();
    } catch (x) { setSent({ err: errMsg(x) }); } finally { setBusy(false); }
  };

  const from = user.id;
  const isCand = user.role === 'candidat';
  const other = detail ? (isCand ? (detail.redacteur?.nom || 'Rédacteur') : (detail.candidat?.nom || 'Candidat')) : '';
  const oUser = detail ? (isCand ? detail.redacteur : detail.candidat) : null;
  const oAv = oUser ? photoUrl({ id: oUser.id, photo: oUser.photo }) : null;

  const typingNow = useRef(null);
  const ping = () => {
    if (typingNow.current) return;
    socket?.emit('typing', Number(id));
    typingNow.current = setTimeout(() => { socket?.emit('stop_typing', Number(id)); typingNow.current = null; }, 1200);
  };

  const rows = [];
  let lastDay = null; let lastSender = null;
  for (const m of items || []) {
    const dk = dayKey(m.created_at);
    if (dk !== lastDay) { rows.push({ t: 'day', key: `d${m.id}`, label: dayLabel(m.created_at) }); lastDay = dk; lastSender = null; }
    rows.push({ t: 'msg', key: m.id, m, me: Number(m.expediteur_id) === from, grp: lastSender === m.expediteur_id });
    lastSender = m.expediteur_id;
  }

  if (err) return <main className="page"><p className="err">{err}</p></main>;
  return (
    <main className="page">
      <div className="msc">
        <header className="msc-head">
          <Link to={`/${user.role}/messagerie`} className="msc-back" aria-label="Retour aux conversations"><Icon name="back" size={18} /></Link>
          <span className="msc-av">{oAv ? <img src={oAv} alt="" /> : initials(other)}</span>
          <span className="msc-name">
            <b>{other}</b>
            <small><span className="msc-on" /> Conversation · Dossier n°{id}</small>
          </span>
          <Link to={`/demandes/${id}`} className="msc-dossier">Voir le dossier</Link>
        </header>

        <div className="msc-body" ref={boxRef}>
          {items === null && <Loader size={64} />}
          {items && items.length === 0 && <p className="msc-empty">Aucun message pour l’instant. Lancez la conversation&nbsp;!</p>}
          {items && items.length > 0 && rows.map((r) => r.t === 'day'
            ? <div key={r.key} className="msc-day">{r.label}</div>
            : (
              <div key={r.key} className={`msc-msg${r.me ? ' me' : ''}${r.grp ? ' grp' : ''}`}>
                <span className="msc-ava">{r.me ? initials(user.nom) : initials(other)}</span>
                <div className="msc-bubble">
                  {r.m.contenu}
                  {r.m.fichier && (
                    <button type="button" className="msc-file" onClick={() => download(`/fichiers/${r.m.fichier.id}`, r.m.fichier.nom_original)}>
                      <Icon name="download" size={14} /> {r.m.fichier.nom_original} ({Math.round(r.m.fichier.taille / 1024)} Ko)
                    </button>
                  )}
                  <time>{hhmm(r.m.created_at)}</time>
                </div>
              </div>
            ))}
          {typing && (
            <div className="msc-msg">
              <span className="msc-ava">{initials(other)}</span>
              <div className="msc-bubble msc-typing"><span /><span /><span /></div>
            </div>
          )}
        </div>

        {sent?.err && <Toast text={sent.err} type="err" onDone={() => setSent(null)} />}

        <form className="msc-form" onSubmit={send}>
          <label className="msc-attach" title="Joindre un fichier (10 Mo max)">
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.txt" onChange={(e) => e.target.files?.[0] && setSent(null)} />
            <Icon name="clip" size={18} />
          </label>
          <textarea
            className="msc-input"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onInput={ping}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
            placeholder="Écrivez un message…"
            maxLength={2000}
          />
          <button className="msc-send" type="submit" disabled={busy} aria-label="Envoyer">
            <Icon name="send" size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
