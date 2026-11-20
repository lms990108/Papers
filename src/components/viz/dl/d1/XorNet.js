import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const step = (v) => (v > 0 ? 1 : 0);
const INPUTS = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];
// 본문: h1 = step(x1 + x2 - 0.5), h2 = step(x1 + x2 - 1.5), y = step(h1 - h2 - 0.5)
const ORIG = [-0.5, -1.5, -0.5];

export default function XorNet() {
  const [bias, setBias] = useState(ORIG);
  const [curved, setCurved] = useState(true);
  const set = (k) => (v) => setBias(bias.map((c, i) => (i === k ? v : c)));
  const rows = INPUTS.map(([x1, x2]) => {
    const a1 = x1 + x2 + bias[0];
    const a2 = x1 + x2 + bias[1];
    const h1 = curved ? step(a1) : a1;
    const h2 = curved ? step(a2) : a2;
    const o = h1 - h2 + bias[2];
    const y = step(o);
    const want = x1 !== x2 ? 1 : 0;
    return {x1, x2, h1, h2, o, y, want};
  });
  const ok = rows.filter((r) => r.y === r.want).length;
  const same = bias.join() === ORIG.join();

  return (
    <Viz
      title="배타적 논리합(XOR)을 은닉 칸 둘로 가르기"
      caption="가중치는 모두 1이고, 첫 합은 x₁ + x₂에 바이어스를 더한 것입니다. 기본값은 본문의 -0.5, -1.5, -0.5입니다. 부호 함수는 양수이면 1, 아니면 0입니다."
    >
      <Controls>
        <Btn on={curved} onClick={() => setCurved(true)}>
          은닉 칸에 부호 함수
        </Btn>
        <Btn on={!curved} onClick={() => setCurved(false)}>
          은닉 칸에 함수 없음 (직선)
        </Btn>
      </Controls>
      <Controls>
        <Slider label="h₁ 바이어스" min={-3} max={1} step={0.5} value={bias[0]} onChange={set(0)} format={(v) => fmt(v, 1)} />
        <Slider label="h₂ 바이어스" min={-3} max={1} step={0.5} value={bias[1]} onChange={set(1)} format={(v) => fmt(v, 1)} />
        <Slider label="출력 바이어스" min={-3} max={1} step={0.5} value={bias[2]} onChange={set(2)} format={(v) => fmt(v, 1)} />
      </Controls>
      <Controls>
        <Btn on={same} onClick={() => setBias(ORIG)}>
          본문 값 (-0.5, -1.5, -0.5)
        </Btn>
        <Btn on={bias.join() === [-0.5, -0.5, -0.5].join()} onClick={() => setBias([-0.5, -0.5, -0.5])}>
          연습 문제 3 (h₂ 바이어스 -0.5)
        </Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>x₁</th>
              <th>x₂</th>
              <th>h₁</th>
              <th>h₂</th>
              <th>h₁ − h₂ + 출력 바이어스</th>
              <th>y</th>
              <th>목표</th>
              <th>맞음</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.x1}${r.x2}`}>
                <td>{r.x1}</td>
                <td>{r.x2}</td>
                <td>{fmt(r.h1, curved ? 0 : 1)}</td>
                <td>{fmt(r.h2, curved ? 0 : 1)}</td>
                <td>{fmt(r.o, 1)}</td>
                <td className={s.cellOn}>{r.y}</td>
                <td>{r.want}</td>
                <td>{r.y === r.want ? 'O' : 'X'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Stats>
        <Stat label="맞은 행" value={`${ok} / 4`} tone={ok === 4 ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {!curved
          ? '은닉 칸에 함수가 없으면 h₁ − h₂는 x₁과 x₂가 서로 지워져 어느 입력에서나 같은 값이 됩니다. 그래서 출력도 네 입력에서 모두 같고, 네 행 가운데 둘만 맞습니다.'
          : same
            ? 'h₁은 하나라도 1이면 켜지고(OR, 또는), h₂는 둘 다 1일 때만 켜집니다(AND, 그리고). h₁은 켜고 h₂는 끈 경우, 곧 하나만 1인 경우에만 출력이 1입니다.'
            : ok === 4
              ? '본문과 다른 바이어스로도 네 행이 모두 맞는 조합이 있습니다.'
              : '바이어스가 맞지 않으면 일부 행이 어긋납니다. 연습 문제 3처럼 h₂의 바이어스가 h₁과 같아지면 두 칸이 같은 일을 해서 h₁ − h₂가 항상 0이 됩니다. 연습 문제 3에서는 출력이 항상 0입니다.'}
      </Note>
    </Viz>
  );
}
