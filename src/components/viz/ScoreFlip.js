import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, fmt, styles as s} from './Viz';
import {normalCdf} from './annSim';

const SW = 560;
const SH = 190;
const RANGE = 0.2;

const sigmaOf = (bits) => RANGE / (2 ** bits - 1) / Math.sqrt(12);
const flipProb = (bits, gap) => normalCdf(-gap / (sigmaOf(bits) * Math.SQRT2));
const pct = (p) => (p < 0.0005 ? '0.0%' : `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`);

export default function ScoreFlip() {
  const [bits, setBits] = useState(6);
  const [e, setE] = useState(-2.7);
  const gap = 10 ** e;
  const sigma = sigmaOf(bits);
  const half = 4 * sigma + gap / 2 + 1e-9;
  const cA = gap / 2;
  const cB = -gap / 2;
  const X = (x) => 30 + ((x + half) / (2 * half)) * (SW - 60);
  const pdf = (x, c) => Math.exp(-((x - c) ** 2) / (2 * sigma ** 2));
  const path = (c) => {
    const pts = [];
    for (let i = 0; i <= 90; i += 1) {
      const x = -half + (2 * half * i) / 90;
      pts.push(`${X(x).toFixed(1)},${(SH - 40 - pdf(x, c) * 110).toFixed(1)}`);
    }
    return `M ${X(-half)},${SH - 40} L ${pts.join(' L ')} L ${X(half)},${SH - 40} Z`;
  };

  return (
    <Viz
      title="양자화 오차와 순위 뒤바뀜"
      caption="후보 A와 B의 진짜 점수 차이(gap)를 정하고 비트 수를 바꿔 보세요. 두 곡선은 양자화 오차 때문에 계산된 점수가 퍼지는 범위입니다. 곡선이 많이 겹칠수록 순서가 뒤바뀔 확률이 큽니다."
    >
      <Controls>
        <Slider label="비트 수" min={4} max={8} value={bits} onChange={setBits} format={(b) => `SQ${b}`} />
        <Slider label="진짜 점수 차이 gap" min={-4} max={-1.7} step={0.05} value={e} onChange={setE} format={() => fmt(gap, 4)} />
      </Controls>
      <svg viewBox={`0 0 ${SW} ${SH}`} className={s.svg} role="img" aria-label="두 후보의 점수 분포와 겹침">
        <path d={path(cA)} fill="var(--vc)" fillOpacity="0.28" stroke="var(--vc)" />
        <path d={path(cB)} fill="var(--vok)" fillOpacity="0.28" stroke="var(--vok)" />
        <line x1={X(0)} x2={X(0)} y1={20} y2={SH - 40} stroke="var(--vgrid)" strokeDasharray="3 3" />
        <text x={X(cA)} y={16} textAnchor="middle" className={s.ts}>A</text>
        <text x={X(cB)} y={16} textAnchor="middle" className={s.ts}>B</text>
        <line x1={30} x2={SW - 30} y1={SH - 40} y2={SH - 40} stroke="var(--ifm-color-emphasis-400)" />
        <text x={SW / 2} y={SH - 14} textAnchor="middle" className={s.ts}>점수 (A가 B보다 gap만큼 높음)</text>
      </svg>
      <Stats>
        <Stat label={`SQ${bits}에서 순서가 뒤바뀔 확률`} value={pct(flipProb(bits, gap))} tone={flipProb(bits, gap) > 0.1 ? 'bad' : undefined} />
        <Stat label="SQ8" value={pct(flipProb(8, gap))} />
        <Stat label="SQ6" value={pct(flipProb(6, gap))} />
        <Stat label="SQ4" value={pct(flipProb(4, gap))} />
      </Stats>
      <Note>
        가정: 질문의 길이는 1, 모든 차원의 값 범위는 ±0.1이고 반올림 오차는 눈금 간격 안에서 고르게 퍼집니다. 이때 한 후보의 점수 오차는 표준편차(오차가 퍼진 정도)가 눈금 간격 / √12이고, 약 {fmt(sigma, 5)}입니다. 실제 값은 데이터마다 다르며, 이 그림은 비트 수에 따른 경향을 보여 주는 설명용입니다.
      </Note>
    </Viz>
  );
}
