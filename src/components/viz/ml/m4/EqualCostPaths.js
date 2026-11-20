import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const KMAX = 20;

export default function EqualCostPaths() {
  const [c, setC] = useState(3);
  const [k, setK] = useState(2);
  const la = c - Math.log(k);
  const W = 640;
  const H = 190;
  const lo = c - Math.log(KMAX) - 0.4;
  const hi = c + 0.4;
  const px = (kk) => 50 + ((kk - 1) / (KMAX - 1)) * (W - 80);
  const py = (v) => 20 + ((hi - v) / (hi - lo)) * (H - 50);
  const pts = Array.from({length: KMAX}, (_, i) => `${i ? 'L' : 'M'}${px(i + 1).toFixed(1)},${py(c - Math.log(i + 1)).toFixed(1)}`).join(' ');

  return (
    <Viz
      title="비용이 같은 경로가 k개이면 logadd는 얼마나 낮아지나"
      caption="logadd는 평균도 최솟값도 아닙니다. 비용 c인 경로 k개의 logadd는 c - ln k입니다. 연습 문제 2는 c = 2, k = 4입니다."
    >
      <Controls>
        <Slider label="경로 하나의 비용 c" min={0} max={6} step={0.5} value={c} onChange={setC} format={(v) => fmt(v, 1)} />
        <Slider label="경로 수 k" min={1} max={KMAX} step={1} value={k} onChange={setK} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="경로 수 k에 따른 logadd 값. k가 늘수록 c에서 ln k만큼 내려간다.">
        <line x1="40" x2={W - 20} y1={py(c)} y2={py(c)} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="5 4" />
        <text x={W - 22} y={py(c) - 5} textAnchor="end" className={s.ts}>평균 = 최솟값 = c</text>
        <path d={pts} fill="none" stroke="var(--va)" strokeWidth="2.4" />
        <circle cx={px(k)} cy={py(la)} r="7" fill="var(--vbad)" />
        <text x={px(k) + (k > KMAX / 2 ? -10 : 10)} y={py(la) - 10} textAnchor={k > KMAX / 2 ? 'end' : 'start'} className={s.t} style={{fill: 'var(--vbad)'}} fontWeight="700">logadd {fmt(la, 3)}</text>
        <text x="40" y={H - 6} className={s.ts}>경로 수 k = 1</text>
        <text x={W - 20} y={H - 6} textAnchor="end" className={s.ts}>k = {KMAX}</text>
        <text x="6" y="14" className={s.ts}>비용</text>
      </svg>
      <Stats>
        <Stat label="logadd = c - ln k" value={fmt(la, 3)} tone="good" />
        <Stat label="ln k" value={fmt(Math.log(k), 3)} />
        <Stat label="평균, 최솟값" value={fmt(c, 2)} />
      </Stats>
      <Note>
        {k === 1 ? '경로가 하나이면 ln 1 = 0이라 logadd가 c와 같습니다.' : `경로가 ${k}개라서 ${fmt(Math.log(k), 3)}만큼 낮아졌습니다. 경로가 늘수록 계속 낮아집니다.`}
        {c === 3 && k === 2 ? ' 본문의 예 3 - ln 2 = 2.307입니다.' : ''}
        {c === 2 && k === 4 ? ' 2 - ln 4 = 0.614로 연습 문제 2의 답입니다.' : ''}
      </Note>
    </Viz>
  );
}
