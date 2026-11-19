import React, {useMemo, useRef, useState} from 'react';
import {useDrag, styles as s} from '../../Viz';

// 지식 그래프 그림들이 함께 쓰는 그리기 컴포넌트(이 폴더 안에서만 쓴다).
// 노드는 끌어서 옮길 수 있고, 위치는 서버와 브라우저에서 똑같이 나오는 힘 모형 배치로 정한다.

const CY = 17;
const nodeW = (label) => Math.min(150, Math.max(46, 13 * Math.min(label.length, 11) + 18));
const shown = (label) => (label.length > 11 ? `${label.slice(0, 10)}…` : label);

// 겹친 노드를 밀어낸다. 이웃한 노드는 간선 이름이 들어갈 틈을 더 둔다.
function relax(q, nodes, edges, W, H) {
  const n = nodes.length;
  const index = {};
  nodes.forEach((nd, i) => {
    index[nd.id] = i;
  });
  const wide = nodes.map((nd) => nodeW(nd.label));
  const near = {};
  edges.forEach((e) => {
    near[`${index[e.s]}-${index[e.o]}`] = true;
    near[`${index[e.o]}-${index[e.s]}`] = true;
  });
  for (let it = 0; it < 80; it += 1) {
    let moved = false;
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const link = near[`${i}-${j}`];
        const ox = (wide[i] + wide[j]) / 2 + (link ? 56 : 10) - Math.abs(q[i][0] - q[j][0]);
        const oy = CY * 2 + (link ? 30 : 18) - Math.abs(q[i][1] - q[j][1]);
        if (ox > 0 && oy > 0) {
          moved = true;
          if (oy <= ox) {
            const d = (q[i][1] >= q[j][1] ? 1 : -1) * (oy / 2 + 0.5);
            q[i][1] += d;
            q[j][1] -= d;
          } else {
            const d = (q[i][0] >= q[j][0] ? 1 : -1) * (ox / 2 + 0.5);
            q[i][0] += d;
            q[j][0] -= d;
          }
        }
      }
    }
    q.forEach((p, i) => {
      p[0] = Math.min(W - wide[i] / 2 - 4, Math.max(wide[i] / 2 + 4, p[0]));
      p[1] = Math.min(H - 26, Math.max(26, p[1]));
    });
    if (!moved) break;
  }
  const out = {};
  nodes.forEach((nd, i) => {
    out[nd.id] = q[i];
  });
  return out;
}

// fixed가 모든 노드의 자리를 알려 주면(0~1 비율) 그대로 쓰고, 아니면 힘 모형으로 배치한다.
export function forceLayout(nodes, edges, W, H, fixed) {
  const n = nodes.length;
  if (n === 0) return {};
  const fit = (v, lo, hi, a, b) => (hi - lo < 1 ? (a + b) / 2 : a + (v - lo) * ((b - a) / (hi - lo)));
  if (fixed && nodes.every((nd) => fixed[nd.id])) {
    return relax(nodes.map((nd) => [50 + fixed[nd.id][0] * (W - 100), 28 + fixed[nd.id][1] * (H - 56)]), nodes, edges, W, H);
  }
  const pos = nodes.map((_, i) => {
    const a = (2 * Math.PI * i) / n;
    return [W / 2 + W * 0.3 * Math.cos(a), H / 2 + H * 0.3 * Math.sin(a)];
  });
  if (n === 1) pos[0] = [W / 2, H / 2];
  const index = {};
  nodes.forEach((nd, i) => {
    index[nd.id] = i;
  });
  const k = Math.sqrt((W * H) / n) * 0.95;
  let temp = W / 8;
  for (let it = 0; it < 170; it += 1) {
    const disp = pos.map(() => [0, 0]);
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const dx = pos[i][0] - pos[j][0];
        const dy = pos[i][1] - pos[j][1];
        const d = Math.max(Math.hypot(dx, dy), 0.01);
        const f = (k * k) / d / d;
        disp[i][0] += dx * f;
        disp[i][1] += dy * f;
        disp[j][0] -= dx * f;
        disp[j][1] -= dy * f;
      }
    }
    edges.forEach((e) => {
      const i = index[e.s];
      const j = index[e.o];
      if (i === undefined || j === undefined || i === j) return;
      const dx = pos[i][0] - pos[j][0];
      const dy = pos[i][1] - pos[j][1];
      const d = Math.max(Math.hypot(dx, dy), 0.01);
      const f = d / k;
      disp[i][0] -= dx * f;
      disp[i][1] -= dy * f;
      disp[j][0] += dx * f;
      disp[j][1] += dy * f;
    });
    pos.forEach((p, i) => {
      disp[i][0] += (W / 2 - p[0]) * 0.04;
      disp[i][1] += (H / 2 - p[1]) * 0.04;
      const len = Math.max(Math.hypot(disp[i][0], disp[i][1]), 0.01);
      const lim = Math.min(len, temp);
      p[0] = Math.min(W - 60, Math.max(60, p[0] + (disp[i][0] / len) * lim));
      p[1] = Math.min(H - 26, Math.max(26, p[1] + (disp[i][1] / len) * lim));
    });
    temp *= 0.97;
  }
  const xs = pos.map((p) => p[0]);
  const ys = pos.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return relax(pos.map((p) => [fit(p[0], x0, x1, 60, W - 60), fit(p[1], y0, y1, 28, H - 28)]), nodes, edges, W, H);
}

const edgeEnd = (c, toward, w) => {
  const dx = toward[0] - c[0];
  const dy = toward[1] - c[1];
  const t = Math.min(dx === 0 ? 1e9 : w / 2 / Math.abs(dx), dy === 0 ? 1e9 : CY / Math.abs(dy));
  return [c[0] + dx * t, c[1] + dy * t];
};

