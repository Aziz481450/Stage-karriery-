export default function StatutBadge({ statut }) {
  const cls = { en_cours: '', en_attente: 'warn', terminee: '', annulee: 'off', actif: '', annule: 'off' }[statut] || '';
  return <span className={`tag ${cls}`}>{statut}</span>;
}