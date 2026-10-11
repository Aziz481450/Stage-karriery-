import { useState } from 'react';
import api, { errMsg } from '../api';
import CvAmelioration from './CvAmelioration';
import Icon from './Icon';
import Toast from './Toast';
import { initials } from '../layout/AppShell';

const tone = (s) => (s >= 75 ? 'ok' : s >= 50 ? 'warn' : 'bad');
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR');

// Demande en attente proposée à un rédacteur : le candidat n'est pas encore lié.
// Le rédacteur consulte le CV et l'analyse LLM, puis accepte (liaison créée) ou refuse
// (la demande reste proposée aux autres rédacteurs disponibles).
export default function Sollicitation({ s, onDone }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  const viewCv = async () => {
    try {
      const res = await api.get(`/demandes/${s.id}/cv`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { setMsg({ t: errMsg(e), ty: 'err' }); }
  };

  const decide = async (action) => {
    setBusy(action);
    try {
      const r = await api.put(`/redacteur/demandes/${s.id}/${action}`, {});
      setMsg({ t: r.data.message, ty: 'ok' });
      onDone();
    } catch (e) { setMsg({ t: errMsg(e), ty: 'err' }); }
    finally { setBusy(null); }
  };

  const a = s.analyse;

  return (
    <article className="sol">
      {msg && <Toast text={msg.t} type={msg.ty} onDone={() => setMsg(null)} />}
      <div className="sol-top">
        <span className="job-av">{initials(s.candidat_nom)}</span>
        <div className="job-id">
          <h3>{s.candidat_nom}</h3>
          <p className="job-sub">Dossier n°{s.id} · {s.titre_poste || s.ville || 'CV à réviser'}</p>
        </div>
        <span className="badge en_attente">En attente</span>
      </div>

      <div className="job-foot">
        <span className="chip"><Icon name="cal" size={13} /> {fmtDate(s.created_at)}</span>
        {s.ville && <span className="chip"><Icon name="loc" size={13} /> {s.ville}</span>}
        {s.score != null
          ? <span className={`chip sc ${tone(s.score)}`}>Score IA {s.score}/100</span>
          : <span className="chip">Analyse en cours</span>}
        <button className="ghost sm" onClick={viewCv}><Icon name="download" size={14} /> Voir le CV</button>
      </div>

      {a && (
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
            </div>
          )}
        </div>
      )}

      <div className="sol-act">
        <CvAmelioration demandeId={s.id} />
        <button className="cta sm" onClick={() => decide('accepte')} disabled={!!busy}>
          <Icon name="check" size={14} /> {busy === 'accepte' ? 'Acceptation…' : 'Accepter la demande'}
        </button>
        <button className="ghost sm refuse" onClick={() => decide('refuse')} disabled={!!busy}>
          <Icon name="x" size={14} /> {busy === 'refuse' ? 'Refus…' : 'Refuser'}
        </button>
      </div>
    </article>
  );
}