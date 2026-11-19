import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, sci, sup, log10} from './lib';

const W = 560;
const H = 250;
const PRESETS = [0.5, 1, 1.5];
const clip = (g, c) => g * Math.min(1, c / Math.abs(g));

export default function RnnClip() {
  const [w, setW] = useState(0.5);
  const [T, setT] = useState(10);
  const [c, setC] = useState(1);
  const [g, setG] = useState(8);

  const lg = Array.from({length: T + 1}, (_, k) => k * log10(w));
  const gT = Math.pow(w, T);
  const lo = Math.min(0, ...lg, log10(c)) - 0.5;
  const hi = Math.max(0, ...lg, log10(c)) + 0.5;
  const px = lin(0, T, 56, W - 20);
  const py = lin(lo, hi, H - 34, 14);
  const step = Math.max(1, Math.ceil((hi - lo) / 6));
  const ticks = [];
  for (let v = Math.ceil(lo); v <= hi; v++) if (v % step === 0) ticks.push(v);
  const xt = T <= 12 ? Array.from({length: T + 1}, (_, i) => i) : [0, Math.round(T / 4), Math.round(T / 2), Math.round((3 * T) / 4), T];

  return (
    <Viz
      title="같은 가중치를 시각마다 곱하는 순환 신경망"
      caption="tanh의 기울기를 1로 가정하면, T개 앞 단어에서 오는 기울기는 wᵀ입니다. 세로축은 기울기를 10의 거듭제곱으로 그린 눈금이고, 점선은 자르기 기준 c입니다. 기준을 넘는 값은 크기만 c로 줄고 방향은 그대로입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p} on={Math.abs(w - p) < 1e-9} onClick={() => setW(p)}>
            w = {p}
          </Btn>
        ))}
        <Slider label="가중치 w" min={0.5} max={1.6} step={0.05} value={w} onChange={setW} format={(v) => fmt(v, 2)} />
        <Slider label="몇 개 앞 단어 T" min={1} max={40} step={1} value={T} onChange={setT} />
        <Slider label="자르기 기준 c" min={0.5} max={5} step={0.5} value={c} onChange={setC} format={(v) => fmt(v, 1)} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="거리에 따른 기울기 wᵀ의 로그 눈금 그래프">
        <line x1={56} y1={14} x2={56} y2={H - 34} stroke="var(--ifm-color-emphasis-400)" />
        {ticks.map((v) => (
          <g key={v}>
            <line x1={56} y1={py(v)} x2={W - 20} y2={py(v)} stroke="var(--ifm-color-emphasis-200)" />
            <text x={50} y={py(v) + 4} textAnchor="end" className={s.ts}>{`10${sup(v)}`}</text>
          </g>
        ))}
        <line x1={56} y1={py(log10(c))} x2={W - 20} y2={py(log10(c))} stroke="var(--vok)" strokeDasharray="5 4" />
        <text x={W - 22} y={py(log10(c)) - 5} textAnchor="end" className={s.ts} style={{fill: 'var(--vok)'}}>자르기 기준 c = {fmt(c, 1)}</text>
        {xt.map((v) => (
          <text key={v} x={px(v)} y={H - 18} textAnchor="middle" className={s.ts}>{v}</text>
        ))}
        <text x={W - 20} y={H - 3} textAnchor="end" className={s.ts}>몇 개 앞 단어</text>
        <text x={4} y={12} className={s.ts}>기울기</text>
        <polyline points={lg.map((v, k) => `${px(k)},${py(v)}`).join(' ')} fill="none" stroke="var(--vb)" strokeWidth="2" />
        <circle cx={px(T)} cy={py(lg[T])} r={6} fill="var(--vb)" />
      </svg>
      <Stats>
        <Stat label={`wᵀ (T = ${T})`} value={sci(gT)} tone={w < 1 - 1e-9 ? 'bad' : w > 1 + 1e-9 ? 'bad' : 'good'} />
        <Stat label="T = 10" value={sci(Math.pow(w, 10), 4)} />
        <Stat label="T = 30" value={sci(Math.pow(w, 30), 4)} />
        <Stat label={`기준 ${fmt(c, 1)}으로 자른 값`} value={sci(clip(gT, c))} />
      </Stats>
      <Note>
        {w < 1 - 1e-9
          ? '곱이 1보다 작아 문장이 길면 앞 단어의 영향이 오차에 거의 전달되지 않습니다.'
          : w > 1 + 1e-9
          ? '곱이 1보다 커서 기울기가 폭주합니다. 기울기 자르기는 크기가 기준을 넘으면 방향은 두고 크기만 줄입니다.'
          : 'w = 1이면 길이와 상관없이 기울기가 1입니다.'}
      </Note>
      <Controls>
        <Slider label="자르기 시험: 기울기 g" min={0.1} max={10} step={0.1} value={g} onChange={(v) => setG(Math.round(v * 10) / 10)} format={(v) => fmt(v, 1)} />
        <span className={s.ts}>
          clip({fmt(g, 1)}) = <b>{fmt(clip(g, c), 1)}</b> (기준 {fmt(c, 1)}). 기준 아래인 값은 그대로 둡니다.
        </span>
      </Controls>
    </Viz>
  );
}
