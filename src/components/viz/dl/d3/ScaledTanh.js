import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {trim} from './util';

const LECUN = [1.7159, 2 / 3];
const XMAX = 4;

const f = (a, A, S) => A * Math.tanh(S * a);
const f2 = (a, A, S) => {
  const t = Math.tanh(S * a);
  return -2 * A * S * S * t * (1 - t * t);
};

export default function ScaledTanh() {
  const [A, setA] = useState(LECUN[0]);
  const [S, setS] = useState(LECUN[1]);
  const [a, setAin] = useState(1);

  // |f''|의 최대 위치를 훑어서 찾는다.
  let best = 0;
  let at = 0;
  for (let k = 0; k <= 600; k++) {
    const x = (k / 600) * XMAX;
    const v = Math.abs(f2(x, A, S));
    if (v > best) {
      best = v;
      at = x;
    }
  }
  const X = (x) => 320 + (x / XMAX) * 280;
  const top = Math.max(A, 0.1) * 1.1;
  const Y1 = (y) => 80 - (y / top) * 64;
  const Y2 = (y) => 190 - (y / Math.max(best, 1e-9)) * 50;
  const xs = Array.from({length: 161}, (_, k) => -XMAX + (k / 160) * 2 * XMAX);
  const p1 = xs.map((x) => `${X(x)},${Y1(f(x, A, S))}`).join(' ');
  const p2 = xs.map((x) => `${X(x)},${Y2(Math.abs(f2(x, A, S)))}`).join(' ');
  const isLecun = Math.abs(A - LECUN[0]) < 1e-9 && Math.abs(S - LECUN[1]) < 1e-9;

  return (
    <Viz
      title="은닉 유닛의 함수 f(a) = A·tanh(S·a)"
      caption="A와 S를 바꿔 f(1)이 얼마인지 보세요. A = 1.7159, S = 2/3이면 f(1) = 1이고 f(−1) = −1입니다. 위 곡선이 f, 아래 곡선이 2차 미분의 절댓값입니다. 점은 입력 a가 가리키는 값입니다."
    >
      <Controls>
        <Btn on={isLecun} onClick={() => { setA(LECUN[0]); setS(LECUN[1]); }}>A = 1.7159, S = 2/3</Btn>
        <Btn on={A === 1 && S === 1} onClick={() => { setA(1); setS(1); }}>A = 1, S = 1 (보통의 tanh)</Btn>
      </Controls>
      <Controls>
        <Slider label="A" min={0.5} max={3} step={0.05} value={A} onChange={setA} format={(v) => trim(v, 4)} />
        <Slider label="S" min={0.2} max={2} step={0.05} value={S} onChange={setS} format={(v) => trim(v, 4)} />
        <Slider label="입력 a" min={-4} max={4} step={0.05} value={a} onChange={setAin} format={(v) => trim(v, 2)} />
      </Controls>
      <svg viewBox="0 0 640 215" className={s.svg} role="img" aria-label={`A=${trim(A, 4)}, S=${trim(S, 4)}인 f(a) 곡선과 2차 미분 절댓값 곡선`}>
        <line x1={20} y1={Y1(0)} x2={620} y2={Y1(0)} stroke="var(--ifm-color-emphasis-300)" />
        <line x1={X(0)} y1={8} x2={X(0)} y2={200} stroke="var(--ifm-color-emphasis-300)" />
        {[-1, 1].map((x) => (
          <line key={x} x1={X(x)} y1={8} x2={X(x)} y2={200} stroke="var(--ifm-color-emphasis-400)" strokeDasharray="3 3" />
        ))}
        <text x={X(1) + 3} y={14} className={s.ts}>a = 1</text>
        <text x={X(-1) - 3} y={14} textAnchor="end" className={s.ts}>a = −1</text>
        <text x={8} y={Y1(0) - 4} className={s.ts}>f(a)</text>
        <text x={8} y={Y2(0) - 4} className={s.ts}>|f″(a)|</text>
        <polyline points={p1} fill="none" stroke="var(--va)" strokeWidth={2.4} />
        <polyline points={p2} fill="none" stroke="var(--vb)" strokeWidth={2.4} />
        <circle cx={X(a)} cy={Y1(f(a, A, S))} r={5.5} fill="var(--va)" />
        <circle cx={X(a)} cy={Y2(Math.abs(f2(a, A, S)))} r={5.5} fill="var(--vb)" />
      </svg>
      <Stats>
        <Stat label={`f(${trim(a, 2)})`} value={trim(f(a, A, S), 4)} />
        <Stat label="f(1)" value={trim(f(1, A, S), 4)} tone={Math.abs(f(1, A, S) - 1) < 5e-5 ? 'good' : undefined} />
        <Stat label="f(−1)" value={trim(f(-1, A, S), 4)} />
        <Stat label="|f″|이 가장 큰 곳" value={`a = ±${trim(at, 2)}`} />
      </Stats>
      <Note>
        {isLecun
          ? '이 값에서 f(1) = 1, f(−1) = −1입니다. |f″|이 가장 큰 곳은 ±1 근처이고, 그 구간에서 유닛의 출력이 입력에 가장 민감합니다.'
          : 'f(1)이 1이 되도록 A와 S를 맞춘 것이 첫 번째 버튼의 값입니다. 다른 값에서는 ±1이 아닌 곳이 |f″|의 정점이 됩니다.'}
      </Note>
    </Viz>
  );
}
