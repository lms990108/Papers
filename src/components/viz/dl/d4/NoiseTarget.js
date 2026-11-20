import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const W = 520;
const H = 150;
const L = 40;
const R = 40;
const X = (x) => L + (1 - x) * (W - L - R);

export default function NoiseTarget() {
  const [x, setX] = useState(0.75);
  const [sub, setSub] = useState(0.25);

  const noise = x; // 데이터가 0이므로 넣어 둔 잡음은 현재 값과 같다
  const sb = Math.min(sub, noise);
  const after = x - sb;

  return (
    <Viz
      title="네트워크가 맞히는 수: 속도(flow)와 잡음(diffusion)"
      caption="데이터가 0이고 현재 값이 x이면, 넣어 둔 잡음은 x입니다. 같은 자리에서 flow matching의 정답은 늘 −1이고 diffusion의 정답은 x입니다. 아래에서 예측한 잡음을 얼마나 뺄지 고릅니다."
    >
      <Controls>
        <Slider label="현재 값 x" min={0} max={1} step={0.05} value={x} onChange={setX} format={(v) => fmt(v, 2)} />
        <Slider label="뺄 양" min={0} max={1} step={0.05} value={sb} onChange={setSub} format={(v) => fmt(v, 2)} />
        <Btn
          onClick={() => {
            setX(0.75);
            setSub(0.25);
          }}
        >
          본문 (0.75에서 0.25)
        </Btn>
        <Btn onClick={() => setSub(noise)}>한 번에 전부</Btn>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="현재 값 x에서 뺄 양만큼 0 쪽으로 이동">
        <line x1={X(1)} y1={80} x2={X(0)} y2={80} stroke="var(--ifm-color-emphasis-500)" strokeWidth="2" />
        <text x={X(1)} y={118} className={s.t} textAnchor="middle">잡음 1</text>
        <text x={X(0)} y={118} className={s.t} textAnchor="middle">데이터 0</text>
        <line x1={X(x)} y1={80} x2={X(after)} y2={80} stroke="var(--vc)" strokeWidth="5" strokeOpacity="0.5" />
        <circle cx={X(x)} cy={80} r={7} fill="var(--vb)" />
        <circle cx={X(after)} cy={80} r={7} fill="none" stroke="var(--vc)" strokeWidth="2.5" />
        <text x={X(x)} y={58} className={s.t} textAnchor="middle" style={{fill: 'var(--vb)'}}>x = {fmt(x, 2)}</text>
        <text x={X(after)} y={104} className={s.t} textAnchor="middle" style={{fill: 'var(--vc)'}}>
          {fmt(after, 2)}
        </text>
      </svg>
      <Stats>
        <Stat label="flow matching의 정답" value="속도 −1" />
        <Stat label="diffusion의 정답" value={`잡음 ${fmt(noise, 2)}`} />
        <Stat label="뺀 뒤의 값" value={fmt(after, 2)} />
        <Stat label="한 번에 전부 뺀 값" value={fmt(x - noise, 2)} />
      </Stats>
      <Note>
        {sb === noise
          ? `예측한 잡음 ${fmt(noise, 2)}을 한 번에 빼면 ${fmt(x, 2)} − ${fmt(noise, 2)} = 0입니다.`
          : `예측한 잡음 중 일부만 빼면 중간이 남습니다. ${fmt(x, 2)}에서 ${fmt(sb, 2)}를 빼면 ${fmt(after, 2)}입니다.`}
        {x === 0.75 && sb === 0.25 ? ' flow matching의 두 번째 걸음과 같은 자리입니다.' : ''}
        {' '}
        도착점은 같이 만들 수 있고, 네트워크가 맞히라고 배운 수가 다릅니다. 한쪽은 속도 −1, 한쪽은 잡음 {fmt(noise, 2)}입니다.
      </Note>
    </Viz>
  );
}
