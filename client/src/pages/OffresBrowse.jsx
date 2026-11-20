import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import Icon from '../components/Icon';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { CATEGORIES, CATEGORY_LABEL, money, dateFr } from '../offresData';
import './offres.css';

const APP_LABEL = { en_attente: 'Candidature en attente', acceptee: 'Candidature acceptée', refusee: 'Candidature refusée' };
const APP_CLASS = { en_attente: 'info', acceptee: 'ok', refusee: 'bad' };

export default function OffresBrowse() {
  const [rows, setRows] = useState(null);
  const [apps, setApps] = useState({});
  const [dossiers, setDossiers] = useState(null);
  const [applyOffre, setApplyOffre] = useState(null);
  const [form, setForm] = useState({ demande_id: '', message: '' });
  const [filters, setFilters] = useState({ q: '', categorie: '' });
  const [open, setOpen] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadOffers = () => {
    setMsg(null);
    api.get('/offres', { params: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })
      .then((r) => setRows(r.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  };
  const loadApps = () => {
    api.get('/candidatures')
      .then((r) => setApps(Object.fromEntries(r.data.map((a) => [a.offre_id, a]))))
      .catch(() => {});
  };

  useEffect(loadOffers, [filters]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(loadApps, []);

  const openApply = (o) => {
    setApplyOffre(o);
    setForm({ demande_id: '', message: '' });
    setMsg(null);
    if (!dossiers) api.get('/candidat/demandes').then((r) => setDossiers(r.data)).catch((e) => setMsg({ err: errMsg(e) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api.post(`/offres/${applyOffre.id}/candidatures`, form);
      setApplyOffre(null);
      setMsg({ ok: 'Candidature envoyée !' });
      loadApps();
    } catch (err) { setMsg({ err: errMsg(err) }); }
    finally { setBusy(false); }
  };

  return (
    <div className="offres">
      <div className="of-head">
        <div>
          <h1>Offres d’emploi</h1>
          <p>Découvrez les opportunités ouvertes par nos recruteurs et postulez avec un de vos CV.</p>
        </div>
      </div>

      <div className="of-toolbar">
        <input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Rechercher (titre, entreprise, lieu)…" />
        <select value={filters.categorie} onChange={(e) => setFilters((f) => ({ ...f, categorie: e.target.value }))}>
          <option value="">Toutes les spécialités</option>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="of-card">
        {rows === null ? <Loader /> : rows.length === 0 ? (
          <div className="of-empty">Aucune offre ouverte pour le moment. Revenez bientôt !</div>
        ) : (
          <div className="of-list">
            {rows.map((o) => {
              const app = apps[o.id];
              return (
                <article className="of-item" key={o.id}>
                  <div className="of-item-top">
                    <div>
                      <h3>{o.titre}</h3>
                      <div className="of-co">{o.entreprise}</div>
                    </div>
                    {app ? (
                      <span className={`of-chip ${APP_CLASS[app.statut] || ''}`}>{APP_LABEL[app.statut] || app.statut}</span>
                    ) : <span className="of-chip ok">Ouverte</span>}
                  </div>
                  <div className="of-meta">
                    <span className="of-chip cat"><Icon name="brief" size={14} /> {CATEGORY_LABEL[o.categorie] || o.categorie}</span>
                    {o.lieu && <span className="of-chip"><Icon name="loc" size={14} /> {o.lieu}</span>}
                    {(o.salaire_min != null || o.salaire_max != null) && <span className="of-chip">{money(o.salaire_min)} – {money(o.salaire_max)}</span>}
                    {o.niveau_experience && <span className="of-chip">{o.niveau_experience}</span>}
                    <span className="of-chip"><Icon name="cal" size={14} /> {dateFr(o.created_at)}</span>
                  </div>
                  <div className="of-apply">
                    <button className="of-btn ghost sm" onClick={() => setOpen((s) => ({ ...s, [o.id]: !s[o.id] }))}>
                      <Icon name={open[o.id] ? 'chev' : 'eye'} size={15} /> {open[o.id] ? 'Masquer' : 'Voir les détails'}
                    </button>
                    <button className="of-btn sm" disabled={!!app} onClick={() => openApply(o)}>
                      <Icon name={app ? 'check' : 'send'} size={15} /> {app ? 'Déjà postulé' : 'Postuler'}
                    </button>
                  </div>
                  {open[o.id] && (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {o.description && <p className="of-desc">{o.description}</p>}
                      {o.exigences && <p className="of-desc"><b>Profil recherché :</b> {o.exigences}</p>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {applyOffre && (
        <div className="of-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && !busy && setApplyOffre(null)}>
          <div className="of-modal" role="dialog" aria-modal="true" aria-label="Postuler à une offre">
            <div className="of-modal-head">
              <div>
                <h2>Postuler</h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>{applyOffre.titre} — {applyOffre.entreprise}</p>
              </div>
              <button className="of-btn ghost sm" onClick={() => setApplyOffre(null)} aria-label="Fermer"><Icon name="x" size={16} /></button>
            </div>
            <form className="of-form" onSubmit={submit}>
              <label className="full">Choisir un dossier (CV) *
                {dossiers === null ? <span className="muted">Chargement des dossiers…</span> : (
                  <select required value={form.demande_id} onChange={(e) => setForm((f) => ({ ...f, demande_id: e.target.value }))}>
                    <option value="" disabled>Sélectionnez un dossier</option>
                    {dossiers.length === 0 && <option value="" disabled>Aucun dossier avec CV — déposez d’abord un CV</option>}
                    {dossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.titre_poste || `Dossier #${d.id}`} — {dateFr(d.created_at)} ({d.statut})
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label className="full">Message de motivation *
                <textarea required minLength={10} maxLength={2000} value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Présentez brièvement votre motivation pour ce poste…" />
              </label>
              <div className="of-form-foot">
                <button type="button" className="of-btn ghost" onClick={() => setApplyOffre(null)}>Annuler</button>
                <button type="submit" className="of-btn" disabled={busy || dossiers === null}>{busy ? 'Envoi…' : 'Envoyer ma candidature'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {msg?.err && <Toast text={msg.err} type="err" onDone={() => setMsg(null)} />}
      {msg?.ok && <Toast text={msg.ok} onDone={() => setMsg(null)} />}
    </div>
  );
}
