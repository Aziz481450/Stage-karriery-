import { useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../api';
import Icon from '../components/Icon';
import StatutBadge from '../components/StatutBadge';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import './admin.css';

const date = (d) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export default function Admin() {
  const [tab, setTab] = useState('stats');
  const [dash, setDash] = useState(null);
  const [users, setUsers] = useState(null);
  const [filtre, setFiltre] = useState('');
  const [statutFiltre, setStatutFiltre] = useState('');
  const [search, setSearch] = useState('');
  const [demandes, setDemandes] = useState(null);
  const [news, setNews] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [dossierBusy, setDossierBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const pdfUrlRef = useRef(null);
  const [msg, setMsg] = useState(null);

  const loadStats = () => api.get('/admin/dashboard').then((r) => setDash(r.data)).catch((e) => setMsg({ err: errMsg(e) }));
  const userParams = () => {
    const p = {};
    if (filtre) p.role = filtre;
    if (statutFiltre) p.statut = statutFiltre;
    if (search.trim()) p.q = search.trim();
    return p;
  };
  const loadUsers = () => api.get('/admin/users', { params: userParams() }).then((r) => setUsers(r.data)).catch(() => {});
  const loadDemandes = () => api.get('/admin/demandes').then((r) => setDemandes(r.data)).catch(() => {});
  const loadNews = () => api.get('/admin/newsletter').then((r) => setNews(r.data)).catch(() => {});

  useEffect(() => { loadStats(); loadDemandes(); loadNews(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadUsers(); }, [filtre, statutFiltre, search]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current); }, []);

  const act = async (fn, okMessage) => {
    setMsg(null);
    try { await fn(); setMsg({ ok: okMessage }); loadUsers(); loadDemandes(); loadStats(); } catch (e) { setMsg({ err: errMsg(e) }); }
  };

  const closePdf = () => {
    if (pdfUrlRef.current) { URL.revokeObjectURL(pdfUrlRef.current); pdfUrlRef.current = null; }
    setPdfUrl(null);
  };

  const openDossier = async (id) => {
    setMsg(null);
    closePdf();
    setDossier(null);
    try {
      const r = await api.get(`/admin/demandes/${id}/dossier`);
      setDossier(r.data);
    } catch (e) { setMsg({ err: errMsg(e) }); }
  };

  const closeDossier = () => { closePdf(); setDossier(null); };

  const viewPdf = async (kind) => {
    if (!dossier) return;
    setMsg(null);
    try {
      const path = kind === 'ameliorer'
        ? `/demandes/${dossier.id}/cv-ameliorer`
        : `/demandes/${dossier.id}/cv`;
      const r = await api.get(path, { responseType: 'blob' });
      closePdf();
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      pdfUrlRef.current = url;
      setPdfTitle(kind === 'ameliorer'
        ? `CV amélioré — ${dossier.candidat_nom}`
        : `CV d’origine — ${dossier.candidat_nom}`);
      setPdfUrl(url);
    } catch (e) { setMsg({ err: errMsg(e) }); }
  };

  const improveCv = async () => {
    if (!dossier) return;
    setDossierBusy(true); setMsg(null);
    try {
      const r = await api.post(`/demandes/${dossier.id}/ameliorer-cv`);
      const fresh = await api.get(`/admin/demandes/${dossier.id}/dossier`);
      setDossier(fresh.data);
      setMsg({ ok: r.data.message });
      loadDemandes();
    } catch (e) { setMsg({ err: errMsg(e) }); }
    finally { setDossierBusy(false); }
  };

  const sendCv = async () => {
    if (!dossier) return;
    setSending(true); setMsg(null);
    try {
      const r = await api.post(`/admin/demandes/${dossier.id}/envoyer-cv`);
      const fresh = await api.get(`/admin/demandes/${dossier.id}/dossier`);
      setDossier(fresh.data);
      const suffix = r.data.mode === 'log' ? ' (mode test : email journalisé, SMTP non configuré)' : '';
      setMsg({ ok: r.data.message + suffix });
      loadDemandes();
    } catch (e) { setMsg({ err: errMsg(e) }); }
    finally { setSending(false); }
  };

  const recommandations = Array.isArray(dossier?.analyse?.recommandations) ? dossier.analyse.recommandations : [];

  return (
    <main className="page">
      <h1>Administration</h1>
      <div className="tabs">
        <button type="button" className={tab === 'stats' ? 'on' : ''} onClick={() => setTab('stats')}>Vue d’ensemble</button>
        <button type="button" className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>Utilisateurs ({users ? users.length : '…'})</button>
        <button type="button" className={tab === 'demandes' ? 'on' : ''} onClick={() => setTab('demandes')}>Dossiers candidats ({demandes ? demandes.length : '…'})</button>
        <button type="button" className={tab === 'news' ? 'on' : ''} onClick={() => setTab('news')}>Newsletter ({news ? news.length : '…'})</button>
      </div>
      {msg?.err && <Toast text={msg.err} type="err" onDone={() => setMsg(null)} />}
      {msg?.ok && <Toast text={msg.ok} type="ok" onDone={() => setMsg(null)} />}

      {tab === 'stats' && (dash === null
        ? <Loader size={64} />
        : (
          <div className="kpis">
            <div className="kpi"><span>Comptes actifs</span><strong>{dash.users.filter((u) => u.statut === 'actif').reduce((s, u) => s + u.n, 0)}</strong></div>
            <div className="kpi"><span>Candidats</span><strong>{dash.users.filter((u) => u.role === 'candidat').reduce((s, u) => s + u.n, 0)}</strong></div>
            <div className="kpi"><span>Rédacteurs</span><strong>{dash.users.filter((u) => u.role === 'redacteur').reduce((s, u) => s + u.n, 0)}</strong></div>
            <div className="kpi"><span>Rédacteurs à valider</span><strong>{dash.users.filter((u) => u.role === 'redacteur' && u.statut === 'en_attente').reduce((s, u) => s + u.n, 0)}</strong></div>
            <div className="kpi"><span>Score moyen</span><strong>{dash.scores.moyenne || 0}/100</strong></div>
          </div>
        ))}

      {tab === 'users' && (
        <div>
          <div className="roles admin-tabs">
            {['', 'candidat', 'redacteur', 'admin'].map((r) => (
              <button key={r || 'all'} type="button" className={filtre === r ? 'on' : ''} onClick={() => setFiltre(r)}>
                {r || 'Tous'}
              </button>
            ))}
          </div>
          <div className="admin-filters">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email…" aria-label="Rechercher un utilisateur" />
            <select value={statutFiltre} onChange={(e) => setStatutFiltre(e.target.value)} aria-label="Filtrer par statut">
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="actif">Actif</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          {users === null
            ? <Loader size={64} />
            : users.length === 0
              ? <p className="muted">Aucun utilisateur.</p>
              : (
                <table className="tbl">
                  <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Inscription</th><th /></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.nom}</td><td>{u.email}</td><td>{u.role}</td>
                        <td><StatutBadge statut={u.statut} /></td>
                        <td className="muted">{date(u.created_at)}</td>
                        <td>
                          {u.statut === 'en_attente' ? (
                            <>
                              <button type="button" className="link" onClick={() => act(() => api.put(`/admin/users/${u.id}/approve`), `Rédacteur ${u.nom} validé.`)}>Approuver</button>
                              {' · '}
                              <button type="button" className="link" onClick={() => act(() => api.put(`/admin/users/${u.id}/reject`), `Candidature de ${u.nom} refusée.`)}>Refuser</button>
                            </>
                          ) : u.statut === 'actif' ? (
                            <button type="button" className="link" onClick={() => act(() => api.put(`/admin/users/${u.id}/cancel`), `Compte ${u.nom} annulé.`)}>Annuler</button>
                          ) : (
                            <button type="button" className="link" onClick={() => act(() => api.put(`/admin/users/${u.id}/activate`), `Compte ${u.nom} réactivé.`)}>Réactiver</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
        </div>
      )}

      {tab === 'demandes' && (demandes === null
        ? <Loader size={64} />
        : demandes.length === 0
          ? <p className="muted">Aucun dossier.</p>
          : (
            <table className="tbl">
              <thead><tr>
                <th>N°</th><th>Candidat</th><th>Poste visé</th><th>Rédacteur</th>
                <th>Statut</th><th>Score</th><th>CV amélioré</th><th>Envoyé</th><th>Date</th><th />
              </tr></thead>
              <tbody>
                {demandes.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td><b>{d.candidat_nom}</b><br /><span className="muted">{d.candidat_email}</span></td>
                    <td>{d.cv_titre || d.titre_poste || '—'}</td>
                    <td>{d.redacteur_nom || '—'}</td>
                    <td><StatutBadge statut={d.statut} /></td>
                    <td>{Number.isFinite(Number(d.score)) ? `${Math.round(d.score)}/100` : '—'}</td>
                    <td>{d.cv_ameliorer_at ? <span className="tag ok">Prêt</span> : <span className="muted">—</span>}</td>
                    <td className="muted">{d.cv_envoye_at ? date(d.cv_envoye_at) : '—'}</td>
                    <td className="muted">{date(d.created_at)}</td>
                    <td>
                      <button type="button" className="link" onClick={() => openDossier(d.id)}>Ouvrir le dossier</button>
                      {' · '}
                      <select className="statut-select" defaultValue={d.statut}
                        aria-label={`Statut de la demande ${d.id}`}
                        onChange={(e) => act(() => api.put(`/admin/demandes/${d.id}/status`, { statut: e.target.value }), `Demande n° ${d.id} : ${e.target.value}.`)}>
                        {['en_attente', 'en_cours', 'terminee', 'annulee'].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

      {tab === 'news' && (news === null
        ? <Loader size={64} />
        : news.length === 0
          ? <p className="muted">Aucune inscription.</p>
          : (
            <table className="tbl">
              <thead><tr><th>Email</th><th>Date</th></tr></thead>
              <tbody>{news.map((n) => <tr key={n.id}><td>{n.email}</td><td className="muted">{date(n.created_at)}</td></tr>)}</tbody>
            </table>
          ))}

      {dossier && !pdfUrl && (
        <div className="admin-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && closeDossier()}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-label={`Dossier n° ${dossier.id}`}>
            <div className="admin-modal-head">
              <div>
                <h2>Dossier n° {dossier.id}</h2>
                <p className="muted">{dossier.candidat_nom} · {dossier.candidat_email}</p>
              </div>
              <button type="button" className="admin-icon-btn" onClick={closeDossier} aria-label="Fermer"><Icon name="x" size={17} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="dossier-grid">
                <div><span>Statut</span><b><StatutBadge statut={dossier.statut} /></b></div>
                <div><span>Score CV</span><b>{Number.isFinite(Number(dossier.score)) ? `${Math.round(dossier.score)}/100` : '—'}</b></div>
                <div><span>Poste visé</span><b>{dossier.cv_titre || dossier.titre_poste || '—'}</b></div>
                <div><span>Ville</span><b>{dossier.ville || '—'}</b></div>
                <div><span>Téléphone</span><b>{dossier.telephone || '—'}</b></div>
                <div><span>Niveau d’études</span><b>{dossier.niveau_etudes || '—'}</b></div>
                <div><span>Rédacteur</span><b>{dossier.redacteur_nom || 'Non assigné'}</b></div>
                <div><span>Créé le</span><b>{date(dossier.created_at)}</b></div>
              </div>

              {dossier.competences && <p className="dossier-line"><b>Compétences :</b> {dossier.competences}</p>}
              {dossier.bio && <p className="dossier-line"><b>Bio :</b> {dossier.bio}</p>}
              {recommandations.length > 0 && (
                <div className="dossier-line">
                  <b>Recommandations IA :</b>
                  <ul>{recommandations.map((r, i) => <li key={i}>{typeof r === 'string' ? r : JSON.stringify(r)}</li>)}</ul>
                </div>
              )}

              <div className="dossier-actions">
                <button type="button" className="admin-btn ghost" onClick={() => viewPdf('original')}>
                  <Icon name="files" size={15} /> Voir le CV d’origine
                </button>
                <button type="button" className="admin-btn ghost" disabled={!dossier.cv_ameliorer_at}
                  onClick={() => viewPdf('ameliorer')}>
                  <Icon name="files" size={15} /> Voir le CV amélioré
                </button>
                <button type="button" className="admin-btn" disabled={dossierBusy} onClick={improveCv}>
                  <Icon name="spark" size={15} /> {dossierBusy ? 'Amélioration en cours…' : dossier.cv_ameliorer_at ? 'Régénérer le CV (IA)' : 'Améliorer le CV (IA)'}
                </button>
                <button type="button" className="admin-btn primary" disabled={!dossier.cv_ameliorer_at || sending} onClick={sendCv}>
                  <Icon name="mail" size={15} /> {sending ? 'Envoi en cours…' : 'Envoyer le CV amélioré par email'}
                </button>
              </div>

              {dossier.cv_envoye_at && (
                <p className="ok" style={{ marginTop: 14 }}>Dernier envoi : {date(dossier.cv_envoye_at)} à {dossier.candidat_email}</p>
              )}
              <p className="muted" style={{ margin: '12px 0 0', fontSize: 12 }}>
                L’envoi utilise la configuration SMTP du serveur. Sans SMTP configuré, l’email est journalisé en mode test.
              </p>
            </div>
          </div>
        </div>
      )}

      {pdfUrl && (
        <div className="admin-modal-bg pdf" onMouseDown={(e) => e.target === e.currentTarget && closePdf()}>
          <div className="admin-modal pdf" role="dialog" aria-modal="true" aria-label={pdfTitle}>
            <div className="admin-modal-head">
              <h2>{pdfTitle}</h2>
              <button type="button" className="admin-icon-btn" onClick={closePdf} aria-label="Fermer"><Icon name="x" size={17} /></button>
            </div>
            <iframe className="admin-pdf-frame" src={pdfUrl} title={pdfTitle} />
          </div>
        </div>
      )}
    </main>
  );
}
