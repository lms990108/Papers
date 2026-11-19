import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, fmt, styles as s} from '../../Viz';
import {softmax, dot, vecMat, trim, heat} from './util';

const TOK = [
  {t: '오늘', x: [1, 0]},
  {t: '날씨', x: [0, 1]},
  {t: '좋다', x: [1, 1]},
];
const Q = TOK.map((tk) => vecMat(tk.x, [[2, 0], [0, 1]]));
const K = TOK.map((tk) => tk.x);
const V = TOK.map((tk) => vecMat(tk.x, [[1, 0], [0, 2]]));
const SC = Q.map((q) => K.map((k) => dot(q, k) / Math.sqrt(2)));

const MODES = [
  {id: 'none', t: '마스크 없음'},
  {id: 'before', t: '소프트맥스 전에 가리기'},
  {id: 'after', t: '소프트맥스 뒤에 지우기 (잘못된 방법)'},
];

export default function AttentionMask() {
  const [mode, setMode] = useState('before');

  const rows = TOK.map((tk, i) => {
    const hide = (j) => mode !== 'none' && j > i;
    let a;
    if (mode === 'before') {
      const sc = SC[i].map((v, j) => (hide(j) ? -Infinity : v));
      a = softmax(sc);
    } else {
      a = softmax(SC[i]).map((v, j) => (hide(j) ? 0 : v));
    }
    const y = [0, 1].map((c) => a.reduce((acc, p, j) => acc + p * V[j][c], 0));
    return {tk, a, y, sum: a.reduce((acc, v) => acc + v, 0), hide};
  });
  const bad = rows.some((r) => Math.abs(r.sum - 1) > 1e-9);

  return (
    <Viz
      title="뒤 칸 가리기: 마스크를 걸어 보세요"
      caption="행은 질문 토큰, 열은 열쇠 토큰입니다. 가려진 칸은 점수를 빼서 소프트맥스에 넣지 않습니다. 가중치는 본문 셋짜리 예(W_Q 첫 칸 2배, W_V 둘째 칸 2배)와 같습니다."
    >
      <Controls>
        {MODES.map((m) => (
          <Btn key={m.id} on={mode === m.id} onClick={() => setMode(m.id)}>
            {m.t}
          </Btn>
        ))}
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>질문 \ 열쇠</th>
            {TOK.map((tk) => (
              <th key={tk.t}>{tk.t}</th>
            ))}
            <th>비율의 합</th>
            <th>출력 y</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.tk.t}>
              <td style={{fontWeight: 600}}>{r.tk.t}</td>
              {r.a.map((a, j) => (
                <td key={j} style={r.hide(j) ? {opacity: 0.45} : {background: heat(a)}}>
                  {r.hide(j) ? (
                    <span>{mode === 'before' ? '가림' : '0으로 지움'}</span>
                  ) : (
                    <b>{fmt(a, 3)}</b>
                  )}
                  <div className={s.ts}>점수 {fmt(SC[i][j], 3)}</div>
                </td>
              ))}
              <td className={Math.abs(r.sum - 1) > 1e-9 ? s.bad : s.good}><b>{fmt(r.sum, 3)}</b></td>
              <td>[{r.y.map((v) => trim(v)).join(', ')}]</td>
            </tr>
          ))}
        </tbody>
      </table>
      {mode === 'none' ? (
        <Note>마스크가 없으면 오늘도 뒤의 날씨와 좋다를 읽습니다. 오늘의 출력은 [0.892, 1.108]입니다.</Note>
      ) : null}
      {mode === 'before' ? (
        <Note>오늘 자리에 남은 칸은 자기 자신뿐이라 비율이 1이고 출력은 [1, 0]입니다. 날씨는 오늘과 자기를 볼 수 있어 가리기 전과 같은 비율입니다. 마지막 토큰 좋다는 가릴 칸이 없습니다.</Note>
      ) : null}
      {mode === 'after' && bad ? (
        <Note>소프트맥스를 한 뒤에 0을 곱하면 비율의 합이 1이 아닙니다. 오늘 행은 0.446만 남습니다. 소프트맥스 전에 가려야 남은 칸이 합 1이 됩니다.</Note>
      ) : null}
    </Viz>
  );
}
