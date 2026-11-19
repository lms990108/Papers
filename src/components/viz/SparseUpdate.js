import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from './Viz';

const TOKENS = ['오늘', '날씨', '좋다', '나쁘다'];

export default function SparseUpdate() {
  const [ids, setIds] = useState([0, 1]);
  const [shared, setShared] = useState(false);

  const inputGrad = TOKENS.map(() => [0, 0]);
  const g = [
    [0.5, -0.5],
    [0, 0],
    [0.3, 0.1],
    [0, 0.2],
  ];
  ids.forEach((id, k) => {
    inputGrad[id] = [inputGrad[id][0] + g[k][0], inputGrad[id][1] + g[k][1]];
  });
  const outGrad = TOKENS.map(() => [0.1, -0.1]);
  const total = TOKENS.map((_, i) =>
    shared ? [inputGrad[i][0] + outGrad[i][0], inputGrad[i][1] + outGrad[i][1]] : inputGrad[i],
  );
  const touched = shared ? TOKENS.length : new Set(ids).size;

  const toggle = (i) =>
    setIds(ids.includes(i) ? ids.filter((x) => x !== i) : ids.length < 3 ? [...ids, i] : ids);

  return (
    <Viz
      title="학습 한 번에 표의 어느 행이 바뀌나"
      caption="이번 문장에 쓴 단어를 고르면, 그 행만 기울기(고칠 방향)를 받습니다. 입력과 점수 계산이 같은 표를 쓰면 모든 행이 기울기를 받습니다."
    >
      <Controls>
        {TOKENS.map((t, i) => (
          <Btn key={t} on={ids.includes(i)} onClick={() => toggle(i)}>
            {t}
          </Btn>
        ))}
        <Btn on={shared} onClick={() => setShared(!shared)}>입출력 표 공유</Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>토큰</th>
            <th>이번 문장에서 읽음</th>
            <th>표가 받는 기울기</th>
          </tr>
        </thead>
        <tbody>
          {TOKENS.map((t, i) => {
            const row = total[i];
            const on = shared || ids.includes(i);
            return (
              <tr key={t}>
                <td>{t}</td>
                <td>{ids.includes(i) ? '읽음' : '—'}</td>
                <td className={on ? s.cellOn : undefined}>
                  [{row.map((v) => Math.round(v * 100) / 100).join(', ')}]
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Note>
        기울기가 계산되는 행은 4개 중 <b>{touched}개</b>입니다(값이 0일 수도 있습니다).{' '}
        {shared
          ? '점수를 낼 때도 같은 표를 쓰므로, 읽지 않은 행도 사전 전체가 기울기를 받습니다.'
          : '사전이 수만이어도 이번 문장이 건드리는 행은 문장의 토큰 수만큼입니다.'}
      </Note>
    </Viz>
  );
}
