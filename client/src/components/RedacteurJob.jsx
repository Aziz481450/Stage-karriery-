import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import Badge from './Badge';
import CvAmelioration from './CvAmelioration';
import Icon from './Icon';
import Toast from './Toast';
import { initials } from '../layout/AppShell';

const tone = (s) => (s >= 75 ? 'ok' : s >= 50 ? 'warn' : 'bad');
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR');

export default function RedacteurJob({ r, onDone }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const viewCv = async () => {
    try {
      const res = await api.get(`/demandes/${r.id}/cv`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { setMsg({ t: errMsg(e), ty: 'err' }); }
  };

  const terminer = async () => {
    setBusy(true);
    try {
      await api.put(`/redacteur/demandes/${r.id}/statut`, { statut: 'terminee' });
      setMsg({ t: 'Dossier marqué comme terminé.', ty: 'ok' });
      onDone();
    } catch (e) { setMsg({ t: errMsg(e), ty: 'err' }); }
    finally { setBusy(false); }
  };

  const a = r.analyse;

  return (
    <article className="job" key={r.id}>
      {msg && <Toast text={msg.t} type={msg.ty} onDone={() => setMsg(null)} />}
      <div className="job-top">
        <span className="job-av">{initials(r.candidat_nom)}</span>
        <div className="job-id">
          <h3>{r.candidat_nom}</h3>
          <p className="job-sub">Dossier n°{r.id} · {r.titre_poste || r.ville || 'CV à réviser'}</p>
        </div>
        <Badge s={r.statut} />
      </div>

      <div className="job-foot">
        <span className="chip"><Icon name="cal" size={13} /> {fmtDate(r.created_at)}</span>
        {r.ville && <span className="chip"><Icon name="loc" size={13} /> {r.ville}</span>}
        {r.score != null
          ? <span className={`chip sc ${tone(r.score)}`}>Score IA {r.score}/100</span>
          : <span className="chip">Analyse en cours</span>}
        <button className="ghost sm" onClick={viewCv}><Icon name="download" size={14} /> Voir le CV</button>
        <CvAmelioration demandeId={r.id} />
        {r.statut === 'en_cours' && (
          <button className="ghost sm" onClick={terminer} disabled={busy}><Icon name="check" size={14} /> Terminer</button>
        )}
        <Link className="ghost sm" to={`/demandes/${r.id}/messages`}><Icon name="send" size={14} /> Message</Link>
        <Link to={`/demandes/${r.id}`} className="cta sm">Ouvrir</Link>
      </div>

      {a ? (
        <div className="llm">
          <button className={`llm-btn${open ? ' open' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open}>
            <Icon name="spark" size={16} />
            <span>Analyse IA du CV</span>
            <span className="llm-count">
              <i>{a.forces.length} forces</i>
              <i>{a.faiblesses.length} axes</i>
              <i>{a.recommandations.length} reco.</i>
            </span>
            <span className="chev"><Icon name="chev" size={16} /></span>
          </button>
          {open && (
            <div className="llm-body">
              <div className="llm-cols">
                <div className="llm-c ok"><h4><Icon name="check" size={13} /> Points forts</h4>
                  <ul>{a.forces.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                <div className="llm-c warn"><h4><Icon name="warn" size={13} /> Axes d’amélioration</h4>
                  <ul>{a.faiblesses.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                <div className="llm-c fx"><h4><Icon name="star" size={13} /> Recommandations</h4>
                  <ul>{a.recommandations.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              </div>
              <Link to={`/demandes/${r.id}`} className="llm-more">Voir l’analyse complète <Icon name="chev" size={14} /></Link>
            </div>
          )}
        </div>
      ) : (
        <p className="muted llm-na">Analyse IA non disponible pour ce dossier.</p>
      )}
    </article>
  );
}