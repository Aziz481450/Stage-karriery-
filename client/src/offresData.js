export const CATEGORIES = [
  ['frontend', 'Front-end developer'],
  ['backend', 'Back-end developer'],
  ['fullstack', 'Full-stack developer'],
  ['mobile', 'Mobile developer'],
  ['ai', 'Intelligence artificielle (AI)'],
  ['iot', 'IoT'],
  ['embedded', 'Systèmes embarqués'],
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES);

export const STATUT_LABEL = { ouverte: 'Ouverte', fermee: 'Fermée' };

export const emptyForm = () => ({
  titre: '', entreprise: '', categorie: 'frontend', lieu: '',
  salaire_min: '', salaire_max: '', niveau_experience: '',
  description: '', exigences: '', statut: 'ouverte', redacteur_id: '',
});

export const money = (n) => (n == null || n === '' ? '—' : `${Number(n).toLocaleString('fr-FR')} €`);
export const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
