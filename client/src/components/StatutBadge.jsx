const LABELS = {
  actif: 'Actif', annule: 'Annulé', en_attente: 'En attente',
  en_cours: 'En cours', terminee: 'Terminée', annulee: 'Annulée',
};

export default function StatutBadge({ statut, label }) {
  const cls = { en_cours: '', en_attente: 'warn', terminee: '', annulee: 'off', actif: '', annule: 'off' }[statut] || '';
  return <span className={`tag ${cls}`}>{label || LABELS[statut] || statut}</span>;
}
