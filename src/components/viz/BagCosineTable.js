import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, fmt, styles as s} from './Viz';

const WORDS = ['오늘', '날씨', '좋다', '나쁘다'];
const DOCS = [
  {n: 'd1', t: '날씨 좋다', v: [0, 1, 1, 0]},
  {n: 'd2', t: '날씨 나쁘다', v: [0, 1, 0, 1]},
  {n: 'd3', t: '날씨 날씨 좋다', v: [0, 2, 1, 0]},
];
const PRESETS = [
  {t: '날씨 좋다 좋다', v: [0, 1, 2, 0]},
  {t: '날씨 날씨 나쁘다', v: [0, 2, 0, 1]},
  {t: '오늘 날씨 좋다', v: [1, 1, 1, 0]},
];

const dot = (x, y) => x.reduce((acc, p, i) => acc + p * y[i], 0);
const norm = (x) => Math.sqrt(dot(x, x));

export default function BagCosineTable() {
  const [q, setQ] = useState([0, 1, 2, 0]);
  const nq = norm(q);

  const rows = DOCS.map((d) => {
    const dt = dot(q, d.v);
    const nn = nq * norm(d.v);
    return {...d, dt, nn, cos: nn > 0 ? dt / nn : NaN};
  });
  const bestDot = Math.max(...rows.map((r) => r.dt));
  const bestCos = nq > 0 ? Math.max(...rows.map((r) => r.cos)) : NaN;

  const change = (i, delta) => {
    const next = q.slice();
    next[i] = Math.max(0, Math.min(5, next[i] + delta));
    setQ(next);
  };

  const dotWinner = rows.filter((r) => r.dt === bestDot).map((r) => r.n).join(', ');
  const cosWinner = rows.filter((r) => Math.abs(r.cos - bestCos) < 1e-9).map((r) => r.n).join(', ');

  return (
    <Viz
      title="새 리뷰 q와 가장 닮은 문서 찾기"
      caption="칸마다 단어가 나온 횟수를 바꿔서 q를 만들어 보세요. 문서 d1, d2, d3은 고정입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.t} on={p.v.join() === q.join()} onClick={() => setQ(p.v)}>
            {p.t}
          </Btn>
        ))}
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>q의 칸</th>
            {WORDS.map((w, i) => (
              <th key={w}>{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>횟수</td>
            {q.map((c, i) => (
              <td key={i}>
                <Btn onClick={() => change(i, -1)}>−</Btn> <b>{c}</b> <Btn onClick={() => change(i, 1)}>+</Btn>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>문서</th>
            <th>목록</th>
            <th>내적 q·d</th>
            <th>길이의 곱</th>
            <th>코사인</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.n}>
              <td>
                {r.n} <span className={s.ts}>({r.t})</span>
              </td>
              <td>[{r.v.join(', ')}]</td>
              <td className={r.dt === bestDot ? s.cellOn : undefined}>{r.dt}</td>
              <td>{fmt(r.nn, 2)}</td>
              <td className={nq > 0 && Math.abs(r.cos - bestCos) < 1e-9 ? s.cellOn : undefined}>
                {nq > 0 ? fmt(r.cos, 3) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {nq === 0 ? (
        <Note>q가 전부 0이면 길이가 0이라 코사인을 계산할 수 없습니다.</Note>
      ) : dotWinner === cosWinner ? (
        <Note>내적이 가장 큰 문서와 코사인이 가장 큰 문서가 같습니다: {cosWinner}.</Note>
      ) : (
        <Note>
          내적은 {dotWinner}을(를), 코사인은 {cosWinner}을(를) 고릅니다. 내적은 길이가 긴 문서에 끌리고, 코사인은 비율이 닮은 문서를 고릅니다.
        </Note>
      )}
    </Viz>
  );
}
