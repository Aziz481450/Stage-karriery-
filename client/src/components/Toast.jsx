import { useEffect, useState } from 'react';

export default function Toast({ text = '', type = 'ok', onDone, delay = 3600 }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOut(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  useEffect(() => {
    if (!out) return undefined;
    const t = setTimeout(onDone, 500);
    return () => clearTimeout(t);
  }, [out, onDone]);
  return (
    <div className={`toast-p ${type}${out ? ' out' : ''}`} role={type === 'err' ? 'alert' : 'status'}>
      <span className="toast-ic" aria-hidden="true">{type === 'ok' ? '✓' : '!'}</span>
      <span>{text}</span>
    </div>
  );
}