export default function BarChart({ data = [], labels = [], height = 220, tone = '' }) {
  const vals = data.map((d) => (Number.isFinite(Number(d)) ? Number(d) : 0));
  const w = 640;
  const h = height;
  const pad = { t: 12, r: 6, b: 28, l: 6 };
  const max = Math.max(1, ...vals);
  const n = vals.length || 1;
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const gap = n > 8 ? 8 : 12;
  const bw = Math.max(4, (iw - gap * (n - 1)) / n);
  const yv = (v) => pad.t + ih - (v / max) * ih;
  const has = vals.some((d) => d > 0);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img"
      aria-label={`Histogramme mensuel, ${vals.length} périodes`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const yy = pad.t + (ih / 4) * i;
        return <line key={i} className="grid-line" x1={pad.l} y1={yy} x2={w - pad.r} y2={yy} />;
      })}
      {vals.map((v, i) => {
        const x = pad.l + i * (bw + gap);
        const yy = yv(v);
        return (
          <g key={i}>
            <rect className={`bar${tone ? ` ${tone}` : ''}`} x={x} y={yy} width={bw}
              height={Math.max(has ? 2 : 1, pad.t + ih - yy)} rx={Math.min(6, bw / 2)} />
            {labels[i] && (
              <text className="axis-txt" x={x + bw / 2} y={h - 8} textAnchor="middle">{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
