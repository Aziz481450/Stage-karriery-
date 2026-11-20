import { useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { CATEGORY_LABEL, dateFr } from '../offresData';
import './offres.css';

const STATUTS = [
  ['', 'Tous les statuts'],
  ['en_attente', 'En attente'],
  ['acceptee', 'Acceptée'],
  ['refusee', 'Refusée'],
];
const CLASS = { en_attente: 'info', acceptee: 'ok', refusee: 'bad' };
const LABEL = { en_attente: 'En attente', acceptee: 'Acceptée', refusee: 'Refusée' };

export default function Candidatures() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [rows, setRows] = useState(null);
  const [statut, setStatut] = useState('');
  const [msg, setMsg] = useState(null);
  const [cvUrl, setCvUrl] = useState(null);
  const [cvTitle, setCvTitle] = useState('');
  const cvUrlRef = useRef(null);

  const load = () => {
    setMsg(null);
    api.get('/candidatures', { params: statut ? { statut } : {} })
      .then((r) => setRows(r.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  };
  useEffect(load, [statut]); // eslint-disable-line react-hooks/exhaustive-deps

  const decide = async (c, value) => {
    try {
      await api.put(`/candidatures/${c.id}/statut`, { statut: value });
      setMsg({ ok: `Candidature ${value === 'acceptee' ? 'acceptée' : 'refusée'}.` });
      load();
    } catch (e) { setMsg({ err: errMsg(e) }); }
  };

  // Un lien <a> n'envoie pas le JWT : on récupère le PDF via axios (intercepteur)
  // et on l'affiche dans un lecteur intégré à partir d'une URL blob locale.
  const viewCv = async (c) => {
    setMsg(null);
    try {
      const r = await api.get(`/candidatures/${c.id}/cv`, { responseType: 'blob' });
      if (cvUrlRef.current) URL.revokeObjectURL(cvUrlRef.current);
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      cvUrlRef.current = url;
      setCvTitle(`${c.candidat_nom} — ${c.offre_titre}`);
      setCvUrl(url);
    } catch (e) { setMsg({ err: errMsg(e) }); }
  };

  const closeCv = () => {
    if (cvUrlRef.current) { URL.revokeObjectURL(cvUrlRef.current); cvUrlRef.current = null; }
    setCvUrl(null);
  };

  const pending = rows ? rows.filter((c) => c.statut === 'en_attente').length : 0;

  return (
    <div className="offres">
      <div className="of-head">
        <div>
          <h1>{isAdmin ? 'Toutes les candidatures' : 'Candidatures reçues'}</h1>
          <p>{pending} candidature{pending > 1 ? 's' : ''} en attente de décision.</p>
        </div>
      </div>

      <div className="of-toolbar">
        <select value={statut} onChange={(e) => setStatut(e.target.value)}>
          {STATUTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="of-card">
        {rows === null ? <Loader /> : rows.length === 0 ? (
          <div className="of-empty">Aucune candidature pour le moment.</div>
        ) : (
          <div className="of-list">
            {rows.map((c) => (
              <article className="of-item" key={c.id}>
                <div className="of-item-top">
                  <div>
                    <h3>{c.offre_titre}</h3>
                    <div className="of-co">
                      {c.offre_entreprise} · Candidat : <b>{c.candidat_nom}</b>
                      {isAdmin && c.offre_redacteur_nom ? ` · Rédacteur : ${c.offre_redacteur_nom}` : ''}
                    </div>
                  </div>
                  <span className={`of-chip ${CLASS[c.statut] || ''}`}>{LABEL[c.statut] || c.statut}</span>
                </div>
                <div className="of-meta">
                  <span className="of-chip cat"><Icon name="brief" size={14} /> {CATEGORY_LABEL[c.offre_categorie] || c.offre_categorie}</span>
                  {c.cv_titre && <span className="of-chip">Poste visé : {c.cv_titre}</span>}
                  {c.cv_score != null && <span className="of-chip">Score CV : {Math.round(c.cv_score)}</span>}
                  <span className="of-chip"><Icon name="cal" size={14} /> {dateFr(c.created_at)}</span>
                </div>
                <p className="of-msg">{c.message}</p>
                <div className="of-actions">
                  <button type="button" className="of-btn ghost sm" onClick={() => viewCv(c)}>
                    <Icon name="files" size={15} /> Voir le CV
                  </button>
                  {c.statut !== 'acceptee' && (
                    <button className="of-btn sm" onClick={() => decide(c, 'acceptee')}><Icon name="check" size={15} /> Accepter</button>
                  )}
                  {c.statut !== 'refusee' && (
                    <button className="of-btn ghost sm" onClick={() => decide(c, 'refusee')}><Icon name="x" size={15} /> Refuser</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {cvUrl && (
        <div className="of-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && closeCv()}>
          <div className="of-modal cv-modal" role="dialog" aria-modal="true" aria-label="CV du candidat">
            <div className="of-modal-head">
              <div>
                <h2>CV du candidat</h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>{cvTitle}</p>
              </div>
              <button className="of-btn ghost sm" onClick={closeCv} aria-label="Fermer"><Icon name="x" size={16} /></button>
            </div>
            <iframe className="cv-frame" src={cvUrl} title="CV du candidat" />
          </div>
        </div>
      )}

      {msg?.err && <Toast text={msg.err} type="err" onDone={() => setMsg(null)} />}
      {msg?.ok && <Toast text={msg.ok} onDone={() => setMsg(null)} />}
    </div>
  );
}
