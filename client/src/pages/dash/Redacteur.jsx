import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../api';
import { useAuth } from '../../AuthContext';
import { LABEL } from '../../components/Badge';
import Icon from '../../components/Icon';
import Toast from '../../components/Toast';
import Sollicitation from '../../components/Sollicitation';
import Metric from '../../components/Metric';
import StatusBadge from '../../components/StatusBadge';
import BarChart from '../../components/charts/BarChart';
import AreaChart from '../../components/charts/AreaChart';
import Gauge from '../../components/charts/Gauge';
import { useSocket } from '../../components/Socket';
import '../dashboard.css';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const FILTERS = [['tous', 'Tous'], ['en_cours', 'En cours'], ['terminee', 'Terminé'], ['annulee', 'Annulé']];
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR');

const bucketKey = (date, mode) => {
  const y = date.getFullYear(), m = date.getMonth();
  if (mode === 'mensuel') return `M${y}-${m}`;
  if (mode === 'trimestriel') return `Q${y}-${Math.floor(m / 3)}`;
  return `A${y}`;
};
const makeBuckets = (mode, now) => {
  const arr = [];
  if (mode === 'mensuel') for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); arr.push({ key: bucketKey(d, mode), label: MONTHS[d.getMonth()], count: 0 }); }
  if (mode === 'trimestriel') { const q = Math.floor(now.getMonth() / 3); for (let i = 7; i >= 0; i--) { const d = new Date(now.getFullYear(), (q - i) * 3, 1); arr.push({ key: bucketKey(d, mode), label: `T${Math.floor(d.getMonth() / 3) + 1} ${String(d.getFullYear()).slice(2)}`, count: 0 }); } }
  if (mode === 'annuel') for (let i = 5; i >= 0; i--) { const y = now.getFullYear() - i; arr.push({ key: `A${y}`, label: String(y), count: 0 }); }
  return arr;
};

