import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, styles as s} from '../../Viz';
import {sigmoid, softmax, nll, num} from './mlCore';

const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)'];

export default function AddCell() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [three, setThree] = useState(false);

  const two = softmax([a, b]);
  const all = softmax([a, b, c]);
  const sig = [a, b, c].slice(0, three ? 3 : 2).map(sigmoid);
  const sigSum = sig.reduce((x, y) => x + y, 0);
  const cur = three ? all : two;
  const Ea = nll(cur[0]);
  const Etwo = nll(two[0]);
  const d = [all[0] - two[0], all[1] - two[1]];

  return (
    <Viz
      title="칸을 하나 늘리면 비율이 어떻게 나뉘나"
      caption="점수 (1, 0)에 점수 0인 칸을 하나 더하면 큰 칸이 0.731에서 0.576으로 줄고 새 칸이 0.212를 가져갑니다. 왼쪽은 칸마다 시그모이드를 따로 넣은 값이라 합이 1이 아닙니다."
    >
      <Controls>
        <Btn on={!three} onClick={() => setThree(false)}>칸 2개</Btn>
        <Btn on={three} onClick={() => setThree(true)}>점수 0인 칸 하나 더하기 (칸 3개)</Btn>
      </Controls>
      <Controls>
        <Slider label="칸 1 점수" min={-4} max={4} step={0.1} value={a} onChange={setA} format={(v) => num(v, 1)} />
        <Slider label="칸 2 점수" min={-4} max={4} step={0.1} value={b} onChange={setB} format={(v) => num(v, 1)} />
        {three ? <Slider label="칸 3 점수" min={-4} max={4} step={0.1} value={c} onChange={setC} format={(v) => num(v, 1)} /> : null}
      </Controls>
      <div className={s.two}>
        <div>
          <b style={{fontSize: '0.85rem'}}>칸마다 따로 시그모이드</b>
          {sig.map((x, i) => (
            <Bar key={i} label={'칸 ' + (i + 1)} value={x} max={1} color={COLORS[i]} text={num(x, 3)} />
          ))}
          <p className={s.note} style={{color: Math.abs(sigSum - 1) < 1e-9 ? undefined : 'var(--vbad)'}}>
            합 = {num(sigSum, 3)}
            {Math.abs(sigSum - 1) < 1e-9 ? '' : ' (1이 아니라서 칸 중 하나를 고르는 비율이 아닙니다)'}
          </p>
        </div>
        <div>
          <b style={{fontSize: '0.85rem'}}>소프트맥스</b>
          {cur.map((x, i) => (
            <Bar key={i} label={'칸 ' + (i + 1)} value={x} max={1} color={COLORS[i]} text={num(x, 3)} />
          ))}
          <p className={s.note}>합 = {num(cur.reduce((x, y) => x + y, 0), 3)}</p>
        </div>
      </div>
      {three ? (
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>칸</th>
              <th>2칸일 때</th>
              <th>3칸일 때 (칸 3 점수 {num(c, 1)})</th>
              <th>변화</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1].map((i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{num(two[i], 3)}</td>
                <td>{num(all[i], 3)}</td>
                <td>{num(d[i], 3)}</td>
              </tr>
            ))}
            <tr>
              <td>3</td>
              <td>—</td>
              <td>{num(all[2], 3)}</td>
              <td>+{num(all[2], 3)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ) : null}
      <Stats>
        <Stat label="칸 1이 정답일 때 오차 (2칸)" value={num(Etwo, 3)} />
        <Stat label="칸 1이 정답일 때 오차 (지금)" value={num(Ea, 3)} tone={three && Ea > Etwo + 1e-9 ? 'bad' : undefined} />
        {!three ? <Stat label="시그모이드 σ(s1 - s2) (s1, s2는 칸 1, 2의 점수)" value={num(sigmoid(a - b), 3)} tone="good" /> : null}
      </Stats>
      <Note>
        {three
          ? '같은 점수여도 나눠 가질 칸이 늘면 정답 비율이 줄고 오차는 커집니다. 칸 3 점수를 낮추면 새 칸이 가져가는 몫이 줄어듭니다.'
          : '칸이 둘이면 소프트맥스의 칸 1은 σ(s1 - s2)와 같아서, 점수 (1, 0)에서 시그모이드에 1을 넣은 0.731이 나옵니다.'}
      </Note>
    </Viz>
  );
}
