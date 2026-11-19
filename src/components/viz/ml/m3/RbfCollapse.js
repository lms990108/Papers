import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {makeFrame} from './geom';

const W = 300;
const H = 250;
const {X, Y} = makeFrame(W, H, [-3, 3], [-2.6, 2.6], {l: 10, r: 10, t: 10, b: 10});
const NAMES = ['1', '7', '3'];
const BASE = [0, 120, 240].map((d) => [2 * Math.cos(((90 + d) * Math.PI) / 180), 2 * Math.sin(((90 + d) * Math.PI) / 180)]);
const J = 2;
const COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)'];

// 상태가 정답 기준에 정확히 있을 때(y_D = 0), 기준끼리 거리가 줄면 오차가 어떻게 되는지
const eAt = (k) => {
  const y = 12 * k * k;
  return Math.log(Math.exp(-J) + 1 + 2 * Math.exp(-y));
};

export default function RbfCollapse() {
  const [k, setK] = useState(1);
  const refs = BASE.map((p) => [p[0] * k, p[1] * k]);
  const y = 12 * k * k;
  const E = eAt(k);
  const curve = Array.from({length: 61}, (_, i) => i / 60);
  const CW = 300;
  const CH = 160;
  const cx = (v) => 30 + v * (CW - 44);
  const cy = (v) => CH - 24 - ((v - 0.1) / (1.2 - 0.1)) * (CH - 40);

  return (
    <Viz
      title="기준이 한 점으로 모이면 y_D는 0이어도 오차가 커집니다"
      caption="세 기준을 중심 쪽으로 모아 보세요. 앞 층이 각 입력을 정답 기준 위에 정확히 놓았다고 가정하면 정답 벌점은 늘 0입니다. 정답만 줄이는 오차는 이 그림을 구분하지 못하고, 오답 항이 있는 E는 기준이 모일수록 커집니다. 삼각형 배치와 j = 2는 설명용 값입니다."
    >
      <Controls>
        <Slider label="기준 사이 거리 비율" min={0} max={1} step={0.02} value={k} onChange={setK} format={(v) => fmt(v, 2)} />
        <Btn onClick={() => setK(1)}>벌어진 기준</Btn>
        <Btn onClick={() => setK(0)}>한 점으로</Btn>
      </Controls>
      <div className={s.two}>
        <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="세 클래스 기준이 중심으로 모이는 평면">
          <line x1={X(-3)} y1={Y(0)} x2={X(3)} y2={Y(0)} stroke="var(--vgrid)" />
          <line x1={X(0)} y1={Y(-2.6)} x2={X(0)} y2={Y(2.6)} stroke="var(--vgrid)" />
          {refs.map((p, i) => (
            <g key={i}>
              <circle cx={X(p[0])} cy={Y(p[1])} r={11 - i * 1.5 * (k < 0.05 ? 1 : 0)} fill={COLORS[i]} fillOpacity="0.85" />
              <text x={X(p[0])} y={Y(p[1]) + 4} textAnchor="middle" className={s.t} style={{fill: '#fff', fontWeight: 700}}>{NAMES[i]}</text>
            </g>
          ))}
          <text x={W / 2} y={H - 6} textAnchor="middle" className={s.ts}>기준 1, 7, 3 (겹치면 번호가 가려집니다)</text>
        </svg>
        <svg viewBox={`0 0 ${CW} ${CH}`} className={s.svg} role="img" aria-label="기준 사이 거리 비율에 따른 오차 E 곡선">
          <line x1={30} y1={CH - 24} x2={CW - 14} y2={CH - 24} stroke="var(--ifm-color-emphasis-400)" />
          <polyline points={curve.map((v) => `${cx(v)},${cy(eAt(v))}`).join(' ')} fill="none" stroke="var(--vb)" strokeWidth="2.5" />
          <line x1={cx(k)} y1={cy(E)} x2={cx(k)} y2={CH - 24} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="4 3" />
          <circle cx={cx(k)} cy={cy(E)} r={6} fill="var(--vb)" />
          <text x={30} y={CH - 6} className={s.ts}>비율 0</text>
          <text x={CW - 14} y={CH - 6} textAnchor="end" className={s.ts}>1</text>
          <text x={34} y={16} className={s.ts}>오차 E (정답 벌점 0일 때)</text>
        </svg>
      </div>
      <Bar label="정답 벌점 y_D" value={0} max={1} color="var(--vok)" text="0.000 (항상)" />
      <Bar label="오답 벌점 y" value={Math.min(y, 12)} max={12} color="var(--va)" text={fmt(y, 3)} />
      <Stats>
        <Stat label="정답만 줄이는 오차" value="0.000" />
        <Stat label="오답 항이 있는 오차 E" value={fmt(E, 3)} tone={k < 0.3 ? 'bad' : undefined} />
        <Stat label="기준 사이 제곱 거리" value={fmt(y, 3)} />
      </Stats>
      <Note>기준 사이 제곱 거리는 12k²입니다(삼각형 한 변이 2√3). 한 점으로 모이면(k = 0) 세 벌점이 모두 0이고 E = log(e^(−2) + 3) ≈ 1.143으로 최대입니다. 기준이 충분히 벌어지면 E는 log(1 + e^(−2)) ≈ 0.127에 가까워집니다.</Note>
    </Viz>
  );
}
