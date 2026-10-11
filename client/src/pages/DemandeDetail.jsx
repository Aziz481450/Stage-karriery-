import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg, download } from '../api';
import { useAuth } from '../AuthContext';
import Badge, { LABEL } from '../components/Badge';
import Icon from '../components/Icon';
import Toast from '../components/Toast';
import { initials } from '../layout/AppShell';
import './dashboard.css';

const fmt = (d) => new Date(d).toLocaleDateString('fr-FR');
const tone = (s) => (s >= 75 ? 'ok' : s >= 50 ? 'warn' : 'bad');

function Ring({ value }) {
  if (value == null) return <p className="muted">Score indisponible</p>;
  const c = 2 * Math.PI * 45;
  return (
    <svg viewBox="0 0 110 110" className="ring-lg ring-lg-c" role="img" aria-label={`Score ${value} sur 100`}>
      <circle cx="55" cy="55" r="45" className="rb" transform="rotate(-90 55 55)" />
      <circle cx="55" cy="55" r="45" className={`rf ${tone(value)}`} transform="rotate(-90 55 55)"
        style={{ strokeDasharray: c, strokeDashoffset: c * (1 - value / 100) }} />
      <text x="55" y="60" textAnchor="middle">{value}/100</text>
    </svg>
  );
}

export default function DemandeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isCand = user.role === 'candidat';
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get(`/demandes/${id}`).then((r) => { setD(r.data); setErr(''); }).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, []);

  const change = async (statut) => {
    setMsg('');
    try { await api.put(`/redacteur/demandes/${id}/statut`, { statut }); load(); }
    catch (e) { setMsg(errMsg(e)); }
  };

  const back = isCand ? '/candidat/dossiers' : user.role === 'redacteur' ? '/redacteur/dossiers' : '/admin';
  const titre = `Dossier n°${d?.id}`;
  const redac = (n) => n?.nom || 'En attente d’un rédacteur';

  return (
    <div className="dash">
      {err && <div className="state"><p className="err" role="alert">{err}</p><Link className="ghost" to={back}>Retour</Link></div>}
      {!err && !d && <div className="job sk" aria-hidden="true" />}
      {!err && d && (
        <>
          <Link to={back} className="back">← {isCand ? 'Mes dossiers' : user.role === 'redacteur' ? 'Dossiers confiés' : 'Administration'}</Link>

          <article className="detail">
            <div>
              <span className="eyebrow">{titre}</span>
              <h1>{d.titre_poste || 'Poste non précisé'}</h1>
              <div className="chips">
                <Badge s={d.statut} />
                <span className="chip"><Icon name="cal" size={13} /> {fmt(d.created_at)}</span>
                {d.candidat.ville && <span className="chip"><Icon name="loc" size={13} /> {d.candidat.ville}</span>}
              </div>
              <div className="redac">
                <span className="mini-av">{d.redacteur ? initials(d.redacteur.nom) : '?'}</span>
                <div><small>{isCand ? 'Rédacteur assigné' : 'Candidat'}</small>
                  <b>{isCand ? redac(d.redacteur) : d.candidat.nom}</b></div>
              </div>
            </div>
            <div className="score-ct"><Ring value={d.score} /><small>Score IA</small></div>
          </article>

          {msg && <Toast text={msg} type="err" onDone={() => setMsg('')} />}

          <div className="detail-actions">
            <button className="ghost" onClick={() => download(`/demandes/${d.id}/cv`, d.cv_nom)}><Icon name="download" size={16} /> Télécharger le CV</button>
            <Link className="cta" to={`/demandes/${id}/messages`}><Icon name="send" size={16} /> Messagerie</Link>
          </div>

          {user.role === 'redacteur' && (
            <div className="card note">
              <h3>Statut du dossier</h3>
              <p className="muted">Faites avancer accompagnement du candidat.</p>
              <div className="m-act" style={{ justifyContent: 'flex-start' }}>
                {Object.entries(LABEL).filter(([k]) => k === 'en_cours' || k === 'terminee').map(([k, v]) => (
                  <button key={k} className={d.statut === k ? 'cta sm' : 'ghost sm'} onClick={() => change(k)} disabled={d.statut === k}>{v}</button>
                ))}
              </div>
            </div>
          )}

          {!isCand && (
            <div className="card info-grid">
              <div className="info"><Icon name="user" size={18} /><div><small>Nom</small><b>{d.candidat.nom}</b></div></div>
              <div className="info"><Icon name="mail" size={18} /><div><small>Email</small><b>{d.candidat.email}</b></div></div>
              {d.candidat.telephone && <div className="info"><Icon name="phone" size={18} /><div><small>Téléphone</small><b>{d.candidat.telephone}</b></div></div>}
              {d.candidat.niveau_etudes && <div className="info"><Icon name="star" size={18} /><div><small>Niveau d’études</small><b>{d.candidat.niveau_etudes}</b></div></div>}
              {d.candidat.competences && <div className="info" style={{ gridColumn: '1 / -1' }}><Icon name="check" size={18} /><div><small>Compétences</small><b>{d.candidat.competences}</b></div></div>}
            </div>
          )}

          {d.analyse ? (
            <section className="an-grid">
              <article className="an-card"><h3><span className="a-ic"><Icon name="check" /></span>Points forts</h3>
                <ul>{d.analyse.forces.map((x, i) => <li key={i}>{x}</li>)}</ul></article>
              <article className="an-card warn"><h3><span className="a-ic"><Icon name="warn" /></span>Axes d’amélioration</h3>
                <ul>{d.analyse.faiblesses.map((x, i) => <li key={i}>{x}</li>)}</ul></article>
              <article className="an-card fx"><h3><span className="a-ic"><Icon name="star" /></span>Recommandations</h3>
                <ul>{d.analyse.recommandations.map((x, i) => <li key={i}>{x}</li>)}</ul></article>
            </section>
          ) : (
            <p className="muted">L’analyse de ce dossier n’est pas encore disponible.</p>
          )}
        </>
      )}
    </div>
  );
}