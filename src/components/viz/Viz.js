import React, {useState} from 'react';
import s from './viz.module.css';

export const cx = (...a) => a.filter(Boolean).join(' ');

export const fmt = (x, n = 2) => {
  const v = Math.round(x * 10 ** n) / 10 ** n;
  return (Object.is(v, -0) ? 0 : v).toFixed(n);
};

export function Viz({title, caption, children}) {
  return (
    <figure className={s.frame}>
      {title ? <div className={s.title}>{title}</div> : null}
      {children}
      {caption ? <figcaption className={s.caption}>{caption}</figcaption> : null}
    </figure>
  );
}

export function Controls({children}) {
  return <div className={s.controls}>{children}</div>;
}

export function Slider({label, min, max, step = 1, value, onChange, format}) {
  return (
    <label className={s.ctl}>
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <b>{format ? format(value) : value}</b>
    </label>
  );
}

export function Btn({on, onClick, children}) {
  return (
    <button type="button" className={cx(s.btn, on && s.btnOn)} onClick={onClick}>
      {children}
    </button>
  );
}

export function Stats({children}) {
  return <div className={s.stats}>{children}</div>;
}

export function Stat({label, value, tone}) {
  return (
    <div className={s.stat}>
      <span>{label}</span>
      <b className={tone ? s[tone] : undefined}>{value}</b>
    </div>
  );
}

export function Note({children}) {
  return <p className={s.note}>{children}</p>;
}

export function Bar({label, value, max, color, text}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={s.barRow}>
      <span>{label}</span>
      <div className={s.barTrack}>
        <div className={s.barFill} style={{width: `${pct}%`, background: color}} />
      </div>
      <b>{text ?? fmt(value)}</b>
    </div>
  );
}

export function useDrag(svgRef, vw, vh, onMove) {
  const [drag, setDrag] = useState(null);
  const toSvg = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * vw, ((e.clientY - r.top) / r.height) * vh];
  };
  const start = (id) => (e) => {
    e.preventDefault();
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(id);
  };
  const move = (e) => {
    if (drag == null) return;
    onMove(drag, toSvg(e));
  };
  const end = () => setDrag(null);
  return {
    dragging: drag,
    start,
    svgProps: {onPointerMove: move, onPointerUp: end, onPointerCancel: end},
  };
}

export {s as styles};
