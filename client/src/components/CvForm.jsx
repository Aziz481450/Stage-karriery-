import { useRef, useState } from 'react';
import api, { errMsg } from '../api';
import Icon from './Icon';

export default function CvForm({ onDone }) {
  const ref = useRef(null);
  const [file, setFile] = useState(null);
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pick = (e) => {
    const f = e.target.files?.[0];
    setErr('');
    if (!f) return;
    if (f.type !== 'application/pdf') return setErr('Seul le format PDF est accepté.');
    if (f.size > 5 * 1024 * 1024) return setErr('Fichier trop volumineux (5 Mo maximum).');
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true); setErr('');
    const fd = new FormData();
    fd.append('cv', file);
    try {
      await api.post('/demandes', fd, {
        onUploadProgress: (x) => setPct(Math.round((x.loaded * 100) / (x.total || 1))),
      });
      setFile(null);
      if (ref.current) ref.current.value = '';
      onDone();
    } catch (x) { setErr(errMsg(x)); setBusy(false); }
  };

  return (
    <form className="cvform" onSubmit={submit}>
      <div className="cvrow">
        <button type="button" className="cv-pick" onClick={() => ref.current?.click()} disabled={busy}>
          <Icon name="upload" size={18} />
          {file ? file.name : 'Choisir un CV (PDF)'}
        </button>
        <button className="cta" disabled={!file || busy} type="submit">
          {busy ? `Envoi ${pct}%` : 'Déposer mon CV'}
        </button>
        <input ref={ref} type="file" accept="application/pdf" onChange={pick} hidden />
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      {busy && (
        <div className="bar-p cv-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
          <i style={{ width: `${pct}%` }} />
        </div>
      )}
    </form>
  );
}