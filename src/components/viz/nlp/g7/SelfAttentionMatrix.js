import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {attend, vec, trim, heat} from './util';

const TOK = [
  {t: '오늘', x: [1, 0], c: 'var(--vb)'},
  {t: '날씨', x: [0, 1], c: 'var(--va)'},
  {t: '좋다', x: [1, 1], c: 'var(--vc)'},
];
const X = TOK.map((tk) => tk.x);
const WV = [[1, 0], [0, 2]];
const I = [1, 0, 0, 1];

const PRESETS = [
  {id: 'book', t: '본문 예 (W_Q 첫 칸 2배)', q: [2, 0, 0, 1], k: I},
  {id: 'id', t: '둘 다 단위행렬', q: I, k: I},
  {id: 'swap', t: 'W_K의 두 열 바꾸기', q: [2, 0, 0, 1], k: [0, 1, 1, 0]},
  {id: 'zero', t: '둘 다 0', q: [0, 0, 0, 0], k: [0, 0, 0, 0]},
];

const mat = (w) => [[w[0], w[1]], [w[2], w[3]]];
const NAMES = ['11', '12', '21', '22'];

export default function SelfAttentionMatrix() {
  const [wq, setWq] = useState(PRESETS[0].q);
  const [wk, setWk] = useState(PRESETS[0].k);
  const [sel, setSel] = useState(2);
  const [preset, setPreset] = useState('book');

  const {Q, K, V, S, A, Y} = attend(X, X, mat(wq), mat(wk), WV);
  const setQ = (i) => (v) => {
    setWq(wq.map((o, k) => (k === i ? v : o)));
    setPreset(null);
  };
  const setK = (i) => (v) => {
    setWk(wk.map((o, k) => (k === i ? v : o)));
    setPreset(null);
  };
  const pick = (p) => {
    setWq(p.q);
    setWk(p.k);
    setPreset(p.id);
  };

  const selfShare = A.reduce((acc, row, i) => acc + row[i], 0) / 3;
  const top = A[sel].indexOf(Math.max.apply(null, A[sel]));

  return (
    <Viz
      title="3 × 3 어텐션 행렬 만져 보기"
      caption="세 토큰(오늘, 날씨, 좋다)이 같은 문장에서 질문과 열쇠와 값을 모두 만듭니다. W_Q와 W_K의 칸을 바꾸면 행렬의 비율이 달라집니다. W_V는 어텐션 페이지의 셋짜리 예처럼 둘째 칸을 2배로 고정했고, 슬라이더 값은 설명용 값입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.id} on={preset === p.id} onClick={() => pick(p)}>
            {p.t}
          </Btn>
        ))}
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title}>W_Q (질문을 만드는 행렬)</div>
          <Controls>
            {wq.map((v, i) => (
              <Slider key={i} label={`W_Q ${NAMES[i]}`} min={-2} max={3} step={0.5} value={v} onChange={setQ(i)} format={(x) => fmt(x, 1)} />
            ))}
          </Controls>
        </div>
        <div>
          <div className={s.title}>W_K (열쇠를 만드는 행렬)</div>
          <Controls>
            {wk.map((v, i) => (
              <Slider key={i} label={`W_K ${NAMES[i]}`} min={-2} max={3} step={0.5} value={v} onChange={setK(i)} format={(x) => fmt(x, 1)} />
            ))}
          </Controls>
        </div>
      </div>

      <table className={s.grid}>
        <thead>
          <tr>
            <th>토큰</th>
            <th>입력 x</th>
            <th>질문 q</th>
            <th>열쇠 k</th>
          </tr>
        </thead>
        <tbody>
          {TOK.map((tk, i) => (
            <tr key={tk.t}>
              <td style={{color: tk.c, fontWeight: 600}}>{tk.t}</td>
              <td>{vec(tk.x)}</td>
              <td>{vec(Q[i])}</td>
              <td>{vec(K[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={s.title} style={{marginTop: 14}}>
        어텐션 행렬 (행 = 질문 토큰, 열 = 열쇠 토큰). 행을 누르면 아래에 그 행의 계산이 나옵니다.
      </div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>질문 \ 열쇠</th>
            {TOK.map((tk) => (
              <th key={tk.t}>{tk.t}</th>
            ))}
            <th>비율의 합</th>
          </tr>
        </thead>
        <tbody>
          {TOK.map((tk, i) => (
            <tr key={tk.t} onClick={() => setSel(i)} style={{cursor: 'pointer'}}>
              <td style={{fontWeight: 600, color: tk.c, outline: i === sel ? '2px solid var(--vb)' : 'none'}}>
                {i === sel ? '▶ ' : ''}
                {tk.t}
              </td>
              {A[i].map((a, j) => (
                <td key={j} style={{background: heat(a), outline: i === sel ? '2px solid var(--vb)' : 'none'}}>
                  <b>{fmt(a, 3)}</b>
                  <div className={s.ts}>점수 {fmt(S[i][j], 3)}</div>
                </td>
              ))}
              <td style={{outline: i === sel ? '2px solid var(--vb)' : 'none'}}>{fmt(A[i].reduce((acc, v) => acc + v, 0), 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={s.title} style={{marginTop: 14}}>
        {TOK[sel].t}의 행: 세 열쇠에 준 비율
      </div>
      {TOK.map((tk, j) => (
        <Bar key={tk.t} label={tk.t} value={A[sel][j]} max={1} color={tk.c} text={fmt(A[sel][j], 3)} />
      ))}
      <p className={s.note}>
        출력 y = {TOK.map((tk, j) => `${fmt(A[sel][j], 3)} × ${vec(V[j])}`).join(' + ')} = <b>{vec(Y[sel])}</b>
      </p>

      <Stats>
        <Stat label="행렬의 크기" value="3 × 3 = 9칸" />
        <Stat label="모든 행의 합" value="1" tone="good" />
        <Stat label="자기 자신에게 준 비율 평균" value={fmt(selfShare, 3)} />
        <Stat label="선택한 행이 가장 많이 읽는 토큰" value={TOK[top].t} />
      </Stats>
      {preset === 'zero' ? (
        <Note>W_Q와 W_K가 0이면 모든 점수가 0이라 비율이 셋 모두 {trim(1 / 3)}입니다. 세 값 목록의 평균을 읽습니다.</Note>
      ) : null}
      {preset === 'swap' ? (
        <Note>열쇠의 두 칸을 바꾸면 같은 질문이 다른 토큰에 높은 점수를 줍니다. 비율은 입력이 아니라 W_Q와 W_K를 거친 곱으로 정해집니다.</Note>
      ) : null}
      {preset === 'book' ? (
        <Note>어텐션 페이지의 셋짜리 예와 같은 값입니다. 좋다 행은 [0.284, 0.140, 0.576], 출력은 [0.860, 1.432]입니다.</Note>
      ) : null}
    </Viz>
  );
}
