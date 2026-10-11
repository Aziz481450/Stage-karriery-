import { useState } from 'react';
import api, { errMsg } from '../api';
import Icon from './Icon';
import Toast from './Toast';

// IA rédacteur : génère une version améliorée du CV PDF via le serveur (Ollama
// quand il est configuré). Le résultat s'affiche dans la page et un vrai PDF
// est téléchargeable (aucun pop-up, fiable partout).
export default function CvAmelioration({ demandeId }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [msg, setMsg] = useState(null);

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.post(`/demandes/${demandeId}/ameliorer-cv`);
      setDone({ nom: r.data.cv_ameliorer_nom, text: r.data.cv_ameliorer || '' });
      setMsg({ t: r.data.message, ty: 'ok' });
    } catch (e) { setMsg({ t: errMsg(e), ty: 'err' }); }
    finally { setBusy(false); }
  };

  const dl = async () => {
    try {
      const res = await api.get(`/demandes/${demandeId}/cv-ameliorer`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = done && done.nom ? done.nom : 'cv-ameliorer.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { setMsg({ t: errMsg(e), ty: 'err' }); }
  };

  return (
    <div className="cv-am">
      {busy && <p className="muted ai-note"><Icon name="spark" size={13} /> Génération du CV amélioré en cours (Ollama, patience)…</p>}
      <button className="ghost sm btn-ai" onClick={run} disabled={busy}>
        <Icon name="spark" size={14} /> {busy ? 'Amélioration en cours…' : done ? 'Régénérer le CV (IA)' : 'Améliorer ce CV (IA)'}
      </button>

      {done && (
        <div className="cv-am-panel">
          <div className="cv-am-head">
            <b><Icon name="spark" size={13} /> CV amélioré par l'IA</b>
            <span className="chip ok">Prêt</span>
            <button className="ghost sm btn-ai" onClick={dl}><Icon name="download" size={13} /> Télécharger le PDF</button>
          </div>
          <pre className="cv-am-text">{done.text}</pre>
          <p className="muted ai-note">Généré par l'IA — relisez-le avant envoi et gardez uniquement les faits exacts.</p>
        </div>
      )}

      {msg && <Toast text={msg.t} type={msg.ty} onDone={() => setMsg(null)} />}
    </div>
  );
}