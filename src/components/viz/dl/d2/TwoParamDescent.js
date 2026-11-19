import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, clamp, E2, path2} from './lib';

const W = 520;
const H = 300;
const A0 = -1;
const A1 = 5;
const B0 = -1;
const B1 = 3;
const pa = lin(A0, A1, 40, W - 12);
const pb = lin(B0, B1, H - 30, 12);
const LEVELS = [1, 3, 6, 10, 15, 20, 30];

export default function TwoParamDescent() {
  const [eps, setEps] = useState(0.05);
  const [t, setT] = useState(4);

  const path = path2(eps, eps, 10).slice(0, t + 1);
  const out = path.some((p) => p[0] < A0 || p[0] > A1 || p[1] < B0 || p[1] > B1);
  const pts = path.map((p) => `${pa(clamp(p[0], A0, A1))},${pb(clamp(p[1], B0, B1))}`).join(' ');
  const f1 = 1 - 2 * eps;
  const f2 = 1 - 20 * eps;
  const last = path[path.length - 1];

  return (
    <Viz
      title="가파른 축과 완만한 축에 같은 학습률 쓰기"
      caption="오차 (w₁ − 3)² + 10(w₂ − 1)²의 등고선입니다. 타원이 좁은 w₂ 쪽이 가파릅니다. 시작은 (0, 0)이고, ε이 0.1에 닿으면 w₂가 0과 2를 왕복합니다."
    >
      <Controls>
        <Btn on={Math.abs(eps - 0.05) < 1e-9} onClick={() => setEps(0.05)}>ε = 0.05</Btn>
        <Btn on={Math.abs(eps - 0.1) < 1e-9} onClick={() => setEps(0.1)}>ε = 0.1</Btn>
      </Controls>
      <Controls>
        <Slider label="학습률 ε" min={0.01} max={0.12} step={0.01} value={eps} onChange={setEps} format={(v) => fmt(v, 2)} />
        <Slider label="걸음 수" min={0} max={10} step={1} value={t} onChange={setT} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="두 파라미터 오차의 등고선과 갱신 경로">
        <defs>
          <clipPath id="d2-two-clip">
            <rect x={40} y={12} width={W - 52} height={H - 42} />
          </clipPath>
        </defs>
        <rect x={40} y={12} width={W - 52} height={H - 42} fill="none" stroke="var(--ifm-color-emphasis-300)" />
        <g clipPath="url(#d2-two-clip)">
          {LEVELS.map((L) => (
            <ellipse key={L} cx={pa(3)} cy={pb(1)} rx={Math.abs(pa(Math.sqrt(L)) - pa(0))} ry={Math.abs(pb(Math.sqrt(L / 10)) - pb(0))} fill="none" stroke="var(--ifm-color-emphasis-400)" />
          ))}
          <polyline points={pts} fill="none" stroke="var(--vb)" strokeWidth="1.5" strokeDasharray="4 3" />
        </g>
        {path.map((p, i) => {
          const o = p[0] < A0 || p[0] > A1 || p[1] < B0 || p[1] > B1;
          const x = pa(clamp(p[0], A0, A1));
          const y = pb(clamp(p[1], B0, B1));
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={i === t ? 5.5 : 3.5} fill={o ? 'none' : 'var(--vb)'} stroke="var(--vb)" />
              {i <= 5 && !o ? (
                <text x={x + 7} y={y - 6} className={s.ts}>
                  {i}
                </text>
              ) : null}
            </g>
          );
        })}
        <circle cx={pa(3)} cy={pb(1)} r={4} fill="var(--vok)" />
        <text x={pa(3) + 7} y={pb(1) - 6} className={s.ts} style={{fill: 'var(--vok)'}}>최솟값 (3, 1)</text>
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
        <Stat label="w₁ 쪽 곱 1 − 2ε" value={fmt(f1, 2)} tone={Math.abs(f1) < 1 ? 'good' : 'bad'} />
        <Stat label="w₂ 쪽 곱 1 − 20ε" value={fmt(f2, 2)} tone={Math.abs(f2) < 1 ? 'good' : 'bad'} />
        <Stat label="w₁ 한계 / w₂ 한계" value="1 / 0.1" />
      </Stats>
      {out ? <Note>일부 점이 그림 밖으로 나갔습니다. 빈 점은 그림 가장자리에 붙여 그렸고, 값은 아래 표에 있습니다.</Note> : null}
      <table className={s.grid}>
        <thead>
          <tr>
            <th>t</th>
            <th>w₁</th>
            <th>w₂</th>
            <th>오차</th>
          </tr>
        </thead>
        <tbody>
          {path.map((p, i) => (
            <tr key={i} className={i === t ? s.cellOn : undefined}>
              <td>{i}</td>
              <td>{fmt(p[0], 3)}</td>
              <td>{fmt(p[1], 3)}</td>
              <td>{fmt(E2(p[0], p[1]), 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        {Math.abs(f2) < 1e-9
          ? 'w₂는 한 번에 1에 닿습니다. 대신 w₁은 0.9배씩만 줄어서 느립니다.'
          : Math.abs(f2) >= 1
          ? 'w₂의 곱 크기가 1 이상이라 w₂가 왕복하며 줄지 않거나 멀어집니다. w₁은 같은 ε에서도 잘 모입니다.'
          : `마지막 점은 (${fmt(last[0], 3)}, ${fmt(last[1], 3)})입니다.`}
      </Note>
    </Viz>
  );
}
