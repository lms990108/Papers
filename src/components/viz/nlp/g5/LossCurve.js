import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const W = 480;
const H = 240;
const L = 44;
const R = 16;
const T = 16;
const B = 36;
const YMAX = 7.2;
const X = (p) => L + p * (W - L - R);
const Y = (v) => T + (1 - v / YMAX) * (H - T - B);
const PRESETS = [0.711, 0.4, 0.1, 0.01, 0.001];

export default function LossCurve() {
  const [p, setP] = useState(0.4);
  const loss = -Math.log(p);
  const rest = (1 - p) / 3;
  const topOk = p > rest + 1e-12;
  const tie = Math.abs(p - rest) < 1e-9;
  const pts = [];
  for (let i = 0; i <= 120; i += 1) {
    const q = Math.max(0.001, i / 120);
    pts.push(X(q) + ',' + Y(-Math.log(q)));
  }

  return (
    <Viz
      title="정답 비율이 작아질수록 오차는 한없이 커집니다"
      caption="정답 칸의 비율 p를 움직여 보세요. 나머지 세 칸에는 남은 비율을 똑같이 나눕니다(설명용 값)."
    >
      <Controls>
        <Slider label="정답 비율 p" min={0.001} max={0.999} step={0.001} value={p} onChange={setP} format={(v) => fmt(v, 3)} />
        {PRESETS.map((v) => (
          <Btn key={v} on={Math.abs(p - v) < 1e-9} onClick={() => setP(v)}>
            {v}
          </Btn>
        ))}
      </Controls>
      <svg viewBox={'0 0 ' + W + ' ' + H} className={s.svg} role="img" aria-label="정답 비율 p에 대한 오차 마이너스 로그 p의 곡선">
        <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--ifm-color-emphasis-400)" />
        {[0, 2, 4, 6].map((v) => (
          <g key={v}>
            <line x1={L} y1={Y(v)} x2={W - R} y2={Y(v)} stroke="var(--vgrid)" />
            <text x={L - 6} y={Y(v) + 4} textAnchor="end" className={s.ts}>{v}</text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <text key={v} x={X(v)} y={H - B + 16} textAnchor="middle" className={s.ts}>{v}</text>
        ))}
        <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" className={s.ts}>정답 칸의 비율 p</text>
        <text x={6} y={T + 4} className={s.ts}>오차</text>
        <polyline points={pts.join(' ')} fill="none" stroke="var(--va)" strokeWidth="2.5" />
        <line x1={X(p)} y1={Y(loss)} x2={X(p)} y2={H - B} stroke="var(--vb)" strokeDasharray="4 3" />
        <line x1={L} y1={Y(loss)} x2={X(p)} y2={Y(loss)} stroke="var(--vb)" strokeDasharray="4 3" />
        <circle cx={X(p)} cy={Y(loss)} r={6} fill="var(--vb)" />
        <text x={Math.min(X(p) + 10, W - 70)} y={Math.max(Y(loss) - 10, 14)} className={s.t}>{fmt(loss, 3)}</text>
      </svg>
      <Stats>
        <Stat label="오차 −log p" value={fmt(loss, 3)} tone={loss < 0.5 ? 'good' : loss > 2 ? 'bad' : undefined} />
        <Stat label="나머지 한 칸의 비율" value={fmt(rest, 3)} />
        <Stat label="가장 높은 칸이 정답인가" value={tie ? '동점' : topOk ? '예' : '아니오'} tone={topOk && !tie ? 'good' : 'bad'} />
      </Stats>
      <Note>
        p = 0.4 이고 나머지가 0.2씩이면 가장 높은 칸이 정답이라 정확도로는 맞지만, 오차는 0.916입니다. 정확도는 가장 높은 칸이 정답인지만 보고, 오차는 정답에 비율을 얼마나 줬는지를 봅니다. p = 0.01이면 4.605, p = 0.001이면 6.908입니다.
      </Note>
    </Viz>
  );
}
