import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

// 특성 (x1, x2), 별점(회귀 레이블), 긍정 1 / 부정 0 (분류 레이블)
const DATA = [
  {t: '연기가 좋다', x: [1, 0], star: 4, c: 1},
  {t: '결말이 나쁘다', x: [0, 1], star: 2, c: 0},
  {t: '연기가 좋다, 좋다', x: [2, 0], star: 4, c: 1},
];
const sigmoid = (v) => 1 / (1 + Math.exp(-v));
// 안정된 로그 오차: 정답이 긍정이면 -log p = log(1+e^-s), 부정이면 -log(1-p) = log(1+e^s)
const logErr = (sc, c) => Math.log(1 + Math.exp(c === 1 ? -sc : sc));

export default function ErrorCompare() {
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(-1);
  const [b, setB] = useState(3);

  const rows = DATA.map((r) => {
    const sc = w1 * r.x[0] + w2 * r.x[1];
    const y = sc + b;
    return {...r, sc, y, d: y - r.star, sq: (y - r.star) ** 2, p: sigmoid(sc), le: logErr(sc, r.c)};
  });
  const meanSq = rows.reduce((a, r) => a + r.sq, 0) / rows.length;
  const meanLog = rows.reduce((a, r) => a + r.le, 0) / rows.length;
  const third = rows[2];

  return (
    <Viz
      title="같은 가중치, 같은 입력, 두 가지 오차"
      caption="회귀는 점수에 바이어스 b를 더해 별점을 내고, 분류는 점수를 시그모이드에 넣어 비율을 냅니다. 기본값은 w1 = 1, w2 = -1, b = 3입니다."
    >
      <Controls>
        <Slider label="w1" min={-3} max={3} step={1} value={w1} onChange={setW1} />
        <Slider label="w2" min={-3} max={3} step={1} value={w2} onChange={setW2} />
        <Slider label="b (회귀만)" min={0} max={6} step={1} value={b} onChange={setB} />
        <Btn onClick={() => {setW1(1); setW2(-1); setB(3);}}>기본값</Btn>
        <Btn onClick={() => setB(4)}>b = 4</Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
      <table className={s.grid}>
        <thead>
          <tr>
            <th rowSpan={2}>리뷰</th>
            <th colSpan={4}>회귀 (y = w1x1 + w2x2 + b)</th>
            <th colSpan={4}>분류 (s = w1x1 + w2x2)</th>
          </tr>
          <tr>
            <th>예측 y</th><th>별점</th><th>차이</th><th>제곱 오차</th>
            <th>점수 s</th><th>비율 p</th><th>정답</th><th>로그 오차</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.t}>
              <td>{r.t}</td>
              <td>{r.y}</td>
              <td>{r.star}</td>
              <td>{r.d}</td>
              <td className={r.sq > 0 ? s.cellOn : undefined}>{r.sq}</td>
              <td>{r.sc}</td>
              <td>{fmt(r.p, 3)}</td>
              <td>{r.c === 1 ? '긍정' : '부정'}</td>
              <td className={r.le > 0.2 ? s.cellOn : undefined}>{fmt(r.le, 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Stats>
        <Stat label="회귀 평균 오차" value={fmt(meanSq, 3)} tone={meanSq === 0 ? 'good' : undefined} />
        <Stat label="분류 평균 오차" value={fmt(meanLog, 3)} />
        <Stat label="셋째 리뷰의 두 오차" value={third.sq + ' / ' + fmt(third.le, 3)} />
      </Stats>
      <Note>
        두 평균은 단위가 달라서 서로 비교하지 않습니다. 한 문제 안에서 가중치를 바꾸기 전후로 비교하는 값입니다.
        {w1 === 1 && w2 === -1 && b === 3
          ? ' 기본값에서는 셋째 리뷰가 회귀에서 1만큼 틀리고, 분류에서는 오차 0.127로 가장 잘 맞습니다.'
          : ''}
      </Note>
    </Viz>
  );
}
