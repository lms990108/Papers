import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, Stats, Stat, fmt, styles as s} from '../../Viz';

const TOKENS = ['오늘', '날씨', '좋다', '나쁘다'];
const W = [0, 0.2, -1, 1];
const TABLE = [[1, 0], [0, 1], [1, 1], [0, 0]];

export default function OneHotLookup() {
  const [k, setK] = useState(2);
  const [mode, setMode] = useState('w');

  const x = TOKENS.map((_, i) => (i === k ? 1 : 0));
  const prodW = x.map((xi, i) => xi * W[i]);
  const sumW = prodW.reduce((a, v) => a + v, 0);
  const row = [0, 1].map((c) => x.reduce((a, xi, i) => a + xi * TABLE[i][c], 0));

  return (
    <Viz
      title="원-핫에 곱하면 한 칸, 한 행만 남는다"
      caption="토큰을 고르고 무엇에 곱할지 바꿔 보세요. 곱한 항이 전부 0이고 1이 있는 칸의 것만 남습니다. 표의 값은 원문의 예입니다."
    >
      <Controls>
        {TOKENS.map((t, i) => (
          <Btn key={t} on={i === k} onClick={() => setK(i)}>
            {t}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={mode === 'w'} onClick={() => setMode('w')}>
          가중치 목록에 곱하기
        </Btn>
        <Btn on={mode === 't'} onClick={() => setMode('t')}>
          임베딩 표에 곱하기
        </Btn>
      </Controls>
      {mode === 'w' ? (
        <div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>토큰</th>
                <th>원-핫 칸</th>
                <th>가중치</th>
                <th>곱</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map((t, i) => (
                <tr key={t}>
                  <td className={i === k ? s.cellOn : undefined}>{t}</td>
                  <td className={i === k ? s.cellOn : undefined}>{x[i]}</td>
                  <td>{fmt(W[i], 1)}</td>
                  <td className={i === k ? s.cellOn : undefined}>{fmt(prodW[i], 1)}</td>
                </tr>
              ))}
              <tr>
                <th colSpan={3}>합</th>
                <th>{fmt(sumW, 1)}</th>
              </tr>
            </tbody>
          </table>
          <Note>
            {TOKENS[k]}의 원-핫과 가중치 [0, 0.2, -1, 1]의 곱은 {fmt(sumW, 1)}입니다. 1이 있는 칸의 가중치만 나오고, 날씨의 0.2 같은 다른 칸은 곱에 들어가지 않습니다.
          </Note>
        </div>
      ) : (
        <div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>토큰</th>
                <th>원-핫 칸</th>
                <th>표의 행</th>
                <th>칸 × 행</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map((t, i) => (
                <tr key={t}>
                  <td className={i === k ? s.cellOn : undefined}>{t}</td>
                  <td className={i === k ? s.cellOn : undefined}>{x[i]}</td>
                  <td>[{TABLE[i].join(', ')}]</td>
                  <td className={i === k ? s.cellOn : undefined}>[{TABLE[i].map((v) => v * x[i]).join(', ')}]</td>
                </tr>
              ))}
              <tr>
                <th colSpan={3}>열마다 더한 결과</th>
                <th>[{row.join(', ')}]</th>
              </tr>
            </tbody>
          </table>
          <Note>
            결과 [{row.join(', ')}]은 표에서 {TOKENS[k]} 행을 그대로 꺼낸 것입니다. 임베딩 층은 이 곱을 하지 않고 번호 {k}로 행을 바로 읽습니다.
          </Note>
        </div>
      )}
      <Stats>
        <Stat label="원-핫 길이" value={TOKENS.length} />
        <Stat label="남는 항" value="1개" tone="good" />
      </Stats>
    </Viz>
  );
}
