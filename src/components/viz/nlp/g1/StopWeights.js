import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const VOCAB = ['날씨', '는', '좋다', '나쁘다'];
const DOCS = [
  {k: 'A', t: '날씨 는 좋다'},
  {k: 'B', t: '날씨 는 나쁘다'},
  {k: 'C', t: '날씨 좋다'},
  {k: 'D', t: '날씨 는 나쁘다 날씨'},
];

export default function StopWeights() {
  const [w, setW] = useState(5);
  const [rm, setRm] = useState(false);

  const weights = [0.2, w, -1, 1];
  const rows = DOCS.map((d) => {
    const toks = d.t.split(' ').filter((x) => !(rm && x === '는'));
    const x = VOCAB.map((v) => toks.filter((t) => t === v).length);
    const score = x.reduce((a, c, i) => a + c * weights[i], 0);
    return {...d, x, score};
  });
  const [A, B, C] = rows;

  return (
    <Viz
      title="는의 가중치를 바꿔도 점수 차이는 그대로"
      caption="칸 순서는 날씨, 는, 좋다, 나쁘다이고 나머지 가중치는 0.2, -1, 1로 고정입니다. 는의 가중치를 움직이면 A와 B의 점수는 같이 움직이고, 는이 없는 C만 따로 남습니다."
    >
      <Controls>
        <Slider label="는의 가중치" min={0} max={8} step={0.5} value={w} onChange={setW} format={(v) => fmt(v, 1)} />
        <Btn on={rm} onClick={() => setRm(!rm)}>
          불용어 는 지우기
        </Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>문장</th>
            {VOCAB.map((v, i) => (
              <th key={v}>
                {v}
                <div className={s.ts}>가중치 {fmt(weights[i], 1)}</div>
              </th>
            ))}
            <th>점수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k}>
              <td>
                {r.k}. {r.t}
              </td>
              {r.x.map((c, i) => (
                <td key={i} className={i === 1 && c > 0 ? s.cellOn : undefined}>
                  {c}
                </td>
              ))}
              <td>
                <b>{fmt(r.score, 1)}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="A와 B의 점수 차이" value={fmt(B.score - A.score, 1)} />
        <Stat label="같은 뜻 A와 C의 점수 차이" value={fmt(A.score - C.score, 1)} tone={Math.abs(A.score - C.score) > 1e-9 ? 'bad' : 'good'} />
        <Stat label="학습할 가중치 수" value={rm ? 3 : 4} />
      </Stats>
      <Note>
        {rm
          ? '는을 입력에서 지웠습니다. 는의 가중치를 움직여도 점수가 변하지 않고, A와 C는 같은 점수입니다. 는 칸의 파라미터도 하나 줄었습니다.'
          : 'A와 B는 는을 같이 가지고 있어서, 는의 가중치가 얼마든 두 점수의 차이는 2입니다. 하지만 는이 없는 C는 A와 같은 뜻인데, 는의 가중치만큼 점수가 벌어집니다.'}
      </Note>
    </Viz>
  );
}
