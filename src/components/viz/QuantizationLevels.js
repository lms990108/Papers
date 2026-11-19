import React, {useState} from 'react';
import {Viz, Controls, Slider, Bar, Note, fmt, styles as s} from './Viz';

const SW = 600;
const D = 1024;
const N = 10000000;

function Row({y, bits, v, lo, hi, color, name}) {
  const L = 2 ** bits;
  const step = 1 / (L - 1);
  const X = (t) => 30 + ((t - lo) / (hi - lo)) * (SW - 60);
  const q = Math.round(v / step) * step;
  const ticks = [];
  const k0 = Math.max(0, Math.ceil(lo / step));
  for (let k = k0; k * step <= hi && k < L; k += 1) ticks.push(k * step);
  return (
    <g>
      <text x={30} y={y - 24} className={s.ts}>
        {name} · 눈금 {L}개 · 간격 {fmt(step, 4)} · 최대 오차 {fmt(step / 2, 4)}
      </text>
      <line x1={30} x2={SW - 30} y1={y} y2={y} stroke="var(--ifm-color-emphasis-300)" />
      {ticks.map((t) => (
        <line key={t} x1={X(t)} x2={X(t)} y1={y - 8} y2={y + 8} stroke={color} strokeWidth="1.2" />
      ))}
      <circle cx={X(q)} cy={y} r={5.5} fill={color} />
      <text x={SW - 30} y={y + 28} textAnchor="end" className={s.ts}>
        복원값 {fmt(q, 4)} · 이 값의 오차 {fmt(Math.abs(q - v), 5)}
      </text>
    </g>
  );
}

export default function QuantizationLevels() {
  const [bits, setBits] = useState(6);
  const [v, setV] = useState(0.25);
  const stepSel = 1 / (2 ** bits - 1);
  const hw = Math.min(0.5, Math.max(0.04, stepSel * 1.6));
  const lo = v - hw;
  const hi = v + hw;
  const X = (t) => 30 + ((t - lo) / (hi - lo)) * (SW - 60);

  const bytes = (b) => (D * b) / 8;
  const gb = (b) => (N * bytes(b)) / 1e9;

  return (
    <Viz
      title="같은 값을 SQ8과 선택한 비트의 눈금에 맞추기"
      caption="값의 범위를 0~1로 두었습니다. 비트를 줄이면 눈금이 성겨지고, 눈금 사이의 가장 먼 값까지 반올림 오차가 생깁니다. 위쪽 그림은 값 주변을 확대한 것입니다."
    >
      <Controls>
        <Slider label="선택한 비트 수" min={2} max={8} value={bits} onChange={setBits} format={(b) => `${b}비트`} />
        <Slider label="저장할 값" min={0} max={1} step={0.001} value={v} onChange={setV} format={(x) => fmt(x, 3)} />
      </Controls>
      <svg viewBox={`0 0 ${SW} 200`} className={s.svg} role="img" aria-label="SQ8과 선택한 비트의 눈금과 반올림 결과">
        <line x1={X(v)} x2={X(v)} y1={14} y2={176} stroke="var(--ifm-font-color-base)" strokeDasharray="4 3" />
        <Row y={58} bits={8} v={v} lo={lo} hi={hi} color="var(--vc)" name="SQ8" />
        <Row y={142} bits={bits} v={v} lo={lo} hi={hi} color="var(--vok)" name={`SQ${bits}`} />
      </svg>
      <div className={s.title} style={{marginTop: 10}}>
        1024차원 벡터 1개의 크기와, 1천만 개를 저장할 때의 메모리
      </div>
      <Bar label="FP32 (원본)" value={bytes(32)} max={bytes(32)} color="var(--ifm-color-emphasis-500)" text={`${bytes(32)}바이트 · ${fmt(gb(32), 1)}GB`} />
      <Bar label="SQ8" value={bytes(8)} max={bytes(32)} color="var(--vc)" text={`${bytes(8)}바이트 · ${fmt(gb(8), 1)}GB`} />
      <Bar label={`SQ${bits}`} value={bytes(bits)} max={bytes(32)} color="var(--vok)" text={`${bytes(bits)}바이트 · ${fmt(gb(bits), 1)}GB`} />
      <Note>벡터 크기만 계산한 값이고, HNSW의 그래프 링크와 다른 필드는 포함하지 않았습니다.</Note>
    </Viz>
  );
}
