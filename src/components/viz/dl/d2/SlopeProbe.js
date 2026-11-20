import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, useDrag, fmt, styles as s} from '../../Viz';
import {lin, clamp, E1, g1} from './lib';

const W = 520;
const H = 260;
const X0 = -1;
const X1 = 7;
const px = lin(X0, X1, 36, W - 14);
const py = lin(0, 17, H - 30, 12);
const DELTAS = [1, 0.1, 0.01, 0.001, 0.000001];
const DNAME = ['1', '0.1', '0.01', '0.001', '0.000001'];

const CURVE = (() => {
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const w = X0 + ((X1 - X0) * i) / 64;
    pts.push(`${px(w)},${py(E1(w))}`);
  }
  return pts.join(' ');
})();

// 점 (w, E(w))를 지나는 기울기 m의 직선을 가로 범위 안으로 잘라 그린다
const seg = (w, m, half) => {
  const a = w - half;
  const b = w + half;
  const ya = E1(w) + m * (a - w);
  const yb = E1(w) + m * (b - w);
  return [px(a), py(clamp(ya, -2, 19)), px(b), py(clamp(yb, -2, 19))];
};

export default function SlopeProbe() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  const [di, setDi] = useState(0);

  const {start, svgProps} = useDrag(ref, W, H, (id, p) => {
    setW(clamp(Math.round(((p[0] - 36) / (W - 50)) * (X1 - X0) * 20) / 20 + X0, X0 + 0.2, X1 - 1.2));
  });

  const d = DELTAS[di];
  const slope = g1(w);
  const rate = (E1(w + d) - E1(w)) / d;
  const tan = seg(w, slope, 1.4);
  const sec = seg(w, rate, 1.4);

  let dir = '기울기가 0입니다. 이 점에서는 어느 쪽으로 가도 오차가 바로 줄지 않습니다.';
  if (slope < -1e-9) dir = '기울기가 음수입니다. 오른쪽으로 갈수록 오차가 줄므로 갱신은 오른쪽으로 갑니다.';
  else if (slope > 1e-9) dir = '기울기가 양수입니다. 오른쪽으로 갈수록 오차가 커지므로 갱신은 왼쪽으로 갑니다.';

  return (
    <Viz
      title="기울기는 δ를 줄일 때 가까워지는 값"
      caption="점을 끌거나 슬라이더로 w를 옮기세요. δ는 w를 오른쪽으로 옮기는 아주 작은 폭입니다. 변화율은 w를 δ만큼 옮겼을 때 오차가 변한 양을 δ로 나눈 값이고, 파란 선은 w와 w+δ의 두 점을 잇는 선입니다. 주황 점선은 w에서 곡선에 딱 닿는 선(접선)이며, 이 선의 기울기가 진짜 기울기입니다. δ를 줄이면 두 선이 겹치고, w = 0, δ = 1에서 −5, δ = 0.1에서 −5.9처럼 −6에 붙습니다."
    >
      <Controls>
        <Slider label="w" min={X0 + 0.2} max={X1 - 1.2} step={0.05} value={w} onChange={setW} format={(v) => fmt(v, 2)} />
        <Slider label="δ (옮기는 폭)" min={0} max={4} step={1} value={di} onChange={setDi} format={(v) => DNAME[v]} />
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="오차 곡선, 접선과 할선" {...svgProps}>
        <line x1={36} y1={py(0)} x2={W - 14} y2={py(0)} stroke="var(--ifm-color-emphasis-400)" />
        <polyline points={CURVE} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth="2" />
        {[0, 1, 2, 3, 4, 5, 6].map((v) => (
          <text key={v} x={px(v)} y={H - 14} textAnchor="middle" className={s.ts}>
            {v}
          </text>
        ))}
        <text x={W - 14} y={H - 2} textAnchor="end" className={s.ts}>w</text>
        <text x={6} y={12} className={s.ts}>오차</text>
        <line x1={sec[0]} y1={sec[1]} x2={sec[2]} y2={sec[3]} stroke="var(--va)" strokeWidth="2.5" />
        <line x1={tan[0]} y1={tan[1]} x2={tan[2]} y2={tan[3]} stroke="var(--vb)" strokeWidth="1.5" strokeDasharray="5 3" />
        <circle cx={px(w + d)} cy={py(E1(w + d))} r={4} fill="var(--va)" />
        <text x={px(w + d) + 6} y={py(E1(w + d)) + 14} className={s.ts} style={{fill: 'var(--va)'}}>w+δ</text>
        <circle cx={px(w)} cy={py(E1(w))} r={13} fill="var(--vb)" fillOpacity="0.15" stroke="var(--vb)" cursor="grab" onPointerDown={start('w')} />
        <circle cx={px(w)} cy={py(E1(w))} r={3.5} fill="var(--vb)" pointerEvents="none" />
        <text x={W - 16} y={26} textAnchor="end" className={s.ts} style={{fill: 'var(--va)'}}>파란 실선: 두 점을 잇는 선(변화율)</text>
        <text x={W - 16} y={42} textAnchor="end" className={s.ts} style={{fill: 'var(--vb)'}}>주황 점선: 딱 닿는 선(기울기)</text>
      </svg>
      <Stats>
        <Stat label="δ" value={DNAME[di]} />
        <Stat label="변화율 (E(w+δ)−E(w))/δ" value={fmt(rate, 6)} />
        <Stat label="기울기 2(w−3)" value={fmt(slope, 4)} />
        <Stat label="차이" value={fmt(rate - slope, 6)} />
      </Stats>
      <Note>{dir}</Note>
    </Viz>
  );
}
