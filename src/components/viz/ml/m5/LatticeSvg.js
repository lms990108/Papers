import React from 'react';
import {styles as s} from '../../Viz';

// "41" 격자(노드 0~3)를 그리는 공용 그림.
// arcs: [{key: '0-2', lines: [{text, on}], on, dim}]  on이면 굵은 최적 경로, dim이면 흐리게.
const X = (n) => 80 + 160 * n;
const Y = 130;

function geom(key) {
  const [a, b] = key.split('-').map(Number);
  const x1 = X(a);
  const x2 = X(b);
  if (b - a === 1) {
    return {d: `M ${x1 + 14},${Y} L ${x2 - 14},${Y}`, tx: (x1 + x2) / 2, ty: Y - 8, dir: -1};
  }
  if (a === 0) {
    return {d: `M ${x1},${Y - 14} C ${x1 + 70},12 ${x2 - 70},12 ${x2},${Y - 14}`, tx: (x1 + x2) / 2, ty: 62, dir: 1};
  }
  return {d: `M ${x1},${Y + 14} C ${x1 + 70},248 ${x2 - 70},248 ${x2},${Y + 14}`, tx: (x1 + x2) / 2, ty: 168, dir: 1};
}

export default function LatticeSvg({nodes = [0, 1, 2, 3], arcs = [], label}) {
  return (
    <svg viewBox="0 0 640 260" className={s.svg} role="img" aria-label={label || '조각 세 개의 격자. 노드 0부터 3까지.'}>
      {arcs.map((a) => {
        const g = geom(a.key);
        const stroke = a.on ? 'var(--vb)' : 'var(--ifm-color-emphasis-500)';
        return (
          <g key={a.key} opacity={a.dim ? 0.3 : 1}>
            <path d={g.d} fill="none" stroke={stroke} strokeWidth={a.on ? 3 : 1.5} />
            {(a.lines || []).map((ln, i) => {
              const y = g.dir < 0 ? g.ty - 15 * (a.lines.length - 1 - i) : g.ty + 15 * i;
              return (
                <text
                  key={i}
                  x={g.tx}
                  y={y}
                  textAnchor="middle"
                  className={s.ts}
                  style={ln.on ? {fill: 'var(--vb)', fontWeight: 700} : undefined}
                >
                  {ln.text}
                </text>
              );
            })}
          </g>
        );
      })}
      {[0, 1, 2, 3].map((n) => {
        const has = nodes.indexOf(n) >= 0;
        return (
          <g key={n}>
            <circle
              cx={X(n)}
              cy={Y}
              r={14}
              fill="var(--ifm-background-color)"
              stroke={has ? 'var(--ifm-font-color-base)' : 'var(--ifm-color-emphasis-400)'}
              strokeWidth={1.5}
              strokeDasharray={has ? undefined : '3 3'}
            />
            <text x={X(n)} y={Y + 4} textAnchor="middle" className={s.t} opacity={has ? 1 : 0.4}>
              {n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
