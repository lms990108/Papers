import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';

const VOCAB = ['오늘', '날씨', '좋다', '나쁘다'];
const POS = [
  {name: '오늘 자리', ans: 1, scores: [0, 1, 0, 0]},
  {name: '날씨 자리', ans: 2, scores: [0, 0, 2, 0]},
];

const softmax = (sc) => {
  const e = sc.map((v) => Math.exp(v));
  const z = e.reduce((a, b) => a + b, 0);
  return {e, z, p: e.map((v) => v / z)};
};

export default function NextTokenLoss() {
  const [pos, setPos] = useState(1);
  const [scores, setScores] = useState(POS.map((p) => p.scores));

  const setScore = (i, v) => setScores(scores.map((row, r) => (r === pos ? row.map((x, j) => (j === i ? v : x)) : row)));
  const ans = POS[pos].ans;
  const sm = softmax(scores[pos]);
  const loss = -Math.log(sm.p[ans]);
  const top = sm.p.indexOf(Math.max(...sm.p));
  const losses = scores.map((row, r) => -Math.log(softmax(row).p[POS[r].ans]));
  const mean = (losses[0] + losses[1]) / 2;

  return (
    <Viz
      title="정답 칸의 비율이 오차가 됩니다"
      caption="자리를 고르고 점수를 바꿔 보세요. 정답 칸의 비율이 1에 가까우면 오차가 0에 가깝고, 낮으면 커집니다. 점수의 기본값은 본문의 가정입니다."
    >
      <Controls>
        {POS.map((p, r) => (
          <Btn key={p.name} on={r === pos} onClick={() => setPos(r)}>
            {p.name} (정답: {VOCAB[p.ans]})
          </Btn>
        ))}
        <Btn onClick={() => setScores(scores.map((row, r) => (r === pos ? POS[r].scores : row)))}>점수 되돌리기</Btn>
        {pos === 1 ? <Btn onClick={() => setScores(scores.map((row, r) => (r === 1 ? [0, 0, 0, 2] : row)))}>점수 뒤집기 (나쁘다 = 2)</Btn> : null}
      </Controls>
      <Controls>
        {VOCAB.map((w, i) => (
          <Slider key={w} label={w} min={-2} max={5} step={0.5} value={scores[pos][i]} onChange={(v) => setScore(i, v)} format={(v) => fmt(v, 1)} />
        ))}
      </Controls>
      {VOCAB.map((w, i) => (
        <Bar
          key={w}
          label={i === ans ? w + ' (정답)' : w}
          value={sm.p[i]}
          max={1}
          color={i === ans ? 'var(--vb)' : 'var(--va)'}
          text={fmt(sm.p[i], 3)}
        />
      ))}
      <table className={s.grid}>
        <thead>
          <tr>
            <th>칸</th>
            <th>점수</th>
            <th>e의 점수 제곱</th>
            <th>비율 p</th>
            <th>기울기 p − y (y: 정답 칸 1, 나머지 0)</th>
          </tr>
        </thead>
        <tbody>
          {VOCAB.map((w, i) => (
            <tr key={w}>
              <td className={i === ans ? s.cellOn : undefined}>{w}</td>
              <td>{fmt(scores[pos][i], 1)}</td>
              <td>{fmt(sm.e[i], 3)}</td>
              <td>{fmt(sm.p[i], 3)}</td>
              <td className={i === ans ? s.cellOn : undefined}>{fmt(sm.p[i] - (i === ans ? 1 : 0), 4)}</td>
            </tr>
          ))}
          <tr>
            <th>합</th>
            <th />
            <th>{fmt(sm.z, 3)}</th>
            <th>{fmt(sm.p.reduce((a, b) => a + b, 0), 3)}</th>
            <th>{fmt(sm.p.reduce((a, b) => a + b, 0) - 1, 4)}</th>
          </tr>
        </tbody>
      </table>
      <Stats>
        <Stat label={'이 자리의 오차 −log p(' + VOCAB[ans] + ')'} value={fmt(loss, 3)} tone={loss < 0.5 ? 'good' : loss > 1.5 ? 'bad' : undefined} />
        <Stat label="가장 높은 칸이 정답인가" value={top === ans ? '예' : '아니오 (' + VOCAB[top] + ')'} tone={top === ans ? 'good' : 'bad'} />
        <Stat label="두 자리의 평균 오차" value={fmt(mean, 3)} />
        <Stat label="퍼플렉서티 e^(평균 오차)" value={fmt(Math.exp(mean), 2)} />
      </Stats>
      <Note>
        기울기의 합은 늘 0입니다. 정답 칸만 음수이므로 경사하강법으로 점수를 고치면 정답 칸의 점수가 올라가고 나머지는 내려갑니다. 평균 오차와 퍼플렉서티는 두 자리의 현재 점수로 계산합니다.
      </Note>
    </Viz>
  );
}
