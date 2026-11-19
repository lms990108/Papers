import React, {useRef, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, useDrag, fmt, styles as s} from '../../Viz';

const W = 480;
const H = 330;
const L = 46;
const R = 16;
const T = 16;
const B = 40;
const LO = 62;
const HI = 75;
const MEAN = 68.25;
const X = (v) => L + ((v - LO) / (HI - LO)) * (W - L - R);
const Y = (v) => T + (1 - (v - LO) / (HI - LO)) * (H - T - B);
const fromX = (px) => LO + ((px - L) / (W - L - R)) * (HI - LO);
const slopeText = (v) => (Math.abs(v - 2 / 3) < 1e-9 ? '2/3' : fmt(v, 2));

export default function GaltonLine() {
  const ref = useRef(null);
  const [d, setD] = useState(3);
  const [k, setK] = useState(2 / 3);

  const {start, svgProps} = useDrag(ref, W, H, (id, p) => {
    const v = Math.round((fromX(p[0]) - MEAN) * 4) / 4;
    setD(Math.max(-6, Math.min(6, v)));
  });

  const x = MEAN + d;
  const y = MEAN + k * d;
  const back = (1 - k) * Math.abs(d);
  const b0 = MEAN * (1 - k);

  return (
    <Viz
      title="부모 키가 평균에서 벗어난 만큼 자식 키는 벗어날까요"
      caption="주황 점을 끌거나 슬라이더를 움직여 보세요. 옅은 선은 기울기 1(자식이 부모만큼 벗어남), 주황 선은 기울기 2/3입니다. 키의 평균은 68.25인치입니다."
    >
      <Controls>
        <Slider label="부모 - 평균 (인치)" min={-6} max={6} step={0.25} value={d} onChange={setD} format={(v) => fmt(v, 2)} />
        <Slider label="기울기" min={0} max={1.2} step={0.01} value={k} onChange={setK} format={slopeText} />
      </Controls>
      <Controls>
        <Btn onClick={() => setD(3)}>부모 +3</Btn>
        <Btn onClick={() => setD(-3)}>부모 -3</Btn>
        <Btn on={Math.abs(k - 2 / 3) < 1e-9} onClick={() => setK(2 / 3)}>기울기 2/3</Btn>
        <Btn on={k === 1} onClick={() => setK(1)}>기울기 1</Btn>
      </Controls>
      <svg ref={ref} viewBox={'0 0 ' + W + ' ' + H} className={s.svg} role="img" aria-label="부모 키에 대한 자식 키 직선과 기울기 1 직선" {...svgProps}>
        <line x1={L} y1={Y(LO)} x2={W - R} y2={Y(LO)} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={L} y1={Y(LO)} x2={L} y2={T} stroke="var(--ifm-color-emphasis-400)" />
        {[64, 68, 72].map((v) => (
          <g key={v}>
            <text x={X(v)} y={H - B + 16} textAnchor="middle" className={s.ts}>{v}</text>
            <text x={L - 6} y={Y(v) + 4} textAnchor="end" className={s.ts}>{v}</text>
          </g>
        ))}
        <line x1={X(MEAN)} y1={T} x2={X(MEAN)} y2={Y(LO)} stroke="var(--vgrid)" strokeDasharray="4 3" />
        <line x1={L} y1={Y(MEAN)} x2={W - R} y2={Y(MEAN)} stroke="var(--vgrid)" strokeDasharray="4 3" />
        <text x={X(MEAN) + 4} y={T + 10} className={s.ts}>평균 68.25</text>
        <line x1={X(LO)} y1={Y(LO)} x2={X(HI)} y2={Y(HI)} stroke="var(--ifm-color-emphasis-500)" strokeOpacity="0.6" />
        <text x={X(HI) - 4} y={Y(HI) + 14} textAnchor="end" className={s.ts}>기울기 1</text>
        <line x1={X(LO)} y1={Y(b0 + k * LO)} x2={X(HI)} y2={Y(b0 + k * HI)} stroke="var(--vb)" strokeWidth="2.5" />
        <line x1={X(x)} y1={Y(x)} x2={X(x)} y2={Y(y)} stroke="var(--vbad)" strokeWidth="3" />
        {Math.abs(back) > 0.01 ? (
          <text x={X(x) + (d >= 0 ? 8 : -8)} y={(Y(x) + Y(y)) / 2 + 4} textAnchor={d >= 0 ? 'start' : 'end'} className={s.t}>{back > 0 ? '돌아간 양 ' : '더 벌어진 양 '}{fmt(Math.abs(back), 2)}</text>
        ) : null}
        <circle cx={X(x)} cy={Y(y)} r={9} fill="var(--vb)" stroke="var(--ifm-font-color-base)" cursor="grab" onPointerDown={start('p')} />
        <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" className={s.ts}>부모 키 x (인치)</text>
        <text x={4} y={T + 4} className={s.ts}>자식 키 y</text>
      </svg>
      <Stats>
        <Stat label="부모 키 x" value={fmt(x, 2)} />
        <Stat label="자식 키 y" value={fmt(y, 2)} />
        <Stat label="평균 쪽으로 돌아간 양" value={fmt(back, 2)} tone={back > 0.001 ? 'good' : back < -0.001 ? 'bad' : undefined} />
        <Stat label="y = 기울기·x + 절편" value={slopeText(k) + 'x + ' + fmt(b0, 2)} />
      </Stats>
      <Note>
        기울기 2/3이면 부모 +3은 자식 +2로, 71.25에서 70.25가 됩니다. 두 식 68.25 + 2/3(x - 68.25)와 2/3x + 22.75는 같은 값을 냅니다. 부모가 평균이면 돌아갈 양이 0이고, 기울기가 1이면 돌아가는 양이 없습니다.
      </Note>
    </Viz>
  );
}