// nodes: {id,label,lit,tag}, edges: {key,s,p,o}. hlEdges, hlNodes, sel은 {키: true} 모양.
export default function GraphView({nodes = [], edges = [], uid = 'gv', W = 560, H = 300, hlEdges = {}, hlNodes = {}, sel = null, onSelect, label, fixed}) {
  const ref = useRef(null);
  const [over, setOver] = useState({});
  const sig = nodes.map((n) => n.id).join('|') + '#' + edges.map((e) => `${e.s}>${e.o}`).join('|');
  const base = useMemo(() => forceLayout(nodes, edges, W, H, fixed), [sig, W, H, fixed]); // eslint-disable-line react-hooks/exhaustive-deps
  const {start, svgProps} = useDrag(ref, W, H, (id, p) => {
    setOver((o) => ({...o, [id]: [Math.min(W - 10, Math.max(10, p[0])), Math.min(H - 10, Math.max(10, p[1]))]}));
  });
  const P = (id) => over[id] || base[id] || [W / 2, H / 2];
  const wOf = {};
  nodes.forEach((n) => {
    wOf[n.id] = nodeW(n.label);
  });

  const groups = {};
  edges.forEach((e, i) => {
    const key = e.s < e.o ? `${e.s}\u0001${e.o}` : `${e.o}\u0001${e.s}`;
    (groups[key] = groups[key] || []).push(i);
  });
  const geo = edges.map((e, i) => {
    if (!(e.s in wOf) || !(e.o in wOf)) return null;
    const a = P(e.s);
    const b = P(e.o);
    if (e.s === e.o) {
      return {d: `M ${a[0] - 12} ${a[1] - CY} C ${a[0] - 36} ${a[1] - 62} ${a[0] + 36} ${a[1] - 62} ${a[0] + 12} ${a[1] - CY}`, lx: a[0], ly: a[1] - 52};
    }
    const key = e.s < e.o ? `${e.s}\u0001${e.o}` : `${e.o}\u0001${e.s}`;
    const g = groups[key];
    const off = (g.indexOf(i) - (g.length - 1) / 2) * 38;
    const [p0, p1] = e.s < e.o ? [a, b] : [b, a];
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const d = Math.max(Math.hypot(dx, dy), 0.01);
    const c = [(a[0] + b[0]) / 2 + (-dy / d) * off, (a[1] + b[1]) / 2 + (dx / d) * off];
    const q0 = edgeEnd(a, c, wOf[e.s] + 4);
    const q1 = edgeEnd(b, c, wOf[e.o] + 8);
    return {d: `M ${q0[0]} ${q0[1]} Q ${c[0]} ${c[1]} ${q1[0]} ${q1[1]}`, lx: 0.25 * q0[0] + 0.5 * c[0] + 0.25 * q1[0], ly: 0.25 * q0[1] + 0.5 * c[1] + 0.25 * q1[1]};
  });
  const anyHl = Object.keys(hlEdges).length > 0;

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={label || '지식 그래프'} {...svgProps}>
      <defs>
        <marker id={`${uid}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ifm-color-emphasis-600)" />
        </marker>
        <marker id={`${uid}-h`} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--vb)" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const g = geo[i];
        if (!g) return null;
        const hl = !!hlEdges[e.key];
        const dim = anyHl && !hl;
        return (
          <g key={e.key} opacity={dim ? 0.3 : 1}>
            <path d={g.d} fill="none" stroke={hl ? 'var(--vb)' : 'var(--ifm-color-emphasis-600)'} strokeWidth={hl ? 3 : 1.5} markerEnd={`url(#${uid}-${hl ? 'h' : 'a'})`} />
            <text x={g.lx} y={g.ly} textAnchor="middle" dominantBaseline="central" className={s.ts} style={{paintOrder: 'stroke', stroke: 'var(--ifm-background-surface-color)', strokeWidth: 4, fontWeight: hl ? 700 : 400}}>
              {e.p}
            </text>
          </g>
        );
      })}
      {nodes.map((n) => {
        const [x, y] = P(n.id);
        const w = wOf[n.id];
        const on = !!hlNodes[n.id] || sel === n.id;
        const stroke = n.mixed ? 'var(--vbad)' : on ? 'var(--vb)' : n.lit ? 'var(--vc)' : 'var(--va)';
        return (
          <g
            key={n.id}
            tabIndex={0}
            style={{cursor: 'grab', outline: 'none'}}
            onPointerDown={start(n.id)}
            onClick={() => onSelect && onSelect(sel === n.id ? null : n.id)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' && onSelect) onSelect(sel === n.id ? null : n.id);
            }}
          >
            <title>{n.label}</title>
            <rect
              x={x - w / 2}
              y={y - CY}
              width={w}
              height={CY * 2}
              rx={n.lit ? 4 : CY}
              fill={on ? 'color-mix(in srgb, var(--vb) 18%, var(--ifm-background-surface-color))' : 'var(--ifm-background-surface-color)'}
              stroke={stroke}
              strokeWidth={on || n.mixed ? 2.5 : 1.5}
              strokeDasharray={n.lit ? '4 3' : undefined}
            />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={s.t}>
              {shown(n.label)}
            </text>
            {n.tag ? (
              <text x={x} y={y + CY + 11} textAnchor="middle" className={s.ts} style={{fill: n.mixed ? 'var(--vbad)' : undefined, paintOrder: 'stroke', stroke: 'var(--ifm-background-surface-color)', strokeWidth: 4}}>
                {n.tag}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
