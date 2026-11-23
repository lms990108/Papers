import React, {useState} from 'react';
import {Viz, Controls, Btn, styles as s, cx} from './Viz';

// items: [{ask, opts: [문자열...], ans: 정답 번호(0부터), why: 풀이}]
// 답을 고르면 정답과 풀이가 나오고, 끝나면 맞힌 개수를 보여 줍니다.
export default function Quiz({items, title = '퀴즈'}) {
  const [q, setQ] = useState(0);
  const [picks, setPicks] = useState([]);

  if (q >= items.length) {
    const hit = items.filter((x, i) => picks[i] === x.ans).length;
    return (
      <Viz title={title + ' 결과'}>
        <p className={s.ask}>
          {items.length}문제 중 {hit}문제를 맞혔습니다.
          {hit === items.length ? '' : ' 틀린 문제는 풀이를 다시 읽어 보세요.'}
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

  const item = items[q];
  const pick = picks[q];
  const answered = pick !== undefined;

  return (
    <Viz title={title + ' ' + (q + 1) + ' / ' + items.length} caption="답을 고르면 정답과 이유가 나옵니다.">
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
          <b>{pick === item.ans ? '맞았습니다.' : '정답은 “' + item.opts[item.ans] + '”입니다.'}</b>
          <br />
          {item.why}
        </div>
      ) : null}
      {answered ? (
        <Controls>
          <Btn on onClick={() => setQ(q + 1)}>
            {q + 1 < items.length ? '다음 문제' : '결과 보기'}
          </Btn>
        </Controls>
      ) : null}
    </Viz>
  );
}
