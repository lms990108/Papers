import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const BASE = ['오늘', '날씨', '좋다', '나쁘다'];
const MOVIE = '영화';

export default function OneHotDistance() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [five, setFive] = useState(false);
  const [byNum, setByNum] = useState(false);

  const toks = five ? BASE.concat([MOVIE]) : BASE;
  const n = toks.length;
  const ia = Math.min(a, n - 1);
  const ib = Math.min(b, n - 1);
  const oh = (k) => toks.map((_, i) => (i === k ? 1 : 0));
  const va = oh(ia);
  const vb = oh(ib);
  const diff = va.map((x, i) => x - vb[i]);
  const dot = va.reduce((acc, x, i) => acc + x * vb[i], 0);
  const dist = Math.sqrt(diff.reduce((acc, x) => acc + x * x, 0));
  const same = ia === ib;
  const cell = (i, j) => (byNum ? Math.abs(i - j) : i === j ? 0 : Math.SQRT2);

  return (
    <Viz
      title="서로 다른 두 토큰은 항상 같은 거리"
      caption="두 토큰을 고르고, 사전에 영화를 더해 보세요. 원-핫으로 재면 어느 쌍이든 거리가 √2입니다. 번호의 차이로 재면 쌍마다 다릅니다."
    >
      <Controls>
        <span className={s.ts}>첫째:</span>
        {toks.map((t, i) => (
          <Btn key={t} on={i === ia} onClick={() => setA(i)}>
            {t}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <span className={s.ts}>둘째:</span>
        {toks.map((t, i) => (
          <Btn key={t} on={i === ib} onClick={() => setB(i)}>
            {t}
          </Btn>
        ))}
        <Btn on={five} onClick={() => setFive(!five)}>
          사전에 영화 더하기 (칸 {five ? 5 : 4}개)
        </Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th />
            {toks.map((t) => (
              <th key={t}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{toks[ia]}</td>
            {va.map((x, i) => (
              <td key={i} className={x ? s.cellOn : undefined}>
                {x}
              </td>
            ))}
          </tr>
          <tr>
            <td>{toks[ib]}</td>
            {vb.map((x, i) => (
              <td key={i} className={x ? s.cellOn : undefined}>
                {x}
              </td>
            ))}
          </tr>
          <tr>
            <td>차이</td>
            {diff.map((x, i) => (
              <td key={i}>{x}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <Stats>
        <Stat label="두 목록의 곱" value={dot} tone={same ? undefined : 'good'} />
        <Stat label="차이의 제곱의 합" value={diff.reduce((acc, x) => acc + x * x, 0)} />
        <Stat label="거리" value={same ? '0' : `√2 = ${fmt(dist, 3)}`} />
        <Stat label="코사인 유사도" value={same ? '1' : '0'} />
        <Stat label="번호의 차이" value={Math.abs(ia - ib)} />
      </Stats>
      <Note>
        {same
          ? '같은 토큰끼리는 곱이 1이고 거리가 0입니다.'
          : '다른 토큰이면 곱은 늘 0이고 차이에는 1과 -1만 남습니다. 제곱의 합이 1 + 1 = 2라서, 사전이 얼마나 크든 거리는 √2입니다.'}
      </Note>
      <Controls>
        <Btn on={!byNum} onClick={() => setByNum(false)}>
          원-핫으로 잰 거리
        </Btn>
        <Btn on={byNum} onClick={() => setByNum(true)}>
          번호의 차이로 잰 거리
        </Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th />
            {toks.map((t) => (
              <th key={t}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {toks.map((t, i) => (
            <tr key={t}>
              <th>{t}</th>
              {toks.map((u, j) => (
                <td key={u} className={i === ia && j === ib ? s.cellOn : undefined}>
                  {byNum ? cell(i, j) : i === j ? '0' : fmt(cell(i, j), 3)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {byNum ? (
        <Note>번호로 재면 좋다(2)와 나쁘다(3)의 차이는 1이고, 좋다(2)와 오늘(0)의 차이는 2입니다. 사전에 넣은 순서가 거리처럼 읽힙니다.</Note>
      ) : null}
    </Viz>
  );
}
