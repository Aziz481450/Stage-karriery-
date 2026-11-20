import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { CATEGORIES, CATEGORY_LABEL, STATUT_LABEL, emptyForm, money, dateFr } from '../offresData';
import './offres.css';

export default function OffresManage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [rows, setRows] = useState(null);
  const [redacteurs, setRedacteurs] = useState([]);
  const [filters, setFilters] = useState({ q: '', categorie: '', statut: '' });
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => {
    setMsg(null);
    api.get('/offres/gestion/mine', { params: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })
      .then((r) => setRows(r.data))
      .catch((e) => setMsg({ err: errMsg(e) }));
  };
  useEffect(load, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAdmin) api.get('/admin/users', { params: { role: 'redacteur' } }).then((r) => setRedacteurs(r.data)).catch(() => {});
  }, [isAdmin]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setForm(emptyForm()); setEditing(null); setModal(true); };
  const openEdit = (o) => {
    setForm({
      titre: o.titre || '', entreprise: o.entreprise || '', categorie: o.categorie || 'frontend',
      lieu: o.lieu || '', salaire_min: o.salaire_min ?? '', salaire_max: o.salaire_max ?? '',
      niveau_experience: o.niveau_experience || '', description: o.description || '',
      exigences: o.exigences || '', statut: o.statut || 'ouverte', redacteur_id: o.redacteur_id || '',
    });
    setEditing(o.id); setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const payload = { ...form };
    if (!isAdmin) delete payload.redacteur_id;
    try {
      if (editing) await api.put(`/offres/${editing}`, payload);
      else await api.post('/offres', payload);
      setModal(false);
      setMsg({ ok: editing ? 'Offre mise à jour.' : 'Offre créée.' });
      load();
    } catch (err) { setMsg({ err: errMsg(err) }); }
    finally { setBusy(false); }
  };

  const toggle = async (o) => {
    const statut = o.statut === 'ouverte' ? 'fermee' : 'ouverte';
    try {
      await api.put(`/offres/${o.id}`, { statut });
      setMsg({ ok: `Offre ${statut === 'ouverte' ? 'rouverte' : 'fermée'}.` });
      load();
    } catch (e) { setMsg({ err: errMsg(e) }); }
  };

  const remove = async (o) => {
    if (!window.confirm(`Supprimer l'offre « ${o.titre} » ?`)) return;
    try {
      await api.delete(`/offres/${o.id}`);
      setMsg({ ok: 'Offre supprimée.' });
      load();
    } catch (e) { setMsg({ err: errMsg(e) }); }
  };

  return (
    <div className="offres">
      <div className="of-head">
        <div>
          <h1>{isAdmin ? 'Toutes les offres d’emploi' : 'Mes offres d’emploi'}</h1>
          <p>Créez, modifiez et suivez vos offres par spécialité.</p>
        </div>
        <button className="of-btn" onClick={openNew}><Icon name="plus" size={18} /> Nouvelle offre</button>
      </div>

      <div className="of-toolbar">
        <input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Rechercher (titre, entreprise, lieu)…" />
        <select value={filters.categorie} onChange={(e) => setFilters((f) => ({ ...f, categorie: e.target.value }))}>
          <option value="">Toutes les spécialités</option>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filters.statut} onChange={(e) => setFilters((f) => ({ ...f, statut: e.target.value }))}>
          <option value="">Tous les statuts</option>
          <option value="ouverte">Ouverte</option>
          <option value="fermee">Fermée</option>
        </select>
      </div>

      <div className="of-card">
        {rows === null ? <Loader /> : rows.length === 0 ? (
          <div className="of-empty">Aucune offre pour le moment. Créez votre première offre.</div>
        ) : (
          <div className="of-list">
            {rows.map((o) => (
              <article className="of-item" key={o.id}>
                <div className="of-item-top">
                  <div>
                    <h3>{o.titre}</h3>
                    <div className="of-co">{o.entreprise}{isAdmin && o.redacteur_nom ? ` · par ${o.redacteur_nom}` : ''}</div>
                  </div>
                  <span className={`of-chip ${o.statut === 'ouverte' ? 'ok' : 'warn'}`}>{STATUT_LABEL[o.statut] || o.statut}</span>
                </div>
                <div className="of-meta">
                  <span className="of-chip cat"><Icon name="brief" size={14} /> {CATEGORY_LABEL[o.categorie] || o.categorie}</span>
                  {o.lieu && <span className="of-chip"><Icon name="loc" size={14} /> {o.lieu}</span>}
                  {(o.salaire_min != null || o.salaire_max != null) && <span className="of-chip">{money(o.salaire_min)} – {money(o.salaire_max)}</span>}
                  {o.niveau_experience && <span className="of-chip">{o.niveau_experience}</span>}
                  <span className="of-chip"><Icon name="cal" size={14} /> {dateFr(o.created_at)}</span>
                </div>
                {o.description && <p className="of-desc">{o.description}</p>}
                <div className="of-actions">
                  <button className="of-btn ghost sm" onClick={() => openEdit(o)}><Icon name="edit" size={15} /> Modifier</button>
                  <button className="of-btn ghost sm" onClick={() => toggle(o)}>{o.statut === 'ouverte' ? 'Fermer' : 'Rouvrir'}</button>
                  <button className="of-btn danger sm" onClick={() => remove(o)}><Icon name="trash" size={15} /> Supprimer</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="of-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && !busy && setModal(false)}>
          <div className="of-modal" role="dialog" aria-modal="true" aria-label={editing ? 'Modifier l’offre' : 'Nouvelle offre'}>
            <div className="of-modal-head">
              <h2>{editing ? 'Modifier l’offre' : 'Nouvelle offre'}</h2>
              <button className="of-btn ghost sm" onClick={() => setModal(false)} aria-label="Fermer"><Icon name="x" size={16} /></button>
            </div>
            <form className="of-form" onSubmit={save}>
              <label>Titre *<input required minLength={3} maxLength={180} value={form.titre} onChange={(e) => set('titre', e.target.value)} /></label>
              <label>Entreprise *<input required minLength={2} maxLength={160} value={form.entreprise} onChange={(e) => set('entreprise', e.target.value)} /></label>
              <label>Spécialité *
                <select value={form.categorie} onChange={(e) => set('categorie', e.target.value)}>
                  {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label>Lieu<input maxLength={160} value={form.lieu} onChange={(e) => set('lieu', e.target.value)} placeholder="Tunis, remote…" /></label>
              <label>Salaire minimum (€)<input type="number" min="0" value={form.salaire_min} onChange={(e) => set('salaire_min', e.target.value)} /></label>
              <label>Salaire maximum (€)<input type="number" min="0" value={form.salaire_max} onChange={(e) => set('salaire_max', e.target.value)} /></label>
              <label>Niveau d’expérience<input maxLength={80} value={form.niveau_experience} onChange={(e) => set('niveau_experience', e.target.value)} placeholder="Junior, Senior…" /></label>
              <label>Statut
                <select value={form.statut} onChange={(e) => set('statut', e.target.value)}>
                  <option value="ouverte">Ouverte</option>
                  <option value="fermee">Fermée</option>
                </select>
              </label>
              {isAdmin && (
                <label className="full">Rédacteur responsable
                  <select value={form.redacteur_id} onChange={(e) => set('redacteur_id', e.target.value)}>
                    <option value="">Moi-même (administrateur)</option>
                    {redacteurs.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
                  </select>
                </label>
              )}
              <label className="full">Description *<textarea required minLength={10} maxLength={10000} value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
              <label className="full">Exigences / profil recherché<textarea maxLength={10000} value={form.exigences} onChange={(e) => set('exigences', e.target.value)} /></label>
              <div className="of-form-foot">
                <button type="button" className="of-btn ghost" onClick={() => setModal(false)}>Annuler</button>
                <button type="submit" className="of-btn" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
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
