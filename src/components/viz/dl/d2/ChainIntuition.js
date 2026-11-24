import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, fmt, styles as s} from '../../Viz';

// 칸 3개가 이어진 가장 단순한 사슬: 칸1 --×0.8--> 칸2 --×2--> 칸3(오차)
const R1 = 0.8;
const R2 = 2;

const W = 600;
const H = 264;
const BW = 112;
const BH = 50;
const CX = {1: 96, 2: 300, 3: 504};
const TOP = 22;
const VA = 'var(--va)';
const VB = 'var(--vb)';
const BASE = 'var(--ifm-font-color-base)';

const STEPS = [
  '칸 1을 1 올려 봅니다.',
  '칸 2는 1 × 0.8 = 0.8만큼 오릅니다.',
  '칸 3(오차)은 0.8 × 2 = 1.6만큼 오릅니다. 칸 1이 오차에 미치는 영향은 1.6입니다.',
  '이제 거꾸로 해 봅니다. 오차가 오차에 미치는 영향은 1에서 시작합니다.',
  '한 칸 앞으로 오며 변화율 2를 곱합니다. 칸 2가 오차에 미치는 영향은 2입니다.',
  '다시 변화율 0.8을 곱합니다. 칸 1의 영향 1.6이 나옵니다. 앞에서 구한 값과 같습니다. 오차 쪽에서 한 번 훑으면 모든 칸의 영향이 한꺼번에 나옵니다. 이것이 역전파입니다.',
];

function Cell({x, y, title, val, on, color, cur}) {
  return (
    <g opacity={on ? 1 : 0.3}>
      <rect x={x - BW / 2} y={y} width={BW} height={BH} rx={8} fill="none" stroke={color} strokeWidth={cur ? 3.5 : 1.75} />
      <text x={x} y={y + 19} textAnchor="middle" className={s.ts} style={{fill: color}}>
        {title}
      </text>
      <text x={x} y={y + 41} textAnchor="middle" style={{fill: 'var(--ifm-font-color-base)', fontSize: 17, fontWeight: 700}}>
        {on ? val : '?'}
      </text>
    </g>
  );
}

function Arrow({x1, x2, y, color, left, label, on, cur}) {
  const tip = left ? x1 : x2;
  const tail = left ? x2 : x1;
  const d = left ? -1 : 1;
  return (
    <g opacity={on ? 1 : 0.3}>
      <line x1={tail} y1={y} x2={tip - d} y2={y} stroke={color} strokeWidth={cur ? 3 : 2} />
      <polygon points={`${tip},${y} ${tip - d * 9},${y - 5} ${tip - d * 9},${y + 5}`} fill={color} />
      <text
        x={(x1 + x2) / 2}
        y={y - 9}
        textAnchor="middle"
        style={{fill: color, fontSize: 15, fontWeight: 700}}
      >
        {label}
      </text>
    </g>
  );
}

export default function ChainIntuition() {
  const [st, setSt] = useState(3);
  const cur = st;
  const gap = (a, b) => [CX[a] + BW / 2 + 4, CX[b] - BW / 2 - 4];

  return (
    <Viz
      title="칸 3개 사슬: 앞으로 곱하면 영향이, 뒤로 곱하면 모든 칸의 영향이"
      caption="화살표의 숫자는 앞 칸이 1 오를 때 다음 칸이 오르는 양(변화율)입니다. 파란 값은 칸 1을 1 올렸을 때 각 칸이 오르는 양이고, 주황 값은 각 칸이 오차에 미치는 영향입니다."
    >
      <Controls>
        <Btn onClick={() => setSt(Math.max(0, st - 1))}>이전</Btn>
        <Btn onClick={() => setSt(Math.min(STEPS.length, st + 1))}>다음</Btn>
        <Btn onClick={() => setSt(STEPS.length)}>끝까지</Btn>
        <Btn onClick={() => setSt(0)}>처음으로</Btn>
        <span className={s.ts}>{st} / {STEPS.length}칸</span>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="칸 3개가 이어진 사슬의 앞방향 영향과 뒤방향 영향">
        {[1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={CX[i] - BW / 2} y={TOP} width={BW} height={BH} rx={8} fill="none" stroke={BASE} strokeWidth={1.75} />
            <text x={CX[i]} y={TOP + 31} textAnchor="middle" style={{fill: BASE, fontSize: 16, fontWeight: 700}}>
              {i === 3 ? '칸 3 (오차)' : `칸 ${i}`}
            </text>
          </g>
        ))}
        <Arrow x1={gap(1, 2)[0]} x2={gap(1, 2)[1]} y={TOP + BH / 2} color={BASE} on label={`× ${R1}`} />
        <Arrow x1={gap(2, 3)[0]} x2={gap(2, 3)[1]} y={TOP + BH / 2} color={BASE} on label={`× ${R2}`} />

        <text x={4} y={104} className={s.ts} style={{fill: VA}}>앞으로: 칸 1을 1 올리면 각 칸이 오르는 양</text>
        <Cell x={CX[1]} y={112} title="+" val="1" on={st >= 1} color={VA} cur={cur === 1} />
        <Cell x={CX[2]} y={112} title="+" val={fmt(R1, 1)} on={st >= 2} color={VA} cur={cur === 2} />
        <Cell x={CX[3]} y={112} title="+" val={fmt(R1 * R2, 1)} on={st >= 3} color={VA} cur={cur === 3} />
        <Arrow x1={gap(1, 2)[0]} x2={gap(1, 2)[1]} y={137} color={VA} on={st >= 2} cur={cur === 2} label={`× ${R1}`} />
        <Arrow x1={gap(2, 3)[0]} x2={gap(2, 3)[1]} y={137} color={VA} on={st >= 3} cur={cur === 3} label={`× ${R2}`} />

        <text x={4} y={192} className={s.ts} style={{fill: VB}}>← 거꾸로: 각 칸이 오차에 미치는 영향</text>
        <Cell x={CX[3]} y={200} title="영향" val="1" on={st >= 4} color={VB} cur={cur === 4} />
        <Cell x={CX[2]} y={200} title="영향" val={String(R2)} on={st >= 5} color={VB} cur={cur === 5} />
        <Cell x={CX[1]} y={200} title="영향" val={fmt(R1 * R2, 1)} on={st >= 6} color={VB} cur={cur === 6} />
        <Arrow left x1={gap(2, 3)[0]} x2={gap(2, 3)[1]} y={225} color={VB} on={st >= 5} cur={cur === 5} label={`× ${R2}`} />
        <Arrow left x1={gap(1, 2)[0]} x2={gap(1, 2)[1]} y={225} color={VB} on={st >= 6} cur={cur === 6} label={`× ${R1}`} />
      </svg>
      <Note>{st === 0 ? '칸 1, 칸 2, 칸 3이 이어져 있고 칸 3이 오차입니다. 다음 버튼을 눌러 보세요.' : STEPS[st - 1]}</Note>
    </Viz>
  );
}
