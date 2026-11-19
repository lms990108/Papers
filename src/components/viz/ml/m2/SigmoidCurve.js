import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, useDrag, styles as s} from '../../Viz';
import {clamp, sigmoid, num} from './mlCore';

const W = 560;
const H = 290;
const L = 44;
const R = 16;
const T = 14;
const B = 32;
const SMAX = 6;
const px = (v) => L + ((v + SMAX) / (2 * SMAX)) * (W - L - R);
const py = (p) => H - B - p * (H - T - B);
const is = (X) => ((X - L) / (W - L - R)) * 2 * SMAX - SMAX;
const TABLE = [-4, -2, -1, 0, 1, 2, 4];
const CURVE = (() => {
  const a = [];
  for (let i = 0; i <= 120; i += 1) {
    const v = -SMAX + (i / 120) * 2 * SMAX;
    a.push(px(v) + ',' + py(sigmoid(v)));
  }
  return a.join(' ');
})();

export default function SigmoidCurve() {
  const ref = useRef(null);
  const [sc, setSc] = useState(1);
  const [th, setTh] = useState(0.5);
  const {start, svgProps} = useDrag(ref, W, H, (id, p) => setSc(clamp(Math.round(is(p[0]) * 10) / 10, -SMAX, SMAX)));

  const p = sigmoid(sc);
  const slope = p * (1 - p);
  const sStar = Math.log(th / (1 - th));
  const tx = 1.1;

  return (
    <Viz
      title="시그모이드 곡선 위의 점수와 비율"
      caption="파란 점을 좌우로 끌면 점수 s가 바뀝니다. 빈 점은 -s의 비율이고 두 비율을 더하면 항상 1입니다. 점선 가로선은 읽기 기준 0.5이고, 슬라이더로 옮길 수 있습니다."
    >
      <Controls>
        <Slider label="점수 s" min={-SMAX} max={SMAX} step={0.1} value={sc} onChange={setSc} format={(v) => num(v, 1)} />
        {TABLE.map((v) => (
          <Btn key={v} on={Math.abs(sc - v) < 1e-9} onClick={() => setSc(v)}>
            {v}
          </Btn>
        ))}
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="시그모이드 곡선, 점수 s에서의 비율과 기울기 접선" {...svgProps}>
        {[-6, -4, -2, 0, 2, 4, 6].map((v) => (
          <g key={v}>
            <line x1={px(v)} y1={T} x2={px(v)} y2={H - B} stroke="var(--vgrid)" />
            <text x={px(v)} y={H - B + 16} className={s.ts} textAnchor="middle">{v}</text>
          </g>
        ))}
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={L} y1={py(v)} x2={W - R} y2={py(v)} stroke="var(--vgrid)" />
            <text x={L - 6} y={py(v) + 4} className={s.ts} textAnchor="end">{v}</text>
          </g>
        ))}
        <text x={W - R} y={H - 4} className={s.ts} textAnchor="end">점수 s</text>
        <text x={L + 4} y={T + 10} className={s.ts}>비율 p</text>
        <line x1={L} y1={py(th)} x2={W - R} y2={py(th)} stroke="var(--vok)" strokeDasharray="5 4" strokeWidth="1.5" />
        <line x1={px(sStar)} y1={py(th)} x2={px(sStar)} y2={H - B} stroke="var(--vok)" strokeDasharray="5 4" strokeWidth="1.5" />
        <text x={px(sStar) + 6} y={H - B - 6} className={s.ts} style={{fill: 'var(--vok)'}}>기준 {num(th, 2)} ↔ s = {num(sStar, 3)}</text>
        <polyline points={CURVE} fill="none" stroke="var(--vb)" strokeWidth="2.5" />
        <line x1={px(sc - tx)} y1={py(p - slope * tx)} x2={px(sc + tx)} y2={py(p + slope * tx)} stroke="var(--vc)" strokeWidth="2" />
        <line x1={px(sc)} y1={py(p)} x2={px(sc)} y2={H - B} stroke="var(--va)" strokeDasharray="3 3" />
        <circle cx={px(-sc)} cy={py(1 - p)} r="5" fill="none" stroke="var(--ifm-color-emphasis-700)" strokeWidth="1.5" />
        <circle cx={px(sc)} cy={py(p)} r="11" fill="var(--va)" fillOpacity="0.25" stroke="var(--va)" strokeWidth="2" cursor="grab" onPointerDown={start('s')} />
        <text x={px(sc) + (sc > 3 ? -14 : 14)} y={py(p) + (p > 0.5 ? 20 : -12)} className={s.t} textAnchor={sc > 3 ? 'end' : 'start'}>
          p = {num(p, 3)}
        </text>
      </svg>
      <Controls>
        <Slider label="읽기 기준" min={0.5} max={0.95} step={0.05} value={th} onChange={setTh} format={(v) => num(v, 2)} />
        <Btn on={Math.abs(th - 0.8) < 1e-9} onClick={() => setTh(0.8)}>0.8</Btn>
        <Btn on={Math.abs(th - 0.5) < 1e-9} onClick={() => setTh(0.5)}>0.5</Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>점수 s</th>
              <th>e^(-s)</th>
              <th>p = 1 ÷ (1 + e^(-s))</th>
              <th>1 - p</th>
              <th>기울기 p(1 - p)</th>
            </tr>
          </thead>
          <tbody>
            {TABLE.map((v) => {
              const q = sigmoid(v);
              const on = Math.abs(sc - v) < 1e-9;
              return (
                <tr key={v}>
                  <td className={on ? s.cellOn : undefined}>{v}</td>
                  <td className={on ? s.cellOn : undefined}>{num(Math.exp(-v), 3)}</td>
                  <td className={on ? s.cellOn : undefined}>{num(q, 3)}</td>
                  <td className={on ? s.cellOn : undefined}>{num(1 - q, 3)}</td>
                  <td className={on ? s.cellOn : undefined}>{num(q * (1 - q), 3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Stats>
        <Stat label="지금의 p" value={num(p, 3)} />
        <Stat label="σ(-s) = 1 - σ(s)" value={num(sigmoid(-sc), 3) + ' + ' + num(p, 3) + ' = ' + num(sigmoid(-sc) + p, 3)} />
        <Stat label="기울기 p(1 - p)" value={num(slope, 3)} />
        <Stat label="오즈 p ÷ (1 - p) = e^s" value={num(Math.exp(sc), 3)} />
      </Stats>
      <Note>
        {th > 0.5
          ? '기준을 ' + num(th, 2) + '로 올리면 긍정으로 읽는 점수가 s = ' + num(sStar, 3) + '부터입니다. 0.8이면 log(0.8 / 0.2) ≈ 1.386입니다. 가중치를 다시 학습하지 않고 읽는 기준만 옮깁니다.'
          : Math.abs(sc) < 1e-9
            ? '점수 0에서 비율은 정확히 0.5이고, 기울기가 가장 큰 0.25입니다.'
            : Math.abs(sc) >= 4
              ? '점수가 크면 비율은 0이나 1에 붙고, 기울기는 0에 가까워집니다.'
              : '점수를 키우면 비율은 1에 가까워지지만 넘지 않습니다. 커지는 속도는 점점 줄어듭니다.'}
      </Note>
    </Viz>
  );
}
