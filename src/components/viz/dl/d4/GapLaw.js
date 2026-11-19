import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

// 원문 표(7차 모델, 매번 새 잡음으로 20번 학습한 평균)
const ROWS = [
  {P: 8, tr: 0.0, te: 0.1295, gap: 0.1295},
  {P: 16, tr: 0.0201, te: 0.0546, gap: 0.0345},
  {P: 32, tr: 0.0336, te: 0.0427, gap: 0.0091},
  {P: 64, tr: 0.0325, te: 0.0393, gap: 0.0068},
  {P: 128, tr: 0.0369, te: 0.0363, gap: -0.0006},
];
const W = 460;
const H = 270;
const L = 48;
const R = 14;
const T = 16;
const B = 36;
const YMIN = -0.02;
const YMAX = 0.15;
const X = (i) => L + (i / 4) * (W - L - R);
const Y = (v) => T + ((YMAX - v) / (YMAX - YMIN)) * (H - T - B);

export default function GapLaw() {
  const [alpha, setAlpha] = useState(0.5);
  const [idx, setIdx] = useState(1);

  const base = ROWS[0].gap;
  const model = (i) => base * Math.pow(ROWS[0].P / ROWS[i].P, alpha);
  const pts = [];
  for (let i = 0; i <= 40; i += 1) {
    const e = i / 10;
    pts.push(`${X(e).toFixed(1)},${Y(base * Math.pow(2, -alpha * e)).toFixed(1)}`);
  }
  const r = ROWS[idx];
  const m = model(idx);

  return (
    <Viz
      title="학습 쌍 P를 늘리면 간격이 줄어드는 모양"
      caption="점은 원문 표의 측정값(7차 모델, 20번 평균)입니다. 곡선은 간격 ≈ k(h/P)^α를 P=8의 값 0.1295에 맞춰 그린 것이며, k와 h를 따로 모르므로 곡선의 높이는 설명용입니다. α를 바꿔 곡선이 점들과 얼마나 맞는지 보세요."
    >
      <Controls>
        <Slider label="α" min={0.5} max={1} step={0.05} value={alpha} onChange={setAlpha} format={(v) => fmt(v, 2)} />
        <Slider label="볼 P" min={0} max={4} value={idx} onChange={setIdx} format={(i) => String(ROWS[i].P)} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="P에 따른 일반화 간격의 측정값과 식의 곡선">
        <line x1={L} y1={Y(0)} x2={W - R} y2={Y(0)} stroke="var(--ifm-color-emphasis-500)" />
        <line x1={L} y1={T} x2={L} y2={H - B + 6} stroke="var(--vgrid)" />
        {[0.05, 0.1].map((v) => (
          <g key={v}>
            <line x1={L} y1={Y(v)} x2={W - R} y2={Y(v)} stroke="var(--vgrid)" strokeDasharray="3 4" />
            <text x={L - 6} y={Y(v) + 4} className={s.ts} textAnchor="end">{fmt(v, 2)}</text>
          </g>
        ))}
        <text x={L - 6} y={Y(0) + 4} className={s.ts} textAnchor="end">0</text>
        <polyline points={pts.join(' ')} fill="none" stroke="var(--vc)" strokeWidth="2.5" />
        {ROWS.map((row, i) => (
          <g key={row.P} onClick={() => setIdx(i)} style={{cursor: 'pointer'}}>
            <circle cx={X(i)} cy={Y(row.gap)} r={i === idx ? 8 : 5.5} fill="var(--vb)" fillOpacity={i === idx ? 1 : 0.8} />
            <text x={X(i)} y={H - 16} className={s.ts} textAnchor="middle" fontWeight={i === idx ? 700 : 400}>P = {row.P}</text>
          </g>
        ))}
        <text x={W - R} y={T + 8} className={s.ts} textAnchor="end" style={{fill: 'var(--vb)'}}>주황 점 = 측정한 간격</text>
        <text x={W - R} y={T + 22} className={s.ts} textAnchor="end" style={{fill: 'var(--vc)'}}>보라 곡선 = 식의 경향 (α={fmt(alpha, 2)})</text>
        <text x={4} y={T + 4} className={s.ts}>간격</text>
      </svg>
      <Stats>
        <Stat label={`P = ${r.P}: 학습 오차`} value={fmt(r.tr, 4)} />
        <Stat label="시험 오차" value={fmt(r.te, 4)} />
        <Stat label="측정한 간격" value={fmt(r.gap, 4)} />
        <Stat label="곡선의 값 (설명용)" value={fmt(m, 4)} />
        <Stat label="P를 두 배로 할 때 배율 2^−α" value={fmt(Math.pow(2, -alpha), 3)} />
        <Stat label="네 배로 할 때 배율" value={fmt(Math.pow(4, -alpha), 3)} />
      </Stats>
      {idx === 4 ? (
        <Note>P = 128의 간격 −0.0006은 시험이 학습보다 낮은 것이 아니라 20번 평균에 남은 잡음입니다. 쌍이 용량에 비해 충분하면 간격이 0 근처에서 만납니다.</Note>
      ) : (
        <Note>학습 오차는 오히려 올라가고 시험 오차는 내려가서 둘이 0.04 근처에서 만납니다. 간격이 이 식처럼 매끈한 거듭제곱으로 줄지는 않고, 식은 경향입니다.</Note>
      )}
    </Viz>
  );
}
