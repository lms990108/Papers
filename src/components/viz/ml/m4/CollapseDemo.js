import React, {useEffect, useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const DATA = [
  {x: -1.2, y: 0},
  {x: -0.8, y: 0},
  {x: 0.8, y: 1},
  {x: 1.2, y: 1},
];
const EPS = 0.05;
const STEPS = 3000;

function dists(P, x) {
  const z = P[0] * x;
  return [(z - P[1]) ** 2, (z - P[2]) ** 2];
}

export function loss(P, disc) {
  let t = 0;
  DATA.forEach(({x, y}) => {
    const d = dists(P, x);
    t += d[y];
    if (disc) t += Math.log(Math.exp(-d[0]) + Math.exp(-d[1]));
  });
  return t / DATA.length;
}

export function gap(P) {
  let t = 0;
  DATA.forEach(({x}) => {
    const d = dists(P, x);
    t += Math.abs(d[0] - d[1]);
  });
  return t / DATA.length;
}

// 해석적 기울기. 원문은 수치 미분을 쓰지만 같은 값이 나옵니다.
function grad(P, disc) {
  const g = [0, 0, 0];
  DATA.forEach(({x, y}) => {
    const d = dists(P, x);
    const e0 = Math.exp(-d[0]);
    const e1 = Math.exp(-d[1]);
    const w = [e0 / (e0 + e1), e1 / (e0 + e1)];
    const z = P[0] * x;
    for (let c = 0; c < 2; c += 1) {
      const dl = (c === y ? 1 : 0) - (disc ? w[c] : 0);
      const dz = 2 * (z - P[1 + c]);
      g[0] += dl * dz * x;
      g[1 + c] += dl * -dz;
    }
  });
  return g.map((v) => v / DATA.length);
}

export function simulate(disc) {
  let P = [1, -0.5, 0.5];
  const out = [P];
  for (let i = 0; i < STEPS; i += 1) {
    const g = grad(P, disc);
    P = P.map((p, k) => p - EPS * g[k]);
    out.push(P);
  }
  return out;
}

const VW = 640;
const px = (v) => 320 + v * 90;

function Axis({P, title, tone}) {
  const col = tone === 'bad' ? 'var(--vbad)' : 'var(--vok)';
  return (
    <svg viewBox="0 0 640 112" className={s.svg} role="img" aria-label={`${title}: 입력을 a배 한 위치와 두 기준점 p0, p1`}>
      <text x="8" y="16" className={s.t} fontWeight="600">{title}</text>
      <line x1="30" x2={VW - 30} y1="62" y2="62" stroke="var(--ifm-color-emphasis-400)" />
      <line x1={px(0)} x2={px(0)} y1="52" y2="72" stroke="var(--ifm-color-emphasis-400)" />
      {DATA.map((d, i) => (
        <g key={i}>
          <circle cx={px(P[0] * d.x)} cy={62 - (i % 2) * 14} r="8" fill="var(--ifm-background-color)" stroke={d.y ? 'var(--vb)' : 'var(--va)'} strokeWidth="2" />
          <text x={px(P[0] * d.x)} y={66 - (i % 2) * 14} textAnchor="middle" className={s.t} fontSize="11">{d.y ? 8 : 3}</text>
        </g>
      ))}
      {[1, 2].map((k) => (
        <g key={k}>
          <polygon points={`${px(P[k])},78 ${px(P[k]) - 7},92 ${px(P[k]) + 7},92`} fill={k === 1 ? 'var(--va)' : 'var(--vb)'} />
          <text x={px(P[k]) + (k === 1 ? -9 : 9)} y="106" textAnchor={k === 1 ? 'end' : 'start'} className={s.ts}>{k === 1 ? 'p0(3)' : 'p1(8)'}</text>
        </g>
      ))}
      <text x={VW - 8} y="16" textAnchor="end" className={s.ts} style={{fill: col}}>동그라미: 입력을 a배 한 위치 z = ax</text>
    </svg>
  );
}

function Curve({runs, step}) {
  const W = 640;
  const H = 120;
  const top = Math.max(1, ...runs.map((r) => Math.max(...r.gaps)));
  const mk = (r) => r.gaps.filter((_, i) => i % 15 === 0 || i === STEPS).map((v, i) => `${i ? 'L' : 'M'}${(40 + (i * 15 / STEPS) * (W - 60)).toFixed(1)},${(H - 20 - (v / top) * (H - 36)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="걸음 수에 따른 정답 거리와 오답 거리의 차">
      <line x1="40" x2={W - 20} y1={H - 20} y2={H - 20} stroke="var(--ifm-color-emphasis-400)" />
      <text x="6" y="16" className={s.ts}>두 거리의 차</text>
      <text x={W - 20} y={H - 4} textAnchor="end" className={s.ts}>걸음 수 (0 ~ 3000)</text>
      <path d={mk(runs[0])} fill="none" stroke="var(--vbad)" strokeWidth="2.4" />
      <path d={mk(runs[1])} fill="none" stroke="var(--vok)" strokeWidth="2.4" />
      <line x1={40 + (step / STEPS) * (W - 60)} x2={40 + (step / STEPS) * (W - 60)} y1="10" y2={H - 20} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="3 3" />
      <text x="300" y={H - 30} className={s.ts} style={{fill: 'var(--vbad)'}}>정답 벌점만</text>
      <text x="300" y="38" className={s.ts} style={{fill: 'var(--vok)'}}>정답 - 전체</text>
    </svg>
  );
}

export default function CollapseDemo() {
  const [step, setStep] = useState(3000);
  const [play, setPlay] = useState(false);
  const runs = useMemo(
    () => [false, true].map((disc) => {
      const traj = simulate(disc);
      return {traj, gaps: traj.map(gap)};
    }),
    [],
  );

  useEffect(() => {
    if (!play) return undefined;
    if (step >= STEPS) {
      setPlay(false);
      return undefined;
    }
    const id = setTimeout(() => setStep((v) => Math.min(STEPS, v + 40)), 40);
    return () => clearTimeout(id);
  }, [play, step]);

  const names = ['정답 벌점만 줄이기', '정답 벌점 - 전체 벌점 줄이기'];
  return (
    <Viz
      title="두 오차를 같은 출발점에서 경사하강법으로 줄이기"
      caption="입력 x는 3이 -1.2, -0.8, 8이 0.8, 1.2입니다. 출발은 a = 1, p0 = -0.5, p1 = 0.5이고 걸음 크기는 0.05입니다. 오차는 4개 점의 평균입니다. 걸음 수를 3000까지 끌어 보세요."
    >
      <Controls>
        <Slider label="걸음 수" min={0} max={STEPS} step={10} value={step} onChange={(v) => { setPlay(false); setStep(v); }} />
        <Btn on={play} onClick={() => { if (step >= STEPS) setStep(0); setPlay(!play); }}>{play ? '멈춤' : '재생'}</Btn>
        <Btn on={false} onClick={() => { setPlay(false); setStep(0); }}>처음으로</Btn>
        <Btn on={false} onClick={() => { setPlay(false); setStep(STEPS); }}>3000걸음</Btn>
      </Controls>
      {runs.map((r, k) => {
        const P = r.traj[step];
        const gp = gap(P);
        return (
          <div key={k} style={{marginBottom: 6}}>
            <Axis P={P} title={names[k]} tone={k === 0 ? 'bad' : 'good'} />
            <Stats>
              <Stat label="a" value={fmt(P[0], 4)} />
              <Stat label="p0" value={fmt(P[1], 4)} />
              <Stat label="p1" value={fmt(P[2], 4)} />
              <Stat label="오차" value={fmt(loss(P, k === 1), 4)} />
              <Stat label="두 거리의 차" value={fmt(gp, 4)} tone={gp < 0.1 ? 'bad' : 'good'} />
            </Stats>
          </div>
        );
      })}
      <Curve runs={runs} step={step} />
      <Note>
        3000걸음에서 정답 벌점만 쓴 쪽은 오차가 0.0000이지만 a가 0에 가깝고 두 기준점이 겹쳐 두 거리의 차가 0.0007입니다. 전체 벌점을 같이 쓴 쪽은 오차가 0.0002이면서 두 기준점이 벌어져 차가 9.7265입니다. 두 거리의 차가 3과 8을 가르는 정도입니다.
      </Note>
    </Viz>
  );
}
