import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { errMsg } from '../api';
export default function Auth({ mode }) {
  const isReg = mode === 'register';
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ nom: '', email: '', password: '', role: 'candidat' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await (isReg ? register(f) : login(f)); nav('/'); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <main className="split">
      <section className="hero">
        <span className="eyebrow">Karriery · Rédaction professionnelle</span>
        <svg className="arrow" viewBox="0 0 340 200" aria-hidden="true" focusable="false">
          <path d="M14 34 C 118 6, 246 30, 300 120" />
          <path d="M299 94 L300 120 L277 108" />
        </svg>
        <h1>Votre CV,<br /><span className="pill">entre</span> de bonnes mains.</h1>
        <p>Déposez votre dossier, un rédacteur vous accompagne jusqu'à une offre qui vous ressemble.</p>
        <ul className="hero-meta">
          <li>Réponse sous 48 h</li>
          <li>Rédacteurs vérifiés</li>
          <li>Suivi personnalisé</li>
        </ul>
      </section>
      <form className="panel" onSubmit={submit}>
        <h2>{isReg ? 'Créer un compte' : 'Se connecter'}</h2>
        {isReg && <>
          <label>Nom complet<input value={f.nom} onChange={set('nom')} required /></label>
          <div className="roles">
            {['candidat', 'redacteur'].map((r) => (
              <button type="button" key={r} className={f.role === r ? 'on' : ''} onClick={() => setF({ ...f, role: r })}>
                {r === 'candidat' ? 'Je cherche un emploi' : 'Je suis rédacteur'}</button>))}
          </div></>}
        <label>Email<input type="email" value={f.email} onChange={set('email')} required /></label>
        <label>Mot de passe<input type="password" value={f.password} onChange={set('password')} minLength={8} required /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="cta" disabled={busy}>{busy ? 'Patientez…' : isReg ? 'Créer mon compte' : 'Se connecter'}</button>
        <p className="muted">{isReg ? 'Déjà inscrit ?' : 'Pas encore de compte ?'}{' '}
          <Link to={isReg ? '/connexion' : '/inscription'}>{isReg ? 'Se connecter' : 'Créer un compte'}</Link></p>
      </form>
    </main>);
}
