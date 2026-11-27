import React, {useEffect, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {gdPath, E1, g1, tr} from './lib';

// 오차 E(w) = (w - 3)^2 의 곡선 위에서 경사하강법을 한 걸음씩 따라간다. 시작은 w = 0.

const W = 560;
const H = 300;
const X0 = -2;
const X1 = 8;
const Y1 = 26;
const L = 50;
const R = W - 30;
const T = 16;
const B = H - 40;
const px = (w) => L + ((w - X0) / (X1 - X0)) * (R - L);
const py = (e) => B - (Math.min(e, Y1) / Y1) * (B - T);
const MAXSTEP = 10;
const STEP_MS = 1300;
const LRS = [
  {e: 0.1, t: '조금씩'},
  {e: 0.5, t: '한 번에'},
  {e: 1.0, t: '왕복'},
  {e: 1.1, t: '발산'},
];
const NOTES = {
  0.1: '기울기가 줄어드는 만큼 걸음도 짧아집니다. 정답 3에 다가가지만 한 번에 도착하지는 않습니다.',
  0.5: '이 곡선에서는 learning rate 0.5가 한 번에 w = 3으로 데려갑니다. 기울기 × 0.5가 정답까지의 거리와 같기 때문입니다.',
  1.0: '걸음이 정답까지의 거리의 두 배라서, 3을 지나 반대쪽 같은 높이로 건너갑니다. 0과 6을 오가며 오차는 줄지 않습니다.',
  1.1: '건너갈 때마다 더 멀리 넘어가서 오차가 커집니다. 곡선 밖으로 나가는 것이 발산입니다.',
};

const curve = Array.from({length: 101}, (_, i) => {
  const w = X0 + ((X1 - X0) * i) / 100;
  return [w, E1(w)];
}).filter(([, e]) => e <= Y1);

export default function ParabolaDescent() {
  const [eps, setEps] = useState(0.1);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      reduce = false;
    }
    setPlaying(!reduce);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setStep((v) => (v >= MAXSTEP ? 0 : v + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [playing]);

  const path = gdPath(0, eps, MAXSTEP);
  const w = path[step];
  const next = path[Math.min(step + 1, MAXSTEP)];
  const inside = (v) => v >= X0 && v <= X1 && E1(v) <= Y1;
  const here = inside(w);
  const g = g1(w);
  const trail = path.slice(0, step + 1).filter(inside);
  const nextIn = inside(next) && step < MAXSTEP;

  // 접선: 현재 위치에서 곡선과 같은 기울기로 닿는 직선
  let tx0 = w - 1.4;
  let tx1 = w + 1.4;
  if (Math.abs(g) > 1e-9) {
    const wz = w - E1(w) / g; // 접선이 축(E = 0)과 만나는 곳
    if (g < 0) tx1 = Math.min(tx1, wz);
    else tx0 = Math.max(tx0, wz);
  }
  const ty = (v) => E1(w) + g * (v - w);

  const choose = (v) => {
    setEps(v);
    setStep(0);
  };

  return (
    <Viz
      title="오차 곡선 위에서 내려가기"
      caption="가로가 파라미터 w, 세로가 오차 E입니다. 곡선 E(w) = (w − 3)²의 가장 낮은 곳이 정답 w = 3입니다. 공(빨강)이 지금 위치이고, 초록 직선은 그 자리의 기울기(접선)입니다. 비어 있는 동그라미가 다음 위치이고, 축 위의 화살표가 이번 걸음입니다. 시작은 w = 0입니다."
    >
      <Controls>
        <span className={s.ts}>learning rate ε</span>
        {LRS.map((r) => (
          <Btn key={r.e} on={eps === r.e} onClick={() => choose(r.e)}>{r.e.toFixed(1)} ({r.t})</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => { setPlaying(false); setStep(Math.min(MAXSTEP, step + 1)); }}>다음 걸음</Btn>
        <Btn onClick={() => { setPlaying(false); setStep(Math.max(0, step - 1)); }}>이전 걸음</Btn>
        <Btn onClick={() => setStep(0)}>처음으로</Btn>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="오차 곡선 위에서 공이 내려가는 모습">
        <line x1={L} y1={B} x2={R} y2={B} stroke="var(--ifm-color-emphasis-500)" />
        <line x1={L} y1={T} x2={L} y2={B} stroke="var(--ifm-color-emphasis-400)" />
        {[0, 2, 4, 6, 8].map((v) => (
          <g key={v}>
            <line x1={px(v)} y1={B} x2={px(v)} y2={B + 4} stroke="var(--ifm-color-emphasis-500)" />
            <text x={px(v)} y={B + 18} textAnchor="middle" className={s.ts}>{v}</text>
          </g>
        ))}
        <text x={R} y={B + 32} textAnchor="end" className={s.ts}>w</text>
        <text x={L + 4} y={T + 8} className={s.ts}>오차 E</text>
        <line x1={px(3)} y1={B} x2={px(3)} y2={py(0) - 0} stroke="var(--vok)" strokeDasharray="4 3" />
        <text x={px(3)} y={B + 30} textAnchor="middle" className={s.ts} style={{fill: 'var(--vok)', fontWeight: 700}}>정답 3</text>
        <polyline points={curve.map(([v, e]) => `${px(v)},${py(e)}`).join(' ')} fill="none" stroke="var(--va)" strokeWidth={3} />

        {trail.map((v, i) => (
          <g key={i}>
            <circle cx={px(v)} cy={py(E1(v))} r={4} fill="var(--vc)" />
            {i < trail.length - 1 ? <text x={px(v)} y={py(E1(v)) - 8} textAnchor="middle" className={s.ts}>{i}</text> : null}
          </g>
        ))}

        {here ? (
          <g>
            <line x1={px(w)} y1={py(E1(w))} x2={px(w)} y2={B} stroke="var(--vbad)" strokeDasharray="2 3" />
            <line x1={px(tx0)} y1={py(ty(tx0))} x2={px(tx1)} y2={py(ty(tx1))} stroke="var(--vok)" strokeWidth={3} strokeLinecap="round" />
            {step < MAXSTEP ? (
              <g>
                {nextIn ? <circle cx={px(next)} cy={py(E1(next))} r={6} fill="none" stroke="var(--vbad)" strokeWidth={2} strokeDasharray="3 2" /> : null}
                <line x1={px(w)} y1={B - 7} x2={px(Math.max(X0, Math.min(X1, next)))} y2={B - 7} stroke="var(--vb)" strokeWidth={3} />
                <polygon
                  points={(() => {
                    const x = px(Math.max(X0, Math.min(X1, next)));
                    const d = next >= w ? 1 : -1;
                    return `${x},${B - 7} ${x - 8 * d},${B - 12} ${x - 8 * d},${B - 2}`;
                  })()}
                  fill="var(--vb)"
                />
              </g>
            ) : null}
            <circle cx={px(w)} cy={py(E1(w))} r={7} fill="var(--vbad)" stroke="#fff" strokeWidth={2} />
          </g>
        ) : null}
      </svg>
      <Stats>
        <Stat label="걸음 수" value={`${step} / ${MAXSTEP}`} />
        <Stat label="위치 w" value={here ? tr(w, 3) : '곡선 밖'} tone={here ? undefined : 'bad'} />
        <Stat label="오차 E" value={here ? tr(E1(w), 3) : '—'} tone={here ? 'good' : 'bad'} />
        <Stat label="기울기 2(w − 3)" value={here ? tr(g, 3) : '—'} />
      </Stats>
      <Note>
        {here && step < MAXSTEP
          ? `다음 w = ${tr(w, 3)} − ${eps} × (${tr(g, 3)}) = ${tr(next, 3)}. 기울기가 ${g < 0 ? '음수라 오른쪽이 내리막이므로 w를 키웁니다' : '양수라 왼쪽이 내리막이므로 w를 줄입니다'}. ${NOTES[eps]}`
          : here
            ? NOTES[eps]
            : `${NOTES[eps]} 지금은 곡선 밖으로 나가 공이 보이지 않습니다.`}
      </Note>
    </Viz>
  );
}
