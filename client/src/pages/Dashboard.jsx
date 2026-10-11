import { useAuth } from '../AuthContext';
import Candidat from './dash/Candidat';
import Redacteur from './dash/Redacteur';

export default function Dashboard() {
  const { user } = useAuth();
  return user.role === 'redacteur' ? <Redacteur /> : <Candidat />;
}