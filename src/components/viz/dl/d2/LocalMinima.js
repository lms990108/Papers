import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin} from './lib';

const W = 520;
const H = 250;
const Eq = (w) => w ** 4 - 3 * w ** 2 + w;
const Gq = (w) => 4 * w ** 3 - 6 * w + 1;
const px = lin(-2.2, 2.2, 40, W - 14);
const py = lin(-4, 12, H - 30, 12);
const CRIT = [-1.301, 0.17, 1.131];

const CURVE = (() => {
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const w = -2.2 + (4.4 * i) / 96;
    pts.push(`${px(w)},${py(Eq(w))}`);
  }
  return pts.join(' ');
})();

const run = (w0, n) => {
  const p = [w0];
  let w = w0;
  for (let i = 0; i < n; i++) {
    w -= 0.01 * Gq(w);
    p.push(w);
  }
  return p;
};

function Saddle() {
  const [r, setR] = useState(0.1);
  const sx = lin(-1, 1, 40, W - 14);
  const sy = lin(-1, 1, H - 30, 12);
  const up = [];
  const down = [];
  for (let i = 0; i <= 40; i++) {
    const v = -1 + i / 20;
    up.push(`${sx(v)},${sy(v * v)}`);
    down.push(`${sx(v)},${sy(-v * v)}`);
  }
  return (
    <div>
      <Controls>
        <Slider label="원점에서 움직인 거리 r" min={0} max={1} step={0.05} value={r} onChange={setR} format={(v) => fmt(v, 2)} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="안장점에서 두 방향의 오차 단면">
        <line x1={40} y1={sy(0)} x2={W - 14} y2={sy(0)} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={sx(0)} y1={12} x2={sx(0)} y2={H - 30} stroke="var(--ifm-color-emphasis-300)" />
        <polyline points={up.join(' ')} fill="none" stroke="var(--va)" strokeWidth="2" />
        <polyline points={down.join(' ')} fill="none" stroke="var(--vb)" strokeWidth="2" strokeDasharray="6 3" />
        <circle cx={sx(r)} cy={sy(r * r)} r={5} fill="var(--va)" />
        <circle cx={sx(r)} cy={sy(-r * r)} r={5} fill="var(--vb)" />
        <circle cx={sx(0)} cy={sy(0)} r={3.5} fill="var(--ifm-font-color-base)" />
        <text x={sx(0.6)} y={sy(0.9)} className={s.ts} style={{fill: 'var(--va)'}}>w₁ 방향: 오차가 오름</text>
        <text x={sx(0.1)} y={sy(-0.9)} className={s.ts} style={{fill: 'var(--vb)'}}>w₂ 방향: 오차가 내림</text>
        <text x={W - 14} y={H - 4} textAnchor="end" className={s.ts}>원점에서 움직인 거리</text>
      </svg>
      <Stats>
        <Stat label="원점의 오차" value="0" />
        <Stat label="원점의 기울기" value="(0, 0)" />
        <Stat label="w₁ 쪽 r만큼" value={fmt(r * r, 3)} tone="bad" />
        <Stat label="w₂ 쪽 r만큼" value={fmt(-r * r, 3)} tone="good" />
      </Stats>
      <Note>E = w₁² − w₂²의 원점은 기울기가 0이지만 최솟값이 아닙니다. w₁ 방향으로는 오르고 w₂ 방향으로는 내려가는 안장점입니다.</Note>
    </div>
  );
}

export default function LocalMinima() {
  const [mode, setMode] = useState('well');
  const [w0, setW0] = useState(2);
  const [n, setN] = useState(200);

  const p = run(w0, 200);
  const shown = p.slice(0, n + 1);
  const w = shown[shown.length - 1];
  const ends = p[200];
  const pts = shown.filter((_, i) => i % 5 === 0 || i === shown.length - 1);

  return (
    <Viz
      title="기울기가 0인 곳이 모두 가장 낮은 곳은 아니다"
      caption="학습률 0.01로 200걸음 내려갑니다. 시작 위치를 옮겨 어느 골짜기에 닿는지 보세요. 골짜기 사이의 봉우리(약 0.170)를 기준으로 도착하는 곳이 갈립니다."
    >
      <Controls>
        <Btn on={mode === 'well'} onClick={() => setMode('well')}>골짜기 둘</Btn>
        <Btn on={mode === 'saddle'} onClick={() => setMode('saddle')}>안장점</Btn>
      </Controls>
      {mode === 'saddle' ? (
        <Saddle />
      ) : (
        <div>
          <Controls>
            <Btn on={w0 === 2} onClick={() => setW0(2)}>시작 2.0</Btn>
            <Btn on={w0 === -2} onClick={() => setW0(-2)}>시작 −2.0</Btn>
            <Slider label="시작 w" min={-2.2} max={2.2} step={0.1} value={w0} onChange={(v) => setW0(Math.round(v * 10) / 10)} format={(v) => fmt(v, 1)} />
            <Slider label="걸음 수" min={0} max={200} step={10} value={n} onChange={setN} />
          </Controls>
          <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="골짜기가 둘인 오차 곡선과 내려가는 점">
            <line x1={40} y1={py(0)} x2={W - 14} y2={py(0)} stroke="var(--ifm-color-emphasis-300)" />
            <polyline points={CURVE} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth="2" />
            {CRIT.map((c, i) => (
              <g key={c}>
                <line x1={px(c)} y1={py(Eq(c))} x2={px(c)} y2={H - 30} stroke="var(--ifm-color-emphasis-300)" strokeDasharray="3 3" />
                <text x={px(c)} y={H - 14} textAnchor="middle" className={s.ts}>{c}</text>
                <text x={px(c)} y={py(Eq(c)) + (i === 1 ? -8 : 16)} textAnchor="middle" className={s.ts}>
                  {i === 1 ? '봉우리' : i === 0 ? '깊은 골짜기' : '얕은 골짜기'}
                </text>
              </g>
            ))}
            {pts.map((q, i) => (
              <circle key={i} cx={px(q)} cy={py(Eq(q))} r={2.6} fill="var(--vb)" />
            ))}
            <circle cx={px(w)} cy={py(Eq(w))} r={6} fill="var(--vb)" />
            <circle cx={px(w0)} cy={py(Eq(w0))} r={5} fill="none" stroke="var(--vb)" strokeWidth="2" />
            <text x={px(w0)} y={py(Eq(w0)) - 10} textAnchor="middle" className={s.ts}>시작</text>
          </svg>
          <Stats>
            <Stat label={`${n}걸음 뒤 w`} value={fmt(w, 3)} />
            <Stat label="오차" value={fmt(Eq(w), 3)} />
            <Stat label="기울기" value={fmt(Gq(w), 4)} />
            <Stat label="200걸음 뒤 닿는 골짜기" value={ends > 0.5 ? '얕은 쪽 (−1.070)' : ends < -0.5 ? '깊은 쪽 (−3.514)' : '봉우리 근처'} tone={ends < -0.5 ? 'good' : 'bad'} />
          </Stats>
          <Note>
            기울기만 보는 이 절차는 어느 골짜기가 더 깊은지 모릅니다. 시작 2.0은 오차 −1.070인 얕은 골짜기에, 시작 −2.0은 −3.514인 깊은 골짜기에 닿습니다.
          </Note>
        </div>
      )}
    </Viz>
  );
}
