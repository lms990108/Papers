import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {attend, vec, heat} from './util';

const SRC = [
  {t: '오늘', x: [1, 0]},
  {t: '날씨', x: [0, 1]},
  {t: '좋다', x: [1, 1]},
];
const TGT = [
  {t: '목표 1', x: [1, 0.5]},
  {t: '목표 2', x: [0.5, 1]},
  {t: '목표 3', x: [1, -0.5]},
  {t: '목표 4', x: [0.5, 0.5]},
];
const WQ = [[2, 0], [0, 1]];
const WK = [[1, 0], [0, 1]];
const WV = [[1, 0], [0, 2]];

const MODES = [
  {id: 'self', t: '셀프 어텐션'},
  {id: 'cross', t: '크로스 어텐션'},
  {id: 'causal', t: '인과 셀프 어텐션'},
];

const ORIGIN = {
  self: {q: '같은 문장 X', k: '같은 문장 X', v: '같은 문장 X'},
  cross: {q: '목표 쪽 Y', k: '다른 쪽 X', v: '다른 쪽 X'},
  causal: {q: '같은 문장 X', k: '같은 문장 X (뒤 칸은 가림)', v: '같은 문장 X'},
};

export default function AttentionKinds() {
  const [mode, setMode] = useState('self');
  const [m, setM] = useState(2);

  const cross = mode === 'cross';
  const rowsTok = cross ? TGT.slice(0, m) : SRC;
  const Xq = rowsTok.map((r) => r.x);
  const {A, S, Y} = attend(Xq, SRC.map((r) => r.x), WQ, WK, WV, mode === 'causal');
  const hidden = (i, j) => mode === 'causal' && j > i;
  const kept = A.reduce((acc, row, i) => acc + row.filter((_, j) => !hidden(i, j)).length, 0);
  const total = rowsTok.length * SRC.length;
  const o = ORIGIN[mode];

  return (
    <Viz
      title="셀프, 크로스, 인과: 같은 계산에서 무엇이 달라지나"
      caption="계산은 세 경우 모두 같습니다. 달라지는 것은 질문이 어디서 오는지, 열쇠와 값이 어디서 오는지, 어느 칸을 가리는지입니다. 크로스의 목표 쪽 token 값은 설명용 값이고, 가중치는 어텐션 페이지의 셋짜리 예와 같습니다."
    >
      <Controls>
        {MODES.map((x) => (
          <Btn key={x.id} on={mode === x.id} onClick={() => setMode(x.id)}>
            {x.t}
          </Btn>
        ))}
        {cross ? <Slider label="목표 쪽 token 수 m" min={1} max={4} step={1} value={m} onChange={setM} /> : null}
      </Controls>

      <table className={s.grid}>
        <thead>
          <tr>
            <th>질문 Q는</th>
            <th>열쇠 K는</th>
            <th>값 V는</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={cross ? s.cellOn : undefined}>{o.q}에서</td>
            <td>{o.k}에서</td>
            <td>{o.v}에서</td>
          </tr>
        </tbody>
      </table>

      <div className={s.title} style={{marginTop: 14}}>
        어텐션 행렬: {rowsTok.length} × {SRC.length} (행 = 질문 쪽, 열 = 열쇠 쪽)
      </div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>질문 \ 열쇠</th>
            {SRC.map((c) => (
              <th key={c.t}>{c.t}</th>
            ))}
            <th>출력 y</th>
          </tr>
        </thead>
        <tbody>
          {rowsTok.map((r, i) => (
            <tr key={r.t}>
              <td style={{fontWeight: 600}}>
                {r.t}
                {cross ? <div className={s.ts}>{vec(r.x, 2)}</div> : null}
              </td>
              {A[i].map((a, j) =>
                hidden(i, j) ? (
                  <td key={j} style={{opacity: 0.5}}>
                    가림
                  </td>
                ) : (
                  <td key={j} style={{background: heat(a)}}>
                    <b>{fmt(a, 3)}</b>
                    <div className={s.ts}>점수 {fmt(S[i][j], 3)}</div>
                  </td>
                ),
              )}
              <td>{vec(Y[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="행렬의 모양" value={`${rowsTok.length} × ${SRC.length}`} tone={rowsTok.length === SRC.length ? undefined : 'bad'} />
        <Stat label="읽을 수 있는 칸" value={`${kept} / ${total}`} />
        <Stat label="출력 줄 수" value={String(rowsTok.length)} />
      </Stats>
      {mode === 'self' ? (
        <Note>셀프 어텐션에서는 질문, 열쇠, 값이 한 시퀀스에서 나와 행렬이 정사각형입니다. 오늘, 날씨, 좋다 행이 어텐션 페이지의 셋짜리 예와 같습니다.</Note>
      ) : null}
      {cross ? (
        <Note>
          크로스 어텐션에서는 질문이 목표 쪽 시퀀스에서 오고, 열쇠와 값은 다른 시퀀스에서 옵니다. 두 시퀀스의 길이가 다르면 행렬은 정사각형이 아닙니다. 인코더와 디코더를 둔 번역 모델에서 디코더가 인코더의 출력을 읽는 계산이 이 모양입니다.
        </Note>
      ) : null}
      {mode === 'causal' ? (
        <Note>인과 셀프 어텐션은 셀프 어텐션에서 자기보다 뒤 칸의 점수를 소프트맥스 전에 가린 것입니다. 오늘 행은 자기 하나만 남아 출력이 [1, 0]이고, 마지막 좋다 행은 가릴 칸이 없어 셀프 어텐션과 같습니다.</Note>
      ) : null}
    </Viz>
  );
}
