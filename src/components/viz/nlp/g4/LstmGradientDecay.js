import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const W = 520;
const H = 270;
const L = 56;
const R = 14;
const T0 = 14;
const B0 = 40;
const XMAX = 40;
const YMIN = -6; // log10 하한

export default function LstmGradientDecay() {
  const [f, setF] = useState(0.9);
  const [steps, setSteps] = useState(20);
  const [log, setLog] = useState(false);

  const px = (k) => L + (k / XMAX) * (W - L - R);
  const py = (v) => {
    const t = log ? (Math.max(Math.log10(Math.max(v, 1e-12)), YMIN) - YMIN) / -YMIN : v;
    return H - B0 - t * (H - B0 - T0);
  };
  const line = (base) => {
    const pts = [];
    for (let k = 0; k <= XMAX; k += 1) pts.push(`${px(k)},${py(Math.pow(base, k))}`);
    return pts.join(' ');
  };
  const ticks = log ? [1, 1e-2, 1e-4, 1e-6] : [0, 0.25, 0.5, 0.75, 1];
  const label = (v) => (log ? (v === 1 ? '1' : `1e-${-Math.round(Math.log10(v))}`) : fmt(v, 2));

  const vf = Math.pow(f, steps);
  const vr = Math.pow(0.5, steps);

  return (
    <Viz
      title="통로를 따라가는 기울기는 얼마나 남나"
      caption="통로를 따라 거슬러 가는 기울기는 대략 f를 자리 수만큼 곱한 값입니다. 파랑이 장단기 메모리의 통로(f), 주황이 순환 신경망의 곱하는 값 0.5입니다. 순환 신경망에는 tanh의 기울기(1 이하)가 더 곱해져 실제로는 이보다 더 빨리 줄어듭니다."
    >
      <Controls>
        <Btn on={f === 0.5} onClick={() => setF(0.5)}>f = 0.5</Btn>
        <Btn on={f === 0.9} onClick={() => setF(0.9)}>f = 0.9</Btn>
        <Btn on={f === 0.99} onClick={() => setF(0.99)}>f = 0.99</Btn>
        <Btn on={log} onClick={() => setLog(!log)}>세로축을 로그 눈금으로</Btn>
      </Controls>
      <Controls>
        <Slider label="잊는 문 f" min={0.3} max={0.999} step={0.001} value={f} onChange={setF} format={(v) => fmt(v, 3)} />
        <Slider label="거슬러 간 자리 수 T" min={1} max={XMAX} step={1} value={steps} onChange={setSteps} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="자리 수에 따라 f의 거듭제곱과 0.5의 거듭제곱이 줄어드는 곡선">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} y1={py(v)} x2={W - R} y2={py(v)} stroke="var(--vgrid)" />
            <text x={L - 6} y={py(v) + 4} className={s.ts} textAnchor="end">{label(v)}</text>
          </g>
        ))}
        {[0, 10, 20, 30, 40].map((k) => (
          <text key={k} x={px(k)} y={H - B0 + 16} className={s.ts} textAnchor="middle">{k}</text>
        ))}
        <text x={(L + W - R) / 2} y={H - 6} className={s.ts} textAnchor="middle">거슬러 간 자리 수</text>
        <polyline points={line(0.5)} fill="none" stroke="var(--vb)" strokeWidth="2" strokeDasharray="6 4" />
        <polyline points={line(f)} fill="none" stroke="var(--va)" strokeWidth="2.5" />
        <line x1={px(steps)} y1={T0} x2={px(steps)} y2={H - B0} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="3 3" />
        <circle cx={px(steps)} cy={py(vf)} r={5} fill="var(--va)" />
        <circle cx={px(steps)} cy={py(vr)} r={5} fill="var(--vb)" />
        <text x={W - R - 4} y={T0 + 12} className={s.t} textAnchor="end" style={{fill: 'var(--va)'}}>f = {fmt(f, 3)} (실선)</text>
        <text x={W - R - 4} y={T0 + 28} className={s.t} textAnchor="end" style={{fill: 'var(--vb)'}}>0.5 (점선)</text>
      </svg>
      <Stats>
        <Stat label={`f^${steps} (통로)`} value={fmt(vf, 6)} tone={vf < 0.01 ? 'bad' : 'good'} />
        <Stat label={`0.5^${steps} (곱하는 값 0.5)`} value={fmt(vr, 6)} tone="bad" />
      </Stats>
      {steps === 20 && f === 0.5 ? <Note>f가 0.5이면 스무 자리 뒤에는 약 0.000001로 사라집니다.</Note> : null}
      {f >= 0.9 && steps === 20 ? <Note>문이 0.9나 0.99를 낼 수 있으면 스무 자리 뒤에도 신호가 살아남습니다.</Note> : null}
    </Viz>
  );
}
