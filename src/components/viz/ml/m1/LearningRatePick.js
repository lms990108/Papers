import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const W = 480;
const H = 250;
const L = 40;
const R = 14;
const T = 14;
const B = 34;
const WLO = -2;
const WHI = 10;
const YMAX = 40;
const X = (w) => L + ((w - WLO) / (WHI - WLO)) * (W - L - R);
const Y = (e) => T + (1 - Math.min(e, YMAX) / YMAX) * (H - T - B);
const E = (w) => (w - 3) ** 2;
const trace = (eps, n) => {
  const out = [0];
  for (let i = 0; i < n; i += 1) out.push(out[i] - eps * 2 * (out[i] - 3));
  return out;
};
const g3 = (v) => String(Number(v.toPrecision(3)));

export default function LearningRatePick() {
  const [a, setA] = useState(0.1);
  const [b, setB] = useState(1);
  const [n, setN] = useState(1);

  const ta = trace(a, 5);
  const tb = trace(b, 5);
  const ea = E(ta[n]);
  const eb = E(tb[n]);
  const pick = Math.abs(ea - eb) < 1e-9 ? '같음' : ea < eb ? 'A' : 'B';
  const curve = [];
  for (let i = 0; i <= 60; i += 1) {
    const w = WLO + (i * (WHI - WLO)) / 60;
    curve.push(X(w) + ',' + Y(E(w)));
  }
  const path = (t, color, name) => {
    const pts = t.slice(0, n + 1);
    return (
      <g>
        <polyline points={pts.map((w) => X(Math.max(WLO, Math.min(WHI, w))) + ',' + Y(E(w))).join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeDasharray="5 3" />
        {pts.map((w, i) => (
          <circle key={i} cx={X(Math.max(WLO, Math.min(WHI, w)))} cy={Y(E(w))} r={i === n ? 6 : 3.5} fill={color} />
        ))}
        <text x={X(Math.max(WLO, Math.min(WHI, pts[n]))) + 8} y={Math.max(Y(E(pts[n])) - 6, T + 10)} className={s.t} style={{fill: color}}>{name}</text>
      </g>
    );
  };

  return (
    <Viz
      title="학습률 두 후보를 검증 오차로 비교하기"
      caption="오차 E(w) = (w - 3)^2, 시작은 w = 0입니다. 갱신은 w에서 학습률 × 2(w - 3)을 뺍니다. 갱신 횟수를 늘리며 A와 B가 어디로 가는지 보세요. 오차가 40을 넘는 점은 맨 위에 붙여 그렸습니다."
    >
      <Controls>
        <Slider label="학습률 A" min={0.05} max={1.6} step={0.05} value={a} onChange={setA} format={(v) => fmt(v, 2)} />
        <Slider label="학습률 B" min={0.05} max={1.6} step={0.05} value={b} onChange={setB} format={(v) => fmt(v, 2)} />
        <Slider label="갱신 횟수" min={0} max={5} step={1} value={n} onChange={setN} />
      </Controls>
      <Controls>
        <Btn on={a === 0.1 && b === 1} onClick={() => {setA(0.1); setB(1);}}>0.1 대 1</Btn>
        <Btn on={a === 0.5 && b === 1.5} onClick={() => {setA(0.5); setB(1.5);}}>0.5 대 1.5</Btn>
      </Controls>
      <svg viewBox={'0 0 ' + W + ' ' + H} className={s.svg} role="img" aria-label="오차 곡선 위에서 학습률 A와 B의 가중치 이동">
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--ifm-color-emphasis-400)" />
        {[0, 3, 6, 9].map((w) => (
          <text key={w} x={X(w)} y={H - B + 16} textAnchor="middle" className={s.ts}>{w}</text>
        ))}
        {[0, 10, 20, 30, 40].map((e) => (
          <g key={e}>
            <line x1={L} y1={Y(e)} x2={W - R} y2={Y(e)} stroke="var(--vgrid)" />
            <text x={L - 5} y={Y(e) + 4} textAnchor="end" className={s.ts}>{e}</text>
          </g>
        ))}
        <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" className={s.ts}>가중치 w (최솟값은 3)</text>
        <polyline points={curve.join(' ')} fill="none" stroke="var(--ifm-color-emphasis-600)" strokeWidth="2" />
        {path(ta, 'var(--va)', 'A')}
        {path(tb, 'var(--vb)', 'B')}
      </svg>
      <div style={{overflowX: 'auto'}}>
      <table className={s.grid}>
        <thead>
          <tr><th>갱신 횟수</th>{[0, 1, 2, 3, 4, 5].map((i) => <th key={i} className={i === n ? s.cellOn : undefined}>{i}</th>)}</tr>
        </thead>
        <tbody>
          <tr><th>A의 w</th>{trace(a, 5).map((w, i) => <td key={i} className={i === n ? s.cellOn : undefined}>{g3(w)}</td>)}</tr>
          <tr><th>B의 w</th>{trace(b, 5).map((w, i) => <td key={i} className={i === n ? s.cellOn : undefined}>{g3(w)}</td>)}</tr>
        </tbody>
      </table>
      </div>
      <Stats>
        <Stat label={'A의 오차 (' + n + '번 뒤)'} value={g3(ea)} />
        <Stat label={'B의 오차 (' + n + '번 뒤)'} value={g3(eb)} />
        <Stat label="오차가 더 작은 쪽" value={pick} tone={pick === '같음' ? undefined : 'good'} />
        <Stat label="w - 3의 배수 (1 - 2·학습률)" value={'A ' + fmt(1 - 2 * a, 2) + ' / B ' + fmt(1 - 2 * b, 2)} />
      </Stats>
      <Note>
        0.1 대 1에서 한 번 갱신하면 A는 오차 5.76, B는 9로 시작 값 9에서 줄지 않았고, B는 그 뒤로도 0과 6을 오갑니다. 그래서 A를 고릅니다. 0.5 대 1.5에서는 0.5가 한 번에 3에 도착해 오차 0이고, 1.5는 w = 9에서 오차 36입니다. 1보다 큰 학습률에서는 점점 멀어집니다.
      </Note>
    </Viz>
  );
}
