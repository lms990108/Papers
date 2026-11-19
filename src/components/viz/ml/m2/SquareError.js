import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, useDrag, styles as s} from '../../Viz';
import {clamp, r2, num} from './mlCore';

const W = 520;
const H = 250;
const L = 40;
const R = 16;
const T = 14;
const B = 30;
const EMAX = 3.2;
const YMAX = 10.5;
const px = (e) => L + ((e + EMAX) / (2 * EMAX)) * (W - L - R);
const py = (y) => H - B - (y / YMAX) * (H - T - B);
const ie = (X) => ((X - L) / (W - L - R)) * 2 * EMAX - EMAX;
const COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)'];
const PRE = [
  {k: '-1, +1 (y = 2x + 1)', e: [-1, 1, 0], n: 2},
  {k: '0, 1 (y = x + 3)', e: [0, 1, 0], n: 2},
  {k: '-1, 2 (y = 3x)', e: [-1, 2, 0], n: 2},
  {k: '1, 1, 1', e: [1, 1, 1], n: 3},
  {k: '0, 0, 3', e: [0, 0, 3], n: 3},
];

const CURVE = (() => {
  const a = [];
  for (let i = 0; i <= 64; i += 1) {
    const e = -EMAX + (i / 64) * 2 * EMAX;
    a.push(px(e) + ',' + py(e * e));
  }
  return a.join(' ');
})();

export default function SquareError() {
  const ref = useRef(null);
  const [e, setE] = useState([-1, 1, 0]);
  const [n, setN] = useState(2);

  const setOne = (i, v) => setE(e.map((x, j) => (j === i ? v : x)));
  const {start, svgProps} = useDrag(ref, W, H, (i, p) => setOne(i, clamp(r2(ie(p[0])), -3, 3)));

  const used = e.slice(0, n);
  const sum = used.reduce((a, c) => a + c, 0);
  const abs = used.reduce((a, c) => a + Math.abs(c), 0);
  const sq = used.reduce((a, c) => a + c * c, 0);
  const cancel = Math.abs(sum) < 1e-9 && sq > 1e-9;

  return (
    <Viz
      title="오차를 더할 때와 제곱해서 더할 때"
      caption="점 하나가 리뷰 하나의 오차입니다. 점을 좌우로 끌거나 슬라이더를 움직여 보세요. 포물선의 높이가 제곱 오차입니다."
    >
      <Controls>
        {PRE.map((p) => (
          <Btn key={p.k} onClick={() => {
            setE(p.e);
            setN(p.n);
          }}>
            {p.k}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={n === 2} onClick={() => setN(2)}>리뷰 2개</Btn>
        <Btn on={n === 3} onClick={() => setN(3)}>리뷰 3개</Btn>
        {used.map((v, i) => (
          <Slider key={i} label={'오차 ' + (i + 1)} min={-3} max={3} step={0.5} value={v} onChange={(x) => setOne(i, x)} format={(x) => num(x, 1)} />
        ))}
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="오차에 대한 제곱 오차 포물선과 오차 점" {...svgProps}>
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--ifm-color-emphasis-500)" />
        <line x1={px(0)} y1={T} x2={px(0)} y2={H - B} stroke="var(--vgrid)" />
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
          <text key={v} x={px(v)} y={H - B + 16} className={s.ts} textAnchor="middle">{v}</text>
        ))}
        {[0, 1, 4, 9].map((v) => (
          <g key={v}>
            <line x1={L} y1={py(v)} x2={W - R} y2={py(v)} stroke="var(--vgrid)" strokeDasharray="3 4" />
            <text x={L - 6} y={py(v) + 4} className={s.ts} textAnchor="end">{v}</text>
          </g>
        ))}
        <text x={W - R} y={H - 4} className={s.ts} textAnchor="end">오차 y - t</text>
        <text x={L + 4} y={T + 10} className={s.ts}>제곱 오차</text>
        <polyline points={CURVE} fill="none" stroke="var(--ifm-color-emphasis-600)" strokeWidth="2" />
        {used.map((v, i) => (
          <g key={i}>
            <line x1={px(v)} y1={py(0)} x2={px(v)} y2={py(v * v)} stroke={COLORS[i]} strokeWidth="2" strokeDasharray="4 3" />
            <circle cx={px(v)} cy={py(v * v)} r="11" fill={COLORS[i]} fillOpacity="0.2" stroke={COLORS[i]} cursor="grab" onPointerDown={start(i)} />
            <text x={px(v)} y={py(v * v) + 4} className={s.ts} textAnchor="middle">{i + 1}</text>
          </g>
        ))}
      </svg>
      <Stats>
        <Stat label="오차의 합" value={num(sum, 2)} tone={cancel ? 'bad' : undefined} />
        <Stat label="오차 절댓값의 합" value={num(abs, 2)} />
        <Stat label="제곱 오차의 합" value={num(sq, 2)} />
        <Stat label={'MSE = 합 ÷ ' + n} value={num(sq / n, 3)} />
      </Stats>
      <Note>
        {cancel
          ? '오차의 합이 0이어도 제곱 오차의 합은 ' + num(sq, 2) + '입니다. 부호가 서로 지우는 것은 제곱하면 사라집니다.'
          : abs > 0 && Math.abs(abs - sum) < 1e-9 && sq > abs + 1e-9
            ? '절댓값의 합과 제곱의 합이 다릅니다. 큰 오차 하나가 제곱에서 훨씬 크게 반영됩니다.'
            : '오차가 1이면 제곱도 1이고, 오차가 2이면 제곱은 4입니다. 오차가 두 배가 되면 제곱은 네 배가 됩니다.'}
      </Note>
    </Viz>
  );
}
