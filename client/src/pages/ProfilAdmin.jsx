import ProfileForm from './ProfileForm';
export default () => <ProfileForm
  endpoint="/admin/profil"
  title="Mon profil administrateur"
  note="Ces informations identifient l’administrateur et apparaissent dans l’espace de gestion."
  fields={[
    { k: 'telephone', label: 'Téléphone' },
    { k: 'ville', label: 'Ville' },
    { k: 'fonction', label: 'Fonction (ex. responsable recrutement)' },
    { k: 'bio', label: 'Présentation', type: 'textarea', wide: true }
  ]} />;
