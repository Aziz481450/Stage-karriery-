import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../api';
import { useAuth } from '../../AuthContext';
import { LABEL } from '../../components/Badge';
import Icon from '../../components/Icon';
import UploadModal from '../../components/UploadModal';
import CvForm from '../../components/CvForm';
import Metric from '../../components/Metric';
import StatusBadge from '../../components/StatusBadge';
import BarChart from '../../components/charts/BarChart';
import AreaChart from '../../components/charts/AreaChart';
import Gauge from '../../components/charts/Gauge';
import '../dashboard.css';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const ORDER = ['en_attente', 'en_cours', 'terminee', 'annulee'];
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

export default function Candidat() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [prof, setProf] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [filtre, setFiltre] = useState('tous');
  const [q, setQ] = useState('');
  const [periode, setPeriode] = useState('mensuel');

  const load = () => api.get('/demandes').then((r) => { setRows(r.data); setErr(''); }).catch((e) => setErr(errMsg(e)));
  useEffect(() => {
    load();
    api.get('/candidat/profil').then((r) => setProf(r.data)).catch(() => {});
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = rows || [];
  const stats = useMemo(() => {
    const sc = data.filter((x) => x.score != null);
    return {
      total: data.length,
      cours: data.filter((x) => x.statut === 'en_cours').length,
      fin: data.filter((x) => x.statut === 'terminee').length,
      moy: sc.length ? Math.round(sc.reduce((a, b) => a + Number(b.score), 0) / sc.length) : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const visibles = useMemo(() => data.filter((r) =>
    (filtre === 'tous' || r.statut === filtre) &&
    `${r.id} ${r.titre_poste || ''} ${r.redacteur_nom || ''}`.toLowerCase().includes(q.toLowerCase())
  ), [rows, filtre, q]);
  const count = (s) => data.filter((r) => r.statut === s).length;

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

  const delta = useMemo(() => {
    const now = Date.now(), d30 = 30 * 864e5;
    const cur = data.filter((r) => now - new Date(r.created_at) < d30).length;
    const prev = data.filter((r) => { const a = now - new Date(r.created_at); return a >= d30 && a < 2 * d30; }).length;
    if (!prev) return null;
    const c = Math.round(((cur - prev) / prev) * 100);
    return c === 0 ? { dir: 'flat', text: '0%' } : { dir: c > 0 ? 'up' : 'down', text: `${c > 0 ? '+' : ''}${c}%` };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const rep = useMemo(() => ORDER.map((s) => ({ s, n: count(s), pct: stats.total ? Math.round((count(s) / stats.total) * 100) : 0 })), [rows, stats.total]);

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <nav className="breadcrumb" aria-label="Fil d'Ariane"><span>Espace candidat</span><span>/</span><b>Tableau de bord</b></nav>
          <h1>Bonjour, {user.nom.split(' ')[0]}</h1>
        </div>
        <div className="head-act">
          <button className="cta" onClick={() => setOpen(true)}><Icon name="plus" size={18} />Nouveau dossier</button>
        </div>
      </header>

      {err && (
        <div className="state"><p className="err" role="alert">{err}</p><button className="ghost" onClick={load}>Réessayer</button></div>
      )}

      {!err && (
        <div className="dash-grid">
          <section className="span-7">
            <div className="metrics">
              <Metric icon="files" value={rows ? stats.total : '…'} label="Dossiers déposés" delta={delta || undefined} />
              <Metric icon="star" value={rows ? (stats.moy != null ? `${stats.moy}/100` : '—') : '…'} label="Score IA moyen" />
            </div>
            <div className="card" style={{ marginTop: 24 }}>
              <h3>Dossiers par mois</h3>
              <p className="card-hint">Nombre de dossiers déposés sur les 12 derniers mois.</p>
              <BarChart data={histo.data} labels={histo.labels} />
            </div>
          </section>

          <section className="span-5">
            <div className="card">
              <h3>Objectif de score</h3>
              <p className="card-hint">Moyenne de vos scores IA, objectif 90/100.</p>
              <Gauge value={stats.moy != null ? stats.moy : 0}
                text={rows ? (stats.moy != null ? `${stats.moy}` : '—') : '…'} caption="Score IA moyen"
                foot={[
                  { value: rows ? stats.total : '…', label: 'Dossiers' },
                  { value: rows ? stats.cours : '…', label: 'En cours' },
                  { value: rows ? stats.fin : '…', label: 'Terminés' },
                ]} />
            </div>
          </section>

          <section className="span-12">
            <div className="card">
              <div className="toolbar">
                <div>
                  <h3>Évolution du score IA</h3>
                  <p className="card-hint" style={{ marginBottom: 0 }}>Score moyen de vos dossiers analysés.</p>
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
              <h3>Répartition des dossiers</h3>
              <p className="card-hint">Par statut.</p>
              <div className="rep">
                {rep.map((r) => (
                  <div className="rep-row" key={r.s}>
                    <span>{LABEL[r.s]}</span>
                    <div className="rep-bar"><i style={{ width: `${r.pct}%` }} /></div>
                    <b>{r.n}</b>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="span-7">
            <div className="card">
              <div className="toolbar">
                <div className="tabs-s" role="tablist">
                  {[['tous', 'Tous', data.length], ...ORDER.map((k) => [k, LABEL[k], count(k)])].map(([k, v, n]) => (
                    <button key={k} role="tab" aria-selected={filtre === k} className={filtre === k ? 'on' : ''} onClick={() => setFiltre(k)}>{v} <i>{n}</i></button>
                  ))}
                </div>
                <label className="search"><Icon name="search" size={18} />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher un dossier" />
                </label>
              </div>

              {!rows && [1, 2, 3].map((i) => <div key={i} className="job sk" aria-hidden="true" />)}

              {rows && data.length === 0 && (
                <div className="empty-h">
                  <div className="eh-hero">
                    <span className="eh-ic"><Icon name="files" /></span>
                    <div>
                      <b>Aucun dossier pour le moment</b>
                      <p className="muted">Déposez votre CV pour démarrer : l’IA l’analyse, puis un rédacteur disponible accepte votre demande et vous accompagne.</p>
                    </div>
                  </div>
                  <CvForm onDone={load} />
                </div>
              )}

              {rows && data.length > 0 && (
                <table className="dtable">
                  <thead>
                    <tr><th>Dossier</th><th>Rédacteur</th><th>Date</th><th>Score IA</th><th>Statut</th></tr>
                  </thead>
                  <tbody>
                    {visibles.map((r) => (
                      <tr key={r.id}>
                        <td><Link to={`/demandes/${r.id}`} className="t-strong">Dossier n°{r.id}<br /><small className="muted">{r.titre_poste || 'Poste non précisé'}</small></Link></td>
                        <td>{r.redacteur_nom || <span className="muted">En attente…</span>}</td>
                        <td>{fmtDate(r.created_at)}</td>
                        <td>{r.score != null ? `${r.score}/100` : <span className="muted">—</span>}</td>
                        <td><StatusBadge statut={r.statut} /></td>
                      </tr>
                    ))}
                    {visibles.length === 0 && (
                      <tr><td colSpan={5}><div className="state" style={{ border: 0 }}><b>Aucun résultat</b><p className="muted">Essayez un autre filtre.</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}

      {open && <UploadModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />}
    </div>
  );
}
