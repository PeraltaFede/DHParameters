import { useEffect, useMemo, useState } from 'react';
import { formatInput, readInput } from '../lib/format.js';
import { Icon } from './Icons.jsx';

export function Segmented({ value, onChange, options, size = 'md', ariaLabel }) {
  return (
    <div className={`seg seg-${size}`} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'on' : ''}
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Check({ checked, onChange, children }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function Callout({ tone = 'info', title, children, style }) {
  return (
    <div className={`callout callout-${tone}`} style={style}>
      {title && <div className="callout-title">{title}</div>}
      {children}
    </div>
  );
}

/**
 * Numeric input that accepts expressions ("pi/2", "-0.15") and keeps the
 * user's text while they type. kind = 'angle' | 'length'.
 */
export function NumberField({ value, onChange, kind = 'length', units = 'deg', ariaLabel }) {
  const display = formatInput(value, kind, units);
  const [text, setText] = useState(display);
  const [focused, setFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(display);
      setInvalid(false);
    }
  }, [display, focused]);

  return (
    <input
      className={`num-input${invalid ? ' invalid' : ''}`}
      type="text"
      inputMode="decimal"
      spellCheck={false}
      aria-label={ariaLabel}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setText(display);
          e.currentTarget.blur();
        }
      }}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const v = readInput(t, kind, units);
        setInvalid(Number.isNaN(v));
        if (!Number.isNaN(v)) onChange(v);
      }}
    />
  );
}

/* ------------------------------------------------------------ code view */

const TOKENS = {
  matlab: /(%.*$)|('(?:[^'\n]|'')*')|(\b\d+(?:\.\d+)?\b)|(\b(?:pi|clear|end|function)\b)|([A-Za-z_]\w*(?=\())/g,
  python: /(#.*$)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(\b(?:from|import|as|pi|True|False|None)\b)|([A-Za-z_]\w*(?=\())/g,
};

function highlightLine(line, lang) {
  const re = TOKENS[lang];
  if (!re) return line;
  const rx = new RegExp(re.source, 'g');
  const parts = [];
  let last = 0;
  let m;
  while ((m = rx.exec(line))) {
    if (m[0].length === 0) {
      rx.lastIndex++;
      continue;
    }
    if (m.index > last) parts.push(line.slice(last, m.index));
    const cls = m[1] ? 'tk-com' : m[2] ? 'tk-str' : m[3] ? 'tk-num' : m[4] ? 'tk-kw' : 'tk-fn';
    parts.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

export function Highlighted({ code, lang }) {
  const lines = useMemo(() => code.split('\n').map((l) => highlightLine(l, lang)), [code, lang]);
  return lines.map((parts, i) => (
    <span key={i} className="code-line">
      {parts}
      {'\n'}
    </span>
  ));
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function CopyButton({ text, label = 'Copy', className = 'btn sm' }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return undefined;
    const id = setTimeout(() => setDone(false), 1400);
    return () => clearTimeout(id);
  }, [done]);
  return (
    <button type="button" className={className} onClick={async () => setDone(await copyText(text))}>
      <Icon name={done ? 'check' : 'copy'} size={14} />
      {done ? 'Copied' : label}
    </button>
  );
}

export function CodeBlock({ code, lang, title }) {
  return (
    <div className="code-block">
      <div className="code-block-head">
        <span className="code-block-title">{title}</span>
        <CopyButton text={code} className="btn sm ghost" />
      </div>
      <pre className="code">
        <code>
          <Highlighted code={code} lang={lang} />
        </code>
      </pre>
    </div>
  );
}
