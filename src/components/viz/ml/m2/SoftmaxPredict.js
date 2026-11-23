import React, {useState} from 'react';
import {Viz, Controls, Btn, styles as s, cx} from '../../Viz';
import {softmax, num} from './mlCore';

const list = (v) => '(' + v.map((x) => num(x, 3)).join(', ') + ')';

// before → after로 점수를 바꿨을 때 idx번째 칸의 비율을 예측합니다.
const ALL_QUESTIONS = [
  {
    ask: '점수 (2, 1, 0)에서 첫 칸의 비율은 0.665입니다. 세 점수에 모두 10을 더해 (12, 11, 10)으로 만들면 첫 칸의 비율은 어떻게 될까요?',
    before: [2, 1, 0],
    after: [12, 11, 10],
    idx: 0,
    opts: ['커진다', '그대로다', '작아진다'],
    ans: 1,
    why: '소프트맥스는 점수의 크기가 아니라 칸 사이의 차이만 봅니다. 두 칸의 비율의 비는 e^(점수 차이)인데, 모든 점수에 같은 수를 더해도 차이는 그대로입니다. 점수가 커졌다고 비율이 커지지는 않습니다.',
  },
  {
    ask: '점수 (1, 0)에서 큰 칸의 비율은 0.731입니다. 점수를 두 배로 키워 (2, 0)으로 만들면 큰 칸의 비율은 얼마쯤 될까요?',
    before: [1, 0],
    after: [2, 0],
    idx: 0,
    opts: ['약 0.75', '약 0.88', '약 1.00', '약 1.46 (두 배)'],
    ans: 1,
    why: '비율은 점수에 비례하지 않고, 점수의 지수로 정해집니다. 두 배인 1.46은 합이 1인 비율이 될 수 없습니다. 점수를 아무리 키워도 1에 가까워질 뿐 1이 되지는 않습니다.',
  },
  {
    ask: '점수 (1, 0, 0)에서 첫 칸의 비율은 0.576입니다. 첫 칸은 건드리지 않고, 둘째 칸의 점수만 0에서 1로 올리면 첫 칸의 비율은 어떻게 될까요?',
    before: [1, 0, 0],
    after: [1, 1, 0],
    idx: 0,
    opts: ['그대로다 (첫 칸의 점수가 그대로이므로)', '올라간다', '내려간다'],
    ans: 2,
    why: '비율의 합이 1이어야 해서, 한 칸이 가져가는 만큼 다른 칸이 줄어듭니다. 다른 칸의 지수가 분모에 들어가기 때문에, 칸 하나의 비율은 자기 점수만으로 정해지지 않습니다.',
  },
  {
    ask: '점수 (3, 3, 0)에서 셋째 칸은 앞의 두 칸보다 점수가 3이나 낮습니다. 셋째 칸의 비율은 얼마쯤일까요?',
    before: [3, 3, 0],
    idx: 2,
    opts: ['정확히 0', '약 0.02', '약 0.10', '약 0.33'],
    ans: 1,
    why: '지수는 어떤 점수에서도 0보다 큽니다. 점수가 낮은 칸의 비율은 매우 작아질 수는 있어도 0이 되지는 않습니다. 소프트맥스는 가장 큰 칸 하나가 모두 가져가는 함수가 아닙니다.',
  },
  {
    ask: '점수 (2, 1, 0)에서 첫 칸의 비율은 0.665입니다. 점수를 temperature T = 0.5로 나눠 (4, 2, 0)으로 만들면 첫 칸의 비율은 어떻게 될까요?',
    before: [2, 1, 0],
    after: [4, 2, 0],
    idx: 0,
    opts: ['커진다', '그대로다', '작아진다'],
    ans: 0,
    why: '0.5로 나누는 것은 2를 곱하는 것이라 점수 차이가 두 배로 벌어집니다. 차이가 벌어지면 비율이 큰 칸에 몰립니다. temperature를 낮추면 가장 높은 칸에 가깝게 답하게 됩니다.',
  },
];

// ids: 보여 줄 문제 번호 (생략하면 전부)
export default function SoftmaxPredict({ids}) {
  const QUESTIONS = ids ? ids.map((i) => ALL_QUESTIONS[i]) : ALL_QUESTIONS;
  const [q, setQ] = useState(0);
  const [picks, setPicks] = useState([]); // 문제별로 처음 고른 답
  const done = q >= QUESTIONS.length;

  if (done) {
    const hit = QUESTIONS.filter((x, i) => picks[i] === x.ans).length;
    return (
      <Viz title="퀴즈 결과">
        <p className={s.ask}>
          {QUESTIONS.length}문제 중 {hit}문제를 맞혔습니다.
          {hit === QUESTIONS.length ? ' 모두 맞혔습니다.' : ' 틀린 문제는 풀이의 이유 부분을 다시 읽고, 위의 그림에서 같은 점수로 확인해 보세요.'}
        </p>
        <Controls>
          <Btn
            onClick={() => {
              setQ(0);
              setPicks([]);
            }}
          >
            처음부터 다시
          </Btn>
        </Controls>
      </Viz>
    );
  }

  const item = QUESTIONS[q];
  const pick = picks[q];
  const answered = pick !== undefined;
  const pBefore = softmax(item.before);
  const pAfter = item.after ? softmax(item.after) : null;
  const show = (v, p) => '점수 ' + list(v) + ' → 비율 ' + list(p);

  return (
    <Viz
      title={'퀴즈 ' + (q + 1) + ' / ' + QUESTIONS.length}
      caption="답을 고르면 실제 계산 결과와 이유가 나옵니다."
    >
      <p className={s.ask}>{item.ask}</p>
      {item.opts.map((o, i) => (
        <button
          key={i}
          type="button"
          disabled={answered}
          className={cx(s.opt, answered && i === item.ans && s.optOk, answered && i === pick && i !== item.ans && s.optBad)}
          onClick={() => setPicks(Object.assign([], picks, {[q]: i}))}
        >
          {o}
        </button>
      ))}
      {answered ? (
        <div className={s.reveal}>
          <b>{pick === item.ans ? '맞았습니다.' : '아쉽습니다. 정답은 “' + item.opts[item.ans] + '”입니다.'}</b>
          <br />
          {show(item.before, pBefore)}
          {pAfter ? (
            <>
              <br />
              {show(item.after, pAfter)}
            </>
          ) : null}
          <br />
          {item.why}
        </div>
      ) : null}
      {answered ? (
        <Controls>
          <Btn on onClick={() => setQ(q + 1)}>
            {q + 1 < QUESTIONS.length ? '다음 문제' : '결과 보기'}
          </Btn>
        </Controls>
      ) : null}
    </Viz>
  );
}
