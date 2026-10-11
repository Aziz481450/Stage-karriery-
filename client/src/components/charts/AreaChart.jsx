import { useId } from 'react';

export default function AreaChart({ data = [], labels = [], height = 260, label = 'Évolution' }) {
  const gid = `dgr${useId().replace(/[:]/g, '')}`;
  const vals = data.map((d) => (Number.isFinite(Number(d)) ? Number(d) : 0));
  const w = 640;
  const h = height;
  const pad = { t: 16, r: 10, b: 30, l: 10 };
  const n = vals.length;
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const max = Math.max(1, ...vals);
  const min = Math.min(0, ...vals);
  const span = Math.max(1, max - min);
  const x = (i) => pad.l + (n <= 1 ? iw / 2 : (iw * i) / (n - 1));
  const y = (v) => pad.t + ih - ((v - min) / span) * ih;
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = n > 0 ? `${line} L${x(n - 1).toFixed(1)},${pad.t + ih} L${x(0).toFixed(1)},${pad.t + ih} Z` : '';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label={`${label}, ${n} points`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E0183F" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#E0183F" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => {
        const yy = pad.t + (ih / 4) * i;
        return <line key={i} className="grid-line" x1={pad.l} y1={yy} x2={w - pad.r} y2={yy} />;
      })}
      {n > 0 && <path d={area} fill={`url(#${gid})`} />}
      {n > 0 && <path className="area-line" d={line} />}
      {n > 1 && vals.map((v, i) => (
        <circle key={i} className="dot" cx={x(i)} cy={y(v)} r={4} />
      ))}
      {labels.map((l, i) => (
        (n <= 12 || i % Math.ceil(n / 12) === 0) && (
          <text key={i} className="axis-txt" x={x(i)} y={h - 8} textAnchor="middle">{l}</text>
        )
      ))}
    </svg>
  );
}
