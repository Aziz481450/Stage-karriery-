import ProfileForm from './ProfileForm';
export default () => <ProfileForm endpoint="/redacteur/profil" title="Mon profil rédacteur" fields={[
  { k: 'specialite', label: 'Spécialité (ex. informatique, santé)' },
  { k: 'annees_experience', label: "Années d'expérience", type: 'number' },
  { k: 'langues', label: 'Langues' }, { k: 'disponible', label: 'Disponible pour de nouveaux dossiers', type: 'check' },
  { k: 'bio', label: 'Présentation', type: 'textarea', wide: true }]} />;
