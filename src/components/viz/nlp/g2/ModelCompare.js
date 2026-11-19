import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Note, fmt, styles as s} from '../../Viz';
import {ratios, ppl, showPpl} from './lmCore';

const S1 = ['오늘', '날씨', '좋다'];
const S2 = ['오늘', '날씨', '나쁘다'];
const S3 = ['오늘', '날씨', '오늘'];
const COLS = [
  {n: '오늘 날씨 좋다', f: (m, k) => ratios(m, S1, k)},
  {n: '오늘 날씨 나쁘다', f: (m, k) => ratios(m, S2, k)},
  {n: '오늘 날씨 오늘', f: (m, k) => ratios(m, S3, k)},
  {n: '앞의 두 문장 묶음', f: (m, k) => ratios(m, S1, k).concat(ratios(m, S2, k))},
];
const CAP = 5;

export default function ModelCompare() {
  const [ci, setCi] = useState(0);
  const [kx, setKx] = useState(0.5);
  const rows = [
    {n: '균등', m: 'uniform', k: 0},
    {n: '유니그램', m: 'unigram', k: 0},
    {n: '바이그램 k=0', m: 'bigram', k: 0},
    {n: '바이그램 k=1 (라플라스)', m: 'bigram', k: 1},
    {n: `바이그램 k=${fmt(kx, 2)}`, m: 'bigram', k: kx},
  ];
  const val = rows.map((r) => COLS.map((c) => ppl(c.f(r.m, r.k))));

  return (
    <Viz
      title="모델을 바꾸면 퍼플렉서티가 어떻게 달라지나"
      caption="네 모델과 문장별 퍼플렉서티입니다. 열 머리를 누르면 그 문장의 값이 막대로 나옵니다. 막대 길이는 5에서 잘립니다. 마지막 모델의 k는 슬라이더로 바꿉니다."
    >
      <Controls>
        <Slider label="마지막 줄의 k" min={0} max={2} step={0.05} value={kx} onChange={setKx} format={(v) => fmt(v, 2)} />
      </Controls>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>모델</th>
              {COLS.map((c, j) => (
                <th key={c.n}>
                  <Btn on={ci === j} onClick={() => setCi(j)}>
                    {c.n}
                  </Btn>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.n}>
                <td>{r.n}</td>
                {val[i].map((v, j) => (
                  <td key={j} className={j === ci ? s.cellOn : undefined}>
                    {showPpl(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={s.title} style={{marginTop: 12}}>{COLS[ci].n}</div>
      {rows.map((r, i) => (
        <Bar
          key={r.n}
          label={r.n}
          value={Math.min(val[i][ci], CAP)}
          max={CAP}
          color={val[i][ci] === Infinity ? 'var(--vbad)' : 'var(--vb)'}
          text={showPpl(val[i][ci])}
        />
      ))}
      {ci === 2 ? (
        <Note>세 번째 문장은 날씨 다음에 오늘이 오는, 학습 글에 없던 순서입니다. 스무딩이 없으면 한없이 큽니다. 유니그램은 앞 단어를 보지 않아서 3.0으로 오히려 낮게 나옵니다.</Note>
      ) : (
        <Note>학습에 쓴 문장에서는 스무딩 없는 바이그램이 가장 낮습니다. 외웠기 때문입니다.</Note>
      )}
    </Viz>
  );
}
