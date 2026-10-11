import ProfileForm from './ProfileForm';
export default () => <ProfileForm endpoint="/candidat/profil" title="Mon profil candidat" fields={[
  { k: 'telephone', label: 'Téléphone' }, { k: 'ville', label: 'Ville' },
  { k: 'titre_poste', label: 'Poste recherché' }, { k: 'niveau_etudes', label: "Niveau d'études" },
  { k: 'competences', label: 'Compétences (séparées par des virgules)', type: 'textarea', wide: true },
  { k: 'bio', label: 'Présentation', type: 'textarea', wide: true }]} />;
