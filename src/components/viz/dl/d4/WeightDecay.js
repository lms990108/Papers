import React, {useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const EPS = 0.1;
const W = 460;
const H = 260;
const L = 40;
const R = 14;
const T = 14;
const B = 30;
const W0 = -0.5;
const W1 = 4.2;
const YM = 16;
const X = (w) => L + ((w - W0) / (W1 - W0)) * (W - L - R);
const Y = (e) => T + (1 - Math.min(e, YM) / YM) * (H - T - B);

export default function WeightDecay() {
  const [lam, setLam] = useState(0.5);
  const [steps, setSteps] = useState(200);

  const path = useMemo(() => {
    const ws = [0];
    for (let i = 0; i < 200; i += 1) {
      const w = ws[i];
      ws.push(w - EPS * (2 * (w - 3) + 2 * lam * w));
    }
    return ws;
  }, [lam]);
  const w = path[steps];
  const eTrain = (x) => (x - 3) * (x - 3);
  const eTot = (x) => eTrain(x) + lam * x * x;
  const star = 3 / (1 + lam);
  const grad = 2 * (w - 3) + 2 * lam * w;

  const curve = (f) => {
    const p = [];
    for (let i = 0; i <= 60; i += 1) {
      const x = W0 + ((W1 - W0) * i) / 60;
      p.push(`${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`);
    }
    return p.join(' ');
  };
  const trail = path.slice(0, Math.min(steps, 40) + 1);

  return (
    <Viz
      title="E(w) = (w − 3)² + λw² 를 경사하강법으로 줄이기 (학습률 0.1)"
      caption="파랑 점선이 학습 오차만의 곡선, 보라 곡선이 정칙화 항을 더한 곡선입니다. 점은 w = 0에서 출발한 경사하강법의 걸음입니다. 갱신은 w ← w − 0.1 × (2(w−3) + 2λw)입니다."
    >
      <Controls>
        <Slider label="λ" min={0} max={4} step={0.1} value={lam} onChange={setLam} format={(v) => fmt(v, 1)} />
        <Slider label="걸음 수" min={0} max={200} value={steps} onChange={setSteps} />
      </Controls>
      <Controls>
        {[0, 0.5, 2].map((v) => (
          <Btn key={v} on={Math.abs(lam - v) < 1e-9} onClick={() => setLam(v)}>
            λ = {v}
          </Btn>
        ))}
        <Btn
          onClick={() => {
            setLam(1);
            setSteps(1);
          }}
        >
          연습 2: λ=1, 한 걸음
        </Btn>
        <Btn onClick={() => setSteps(Math.min(200, steps + 1))}>한 걸음 더</Btn>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="학습 오차 곡선과 정칙화를 더한 곡선, 경사하강법의 걸음">
        <line x1={L} y1={Y(0)} x2={W - R} y2={Y(0)} stroke="var(--ifm-color-emphasis-500)" />
        <line x1={X(0)} y1={T} x2={X(0)} y2={Y(0)} stroke="var(--vgrid)" />
        <polyline points={curve(eTrain)} fill="none" stroke="var(--va)" strokeWidth="2" strokeDasharray="5 4" />
        <polyline points={curve(eTot)} fill="none" stroke="var(--vc)" strokeWidth="2.5" />
        <line x1={X(3)} y1={Y(0)} x2={X(3)} y2={Y(0) - 8} stroke="var(--va)" strokeWidth="2" />
        <text x={X(3)} y={H - 10} className={s.ts} textAnchor="middle" style={{fill: 'var(--va)'}}>학습 오차 최솟값 w = 3</text>
        <line x1={X(star)} y1={Y(0)} x2={X(star)} y2={Y(0) - 8} stroke="var(--vc)" strokeWidth="2" />
        <text x={X(star)} y={H - 22} className={s.ts} textAnchor="middle" style={{fill: 'var(--vc)'}}>3/(1+λ) = {fmt(star, 2)}</text>
        {trail.map((x, i) => (
          <circle key={i} cx={X(x)} cy={Y(eTot(x))} r={i === trail.length - 1 && steps <= 40 ? 6 : 3} fill="var(--vb)" fillOpacity={i === trail.length - 1 ? 1 : 0.55} />
        ))}
        {steps > 40 ? <circle cx={X(w)} cy={Y(eTot(w))} r={6} fill="var(--vb)" /> : null}
        <text x={L + 6} y={T + 12} className={s.ts} style={{fill: 'var(--vb)'}}>주황 점 = 지금의 w</text>
      </svg>
      <Stats>
        <Stat label="현재 w" value={fmt(w, 4)} />
        <Stat label="이론값 3/(1+λ)" value={fmt(star, 4)} />
        <Stat label="학습 오차 (w−3)²" value={fmt(eTrain(w), 4)} />
        <Stat label="오차 + λw²" value={fmt(eTot(w), 4)} />
        <Stat label="기울기" value={fmt(grad, 3)} />
      </Stats>
      <Note>
        {lam === 0
          ? 'λ = 0이면 학습 오차의 최솟값 3에 도착합니다.'
          : `정칙화를 켜면 도착점이 ${fmt(star, 2)} 쪽으로 당겨지고, 그 자리의 학습 오차는 ${fmt(eTrain(star), 3)}으로 올라갑니다. 학습 오차만 보면 3이 제일 낫습니다. 정칙화는 일부러 그 자리에서 벗어나게 하는 것입니다.`}
        {' '}
        걸음마다 w에 (1 − 2ελ) = {fmt(1 - 2 * EPS * lam, 2)}가 곱해지며 줄어듭니다.
      </Note>
    </Viz>
  );
}
