import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const CELL = 12;
const GAP = 40;

function Grid({n, x0, color, label}) {
  const cells = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      cells.push(<rect key={`${i}-${j}`} x={x0 + j * CELL} y={26 + i * CELL} width={CELL - 1} height={CELL - 1} fill={color} fillOpacity="0.7" />);
    }
  }
  return (
    <g>
      {cells}
      <text x={x0} y={16} className={s.t} style={{fill: color}}>
        {label}
      </text>
    </g>
  );
}

export default function AttentionCost() {
  const [n, setN] = useState(6);
  const W = 30 + 12 * CELL + GAP + 24 * CELL;
  const H = 40 + 24 * CELL;

  return (
    <Viz
      title="문장이 길어지면 점수 표는 얼마나 커지나"
      caption="점수 표는 토큰 수 n에 대해 n × n칸입니다. 문장 길이를 두 배로 하면 칸 수가 몇 배가 되는지 보세요. 순환 신경망은 자리 수에 비례해 늘어납니다."
    >
      <Controls>
        <Slider label="토큰 수 n" min={1} max={12} step={1} value={n} onChange={setN} />
        <Btn onClick={() => setN(4)}>n = 4</Btn>
        <Btn onClick={() => setN(8)}>n = 8</Btn>
        <Btn onClick={() => setN(12)}>n = 12</Btn>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={`토큰 ${n}개의 점수 표 ${n}×${n}칸과 토큰 ${2 * n}개의 점수 표 ${2 * n}×${2 * n}칸을 나란히 비교한 그림`}>
        <Grid n={n} x0={10} color="var(--va)" label={`n = ${n}`} />
        <Grid n={2 * n} x0={10 + n * CELL + GAP} color="var(--vb)" label={`길이 두 배: 2n = ${2 * n}`} />
      </svg>
      <Stats>
        <Stat label={`n = ${n}의 점수 칸`} value={n * n} />
        <Stat label={`2n = ${2 * n}의 점수 칸`} value={4 * n * n} tone="bad" />
        <Stat label="칸 수의 비" value="4배" />
        <Stat label="토큰 수의 비" value="2배" />
      </Stats>
      <Note>순환 신경망은 한 칸씩 밟아 자리 수에 비례해 늘지만 병렬화가 어렵습니다. 어텐션은 병렬화가 쉬운 대신 제곱 비용을 냅니다.</Note>
    </Viz>
  );
}
