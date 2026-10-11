import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { SocketProvider } from './components/Socket';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProfilCandidat from './pages/ProfilCandidat';
import ProfilRedacteur from './pages/ProfilRedacteur';
import Demandes from './pages/Demandes';
import DemandeDetail from './pages/DemandeDetail';
import Messagerie from './pages/Messagerie';
import Conversations from './pages/Conversations';
import Admin from './pages/Admin';
import Footer from './components/Footer';
import AppShell from './layout/AppShell';

const home = (u) => ({ candidat: '/candidat/dashboard', redacteur: '/redacteur/dashboard', admin: '/admin' }[u.role]);

function Role({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user.role) ? children : <Navigate to={home(user)} replace />;
}

function Private() {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted pad">Chargement…</p>;
  return user ? <AppShell /> : <Navigate to="/connexion" replace />;
}

function Public() {
  return (
    <div className="shell">
      <header className="bar">
        <Link to="/" aria-label="Karriery, accueil"><img src="/logo.png" alt="Karriery" className="logo" /></Link>
        <span className="rule" />
      </header>
      <div className="main"><Outlet /></div>
      <Footer />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const C = ['candidat'], R = ['redacteur'], ALL = ['candidat', 'redacteur', 'admin'];
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={loading ? null : user ? <Navigate to={home(user)} replace /> : <Home />} />
        <Route element={<Public />}>
          <Route path="/connexion" element={<Auth mode="login" />} />
          <Route path="/inscription" element={<Auth mode="register" />} />
        </Route>
        <Route element={<Private />}>
          <Route path="/candidat/dashboard" element={<Role roles={C}><Dashboard /></Role>} />
          <Route path="/candidat/dossiers" element={<Role roles={C}><Demandes /></Role>} />
          <Route path="/candidat/profil" element={<Role roles={C}><ProfilCandidat /></Role>} />
          <Route path="/candidat/messagerie" element={<Role roles={C}><Conversations /></Role>} />
          <Route path="/redacteur/dashboard" element={<Role roles={R}><Dashboard /></Role>} />
          <Route path="/redacteur/dossiers" element={<Role roles={R}><Demandes /></Role>} />
          <Route path="/redacteur/profil" element={<Role roles={R}><ProfilRedacteur /></Role>} />
          <Route path="/redacteur/messagerie" element={<Role roles={R}><Conversations /></Role>} />
          <Route path="/demandes/:id" element={<Role roles={ALL}><DemandeDetail /></Role>} />
          <Route path="/demandes/:id/messages" element={<Role roles={ALL}><Messagerie /></Role>} />
          <Route path="/admin" element={<Role roles={['admin']}><Admin /></Role>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}