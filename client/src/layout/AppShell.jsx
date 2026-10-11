import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { photoUrl } from '../api';
import Bell from '../components/Bell';
import Icon from '../components/Icon';
import ThemeToggle from '../components/ThemeToggle';
import Assistant from '../components/Assistant';
import CommandPalette from '../components/CommandPalette';
import './shell.css';
import '../premium.css';
import '../theme.css';

const NAV = {
  candidat: [
    { group: 'Menu', items: [['/candidat/dashboard', 'Tableau de bord', 'dash'], ['/candidat/dossiers', 'Mes dossiers', 'files'], ['/candidat/messagerie', 'Messagerie', 'mail'], ['/candidat/profil', 'Mon profil', 'user']] },
    { group: 'Autres', items: [['mailto:info@karriery.com', 'Aide', 'help']] },
  ],
  redacteur: [
    { group: 'Menu', items: [['/redacteur/dashboard', 'Tableau de bord', 'dash'], ['/redacteur/dossiers', 'Dossiers', 'files'], ['/redacteur/messagerie', 'Messagerie', 'mail'], ['/redacteur/profil', 'Mon profil', 'user']] },
    { group: 'Autres', items: [['mailto:info@karriery.com', 'Aide', 'help']] },
  ],
  admin: [
    { group: 'Menu', items: [['/admin', 'Administration', 'admin']] },
    { group: 'Autres', items: [['mailto:info@karriery.com', 'Aide', 'help']] },
  ],
};
const ROLE = { candidat: 'Candidat', redacteur: 'Rédacteur', admin: 'Administrateur' };

export const initials = (n = '') => n.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [prof, setProf] = useState(false);
  const [cp, setCp] = useState(false);
  const ref = useRef(null);

  useEffect(() => { setMenu(false); setProf(false); setCp(false); }, [pathname]);

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setProf(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCp((v) => !v); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const items = [
    ...NAV[user.role].flatMap((g) => g.items.map(([to, label, i]) =>
      to.startsWith('mailto:')
        ? { label, icon: i, action: () => { window.location.href = to; } }
        : { to, label, icon: i })),
    { label: 'Se déconnecter', icon: 'logout', action: async () => { await logout(); navigate('/'); } },
  ];
  const av = photoUrl(user);

  return (
    <div className="app">
      <aside className={`side${menu ? ' open' : ''}`}>
        <Link to="/" className="side-logo" aria-label="Karriery, accueil">
          <img src="/logo.png" alt="" />
          <span>Karriery</span>
        </Link>

        {NAV[user.role].map((g) => (
          <nav key={g.group} aria-label={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map(([to, label, i]) => (
              to.startsWith('mailto:')
                ? <a key={to} href={to} className="nl"><Icon name={i} size={20} /><span>{label}</span></a>
                : <NavLink key={to} to={to} className="nl" onClick={() => setMenu(false)}><Icon name={i} size={20} /><span>{label}</span></NavLink>
            ))}
          </nav>
        ))}

        <div className="side-foot">
          <b>Besoin d'aide&nbsp;?</b>
          <span>Notre équipe vous répond.</span>
          <a href="mailto:info@karriery.com">info@karriery.com</a>
        </div>
      </aside>

      {menu && <div className="scrim" onClick={() => setMenu(false)} aria-hidden="true" />}

      <div className="col">
        <header className="top">
          <button className="burger" onClick={() => setMenu((v) => !v)} aria-label="Ouvrir le menu" aria-expanded={menu}>
            <Icon name={menu ? 'x' : 'menu'} />
          </button>

          <div className="top-search" role="button" tabIndex={0} aria-label="Rechercher (Ctrl+K)"
            onClick={() => setCp(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCp(true); } }}>
            <Icon name="search" size={18} />
            <input readOnly placeholder="Rechercher…" tabIndex={-1} aria-hidden="true" />
            <kbd>⌘ K</kbd>
          </div>

          <div className="top-r">
            <Assistant />
            <ThemeToggle />
            {user.role !== 'admin' && <Bell />}

            <div className="prof" ref={ref}>
              <button className="prof-btn" onClick={() => setProf(!prof)} aria-expanded={prof} aria-haspopup="menu">
                <span className="av">{av ? <img src={av} alt="" /> : initials(user.nom)}</span>
                <span className="pn"><b>{user.nom}</b><small>{ROLE[user.role]}</small></span>
              </button>
              {prof && (
                <div className="pm" role="menu">
                  {user.role !== 'admin' && (
                    <Link to={`/${user.role}/profil`} role="menuitem" onClick={() => setProf(false)}>
                      <Icon name="user" size={16} /> Modifier le profil
                    </Link>
                  )}
                  <a href="mailto:info@karriery.com" role="menuitem"><Icon name="help" size={16} /> Aide</a>
                  <button onClick={logout} role="menuitem"><Icon name="logout" size={16} /> Se déconnecter</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <CommandPalette open={cp} onClose={() => setCp(false)} items={items} />

        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
