import { LABEL } from './Badge';

export default function StatusBadge({ statut }) {
  const s = statut || 'en_attente';
  return <span className={`sbadge ${s}`}>{LABEL[s] || s}</span>;
}
