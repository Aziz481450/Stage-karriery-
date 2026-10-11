import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import Badge, { LABEL } from '../components/Badge';
import Icon from '../components/Icon';
import UploadModal from '../components/UploadModal';
import CvForm from '../components/CvForm';
import RedacteurJob from '../components/RedacteurJob';
import Sollicitation from '../components/Sollicitation';
import './dashboard.css';

const tone = (s) => (s >= 75 ? 'ok' : s >= 50 ? 'warn' : 'bad');
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR');

export default function Demandes() {
  const { user } = useAuth();
  const red = user.role === 'redacteur';
  const [rows, setRows] = useState(null);
  const [sols, setSols] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [filtre, setFiltre] = useState('tous');
  const [q, setQ] = useState('');

  const load = () => {
    api.get('/demandes').then((r) => { setRows(r.data); setErr(''); }).catch((e) => setErr(errMsg(e)));
    if (red) api.get('/redacteur/demandes/en-attente').then((r) => setSols(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const visibles = useMemo(() => (rows || []).filter((r) =>
    (filtre === 'tous' || r.statut === filtre) &&
    `${r.id} ${r.titre_poste || ''} ${r.candidat_nom || ''} ${r.redacteur_nom || ''}`.toLowerCase().includes(q.toLowerCase())
  ), [rows, filtre, q]);
  const count = (s) => (rows || []).filter((r) => r.statut === s).length;
  const subtitle = (r) => (red ? (r.titre_poste || r.ville || 'CV à réviser') : (r.titre_poste || 'Poste non précisé'));

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h1>{red ? 'Dossiers confiés' : 'Mes dossiers'}</h1>
          <p className="muted">{red ? 'Gérez les CV qui vous sont confiés : consultez le CV, l’analyse IA et le statut.' : 'Consultez toutes vos candidatures et leur score IA.'}</p>
        </div>
        {!red && <button className="cta btn-ic" onClick={() => setOpen(true)}><Icon name="plus" size={18} />Nouveau dossier</button>}
      </div>

      {red && sols && sols.length > 0 && (
        <section className="sol-band mb" aria-label="Demandes en attente d’acceptation">
          <div className="sol-head">
            <div>
              <h2>Demandes en attente d’acceptation <span className="chip sol-n">{sols.length}</span></h2>
              <p className="muted">Lisez le CV et l’analyse IA, puis acceptez pour lier le candidat à votre planning, ou refusez (elle restera proposée aux autres rédacteurs).</p>
            </div>
          </div>
          <div className="sol-list">
            {sols.map((s) => <Sollicitation key={s.id} s={s} onDone={load} />)}
          </div>
        </section>
      )}

      <div className="toolbar">
        <div className="tabs-s" role="tablist">
          {[['tous', 'Tous', (rows || []).length], ...Object.entries(LABEL).map(([k, v]) => [k, v, count(k)])].map(([k, v, n]) => (
            <button key={k} role="tab" aria-selected={filtre === k} className={filtre === k ? 'on' : ''} onClick={() => setFiltre(k)}>{v} <i>{n}</i></button>
          ))}
        </div>
        <label className="search"><Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher un dossier" />
        </label>
      </div>

      {err && <div className="state"><p className="err" role="alert">{err}</p><button className="ghost" onClick={load}>Réessayer</button></div>}
      {!err && !rows && [1, 2, 3].map((i) => <div key={i} className="job sk" aria-hidden="true" />)}
      {!err && rows && visibles.length === 0 && (!red && rows.length === 0 ? (
        <div className="empty-h">
          <div className="eh-hero">
            <span className="eh-ic"><Icon name="files" /></span>
            <div>
              <b>Aucun dossier pour le moment</b>
              <p className="muted">Déposez votre CV pour démarrer : l’IA l’analyse et un rédacteur s’en occupe.</p>
            </div>
          </div>
          <CvForm onDone={load} />
        </div>
      ) : (
        <div className="state">
          <b>{rows.length === 0 ? 'Aucun dossier pour le moment' : 'Aucun résultat'}</b>
          <p className="muted">{rows.length === 0 ? 'Les nouveaux dossiers apparaîtront ici.' : 'Essayez un autre filtre.'}</p>
        </div>
      ))}
      {visibles.map((r) => red ? (
        <RedacteurJob key={r.id} r={r} onDone={load} />
      ) : (
        <article className="job" key={r.id}>
          <div className="job-top">
            <span className="job-av"><Icon name="files" /></span>
            <div className="job-id">
              <h3>Dossier n°{r.id}</h3>
              <p className="job-sub">{subtitle(r)}</p>
            </div>
            <Badge s={r.statut} />
          </div>
          <div className="job-foot">
            <span className="chip"><Icon name="cal" size={13} /> {fmtDate(r.created_at)}</span>
            {r.score != null ? <span className={`chip sc ${tone(r.score)}`}>Score {r.score}/100</span> : <span className="chip">Analyse en cours</span>}
            <Link to={`/demandes/${r.id}`} className="cta sm">Ouvrir</Link>
          </div>
        </article>
      ))}

      {open && <UploadModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />}
    </div>
  );
}