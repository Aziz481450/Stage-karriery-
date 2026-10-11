import { useEffect, useState } from 'react';
import api, { errMsg, photoUrl } from '../api';
import { useAuth } from '../AuthContext';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const initials = (n = '') => n.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function ProfileForm({ endpoint, title, fields }) {
  const { refresh } = useAuth();
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busyPhoto, setBusyPhoto] = useState(false);
  const [loadErr, setLoadErr] = useState('');

  const load = () => {
    setLoadErr('');
    api.get(endpoint).then((r) => setD(r.data)).catch((e) => setLoadErr(errMsg(e)));
  };
  useEffect(load, [endpoint]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusyPhoto(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('photo', f);
      const r = await api.post('/profil/photo', fd);
      setD((p) => ({ ...p, photo: r.data.photo }));
      await refresh();
      setMsg({ ok: 'Photo de profil mise à jour.' });
    } catch (x) { setMsg({ err: errMsg(x) }); }
    finally { setBusyPhoto(false); }
  };

  const removePhoto = async () => {
    setBusyPhoto(true); setMsg(null);
    try {
      await api.delete('/profil/photo');
      setD((p) => ({ ...p, photo: null }));
      await refresh();
      setMsg({ ok: 'Photo retirée.' });
    } catch (x) { setMsg({ err: errMsg(x) }); }
    finally { setBusyPhoto(false); }
  };

  if (loadErr) {
    return (
      <main className="page">
        <h1>{title}</h1>
        <div className="state">
          <b>Impossible de charger votre profil</b>
          <p className="err" role="alert">{loadErr}</p>
          <button type="button" className="ghost" onClick={load}>Réessayer</button>
        </div>
      </main>
    );
  }
  if (!d) return <Loader label="Chargement du profil…" />;

  const save = async (e) => {
    e.preventDefault(); setMsg(null);
    try { await api.put(endpoint, d); setMsg({ ok: 'Profil enregistré.' }); } catch (x) { setMsg({ err: errMsg(x) }); }
  };
  return (
    <main className="page"><h1>{title}</h1>
      <p className="muted pf-note">Ces informations personnalisent votre accompagnement et aident l’analyse de vos CV par l’IA.</p>
      <div className="photo-row">
        <span className="photo-av">
          {d.photo ? <img src={photoUrl({ id: d.user_id || d.id, photo: d.photo })} alt="" /> : initials(d.nom)}
        </span>
        <div className="photo-actions">
          <label className="ghost sm photo-pick">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onPhoto} hidden />
            {busyPhoto ? 'Envoi…' : d.photo ? 'Changer la photo' : 'Ajouter une photo'}
          </label>
          {d.photo && <button type="button" className="ghost sm" onClick={removePhoto} disabled={busyPhoto}>Retirer</button>}
          <p className="muted">JPG, PNG ou WEBP — 2 Mo maximum.</p>
        </div>
      </div>
      <form className="grid" onSubmit={save}>
        <label>Nom complet<input value={d.nom || ''} onChange={(e) => setD({ ...d, nom: e.target.value })} /></label>
        <label>Email<input value={d.email || ''} disabled /></label>
        {fields.map(({ k, label, type = 'text', wide }) => (
          <label key={k} className={wide ? 'wide' : ''}>{label}
            {type === 'textarea' ? <textarea rows="4" value={d[k] ?? ''} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
            : type === 'check' ? <input type="checkbox" checked={!!d[k]} onChange={(e) => setD({ ...d, [k]: e.target.checked ? 1 : 0 })} />
            : <input type={type} value={d[k] ?? ''} onChange={(e) => setD({ ...d, [k]: e.target.value })} />}
          </label>))}
        <div className="wide">
          {msg && <Toast text={msg.err || msg.ok} type={msg.err ? 'err' : 'ok'} onDone={() => setMsg(null)} />}
          <button className="cta">Enregistrer le profil</button></div>
      </form></main>);
}