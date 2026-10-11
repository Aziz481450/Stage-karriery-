import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

export default function CommandPalette({ open, onClose, items }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const list = useMemo(
    () => items.filter((it) => it.label.toLowerCase().includes(q.trim().toLowerCase())),
    [items, q]
  );

  useEffect(() => {
    if (!open) return;
    setQ('');
    setSel(0);
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => { setSel(0); }, [q]);

  if (!open) return null;

  const run = (it) => {
    if (!it) return;
    onClose();
    if (it.action) it.action();
    else navigate(it.to);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(list[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div className="cp-scrim" onMouseDown={onClose}>
      <div className="cp" role="dialog" aria-modal="true" aria-label="Copilote IA" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cp-top">
          <Icon name="spark" size={18} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Aller à une page ou lancer une action…"
            aria-label="Rechercher une page ou une action"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="cp-list">
          {list.length === 0 && <p className="cp-empty muted">Aucun résultat.</p>}
          {list.map((it, i) => (
            <button
              type="button"
              key={it.to || it.label}
              className={`cp-item${i === sel ? ' on' : ''}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => run(it)}
            >
              <span className="cp-ic"><Icon name={it.icon} size={18} /></span>
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
