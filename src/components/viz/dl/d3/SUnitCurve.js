import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, styles as s} from '../../Viz';
import {trim} from './util';

const SUMS = [
  ['왼쪽 위', 1.9],
  ['오른쪽 위', 0.25],
  ['왼쪽 아래', 1.7],
  ['오른쪽 아래', 0.65],
];
const SMAX = 4;
const PRESETS = [
  ['c=0.25, b=0 (평균처럼)', 0.25, 0, 2],
  ['c=3, b=−2 (문턱처럼)', 3, -2, 2],
  ['연습 문제 2: c=0.5, b=−0.5', 0.5, -0.5, 2],
];

export default function SUnitCurve() {
  const [c, setC] = useState(0.25);
  const [b, setB] = useState(0);
  const [mine, setMine] = useState(2);

  const f = (x) => Math.tanh(c * x + b);
  const X = (x) => 50 + (x / SMAX) * 560;
  const Y = (y) => 100 - y * 80;
  const pts = Array.from({length: 81}, (_, k) => {
    const x = (k / 80) * SMAX;
    return `${X(x)},${Y(f(x))}`;
  }).join(' ');
  const thr = c > 0 ? -b / c : null;
  const thrIn = thr !== null && thr >= 0 && thr <= SMAX;

  return (
    <Viz
      title="LeNet식 서브샘플링 유닛: tanh(c·s + b)"
      caption="s는 2×2 덩어리의 합입니다. 계수 c가 작으면 거의 직선(평균처럼 흐림)이고, c를 키우고 b를 음수로 두면 문턱을 넘는지를 가르는 계단이 됩니다. 점은 본문의 네 덩어리이고, 검은 점은 직접 고른 합입니다. f는 tanh로 두었습니다."
    >
      <Controls>
        <Slider label="계수 c" min={0} max={4} step={0.05} value={c} onChange={setC} format={(v) => trim(v, 2)} />
        <Slider label="바이어스 b" min={-4} max={2} step={0.05} value={b} onChange={setB} format={(v) => trim(v, 2)} />
        <Slider label="내가 고른 합 s" min={0} max={4} step={0.05} value={mine} onChange={setMine} format={(v) => trim(v, 2)} />
      </Controls>
      <Controls>
        {PRESETS.map(([name, pc, pb, pm]) => (
          <Btn key={name} on={c === pc && b === pb} onClick={() => { setC(pc); setB(pb); setMine(pm); }}>{name}</Btn>
        ))}
      </Controls>
      <svg viewBox="0 0 640 210" className={s.svg} role="img" aria-label={`tanh(${c}s+${b}) 곡선과 네 덩어리의 출력 점`}>
        <line x1={50} y1={Y(0)} x2={610} y2={Y(0)} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={50} y1={Y(1)} x2={610} y2={Y(1)} stroke="var(--ifm-color-emphasis-200)" strokeDasharray="3 3" />
        <line x1={50} y1={Y(-1)} x2={610} y2={Y(-1)} stroke="var(--ifm-color-emphasis-200)" strokeDasharray="3 3" />
        <text x={44} y={Y(1) + 4} textAnchor="end" className={s.ts}>1</text>
        <text x={44} y={Y(0) + 4} textAnchor="end" className={s.ts}>0</text>
        <text x={44} y={Y(-1) + 4} textAnchor="end" className={s.ts}>−1</text>
        {[0, 1, 2, 3, 4].map((x) => (
          <text key={x} x={X(x)} y={198} textAnchor="middle" className={s.ts}>{x}</text>
        ))}
        <text x={330} y={209} textAnchor="middle" className={s.ts}>덩어리의 합 s</text>
        {thrIn ? (
          <g>
            <line x1={X(thr)} y1={14} x2={X(thr)} y2={186} stroke="var(--vbad)" strokeDasharray="5 3" />
            <text x={X(thr) + 4} y={26} className={s.ts} style={{fill: 'var(--vbad)'}}>문턱 s = {trim(thr, 2)}</text>
          </g>
        ) : null}
        <polyline points={pts} fill="none" stroke="var(--va)" strokeWidth={2.5} />
        {SUMS.map(([name, v], i) => (
          <g key={name}>
            <circle cx={X(v)} cy={Y(f(v))} r={5.5} fill="var(--vb)" />
            <text x={X(v)} y={Y(f(v)) + [-10, 18, 18, -10][i]} textAnchor="middle" className={s.ts}>{name}</text>
          </g>
        ))}
        <circle cx={X(mine)} cy={Y(f(mine))} r={5.5} fill="var(--ifm-font-color-base)" />
      </svg>
      <table className={s.grid}>
        <thead>
          <tr><th>덩어리</th><th>합 s</th><th>c·s + b</th><th>tanh(c·s + b)</th></tr>
        </thead>
        <tbody>
          {SUMS.map(([name, v]) => (
            <tr key={name}>
              <td>{name}</td><td>{trim(v, 2)}</td><td>{trim(c * v + b)}</td><td className={s.cellOn}>{trim(f(v))}</td>
            </tr>
          ))}
          <tr>
            <td>내가 고른 합</td><td>{trim(mine, 2)}</td><td>{trim(c * mine + b)}</td><td className={s.cellOn}>{trim(f(mine))}</td>
          </tr>
        </tbody>
      </table>
      <Note>
        {c === 0
          ? 'c = 0이면 입력과 상관없이 출력이 tanh(b)로 일정합니다.'
          : `문턱은 c·s + b = 0이 되는 s = ${trim(-b / c, 3)}입니다. 이보다 합이 크면 양수, 작으면 음수가 나옵니다.`}
        {' '}계수와 바이어스는 고정이 아니라 오차로 정해집니다. “얼마나 흐릴지”도 학습 대상입니다.
      </Note>
    </Viz>
  );
}
