import { useEffect, useState } from 'react';

export default function Typewriter({ words, speed = 70, hold = 1800 }) {
  const reduced = typeof window === 'undefined'
    ? false
    : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [w, setW] = useState(0);
  const [text, setText] = useState(reduced ? words[0] : '');
  const [del, setDel] = useState(false);

  useEffect(() => {
    if (reduced) return undefined;
    const cur = words[w % words.length];
    let t;
    if (!del && text === cur) t = setTimeout(() => setDel(true), hold);
    else if (del && text === '') { setDel(false); setW((x) => (x + 1) % words.length); }
    else if (del) t = setTimeout(() => setText(cur.slice(0, text.length - 1)), 34);
    else t = setTimeout(() => setText(cur.slice(0, text.length + 1)), speed);
    return () => clearTimeout(t);
  }, [text, del, w, words, reduced, speed, hold]);

  return (
    <span className="typewriter">{text}<span className="tw-caret" aria-hidden="true" /></span>
  );
}