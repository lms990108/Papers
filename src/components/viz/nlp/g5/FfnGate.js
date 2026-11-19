import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const W = 480;
const H = 220;
const L = 36;
const T = 14;
const B = 28;
const XR = 3.5;
const YR = [-1, 3.5];
const X = (z) => L + ((z + XR) / (2 * XR)) * (W - L - 12);
const Y = (v) => T + (1 - (v - YR[0]) / (YR[1] - YR[0])) * (H - T - B);
const sigma = (z) => 1 / (1 + Math.exp(-z));
const silu = (z) => z * sigma(z);

export default function FfnGate() {
  const [z, setZ] = useState(1);
  const [v, setV] = useState(1);
  const gate = silu(z);
  const out = gate * v;
  const relu = Math.max(0, z) * v;
  const pts = (f) => Array.from({length: 71}, (_, i) => X(-XR + (i * 2 * XR) / 70) + ',' + Y(f(-XR + (i * 2 * XR) / 70))).join(' ');

  return (
    <Viz
      title="SwiGLU의 문: SiLU는 음수도 조금 흘려 보냅니다"
      caption="문 갈래의 입력 z와 값 갈래의 값을 바꿔 보세요. 두 갈래를 칸마다 곱한 값이 FFN 출력이고, 그 값이 잔차에 더해집니다. 가중치는 단위행렬이고 잔차의 입력은 1로 둡니다(설명용)."
    >
      <Controls>
        <Slider label="문 입력 z" min={-3} max={3} step={0.1} value={z} onChange={setZ} format={(e) => fmt(e, 1)} />
        <Slider label="값 갈래" min={-3} max={3} step={0.1} value={v} onChange={setV} format={(e) => fmt(e, 1)} />
        <Btn onClick={() => { setZ(1); setV(1); }}>z = 1, 값 = 1</Btn>
        <Btn onClick={() => { setZ(-1); setV(-1); }}>z = −1, 값 = −1</Btn>
        <Btn onClick={() => { setZ(1); setV(2); }}>z = 1, 값 = 2</Btn>
      </Controls>
      <svg viewBox={'0 0 ' + W + ' ' + H} className={s.svg} role="img" aria-label="SiLU와 ReLU 곡선과 현재 z의 위치">
        <line x1={L} y1={Y(0)} x2={W - 12} y2={Y(0)} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={X(0)} y1={T} x2={X(0)} y2={H - B} stroke="var(--ifm-color-emphasis-400)" />
        {[-3, -2, -1, 1, 2, 3].map((t) => (
          <text key={t} x={X(t)} y={Y(0) + 14} textAnchor="middle" className={s.ts}>{t}</text>
        ))}
        <polyline points={pts((q) => Math.max(0, q))} fill="none" stroke="var(--ifm-color-emphasis-500)" strokeWidth="2" strokeDasharray="5 4" />
        <polyline points={pts(silu)} fill="none" stroke="var(--va)" strokeWidth="2.5" />
        <line x1={X(z)} y1={Y(0)} x2={X(z)} y2={Y(gate)} stroke="var(--vb)" strokeDasharray="4 3" />
        <circle cx={X(z)} cy={Y(gate)} r={6} fill="var(--vb)" />
        <text x={W - 14} y={T + 12} textAnchor="end" className={s.t} style={{fill: 'var(--va)'}}>실선: SiLU(z)</text>
        <text x={W - 14} y={T + 28} textAnchor="end" className={s.ts}>점선: ReLU(z)</text>
      </svg>
      <Stats>
        <Stat label="σ(z)" value={fmt(sigma(z), 3)} />
        <Stat label="SiLU(z) = z·σ(z)" value={fmt(gate, 3)} />
        <Stat label="문 × 값 (FFN 출력)" value={fmt(out, 3)} />
        <Stat label="ReLU였다면" value={fmt(relu, 3)} />
        <Stat label="잔차: 1 + FFN 출력" value={fmt(1 + out, 3)} tone="good" />
      </Stats>
      <Note>
        z = 1이고 값이 1이면 SiLU(1) = 0.731이라 1 + 0.731 = 1.731입니다. z = 0이면 문이 0이라 더해지지 않습니다. z = −1이면 SiLU(−1) = −0.269이고 값이 −1이면 곱이 0.269로, 음수 입력에서도 조금 더해집니다. ReLU는 이 칸을 0으로 자릅니다.
      </Note>
    </Viz>
  );
}
