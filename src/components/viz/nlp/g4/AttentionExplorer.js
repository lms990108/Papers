import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Note, fmt, styles as s} from '../../Viz';
import {softmax, dot, vecMat, trim, heat} from './util';

const ALL = [
  {t: '오늘', x: [1, 0]},
  {t: '날씨', x: [0, 1]},
  {t: '좋다', x: [1, 1]},
];
const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)'];
const D = 2;
const vec = (v) => `[${v.map((x) => trim(x)).join(', ')}]`;

export default function AttentionExplorer() {
  const [n, setN] = useState(2);
  const [qs, setQs] = useState(1);
  const [vs, setVs] = useState(1);
  const [qi, setQi] = useState(0);
  const [rev, setRev] = useState(false);

  const pick = (m) => {
    setN(m);
    setQs(m === 3 ? 2 : 1);
    setVs(m === 3 ? 2 : 1);
    setQi(m === 3 ? 2 : 0);
  };

  let idx = ALL.slice(0, n).map((_, k) => k);
  if (rev) idx = idx.reverse();
  const toks = idx.map((k) => ({...ALL[k], c: COLORS[k]}));
  const WQ = [[qs, 0], [0, 1]];
  const WK = [[1, 0], [0, 1]];
  const WV = [[1, 0], [0, vs]];
  const Q = toks.map((tk) => vecMat(tk.x, WQ));
  const K = toks.map((tk) => vecMat(tk.x, WK));
  const V = toks.map((tk) => vecMat(tk.x, WV));
  const S = Q.map((q) => K.map((k) => dot(q, k) / Math.sqrt(D)));
  const A = S.map((row) => softmax(row));
  const Y = A.map((row) => [0, 1].map((c) => row.reduce((acc, a, j) => acc + a * V[j][c], 0)));

  let r = toks.map((tk) => tk.t).indexOf(ALL[Math.min(qi, n - 1)].t);
  if (r < 0) r = 0;

  return (
    <Viz
      title="질문 토큰을 골라 어텐션 따라가기"
      caption="표의 행을 눌러 질문이 될 토큰을 고르세요. 점수, 소프트맥스 비율, 값의 가중합이 아래에 그대로 계산됩니다. 가중치는 설명용 값이고, 기본값이 본문의 예와 같은 숫자를 냅니다."
    >
      <Controls>
        <Btn on={n === 2} onClick={() => pick(2)}>토큰 둘 (가중치 = 단위행렬)</Btn>
        <Btn on={n === 3} onClick={() => pick(3)}>토큰 셋 (학습 가능한 투영)</Btn>
        <Btn on={rev} onClick={() => setRev(!rev)}>토큰 순서 바꾸기</Btn>
      </Controls>
      <Controls>
        <Slider label="W_Q의 첫 칸 배율" min={0.5} max={3} step={0.5} value={qs} onChange={setQs} format={(v) => fmt(v, 1)} />
        <Slider label="W_V의 둘째 칸 배율" min={0.5} max={3} step={0.5} value={vs} onChange={setVs} format={(v) => fmt(v, 1)} />
      </Controls>

      <table className={s.grid}>
        <thead>
          <tr>
            <th>토큰</th>
            <th>입력 x</th>
            <th>질문 q</th>
            <th>열쇠 k</th>
            <th>값 v</th>
          </tr>
        </thead>
        <tbody>
          {toks.map((tk, j) => (
            <tr key={tk.t}>
              <td style={{color: tk.c, fontWeight: 600}}>{tk.t}</td>
              <td>{vec(tk.x)}</td>
              <td>{vec(Q[j])}</td>
              <td>{vec(K[j])}</td>
              <td>{vec(V[j])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={s.title} style={{marginTop: 14}}>어텐션 비율 표 (행 = 질문, 열 = 열쇠)</div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>질문 \ 열쇠</th>
            {toks.map((tk) => (
              <th key={tk.t}>{tk.t}</th>
            ))}
            <th>출력 y</th>
          </tr>
        </thead>
        <tbody>
          {toks.map((tk, i) => (
            <tr key={tk.t} onClick={() => setQi(ALL.map((a) => a.t).indexOf(tk.t))} style={{cursor: 'pointer'}}>
              <td style={{fontWeight: 600, color: tk.c, outline: i === r ? '2px solid var(--vb)' : 'none'}}>
                {i === r ? '▶ ' : ''}{tk.t}
              </td>
              {A[i].map((a, j) => (
                <td key={j} style={{background: heat(a), outline: i === r ? '2px solid var(--vb)' : 'none'}}>
                  <b>{fmt(a, 3)}</b>
                  <div className={s.ts}>점수 {fmt(S[i][j], 3)}</div>
                </td>
              ))}
              <td style={{outline: i === r ? '2px solid var(--vb)' : 'none'}}>{vec(Y[i].map((v) => Number(v.toFixed(3))))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={s.title} style={{marginTop: 14}}>
        선택한 질문: {toks[r].t} {vec(Q[r])}
      </div>
      <p className={s.note}>
        ① 점수 = 질문과 열쇠의 곱 ÷ √2 ({fmt(Math.sqrt(D), 3)}): {toks.map((tk, j) => `${tk.t} ${trim(dot(Q[r], K[j]))}/${fmt(Math.sqrt(D), 3)} = ${fmt(S[r][j], 3)}`).join(', ')}
      </p>
      <p className={s.note}>② 소프트맥스 비율:</p>
      {toks.map((tk, j) => (
        <Bar key={tk.t} label={tk.t} value={A[r][j]} max={1} color={tk.c} text={fmt(A[r][j], 3)} />
      ))}
      <p className={s.note}>
        ③ 값의 가중합: y = {toks.map((tk, j) => `${fmt(A[r][j], 3)} × ${vec(V[j])}`).join(' + ')} = <b>{vec(Y[r].map((v) => Number(v.toFixed(3))))}</b>
      </p>
      {rev ? (
        <Note>토큰 순서를 바꿔도 각 토큰의 출력 값은 그대로이고, 출력이 놓인 줄의 순서만 따라 바뀝니다. 어텐션은 순서를 모릅니다.</Note>
      ) : null}
    </Viz>
  );
}
