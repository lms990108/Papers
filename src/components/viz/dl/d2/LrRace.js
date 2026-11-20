import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, fmt, styles as s} from '../../Viz';
import {lin, clamp, tr, gdPath} from './lib';

const W = 560;
const H = 270;
const Y0 = -4;
const Y1 = 11;
const LRS = [
  {e: 0.01, c: 'var(--va)'},
  {e: 0.1, c: 'var(--vok)'},
  {e: 0.5, c: 'var(--vc)'},
  {e: 1, c: 'var(--vb)'},
  {e: 1.1, c: 'var(--vbad)'},
];

export default function LrRace() {
  const [n, setN] = useState(5);
  const px = lin(0, 10, 40, W - 70);
  const py = lin(Y0, Y1, H - 28, 12);
  const paths = LRS.map((r) => gdPath(0, r.e, 10).map((w) => w));

  return (
    <Viz
      title="학습률 다섯 개로 달리기"
      caption="모두 w = 0에서 시작해 목표 3을 향합니다. 걸음 수를 늘리면서 어느 선이 3에 먼저 닿고, 어느 선이 튀는지 보세요. 선 끝의 글자가 학습률 ε입니다."
    >
      <Controls>
        <Slider label="걸음 수" min={1} max={10} step={1} value={n} onChange={setN} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="학습률별 w 값의 변화">
        <line x1={40} y1={py(3)} x2={W - 70} y2={py(3)} stroke="var(--vok)" strokeDasharray="5 4" />
        <text x={W - 66} y={py(3) + 4} className={s.ts} style={{fill: 'var(--vok)'}}>목표 3</text>
        <line x1={40} y1={py(0)} x2={W - 70} y2={py(0)} stroke="var(--ifm-color-emphasis-300)" />
        <line x1={40} y1={12} x2={40} y2={H - 28} stroke="var(--ifm-color-emphasis-400)" />
        {[-3, 0, 3, 6, 9].map((v) => (
          <text key={v} x={34} y={py(v) + 4} textAnchor="end" className={s.ts}>
            {v}
          </text>
        ))}
        {[0, 2, 4, 6, 8, 10].map((v) => (
          <text key={v} x={px(v)} y={H - 12} textAnchor="middle" className={s.ts}>
            {v}
          </text>
        ))}
        <text x={W - 70} y={H - 1} textAnchor="end" className={s.ts}>걸음 수</text>
        <text x={4} y={10} className={s.ts}>w</text>
        {LRS.map((r, k) => {
          const p = paths[k].slice(0, n + 1);
          const pts = p.map((w, i) => `${px(i)},${py(clamp(w, Y0, Y1))}`).join(' ');
          const last = p[p.length - 1];
          const ly = clamp(py(clamp(last, Y0, Y1)) + (k === 3 ? 10 : k === 4 ? -6 : 0), 14, H - 30);
          return (
            <g key={r.e}>
              <polyline points={pts} fill="none" stroke={r.c} strokeWidth="2" strokeDasharray={k === 3 ? '6 3' : undefined} />
              {p.map((w, i) => (
                <circle key={i} cx={px(i)} cy={py(clamp(w, Y0, Y1))} r={2.8} fill={r.c} />
              ))}
              <text x={px(n) + 8} y={ly + 4} className={s.ts} style={{fill: r.c}}>
                ε={r.e}
              </text>
            </g>
          );
        })}
      </svg>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>ε</th>
            <th>1 − 2ε</th>
            <th>{n}걸음 뒤의 w 경로</th>
          </tr>
        </thead>
        <tbody>
          {LRS.map((r, k) => (
            <tr key={r.e}>
              <td>{r.e}</td>
              <td>{fmt(1 - 2 * r.e, 2)}</td>
              <td style={{textAlign: 'left'}}>{paths[k].slice(0, n + 1).map((w) => tr(w, 3)).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="ε = 0.5" value="한 번에 3" tone="good" />
        <Stat label="ε = 1" value="0과 6 왕복" tone="bad" />
        <Stat label="ε = 1.1" value="왕복하며 발산" tone="bad" />
      </Stats>
    </Viz>
  );
}
