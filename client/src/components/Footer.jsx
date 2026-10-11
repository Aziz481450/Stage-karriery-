import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { IconInstagram, IconLinkedin, IconYoutube, IconMail, IconPhone, IconArrowRight } from './icons';

const quick = [
  ['Fonctionnalités', '/#fonctionnalites'],
  ['Parcours', '/#parcours'],
  ['Notre CEO', '/#ceo'],
  ['À propos', '/#apropos'],
  ['Contact', '/#contact'],
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    setMsg(null); setBusy(true);
    try {
      await api.post('/newsletter', { email });
      setMsg({ ok: 'Merci ! Vous êtes maintenant inscrit.' });
      setEmail('');
    } catch (x) {
      setMsg({ bad: x.response?.status === 409 ? 'Cette adresse est déjà inscrite.' : errMsg(x) });
    } finally { setBusy(false); }
  };

  return (
    <footer className="foot">
      <div className="foot-grid">
        <div className="foot-about">
          <span className="foot-logo"><img src="/logo.png" alt="Karriery" /></span>
          <p>Karriery accompagne les candidats dans la construction de leur parcours
            professionnel, en réunissant l’analyse par IA et l’expertise de rédacteurs humains.</p>
          <div className="social">
            <a href="https://instagram.com/karrierytn" target="_blank" rel="noreferrer" aria-label="Instagram"><IconInstagram size={17} /></a>
            <a href="https://linkedin.com/company/karriery" target="_blank" rel="noreferrer" aria-label="LinkedIn"><IconLinkedin size={17} /></a>
            <a href="https://www.youtube.com/@boussadahalim6021" target="_blank" rel="noreferrer" aria-label="YouTube"><IconYoutube size={17} /></a>
          </div>
        </div>

        <div>
          <h3 className="foot-title">Liens rapides</h3>
          <ul className="foot-links">
            {quick.map(([label, href]) => <li key={href}><Link to={href}>{label}</Link></li>)}
          </ul>
        </div>

        <div>
          <h3 className="foot-title">Support</h3>
          <ul className="foot-links foot-contact">
            <li><Link to="/connexion">Se connecter</Link></li>
            <li><Link to="/inscription">Créer un compte</Link></li>
            <li><a href="tel:+21658065605"><IconPhone size={15} /> +216 58 065 605</a></li>
            <li><a href="mailto:info@karriery.com"><IconMail size={15} /> info@karriery.com</a></li>
          </ul>
        </div>

        <div className="nl">
          <h3 className="foot-title">Newsletter</h3>
          <p>Recevez les nouveautés de Karriery et nos conseils pour améliorer votre CV.</p>
          <form onSubmit={subscribe}>
            <input type="email" placeholder="Votre adresse email" value={email}
              onChange={(e) => setEmail(e.target.value)} required aria-label="Adresse email" />
            <button type="submit" disabled={busy} aria-label="S’inscrire">
              {busy ? '…' : <IconArrowRight size={18} />}
            </button>
          </form>
          {msg?.ok && <p className="msg ok" role="status">{msg.ok}</p>}
          {msg?.bad && <p className="msg bad" role="alert">{msg.bad}</p>}
        </div>
      </div>

      <div className="foot-bottom">
        <div className="foot-bottom-in">
          <p>© 2026 Karriery. Tous droits réservés.</p>
          <p>Fait avec <span className="heart">♥</span> en Tunisie</p>
        </div>
      </div>
    </footer>
  );
}
