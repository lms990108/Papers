import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, styles as s} from '../../Viz';
import {sigmoid, nll, num} from './mlCore';

const REV = [
  {name: '연기가 좋다', x: [1, 0], t: 1},
  {name: '결말이 나쁘다', x: [0, 1], t: 0},
  {name: '연기가 좋다, 좋다', x: [2, 0], t: 1},
];

export default function SigmoidReview() {
  const [i, setI] = useState(0);
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(-1);
  const [b, setB] = useState(0);
  const [t, setT] = useState(1);

  const r = REV[i];
  const score = w1 * r.x[0] + w2 * r.x[1] + b;
  const e = Math.exp(-score);
  const den = 1 + e;
  const p = sigmoid(score);
  const read = Math.abs(p - 0.5) < 1e-12 ? '경계 (0.5)' : p > 0.5 ? '긍정 (1)' : '부정 (0)';
  const E1 = nll(p);
  const E0 = nll(1 - p);
  const E = t === 1 ? E1 : E0;
  const right = (p > 0.5 ? 1 : 0) === t;
  const pick = (k) => {
    setI(k);
    setT(REV[k].t);
  };

  return (
    <Viz
      title="점수가 시그모이드를 지나 비율이 되는 세 단계"
      caption="리뷰를 고르면 점수 s = w1·x1 + w2·x2 + b를 계산하고, 세 단계로 비율 p를 만듭니다. 처음 값 (w1, w2, b) = (1, -1, 0)에서 연기가 좋다는 0.731, 결말이 나쁘다는 0.269입니다. 좋다, 좋다의 정답 긍정은 설명용 값입니다."
    >
      <Controls>
        {REV.map((q, k) => (
          <Btn key={q.name} on={i === k} onClick={() => pick(k)}>
            {q.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="w1 (좋다)" min={-3} max={3} step={0.1} value={w1} onChange={setW1} format={(v) => num(v, 1)} />
        <Slider label="w2 (나쁘다)" min={-3} max={3} step={0.1} value={w2} onChange={setW2} format={(v) => num(v, 1)} />
        <Slider label="b" min={-3} max={3} step={0.1} value={b} onChange={setB} format={(v) => num(v, 1)} />
      </Controls>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>0. 점수 s</th>
              <th>1. e^(-s)</th>
              <th>2. 1 + e^(-s)</th>
              <th>3. p = 1 ÷ (1 + e^(-s))</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{num(w1, 1)} × {r.x[0]} + ({num(w2, 1)}) × {r.x[1]} + {num(b, 1)} = <b>{num(score, 3)}</b></td>
              <td>{num(e, 3)}</td>
              <td>{num(den, 3)}</td>
              <td className={s.cellOn}><b>{num(p, 3)}</b></td>
            </tr>
          </tbody>
        </table>
      </div>
      <Bar label="비율 p" value={p} max={1} color="var(--va)" text={num(p, 3)} />
      <Bar label="1 - p" value={1 - p} max={1} color="var(--vb)" text={num(1 - p, 3)} />
      <Controls>
        <span style={{fontSize: '0.85rem'}}>정답을 고르면 오차가 정해집니다.</span>
        <Btn on={t === 1} onClick={() => setT(1)}>정답 긍정 (t = 1)</Btn>
        <Btn on={t === 0} onClick={() => setT(0)}>정답 부정 (t = 0)</Btn>
      </Controls>
      <Stats>
        <Stat label="읽기 규칙 (0.5 기준)" value={read} />
        <Stat label="오차 -log p (정답 긍정)" value={num(E1, 3)} />
        <Stat label="오차 -log(1-p) (정답 부정)" value={num(E0, 3)} />
        <Stat label="선택한 정답의 오차" value={num(E, 3)} tone={right ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {Math.abs(score) < 1e-9
          ? '점수가 0이면 e^0 = 1이라 분모가 2이고, 비율은 정확히 0.5입니다.'
          : right
            ? '읽은 칸이 정답과 같습니다. 같은 비율이어도 정답이 반대쪽이면 오차가 훨씬 큽니다. 정답을 바꿔 눌러 보세요.'
            : '읽은 칸이 정답과 반대입니다. 확신이 클수록 오차가 크게 남습니다.'}
      </Note>
    </Viz>
  );
}
