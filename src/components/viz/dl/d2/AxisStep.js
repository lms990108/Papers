import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, clamp, E2, path2} from './lib';

const W = 520;
const H = 280;
const A0 = -0.5;
const A1 = 4;
const B0 = -0.5;
const B1 = 2.5;
const pa = lin(A0, A1, 40, W - 12);
const pb = lin(B0, B1, H - 30, 12);
const LEVELS = [0.5, 1, 3, 6, 10, 15];
const H1 = 2;
const H2 = 20;

export default function AxisStep() {
  const [mu, setMu] = useState(0.02);
  const [eta, setEta] = useState(0.2);
  const [n, setN] = useState(10);

  const e1 = eta / (mu + H1);
  const e2 = eta / (mu + H2);
  const runs = [
    {name: '공통 0.05', a: 0.05, b: 0.05, c: 'var(--va)'},
    {name: '공통 0.1', a: 0.1, b: 0.1, c: 'var(--vbad)'},
    {name: '축별 ε_k', a: e1, b: e2, c: 'var(--vok)'},
  ].map((r) => {
    const path = path2(r.a, r.b, n);
    const last = path[path.length - 1];
    return {...r, path, last, E: E2(last[0], last[1])};
  });

  return (
    <Viz
      title="축마다 보폭을 나누면"
      caption="오차 (w₁ − 3)² + 10(w₂ − 1)²에서 2차 미분은 w₁ 쪽 2, w₂ 쪽 20입니다. 축별 보폭은 ε_k = η / (μ + h_kk)이고, 여기서는 h_kk에 이 값을 그대로 씁니다. 시작은 (0, 0)입니다."
    >
      <Controls>
        <Slider label="η (전역 학습률)" min={0.05} max={1} step={0.05} value={eta} onChange={setEta} format={(v) => fmt(v, 2)} />
        <Slider label="μ" min={0.01} max={0.5} step={0.01} value={mu} onChange={setMu} format={(v) => fmt(v, 2)} />
        <Slider label="걸음 수" min={1} max={30} step={1} value={n} onChange={setN} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="공통 학습률과 축별 보폭의 경로 비교">
        <defs>
          <clipPath id="d2-axis-clip">
            <rect x={40} y={12} width={W - 52} height={H - 42} />
          </clipPath>
        </defs>
        <rect x={40} y={12} width={W - 52} height={H - 42} fill="none" stroke="var(--ifm-color-emphasis-300)" />
        <g clipPath="url(#d2-axis-clip)">
          {LEVELS.map((L) => (
            <ellipse key={L} cx={pa(3)} cy={pb(1)} rx={Math.abs(pa(Math.sqrt(L)) - pa(0))} ry={Math.abs(pb(Math.sqrt(L / 10)) - pb(0))} fill="none" stroke="var(--ifm-color-emphasis-300)" />
          ))}
          {runs.map((r, i) => (
            <polyline
              key={r.name}
              points={r.path.map((p) => `${pa(clamp(p[0], A0, A1))},${pb(clamp(p[1], B0, B1))}`).join(' ')}
              fill="none"
              stroke={r.c}
              strokeWidth="1.8"
              strokeDasharray={i === 1 ? '5 3' : i === 0 ? '2 3' : undefined}
            />
          ))}
        </g>
        {runs.map((r) => (
          <circle key={r.name} cx={pa(clamp(r.last[0], A0, A1))} cy={pb(clamp(r.last[1], B0, B1))} r={5} fill={r.c} />
        ))}
        <circle cx={pa(3)} cy={pb(1)} r={3.5} fill="var(--ifm-font-color-base)" />
        <text x={pa(3) + 6} y={pb(1) - 6} className={s.ts}>최솟값</text>
        {runs.map((r, i) => (
          <text key={r.name} x={48} y={26 + i * 15} className={s.ts} style={{fill: r.c}}>
            {i === 0 ? '점선' : i === 1 ? '파선' : '실선'}: {r.name}
          </text>
        ))}
        {[0, 1, 2, 3, 4].map((v) => (
          <text key={v} x={pa(v)} y={H - 14} textAnchor="middle" className={s.ts}>{v}</text>
        ))}
        {[0, 1, 2].map((v) => (
          <text key={v} x={34} y={pb(v) + 4} textAnchor="end" className={s.ts}>{v}</text>
        ))}
        <text x={W - 12} y={H - 1} textAnchor="end" className={s.ts}>w₁</text>
        <text x={4} y={10} className={s.ts}>w₂</text>
      </svg>
      <Stats>
        <Stat label="ε₁ = η/(μ+2)" value={fmt(e1, 4)} />
        <Stat label="ε₂ = η/(μ+20)" value={fmt(e2, 5)} />
        <Stat label="축별 곱 1−ε₁h₁ / 1−ε₂h₂" value={`${fmt(1 - e1 * H1, 3)} / ${fmt(1 - e2 * H2, 3)}`} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>{n}걸음 뒤</th>
            <th>w₁</th>
            <th>w₂</th>
            <th>오차</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{fmt(r.last[0], 3)}</td>
              <td>{fmt(r.last[1], 3)}</td>
              <td>{fmt(r.E, 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        공통 0.05는 w₂가 한 번에 끝나지만 w₁이 느리고, 공통 0.1은 w₂가 왕복합니다. 축별 보폭은 두 축의 곱이 거의 같아서(η = 0.2, μ = 0.02에서 둘 다 약 0.8) 같은 속도로 줄어듭니다.
      </Note>
    </Viz>
  );
}
