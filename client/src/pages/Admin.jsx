import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import StatutBadge from '../components/StatutBadge';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const date = (d) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export default function Admin() {
  const [tab, setTab] = useState('stats');
  const [dash, setDash] = useState(null);
  const [users, setUsers] = useState(null);
  const [filtre, setFiltre] = useState('');
  const [demandes, setDemandes] = useState(null);
  const [news, setNews] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadStats = () => api.get('/admin/dashboard').then((r) => setDash(r.data)).catch((e) => setMsg({ err: errMsg(e) }));
  const loadUsers = () => api.get('/admin/users', { params: filtre ? { role: filtre } : {} }).then((r) => setUsers(r.data)).catch(() => {});
  const loadDemandes = () => api.get('/admin/demandes').then((r) => setDemandes(r.data)).catch(() => {});
  const loadNews = () => api.get('/admin/newsletter').then((r) => setNews(r.data)).catch(() => {});

  useEffect(() => { loadStats(); loadUsers(); loadDemandes(); loadNews(); }, []);

  const act = async (fn, okMessage) => {
    setMsg(null);
    try { await fn(); setMsg({ ok: okMessage }); loadUsers(); loadDemandes(); loadStats(); } catch (e) { setMsg({ err: errMsg(e) }); }
  };

  return (
    <main className="page">
      <h1>Administration</h1>
      <div className="tabs">
        <button type="button" className={tab === 'stats' ? 'on' : ''} onClick={() => setTab('stats')}>Vue d’ensemble</button>
        <button type="button" className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>Utilisateurs ({users ? users.length : '…'})</button>
        <button type="button" className={tab === 'demandes' ? 'on' : ''} onClick={() => setTab('demandes')}>Demandes ({demandes ? demandes.length : '…'})</button>
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
                          {u.statut === 'actif'
                            ? <button type="button" className="link" onClick={() => act(() => api.put(`/admin/users/${u.id}/cancel`), `Compte ${u.nom} annulé.`)}>Annuler</button>
                            : <button type="button" className="link" onClick={() => act(() => api.put(`/admin/users/${u.id}/activate`), `Compte ${u.nom} réactivé.`)}>Réactiver</button>}
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
          ? <p className="muted">Aucune demande.</p>
          : (
            <table className="tbl">
              <thead><tr><th>N°</th><th>Candidat</th><th>Rédacteur</th><th>Statut</th><th>Score</th><th>Date</th><th /></tr></thead>
              <tbody>
                {demandes.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td><td>{d.candidat_nom}</td><td>{d.redacteur_nom || '—'}</td>
                    <td><StatutBadge statut={d.statut} /></td>
                    <td>{Number.isFinite(Number(d.score)) ? `${Math.round(d.score)}/100` : '—'}</td>
                    <td className="muted">{date(d.created_at)}</td>
                    <td>
                      <select className="statut-select" defaultValue={d.statut}
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
    </main>
  );
}