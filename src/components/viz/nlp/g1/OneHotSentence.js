import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';

const TOKENS = ['오늘', '날씨', '좋다', '나쁘다'];
const MAX = 6;

export default function OneHotSentence() {
  const [ids, setIds] = useState([1, 3]);
  const [sum, setSum] = useState(false);

  const rows = ids.map((id) => TOKENS.map((_, j) => (j === id ? 1 : 0)));
  const bag = TOKENS.map((_, j) => rows.reduce((a, r) => a + r[j], 0));
  const add = (i) => ids.length < MAX && setIds(ids.concat([i]));
  const reversed = ids.slice().reverse();
  const sameBag = ids.length > 1 && reversed.join() !== ids.join();

  return (
    <Viz
      title="문장은 원-핫 행의 열"
      caption="단어 버튼으로 문장을 만들어 보세요(최대 6개). 행은 단어 순서대로 쌓입니다. 열마다 더하면 순서가 사라지고 단어 주머니의 횟수 목록이 됩니다."
    >
      <Controls>
        {TOKENS.map((t, i) => (
          <Btn key={t} onClick={() => add(i)}>
            + {t}
          </Btn>
        ))}
        <Btn onClick={() => setIds(ids.slice(0, -1))}>하나 지우기</Btn>
        <Btn onClick={() => setIds([])}>모두 지우기</Btn>
        <Btn onClick={() => setIds(reversed)}>순서 뒤집기</Btn>
        <Btn on={sum} onClick={() => setSum(!sum)}>
          열마다 더하기
        </Btn>
      </Controls>
      <div className={s.title}>문장: {ids.length ? ids.map((i) => TOKENS[i]).join(' ') : '(비어 있음)'}</div>
      {ids.length ? (
        <table className={s.grid}>
          <thead>
            <tr>
              <th>자리</th>
              {TOKENS.map((t) => (
                <th key={t}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={k}>
                <td>
                  {k + 1}: {TOKENS[ids[k]]}
                </td>
                {r.map((v, j) => (
                  <td key={j} className={v ? s.cellOn : undefined}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
            {sum ? (
              <tr>
                <th>열의 합</th>
                {bag.map((v, j) => (
                  <th key={j}>{v}</th>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      ) : (
        <Note>위의 단어 버튼으로 문장을 만들어 보세요.</Note>
      )}
      {sum && ids.length ? (
        <Note>
          열의 합 [{bag.join(', ')}]은 단어 주머니의 횟수 목록입니다.
          {sameBag ? ' 순서를 뒤집어도 이 합은 같습니다. 순서를 지키려면 행을 합치지 않고 그대로 신경망에 넣습니다.' : ''}
        </Note>
      ) : null}
      {!sum && ids.length ? <Note>순서를 지키려면 행을 합치지 않고 그대로 신경망에 넣습니다.</Note> : null}
    </Viz>
  );
}