export default function Redacteur() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [rows, setRows] = useState(null);
  const [sols, setSols] = useState(null);
  const [prof, setProf] = useState(null);
  const [err, setErr] = useState('');
  const [filtre, setFiltre] = useState('tous');
  const [q, setQ] = useState('');
  const [periode, setPeriode] = useState('mensuel');
  const [busyAvail, setBusyAvail] = useState(false);
  const [busyTerm, setBusyTerm] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => {
    api.get('/demandes').then((r) => { setRows(r.data); setErr(''); }).catch((e) => setErr(errMsg(e)));
    return api.get('/redacteur/demandes/en-attente').then((r) => setSols(r.data)).catch(() => {});
  };
  useEffect(() => {
    load();
    api.get('/redacteur/profil').then((r) => setProf(r.data)).catch(() => {});
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 6000);
    const onFocus = () => document.visibilityState === 'visible' && load();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;
    const h = () => load();
    socket.on('demande_disponible', h);
    socket.on('demande_prise', h);
    socket.on('demande_statut', h);
    return () => { socket.off('demande_disponible', h); socket.off('demande_prise', h); socket.off('demande_statut', h); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const data = rows || [];
  const stats = useMemo(() => {
    const sc = data.filter((x) => x.score != null);
    return {
      total: data.length,
      cours: data.filter((x) => x.statut === 'en_cours').length,
      fin: data.filter((x) => x.statut === 'terminee').length,
      att: data.filter((x) => x.statut === 'en_attente').length,
      ann: data.filter((x) => x.statut === 'annulee').length,
      moy: sc.length ? Math.round(sc.reduce((a, b) => a + Number(b.score), 0) / sc.length) : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const visibles = useMemo(() => data.filter((r) =>
    (filtre === 'tous' || r.statut === filtre) &&
    `${r.id} ${r.titre_poste || ''} ${r.candidat_nom || ''} ${r.ville || ''}`.toLowerCase().includes(q.toLowerCase())
  ), [rows, filtre, q]);
  const count = (s) => data.filter((r) => r.statut === s).length;

  const avancement = stats.total ? Math.round((stats.fin / stats.total) * 100) : 0;

  const histo = useMemo(() => {
    const buckets = makeBuckets('mensuel', new Date());
    const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
    data.forEach((r) => { const k = bucketKey(new Date(r.created_at), 'mensuel'); if (k in idx) buckets[idx[k]].count++; });
    return { data: buckets.map((b) => b.count), labels: buckets.map((b) => b.label) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const evolution = useMemo(() => {
    const buckets = makeBuckets(periode, new Date());
    const sums = new Map(buckets.map((b) => [b.key, { s: 0, n: 0 }]));
    data.filter((r) => r.score != null).forEach((r) => {
      const k = bucketKey(new Date(r.created_at), periode);
      const b = sums.get(k); if (b) { b.s += Number(r.score); b.n++; }
    });
    return {
      data: buckets.map((b) => { const v = sums.get(b.key); return v.n ? Math.round(v.s / v.n) : 0; }),
      labels: buckets.map((b) => b.label),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, periode]);

  const setDispo = async (v) => {
    setBusyAvail(true);
    try {
      await api.put('/redacteur/profil', { disponible: v ? 1 : 0 });
      setProf((p) => ({ ...p, disponible: v ? 1 : 0 }));
      setMsg({ t: v ? 'Vous êtes disponible : les nouveaux CV pourront vous être affectés.' : 'Vous êtes indisponible : aucun nouveau CV ne vous sera affecté.', ty: 'ok' });
    } catch (e) { setMsg({ t: errMsg(e), ty: 'err' }); }
    finally { setBusyAvail(false); }
  };

  const terminer = async (id) => {
    setBusyTerm(id);
    try {
      await api.put(`/redacteur/demandes/${id}/statut`, { statut: 'terminee' });
      setMsg({ t: 'Dossier marqué comme terminé.', ty: 'ok' });
      load();
    } catch (e) { setMsg({ t: errMsg(e), ty: 'err' }); }
    finally { setBusyTerm(null); }
  };

  const dispo = !!(prof && prof.disponible);

  return (
    <div className="dash">
      {msg && <Toast text={msg.t} type={msg.ty} onDone={() => setMsg(null)} />}

      <header className="dash-head">
        <div>
          <nav className="breadcrumb" aria-label="Fil d'Ariane"><span>Espace rédacteur</span><span>/</span><b>Tableau de bord</b></nav>
          <h1>Bonjour, {user.nom.split(' ')[0]}</h1>
        </div>
        <div className="head-act">
          <span className="avail">
            <button className={`switch${dispo ? ' on' : ''}`} onClick={() => setDispo(!dispo)}
              disabled={busyAvail || !prof} role="switch" aria-checked={dispo} aria-label="Disponibilité">
              <i aria-hidden="true" />
            </button>
            {prof == null ? '…' : dispo ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
      </header>

      {err && (
        <div className="state"><p className="err" role="alert">{err}</p><button className="ghost" onClick={load}>Réessayer</button></div>
      )}

      {!err && (
        <div className="dash-grid">
          <section className="span-7">
            <div className="metrics">
              <Metric icon="send" value={sols ? sols.length : '…'} label="Sollicitations reçues" />
              <Metric icon="files" value={rows ? stats.total : '…'} label="Dossiers confiés" />
            </div>
            <div className="card" style={{ marginTop: 24 }}>
              <h3>Dossiers par mois</h3>
              <p className="card-hint">Dossiers confiés au cours des 12 derniers mois.</p>
              <BarChart data={histo.data} labels={histo.labels} />
            </div>
          </section>

          <section className="span-5">
            <div className="card">
              <h3>Avancement</h3>
              <p className="card-hint">Part de dossiers terminés sur le total confié.</p>
              <Gauge value={rows ? avancement : 0} text={rows ? `${avancement}%` : '…'} caption="Terminés / total"
                foot={[
                  { value: rows ? stats.cours : '…', label: 'En cours' },
                  { value: rows ? stats.fin : '…', label: 'Terminés' },
                  { value: rows ? stats.att : '…', label: 'En attente' },
                ]} />
            </div>
          </section>

          <section className="span-12">
            <div className="card">
              <div className="toolbar">
                <div>
                  <h3>Évolution du score IA</h3>
                  <p className="card-hint" style={{ marginBottom: 0 }}>Score moyen des CV reçus.</p>
                </div>
                <div className="tabs-s" role="tablist">
                  {[['mensuel', 'Mensuel'], ['trimestriel', 'Trimestriel'], ['annuel', 'Annuel']].map(([k, v]) => (
                    <button key={k} role="tab" aria-selected={periode === k} className={periode === k ? 'on' : ''} onClick={() => setPeriode(k)}>{v}</button>
                  ))}
                </div>
              </div>
              <AreaChart data={evolution.data} labels={evolution.labels} label="Évolution du score IA" />
            </div>
          </section>

          <section className="span-5">
            <div className="card">
              <h3>Sollicitations reçues</h3>
              <p className="card-hint">Ces candidats attendent qu’un rédacteur accepte leur demande.</p>
              {sols && sols.length === 0 && (
                <div className="state" style={{ border: 0 }}>
                  <b>Aucune sollicitation</b>
                  <p className="muted">Les nouvelles demandes apparaîtront ici.</p>
                </div>
              )}
              {sols && sols.length > 0 && (
                <div style={{ display: 'grid', gap: 12 }}>
                  {sols.slice(0, 3).map((s) => <Sollicitation key={s.id} s={s} onDone={load} />)}
                  {sols.length > 3 && <Link to="/redacteur/demandes" className="llm-more">Voir les {sols.length} sollicitations <Icon name="chev" size={14} /></Link>}
                </div>
              )}
              {!sols && <p className="muted">Chargement…</p>}
            </div>
          </section>

          <section className="span-7">
            <div className="card">
              <div className="toolbar">
                <div className="tabs-s" role="tablist">
                  {FILTERS.map(([k, v]) => (
                    <button key={k} role="tab" aria-selected={filtre === k} className={filtre === k ? 'on' : ''} onClick={() => setFiltre(k)}>{v} <i>{k === 'tous' ? data.length : count(k)}</i></button>
                  ))}
                </div>
                <label className="search"><Icon name="search" size={18} />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un candidat…" aria-label="Rechercher un dossier" />
                </label>
              </div>

              {!rows && [1, 2, 3].map((i) => <div key={i} className="job sk" aria-hidden="true" />)}

              {rows && data.length === 0 && (
                <div className="empty-h">
                  <div className="eh-hero">
                    <span className="eh-ic"><Icon name="spark" /></span>
                    <div>
                      <b>En attente de dossiers confiés</b>
                      <p className="muted">Les CV déposés par les candidats vous sont affectés automatiquement selon votre spécialité{prof?.specialite ? ` (${prof.specialite})` : ''} — restez disponible.</p>
                    </div>
                  </div>
                </div>
              )}

              {rows && data.length > 0 && (
                <table className="dtable">
                  <thead>
                    <tr><th>Dossier</th><th>Candidat</th><th>Date</th><th>Score IA</th><th>Statut</th><th /></tr>
                  </thead>
                  <tbody>
                    {visibles.map((r) => (
                      <tr key={r.id}>
                        <td><Link to={`/demandes/${r.id}`} className="t-strong">Dossier n°{r.id}<br /><small className="muted">{r.titre_poste || 'CV à réviser'}</small></Link></td>
                        <td>{r.candidat_nom}</td>
                        <td>{fmtDate(r.created_at)}</td>
                        <td>{r.score != null ? `${r.score}/100` : <span className="muted">—</span>}</td>
                        <td><StatusBadge statut={r.statut} /></td>
                        <td>
                          {r.statut === 'en_cours' && (
                            <button className="ghost sm" onClick={() => terminer(r.id)} disabled={busyTerm === r.id}>
                              <Icon name="check" size={14} /> {busyTerm === r.id ? '…' : 'Terminer'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {visibles.length === 0 && (
                      <tr><td colSpan={6}><div className="state" style={{ border: 0 }}><b>Aucun résultat</b><p className="muted">Essayez un autre filtre.</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
