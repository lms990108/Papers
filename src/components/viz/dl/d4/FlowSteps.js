import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const STEPS = [1, 0.5, 0.25, 0.125];
const W = 520;
const H = 120;
const L = 40;
const R = 40;
const X = (x) => L + (1 - x) * (W - L - R);

export default function FlowSteps() {
  const [h, setH] = useState(0.25);
  const [done, setDone] = useState(2);

  const v = -1;
  const N = Math.round(1 / h);
  const d = Math.min(done, N);
  const xs = [1];
  for (let i = 0; i < N; i += 1) xs.push(xs[i] + h * v);
  const cur = xs[d];

  const pickH = (nh) => {
    setH(nh);
    setDone(Math.round(1 / nh));
  };

  return (
    <Viz
      title="속도 −1로 x = 1에서 0까지 걷기 (flow matching)"
      caption="왼쪽 끝 1은 잡음, 오른쪽 끝 0은 데이터입니다. 속도는 값이 움직이는 방향과 크기이고, 음수이면 0 쪽으로 움직입니다. 보폭은 한 번에 얼마나 나아갈지의 비율이고, 한 걸음은 보폭 × 속도입니다. 보폭을 바꾸고 걸음 수를 줄여, 중간에서 멈추면 어디인지 보세요. 수가 하나인 것은 걸음을 보이게 하려는 것입니다."
    >
      <Controls>
        <span style={{fontSize: '0.85rem'}}>보폭</span>
        {STEPS.map((x) => (
          <Btn key={x} on={x === h} onClick={() => pickH(x)}>
            {x}
          </Btn>
        ))}
        <Slider label="걸음 수" min={0} max={N} value={d} onChange={setDone} />
        <Btn onClick={() => setDone(Math.min(N, d + 1))}>한 걸음 더</Btn>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={`x가 1에서 ${fmt(cur, 3)}까지 움직인 모습`}>
        <line x1={X(1)} y1={60} x2={X(0)} y2={60} stroke="var(--ifm-color-emphasis-500)" strokeWidth="2" />
        <text x={X(1)} y={100} className={s.t} textAnchor="middle">잡음 1</text>
        <text x={X(0)} y={100} className={s.t} textAnchor="middle">데이터 0</text>
        <text x={X(0.5)} y={100} className={s.ts} textAnchor="middle">0.5</text>
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={X(x)} cy={60} r={i === d ? 9 : 5} fill={i <= d ? 'var(--vb)' : 'none'} stroke="var(--vb)" strokeWidth="1.5" strokeOpacity={i <= d ? 1 : 0.5} />
            {i > 0 && i <= d ? (
              <text x={(X(xs[i - 1]) + X(x)) / 2} y={40} className={s.ts} textAnchor="middle">{fmt(h * v, 3)}</text>
            ) : null}
          </g>
        ))}
        <text x={X(cur)} y={22} className={s.t} textAnchor="middle" style={{fontWeight: 600}}>x = {fmt(cur, 3)}</text>
      </svg>
      <table className={s.grid}>
        <thead>
          <tr><th>걸음</th><th>시작</th><th>속도</th><th>도착</th></tr>
        </thead>
        <tbody>
          {xs.slice(0, N).map((x, i) => (
            <tr key={i} className={i < d ? s.cellOn : undefined} style={{opacity: i < d ? 1 : 0.45}}>
              <td>{i + 1}</td>
              <td>{fmt(x, 3)}</td>
              <td>−1</td>
              <td>{fmt(xs[i + 1], 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="현재 값" value={fmt(cur, 3)} />
        <Stat label="모두 걷는 데 걸음" value={String(N)} />
      </Stats>
      <Note>
        {d === 0
          ? '아직 출발하지 않았습니다.'
          : d === N
          ? `${N}번이면 0에 도착합니다.`
          : `${d}번에서 멈추면 ${fmt(cur, 2)}입니다. 데이터가 0, 잡음이 1인 직선 위의 중간입니다.`}
        {' '}
        위치가 어디여도 정답 속도는 −1입니다. 직선이라 위치가 바뀌어도 속도가 같습니다. 한 번에 0을 맞히는 모델은 이 중간을 만들지 않지만, 속도를 맞히면 걸음 수로 중간을 고를 수 있습니다.
      </Note>
    </Viz>
  );
}
