import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import Icon from './Icon';

export default function UploadModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [busy, onClose]);

  const pick = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') return setErr('Seul le format PDF est accepté.');
    if (f.size > 5 * 1024 * 1024) return setErr('Fichier trop volumineux (5 Mo maximum).');
    setErr('');
    setFile(f);
  };

  const send = async () => {
    setBusy(true);
    setErr('');
    const fd = new FormData();
    fd.append('cv', file);
    try {
      await api.post('/demandes', fd, { onUploadProgress: (e) => setPct(Math.round((e.loaded * 100) / (e.total || 1))) });
      onDone();
    } catch (x) { setErr(errMsg(x)); setBusy(false); }
  };

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="mt">
        <h2 id="mt">Nouveau dossier</h2>
        <p className="muted">Déposez votre CV : il sera analysé par l’IA et confié au rédacteur le plus adapté.</p>
        <label className={`dz ${drag ? 'on' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}>
          <Icon name="upload" size={28} />
          <b>{file ? file.name : 'Glissez votre CV ici ou cliquez pour parcourir'}</b>
          <small>PDF uniquement, 5 Mo maximum</small>
          <input type="file" accept="application/pdf" onChange={(e) => pick(e.target.files[0])} hidden />
        </label>
        {busy && <div className="bar-p" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pct}%` }} /></div>}
        {err && <p className="err" role="alert">{err}</p>}
        <div className="m-act">
          <button className="ghost" onClick={onClose} disabled={busy}>Annuler</button>
          <button className="cta" onClick={send} disabled={!file || busy}>{busy ? `Envoi ${pct}%` : 'Envoyer mon CV'}</button>
        </div>
      </div>
    </div>
  );
}