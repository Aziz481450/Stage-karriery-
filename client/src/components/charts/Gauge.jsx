export default function Gauge({ value = 0, caption = 'Objectif', text, foot = null }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const R = 90;
  const len = Math.PI * R;
  const off = len * (1 - v / 100);

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 200 120" className="gauge" role="img" aria-label={`${caption} : ${text || `${v}%`}`}>
        <path className="track" d={`M10,100 A${R},${R} 0 0 1 190,100`} />
        <path className="fill" d={`M10,100 A${R},${R} 0 0 1 190,100`}
          strokeDasharray={len} strokeDashoffset={off} />
        <text className="g-val" x="100" y="86" textAnchor="middle">{text || `${v}%`}</text>
        <text className="g-sub" x="100" y="106" textAnchor="middle">{caption}</text>
      </svg>
      {foot && (
        <div className="gauge-foot">
          {foot.map((f, i) => (
            <div key={i}><b>{f.value}</b><small>{f.label}</small></div>
          ))}
        </div>
      )}
    </div>
  );
}
