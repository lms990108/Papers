import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, net, sci} from './lib';

const W = 540;
const H = 220;
const X = 1;
const T = 0;
const w1 = 0.5;
const w2 = 1;
const E = (a, b) => net(X, a, b, T).E;
const base = net(X, w1, w2, T);

// 가운데 차분 오차 (w1, w2 중 큰 쪽)
const errAt = (k) => {
  const d = Math.pow(10, -k);
  const n1 = (E(w1 + d, w2) - E(w1 - d, w2)) / (2 * d);
  const n2 = (E(w1, w2 + d) - E(w1, w2 - d)) / (2 * d);
  return {d, n1, n2, e1: Math.abs(n1 - base.dw1), e2: Math.abs(n2 - base.dw2)};
};
const ALL = Array.from({length: 12}, (_, i) => errAt(i + 1));
const px = lin(0.5, 12.5, 56, W - 14);
const LOW = -13;
const py = lin(LOW, 0, H - 34, 14);
const lg = (v) => Math.max(LOW, Math.log(Math.max(v, 1e-300)) / Math.LN10);

export default function GradCheck() {
  const [k, setK] = useState(6);
  const r = ALL[k - 1];
  const f1 = (E(w1 + r.d, w2) - E(w1, w2)) / r.d;
  const f2 = (E(w1, w2 + r.d) - E(w1, w2)) / r.d;
  const emax = Math.max(r.e1, r.e2);
  const pts = ALL.map((q, i) => `${px(i + 1)},${py(lg(Math.max(q.e1, q.e2)))}`).join(' ');
  const good = emax < 1e-4;

  return (
    <Viz
      title="수치 미분으로 역전파 검산하기 (기울기 검사)"
      caption="두 층 예(입력 1, 정답 0, w₁ = 0.5, w₂ = 1)의 역전파 기울기 0.7269, 0.4271을 간격 d의 수치 미분과 비교합니다. d = 10⁻ᵏ입니다. 가운데 차분은 +d와 −d 두 곳의 오차를 쓰고, 한쪽 차분은 +d 한 곳만 씁니다. 간격이 너무 크면 곡선의 휘어짐 때문에, 너무 작으면 반올림 때문에 틀립니다."
    >
      <Controls>
        <Slider label="k (d = 10⁻ᵏ)" min={1} max={12} step={1} value={k} onChange={setK} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="간격 d에 따른 수치 미분의 오차">
        <line x1={56} y1={H - 34} x2={W - 14} y2={H - 34} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={56} y1={14} x2={56} y2={H - 34} stroke="var(--ifm-color-emphasis-400)" />
        {[['10⁰', 0], ['10⁻³', -3], ['10⁻⁶', -6], ['10⁻⁹', -9], ['10⁻¹²', -12]].map(([lab, v]) => (
          <g key={lab}>
            <line x1={56} y1={py(v)} x2={W - 14} y2={py(v)} stroke="var(--ifm-color-emphasis-200)" />
            <text x={50} y={py(v) + 4} textAnchor="end" className={s.ts}>{lab}</text>
          </g>
        ))}
        {ALL.map((q, i) => (
          <text key={i} x={px(i + 1)} y={H - 18} textAnchor="middle" className={s.ts}>{i + 1}</text>
        ))}
        <text x={W - 14} y={H - 3} textAnchor="end" className={s.ts}>k (간격이 작아지는 쪽 →)</text>
        <text x={4} y={12} className={s.ts}>기울기 오차</text>
        <polyline points={pts} fill="none" stroke="var(--vb)" strokeWidth="2" />
        {ALL.map((q, i) => (
          <circle key={i} cx={px(i + 1)} cy={py(lg(Math.max(q.e1, q.e2)))} r={i + 1 === k ? 6 : 3.5} fill={i + 1 === k ? 'var(--vb)' : 'var(--ifm-background-surface-color)'} stroke="var(--vb)" strokeWidth="1.8" />
        ))}
      </svg>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>파라미터</th>
            <th>역전파</th>
            <th>가운데 차분</th>
            <th>한쪽 차분</th>
            <th>가운데 차분 오차</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>w₁</td>
            <td>{fmt(base.dw1, 4)}</td>
            <td>{fmt(r.n1, 4)}</td>
            <td>{fmt(f1, 4)}</td>
            <td>{sci(r.e1)}</td>
          </tr>
          <tr>
            <td>w₂</td>
            <td>{fmt(base.dw2, 4)}</td>
            <td>{fmt(r.n2, 4)}</td>
            <td>{fmt(f2, 4)}</td>
            <td>{sci(r.e2)}</td>
          </tr>
        </tbody>
      </table>
      <Stats>
        <Stat label="간격 d" value={sci(r.d, 1)} />
        <Stat label="두 기울기 중 큰 오차" value={sci(emax)} tone={good ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {k <= 3
          ? 'd가 커서 곡선의 휘어짐이 그대로 오차가 됩니다.'
          : k >= 10
          ? 'd가 너무 작아 두 오차 값의 차이가 부동소수점 반올림에 묻히기 시작합니다.'
          : '네 자리까지 역전파와 같습니다. 그래서 검산에는 d = 10⁻⁶ 정도를 씁니다.'}
      </Note>
    </Viz>
  );
}
