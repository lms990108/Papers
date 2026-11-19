import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const W = 560;
const H = 250;
const X0 = 50;
const X1 = 540;
const Y0 = 20;
const Y1 = 215;
const LO = -6;
const HI = 4;
const K_MAX = 20;

const px = (k) => X0 + (k / K_MAX) * (X1 - X0);
const py = (lg) => Y1 - ((Math.max(LO, Math.min(HI, lg)) - LO) / (HI - LO)) * (Y1 - Y0);

const show = (x) => (x >= 100 ? fmt(x, 1) : x >= 0.0001 ? fmt(x, 5).replace(/0+$/, '').replace(/\.$/, '') : x.toExponential(1));

export default function GradDecay() {
  const [w, setW] = useState(0.5);
  const [k, setK] = useState(10);

  const val = Math.pow(w, k);
  const pts = Array.from({length: K_MAX + 1}, (_, i) => `${px(i)},${py(i * Math.log10(w))}`).join(' ');
  const tone = w < 1 ? 'bad' : w > 1 ? 'bad' : 'good';

  return (
    <Viz
      title="멀리 거슬러 갈수록 기울기는 w^k배"
      caption="tanh의 기울기를 1로 보고, 한 칸 거슬러 갈 때마다 w가 곱해진다고 둔 근사입니다. 세로축은 로그 눈금이고, 점선이 1(기울기 그대로)입니다."
    >
      <Controls>
        <Btn on={w === 0.5} onClick={() => setW(0.5)}>w = 0.5</Btn>
        <Btn on={w === 1.5} onClick={() => setW(1.5)}>w = 1.5</Btn>
        <Btn on={w === 0.9} onClick={() => setW(0.9)}>w = 0.9</Btn>
        <Btn on={w === 1.1} onClick={() => setW(1.1)}>w = 1.1</Btn>
      </Controls>
      <Controls>
        <Slider label="w" min={0.1} max={1.6} step={0.05} value={w} onChange={setW} format={(x) => fmt(x, 2)} />
        <Slider label="거리 k (자리 수)" min={1} max={K_MAX} value={k} onChange={setK} />
      </Controls>

      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="거리에 따른 기울기 w의 k제곱을 로그 눈금으로 그린 선">
        {[-6, -4, -2, 0, 2, 4].map((e) => (
          <g key={e}>
            <line x1={X0} y1={py(e)} x2={X1} y2={py(e)} stroke="var(--vgrid)" strokeDasharray={e === 0 ? '5 4' : undefined} />
            <text x={X0 - 6} y={py(e) + 4} textAnchor="end" className={s.ts}>{e === 0 ? '1' : `10^${e}`}</text>
          </g>
        ))}
        {[0, 5, 10, 15, 20].map((i) => (
          <text key={i} x={px(i)} y={H - 8} textAnchor="middle" className={s.ts}>{i}</text>
        ))}
        <text x={X1} y={Y0 - 6} textAnchor="end" className={s.ts}>가로: 거슬러 간 자리 수 k</text>
        <polyline points={pts} fill="none" stroke="var(--vb)" strokeWidth="2.5" />
        <line x1={px(k)} y1={Y0} x2={px(k)} y2={Y1} stroke="var(--va)" strokeDasharray="3 3" />
        <circle cx={px(k)} cy={py(k * Math.log10(w))} r="6" fill="var(--va)" />
      </svg>

      <Stats>
        <Stat label={`k = ${k}일 때 w^k`} value={show(val)} tone={tone} />
        <Stat label="k = 1" value={show(Math.pow(w, 1))} />
        <Stat label="k = 5" value={show(Math.pow(w, 5))} />
        <Stat label="k = 10" value={show(Math.pow(w, 10))} />
        <Stat label="k = 20" value={show(Math.pow(w, 20))} />
      </Stats>
      <Note>
        {w < 1
          ? `w가 1보다 작아서 ${k}자리 앞의 기울기는 ${show(val)}배로 사라져 갑니다. 이것이 기울기 소실입니다.`
          : w > 1
          ? `w가 1보다 커서 ${k}자리 앞의 기울기는 ${show(val)}배로 커집니다. 이것이 기울기 폭주입니다.`
          : 'w가 정확히 1이면 기울기가 그대로 전달됩니다. 실제로는 tanh의 기울기가 1보다 작아 소실 쪽으로 기웁니다.'}
      </Note>
    </Viz>
  );
}
