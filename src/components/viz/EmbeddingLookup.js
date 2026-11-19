import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, fmt, styles as s} from './Viz';

const TOKENS = [
  {t: '오늘', v: [1, 0]},
  {t: '날씨', v: [0, 1]},
  {t: '좋다', v: [1, 1]},
  {t: '나쁘다', v: [0, 0]},
];
const POS = [
  [0.1, 0],
  [0.2, 0],
  [0.3, 0],
  [0.4, 0],
];
const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)', 'var(--vok)'];

export default function EmbeddingLookup() {
  const [ids, setIds] = useState([0, 1]);
  const [pos, setPos] = useState(false);
  const [onehot, setOnehot] = useState(false);

  const add = (i) => ids.length < 4 && setIds([...ids, i]);
  const rows = ids.map((i) => TOKENS[i].v);
  const x = rows.map((r, k) => r.map((e, j) => e + POS[k][j]));
  const hot = ids.map((i) => TOKENS.map((_, j) => (i === j ? 1 : 0)));
  const prod = hot.map((h) => [0, 1].map((c) => h.reduce((acc, p, j) => acc + p * TOKENS[j].v[c], 0)));

  return (
    <Viz
      title="문장을 번호로, 번호를 표의 행으로"
      caption="단어 버튼을 눌러 문장을 만들어 보세요(최대 4개). 문장의 단어마다 표의 한 행을 읽어 오고, 그 행들이 망에 들어가는 목록입니다."
    >
      <Controls>
        {TOKENS.map((tk, i) => (
          <Btn key={tk.t} onClick={() => add(i)}>
            + {tk.t}
          </Btn>
        ))}
        <Btn onClick={() => setIds([])}>지우기</Btn>
        <Btn on={pos} onClick={() => setPos(!pos)}>위치 목록 더하기</Btn>
        <Btn on={onehot} onClick={() => setOnehot(!onehot)}>원-핫 × 표로 계산</Btn>
      </Controls>

      <div className={s.two}>
        <div>
          <div className={s.title}>임베딩 표 (4행 2열)</div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>번호</th>
                <th>토큰</th>
                <th>목록</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map((tk, i) => {
                const used = ids.includes(i);
                return (
                  <tr key={tk.t}>
                    <td>{i}</td>
                    <td className={used ? s.cellOn : undefined}>{tk.t}</td>
                    <td className={used ? s.cellOn : undefined}>{tk.v.join(', ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <div className={s.title}>
            문장: {ids.length ? ids.map((i) => TOKENS[i].t).join(' ') : '(비어 있음)'}
          </div>
          {ids.length ? (
            <table className={s.grid}>
              <thead>
                <tr>
                  <th>자리</th>
                  <th>번호</th>
                  <th>읽은 행</th>
                  {pos ? <th>+ 위치 목록</th> : null}
                  {pos ? <th>= 입력 x</th> : null}
                </tr>
              </thead>
              <tbody>
                {ids.map((id, k) => (
                  <tr key={k}>
                    <td>{k + 1}</td>
                    <td style={{color: COLORS[k]}}>{id}</td>
                    <td>{rows[k].join(', ')}</td>
                    {pos ? <td>{POS[k].join(', ')}</td> : null}
                    {pos ? <td>{x[k].map((v) => fmt(v, 1)).join(', ')}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Note>위의 단어 버튼으로 문장을 만들어 보세요.</Note>
          )}
        </div>
      </div>

      {onehot && ids.length ? (
        <div>
          <div className={s.title} style={{marginTop: 12}}>
            원-핫 목록(자리 × 4칸)에 표를 곱한 결과
          </div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>자리</th>
                <th>원-핫 목록</th>
                <th>× 표 =</th>
                <th>행 읽기와 같은가</th>
              </tr>
            </thead>
            <tbody>
              {ids.map((id, k) => (
                <tr key={k}>
                  <td>{k + 1}</td>
                  <td>[{hot[k].join(', ')}]</td>
                  <td>[{prod[k].join(', ')}]</td>
                  <td className={s.good}>같음</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Note>원-핫의 1이 있는 칸이 표에서 그 행만 골라냅니다. 그래서 구현에서는 곱하지 않고 번호로 행을 바로 읽습니다.</Note>
        </div>
      ) : null}
      {pos ? (
        <Note>
          같은 단어도 자리가 바뀌면 입력이 달라집니다. 예를 들어 오늘이 첫 자리면 [1, 0] + [0.1, 0] = [1.1, 0]이고, 둘째 자리면 [1, 0] + [0.2, 0] = [1.2, 0]입니다.
        </Note>
      ) : null}
    </Viz>
  );
}
