import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const REF = {w: -0.5, l: -1.0};
const PRESETS = [
  {t: '처음 (기준과 같음)', w: -0.5, l: -1.0},
  {t: '한 번 갱신한 뒤', w: -0.3, l: -1.2},
  {t: '둘 다 같이 올림', w: -0.2, l: -0.7},
  {t: '고른 답만 크게 올림', w: -0.1, l: -1.0},
];
const sig = (x) => 1 / (1 + Math.exp(-x));
const GX = 20;
const GW = 260;
const GH = 110;
const gx = (x) => GX + ((x + 3) / 6) * GW;
const gy = (e) => 10 + GH - Math.min(e, 3.5) / 3.5 * GH;

export default function DpoMargin() {
  const [w, setW] = useState(-0.5);
  const [l, setL] = useState(-1.0);
  const [beta, setBeta] = useState(1);
  const dw = w - REF.w;
  const dl = l - REF.l;
  const x = beta * (dw - dl);
  const e = -Math.log(sig(x));
  const pts = [];
  for (let i = 0; i <= 60; i += 1) {
    const v = -3 + (i / 60) * 6;
    pts.push(`${gx(v)},${gy(-Math.log(sig(v)))}`);
  }
  const near = (a, b) => Math.abs(a - b) < 1e-9;

  return (
    <Viz
      title="DPO의 오차는 간격이 얼마나 벌어졌는가"
      caption="기준 모델의 logprob은 고른 답 -0.5, 버린 답 -1.0으로 고정입니다. 학습 중인 모델의 logprob을 움직여 보세요. 세기 β는 글의 예에서 1입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.t} on={near(p.w, w) && near(p.l, l)} onClick={() => { setW(p.w); setL(p.l); }}>
            {p.t}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="학습 중 log π(고른 답)" min={-3} max={0} step={0.1} value={w} onChange={setW} format={(v) => fmt(v, 1)} />
        <Slider label="학습 중 log π(버린 답)" min={-3} max={0} step={0.1} value={l} onChange={setL} format={(v) => fmt(v, 1)} />
        <Slider label="세기 β" min={0.5} max={3} step={0.5} value={beta} onChange={setBeta} format={(v) => fmt(v, 1)} />
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th />
            <th>학습 중 log π</th>
            <th>기준 log π_ref</th>
            <th>차이</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>고른 답</td>
            <td>{fmt(w, 1)}</td>
            <td>{fmt(REF.w, 1)}</td>
            <td className={s.cellOn}>{fmt(dw, 1)}</td>
          </tr>
          <tr>
            <td>버린 답</td>
            <td>{fmt(l, 1)}</td>
            <td>{fmt(REF.l, 1)}</td>
            <td className={s.cellOn}>{fmt(dl, 1)}</td>
          </tr>
        </tbody>
      </table>
      <svg viewBox="0 0 300 150" className={s.svg} style={{maxWidth: 420}} role="img" aria-label="시그모이드 입력에 따른 오차 곡선과 현재 위치">
        <line x1={GX} y1={10 + GH} x2={GX + GW} y2={10 + GH} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={gx(0)} y1={10} x2={gx(0)} y2={10 + GH} stroke="var(--ifm-color-emphasis-300)" strokeDasharray="3 3" />
        <polyline points={pts.join(' ')} fill="none" stroke="var(--ifm-color-emphasis-700)" strokeWidth="1.5" />
        <circle cx={gx(Math.max(-3, Math.min(3, x)))} cy={gy(e)} r={5} fill="var(--vb)" />
        <text x={gx(0) + 4} y={22} className={s.ts}>입력 0 → 오차 0.693</text>
        <text x={GX} y={10 + GH + 16} className={s.ts}>-3</text>
        <text x={GX + GW} y={10 + GH + 16} textAnchor="end" className={s.ts}>3 (시그모이드 입력)</text>
      </svg>
      <Stats>
        <Stat label="시그모이드 입력" value={fmt(x, 2)} />
        <Stat label="시그모이드 출력" value={fmt(sig(x), 3)} />
        <Stat label="오차 -log σ" value={fmt(e, 3)} tone={e < 0.69 ? 'good' : e > 0.7 ? 'bad' : undefined} />
      </Stats>
      <Note>
        {near(dw, dl)
          ? '두 답의 차이가 같으면 시그모이드 입력은 0이고 오차는 0.693입니다. 둘을 같이 올려도 변하지 않습니다.'
          : x > 0
            ? '고른 답이 기준보다 더 올랐거나 버린 답이 더 내려가서 오차가 0.693보다 작습니다.'
            : '버린 답이 고른 답보다 기준에서 더 올라서 오차가 0.693보다 큽니다.'}
      </Note>
    </Viz>
  );
}
