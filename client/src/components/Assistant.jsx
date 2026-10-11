import { useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../api';
import Icon from './Icon';
import OllamaLogo from './OllamaLogo';

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setErr('');
  }, [open]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, busy, open]);

  const send = async () => {
    const q = text.trim();
    if (!q || busy) return;
    setText(''); setErr('');
    const next = [...msgs, { role: 'user', content: q }];
    setMsgs(next); setBusy(true);
    try {
      const r = await api.post('/assistant/chat', { messages: next });
      setMsgs((m) => [...m, { role: 'assistant', content: r.data.reply }]);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setMsgs([]); setErr(''); inputRef.current?.focus(); };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <button className="icon-btn ai-btn" onClick={() => setOpen(true)} aria-label="Assistant IA" title="Assistant IA (Ollama)">
        <OllamaLogo size={22} />
      </button>

      {open && (
        <div className="ai-scrim" onClick={() => setOpen(false)} aria-hidden="true">
          <section className="ai" role="dialog" aria-modal="true" aria-label="Assistant IA" onClick={(e) => e.stopPropagation()}>
            <header className="ai-head">
              <span className="ai-badge"><OllamaLogo size={22} /></span>
              <div className="ai-title">
                <b>Assistant Karriery</b>
                <small><span className="ai-dot" /> Propulsé par Ollama</small>
              </div>
              <div className="ai-acts">
                {msgs.length > 0 && (
                  <button className="ai-ico" onClick={reset} aria-label="Nouvelle conversation" title="Nouvelle conversation"><Icon name="plus" size={18} /></button>
                )}
                <button className="ai-ico" onClick={() => setOpen(false)} aria-label="Fermer"><Icon name="x" size={18} /></button>
              </div>
            </header>

            <div className="ai-list" ref={listRef}>
              {msgs.length === 0 && !busy && (
                <div className="ai-empty" aria-hidden="true">
                  <span className="ai-watermark"><OllamaLogo size={92} /></span>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`ai-msg ${m.role}`}>
                  {m.role === 'assistant' && <span className="ai-ava"><OllamaLogo size={15} /></span>}
                  <div className="ai-bubble">{m.content}</div>
                </div>
              ))}
              {busy && (
                <div className="ai-msg assistant">
                  <span className="ai-ava"><OllamaLogo size={15} /></span>
                  <div className="ai-bubble ai-typing"><span /><span /><span /></div>
                </div>
              )}
              {err && <p className="ai-err" role="alert">{err}</p>}
            </div>

            <div className="ai-composer">
              <div className="ai-field">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={text}
                  placeholder="Posez votre question…"
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKey}
                  disabled={busy}
                />
                <button className="ai-send" onClick={send} disabled={busy || !text.trim()} aria-label="Envoyer">
                  <Icon name={busy ? 'clock' : 'send'} size={18} />
                </button>
              </div>
              <p className="ai-hint">Réponses générées par IA — vérifiez les informations importantes. Entrée pour envoyer, Maj+Entrée pour un saut de ligne.</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
