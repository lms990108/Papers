import React from 'react';
import {styles as s} from '../../Viz';
import {POS, ALL_NODES, FULL} from './graphToy';

const W = 560;
const H = 290;
const tint = (c, p = 18) => `color-mix(in srgb, ${c} ${p}%, var(--ifm-background-color))`;
const widthOf = (n) => 14 + 11.5 * n.length;

// 작은 지식 그래프를 그리는 공용 그림. 노드는 글자 라벨이 붙은 알약 모양입니다.
// color(노드) → 색, tag(노드) → 작은 표지, nodeOn/edgeOn → 강조 여부, ring(노드) → 시작점 표시
export default function GraphCanvas({
  nodes = ALL_NODES,
  edges = FULL.edges,
  color = () => null,
  tag = () => '',
  nodeOn = () => true,
  edgeOn = () => true,
  ring = () => false,
  showRel = false,
  onNode = null,
  label = '개체 10개와 관계가 이어진 작은 지식 그래프',
}) {
  const drawn = edges.filter((e) => nodes.indexOf(e.a) >= 0 && nodes.indexOf(e.b) >= 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={label}>
      {drawn.map((e) => {
        const [x1, y1] = POS[e.a];
        const [x2, y2] = POS[e.b];
        const on = edgeOn(e);
        return (
          <g key={e.id}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={on ? 'var(--ifm-color-emphasis-700)' : 'var(--ifm-color-emphasis-300)'}
              strokeWidth={on ? 1.2 + e.w : 1}
              strokeDasharray={on ? undefined : '4 4'}
            />
            {showRel ? (
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} textAnchor="middle" className={s.ts} style={{opacity: on ? 1 : 0.5}}>
                {e.rel}
              </text>
            ) : null}
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = POS[n];
        if (!p) return null;
        const c = color(n) || 'var(--ifm-color-emphasis-600)';
        const on = nodeOn(n);
        const w = widthOf(n);
        const t = tag(n);
        return (
          <g
            key={n}
            opacity={on ? 1 : 0.35}
            onClick={onNode ? () => onNode(n) : undefined}
            style={onNode ? {cursor: 'pointer'} : undefined}
            role={onNode ? 'button' : undefined}
            tabIndex={onNode ? 0 : undefined}
            onKeyDown={onNode ? (ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), onNode(n)) : undefined}
            aria-label={onNode ? `${n} 그룹 바꾸기` : undefined}
          >
            {ring(n) ? <rect x={p[0] - w / 2 - 4} y={p[1] - 17} width={w + 8} height={34} rx={17} fill="none" stroke="var(--vok)" strokeWidth="2.5" /> : null}
            <rect x={p[0] - w / 2} y={p[1] - 13} width={w} height={26} rx={13} fill={tint(c, 22)} stroke={c} strokeWidth="1.4" />
            <text x={p[0]} y={p[1] + 4.5} textAnchor="middle" className={s.t}>
              {n}
            </text>
            {t ? (
              <text x={p[0] + w / 2 - 2} y={p[1] - 13} textAnchor="middle" className={s.ts} style={{fontWeight: 700}}>
                {t}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
