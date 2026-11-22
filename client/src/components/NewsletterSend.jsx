import { useState } from 'react';
import api, { errMsg } from '../api';
import Icon from './Icon';
import Toast from './Toast';

// Bouton à placer dans le widget d'analyse IA : génère (si besoin) le CV
// amélioré, puis l'envoie au candidat avec l'expéditeur « Karriery Newsletter ».
export default function NewsletterSend({ demandeId, ready = false, compact = false, onDone }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const send = async () => {
    setBusy(true); setMsg(null);
    try {
      if (!ready) await api.post(`/demandes/${demandeId}/ameliorer-cv`);
      const r = await api.post(`/demandes/${demandeId}/envoyer-cv`, { source: 'newsletter' });
      const suffix = r.data.mode === 'log' ? ' (mode test : email journalisé)' : '';
      setMsg({ t: r.data.message + suffix, ty: 'ok' });
      if (onDone) onDone();
    } catch (e) { setMsg({ t: errMsg(e), ty: 'err' }); }
    finally { setBusy(false); }
  };

  return (
    <>
      <button type="button" className={compact ? 'ghost sm' : 'cta sm'} onClick={send} disabled={busy}
        title="Génère le CV amélioré si besoin et l’envoie au candidat au nom de la newsletter Karriery">
        <Icon name="mail" size={14} />
        {busy ? 'Envoi en cours…' : 'Envoyer par la newsletter'}
      </button>
      {msg && <Toast text={msg.t} type={msg.ty} onDone={() => setMsg(null)} />}
    </>
  );
}
