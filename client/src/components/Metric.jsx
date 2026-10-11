import Icon from './Icon';

const ARROW = { up: '▲', down: '▼', flat: '▬' };

export default function Metric({ icon, value, label, delta }) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span className="metric-ic"><Icon name={icon} size={22} /></span>
        {delta && (
          <span className={`delta ${delta.dir}`}>{ARROW[delta.dir] || ''} {delta.text}</span>
        )}
      </div>
      <div className="metric-val">{value}</div>
      <div className="metric-lbl">{label}</div>
    </div>
  );
}
