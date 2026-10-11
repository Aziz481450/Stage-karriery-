export const LABEL = { en_attente: 'En attente', en_cours: 'En cours', terminee: 'Terminé', annulee: 'Annulé', refusee: 'Refusée' };

export default function Badge({ s }) {
  return <span className={`badge ${s || ''}`}>{LABEL[s] || s}</span>;
}