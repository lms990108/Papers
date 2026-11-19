import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, sci, sup, log10} from './lib';

const W = 560;
const H = 250;
const LR = 0.1;
const PRESETS = [0.25, 0.5, 0.9, 1, 1.1, 2];

export default function ChainProduct() {
  const [r, setR] = useState(0.25);
  const [n, setN] = useState(3);

  const lg = Array.from({length: n + 1}, (_, k) => k * log10(r));
  const g = Math.pow(r, n);
  const lo = Math.min(0, ...lg) - 0.5;
  const hi = Math.max(0, ...lg) + 0.5;
  const px = lin(0, n, 56, W - 20);
  const py = lin(lo, hi, H - 34, 14);
  const step = Math.max(1, Math.ceil((hi - lo) / 6));
  const ticks = [];
  for (let v = Math.ceil(lo); v <= hi; v++) if (v % step === 0) ticks.push(v);
  const xt = n <= 12 ? Array.from({length: n + 1}, (_, i) => i) : [0, Math.round(n / 4), Math.round(n / 2), Math.round((3 * n) / 4), n];

  let verdict = '층 수와 상관없이 같습니다.';
  let tone;
  if (r < 1 - 1e-9) {
    verdict = '1보다 작은 수가 반복해서 곱해져 앞 층의 기울기가 지수적으로 작아집니다(소실).';
    tone = 'bad';
  } else if (r > 1 + 1e-9) {
    verdict = '1보다 큰 수가 반복해서 곱해져 앞 층의 기울기가 지수적으로 커집니다(폭주).';
    tone = 'bad';
  }

  return (
    <Viz
      title="층마다 r을 곱하면 첫 층의 기울기는 rⁿ"
      caption="출력 쪽 기울기를 1로 두고, 앞 층으로 한 층 갈 때마다 r을 곱합니다. 세로축은 기울기를 10의 거듭제곱으로 그린 눈금입니다. 학습률은 0.1입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p} on={Math.abs(r - p) < 1e-9} onClick={() => setR(p)}>
            r = {p}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="층당 곱 r" min={0.1} max={2.5} step={0.05} value={r} onChange={setR} format={(v) => fmt(v, 2)} />
        <Slider label="층 수 n" min={1} max={100} step={1} value={n} onChange={setN} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="앞 층으로 갈수록 기울기가 변하는 로그 눈금 그래프">
        <line x1={56} y1={py(0)} x2={W - 20} y2={py(0)} stroke="var(--vok)" strokeDasharray="5 4" />
        <text x={W - 22} y={py(0) - 5} textAnchor="end" className={s.ts} style={{fill: 'var(--vok)'}}>기울기 1 (출력 쪽)</text>
        <line x1={56} y1={14} x2={56} y2={H - 34} stroke="var(--ifm-color-emphasis-400)" />
        {ticks.map((v) => (
          <g key={v}>
            <line x1={56} y1={py(v)} x2={W - 20} y2={py(v)} stroke="var(--ifm-color-emphasis-200)" />
            <text x={50} y={py(v) + 4} textAnchor="end" className={s.ts}>{`10${sup(v)}`}</text>
          </g>
        ))}
        {xt.map((v) => (
          <text key={v} x={px(v)} y={H - 18} textAnchor="middle" className={s.ts}>{v}</text>
        ))}
        <text x={W - 20} y={H - 3} textAnchor="end" className={s.ts}>앞쪽으로 몇 층</text>
        <text x={4} y={12} className={s.ts}>기울기</text>
        <polyline points={lg.map((v, k) => `${px(k)},${py(v)}`).join(' ')} fill="none" stroke="var(--vb)" strokeWidth="2" />
        {n <= 30 ? lg.map((v, k) => <circle key={k} cx={px(k)} cy={py(v)} r={3.5} fill="var(--vb)" />) : null}
        <circle cx={px(n)} cy={py(lg[n])} r={6} fill="var(--vb)" />
      </svg>
      <Stats>
        <Stat label="첫 층의 기울기 rⁿ" value={sci(g)} tone={tone} />
        <Stat label="첫 가중치 이동량 (0.1 × 기울기)" value={sci(LR * g)} />
        <Stat label="출력 쪽 이동량" value="0.1" />
      </Stats>
      <Note>{verdict}</Note>
    </Viz>
  );
}
