import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, useDrag, fmt, styles as s} from './Viz';

const W = 520;
const H = 340;
const OX = 260;
const OY = 170;
const R = 105;
const TOKENS_PER_CHUNK = 200;

const CHUNKS = [
  {label: '연차 15일', a: 10},
  {label: '연차·병가 요약', a: 38},
  {label: '병가 규정', a: 66},
  {label: '출장비 정산', a: 125},
  {label: '재택근무', a: 172},
  {label: '보안 정책', a: 215},
  {label: '식대 지원', a: 252},
  {label: '복지 포인트', a: 295},
];
const ANSWER = 0;

const rad = (d) => (d * Math.PI) / 180;
const px = (a, r) => OX + r * Math.cos(rad(a));
const py = (a, r) => OY - r * Math.sin(rad(a));

export default function RetrievalDemo() {
  const ref = useRef(null);
  const [qa, setQa] = useState(0);
  const [k, setK] = useState(2);

  const {start, svgProps} = useDrag(ref, W, H, (id, p) => {
    const deg = (Math.atan2(OY - p[1], p[0] - OX) * 180) / Math.PI;
    setQa((deg + 360) % 360);
  });

  const scored = CHUNKS.map((c, i) => ({...c, i, cos: Math.cos(rad(c.a - qa))})).sort((x, y) => y.cos - x.cos);
  const picked = new Set(scored.slice(0, k).map((c) => c.i));
  const hit = picked.has(ANSWER);

  return (
    <Viz
      title="질문과 가까운 청크 k개 고르기"
      caption="질문 화살표 끝을 끌어 돌려 보세요. 각 청크는 방향으로 표시한 임베딩이고, 질문과 방향이 가까운 순서로 k개를 고릅니다. 코사인은 두 방향이 같을수록 1에 가까워지는 값입니다. 위치와 점수는 설명용 값입니다."
    >
      <Controls>
        <Slider label="k (남길 청크 수)" min={1} max={8} value={k} onChange={setK} />
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="질문 방향과 청크 방향" {...svgProps}>
        <circle cx={OX} cy={OY} r={R} fill="none" stroke="var(--vgrid)" strokeDasharray="4 4" />
        <line x1={OX} y1={OY} x2={px(qa, R - 6)} y2={py(qa, R - 6)} stroke="var(--vb)" strokeWidth="2.5" />
        {CHUNKS.map((c, i) => {
          const on = picked.has(i);
          const lx = px(c.a, R + 18);
          const ly = py(c.a, R + 18);
          const cosv = Math.cos(rad(c.a));
          const anchor = cosv > 0.25 ? 'start' : cosv < -0.25 ? 'end' : 'middle';
          return (
            <g key={c.label}>
              <circle
                cx={px(c.a, R)}
                cy={py(c.a, R)}
                r={on ? 8 : 6}
                fill={on ? 'var(--va)' : 'var(--ifm-background-color)'}
                stroke={on ? 'var(--va)' : 'var(--ifm-color-emphasis-500)'}
                strokeWidth="2"
              />
              {i === ANSWER ? (
                <circle cx={px(c.a, R)} cy={py(c.a, R)} r={13} fill="none" stroke="var(--vok)" strokeWidth="2" strokeDasharray="3 2" />
              ) : null}
              <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="central" className={s.ts} style={{fill: on ? 'var(--va)' : undefined}}>
                {c.label}
              </text>
            </g>
          );
        })}
        <circle cx={px(qa, R - 6)} cy={py(qa, R - 6)} r={13} fill="var(--vb)" fillOpacity="0.2" stroke="var(--vb)" cursor="grab" onPointerDown={start('q')} />
        <text x={OX} y={OY + 4} textAnchor="middle" className={s.ts}>질문</text>
        <text x={14} y={H - 12} className={s.ts} style={{fill: 'var(--vok)'}}>초록 점선 = 정답이 있는 청크</text>
      </svg>
      <Stats>
        <Stat label="남긴 청크 수 k" value={k} />
        <Stat label="생성 입력에 붙는 길이" value={`약 ${k * TOKENS_PER_CHUNK}토큰`} />
        <Stat label="정답 청크가 포함됐나" value={hit ? '포함' : '빠짐'} tone={hit ? 'good' : 'bad'} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>순위</th>
            <th>청크</th>
            <th>코사인</th>
            <th>선택</th>
          </tr>
        </thead>
        <tbody>
          {scored.map((c, r) => (
            <tr key={c.label}>
              <td>{r + 1}</td>
              <td>
                {c.label}
                {c.i === ANSWER ? ' (정답)' : ''}
              </td>
              <td>{fmt(c.cos)}</td>
              <td className={picked.has(c.i) ? s.cellOn : undefined}>{picked.has(c.i) ? '남김' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.note}>청크 하나가 약 {TOKENS_PER_CHUNK}토큰이라고 가정한 값입니다.</p>
    </Viz>
  );
}
