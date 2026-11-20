import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {softmax} from './util';

const CELL = 38;
const LEFT = 62;
const TOP = 34;
const BASE_LAST = 10; // 마지막 토큰의 바꾼 값 (설명용)

const score = (i, j) => 1.5 * Math.sin(1.7 * i + 2.3 * j + 0.5);

export default function CausalMaskGrid() {
  const [n, setN] = useState(5);
  const [masked, setMasked] = useState(true);
  const [sel, setSel] = useState(2);
  const [swap, setSwap] = useState(false);

  const r = Math.min(sel, n - 1);
  const v0 = Array.from({length: n}, (_, j) => j + 1);
  const v1 = v0.map((v, j) => (j === n - 1 ? BASE_LAST : v));

  const A = [];
  for (let i = 0; i < n; i += 1) {
    const sc = [];
    for (let j = 0; j < n; j += 1) sc.push(masked && j > i ? -Infinity : score(i, j));
    A.push(softmax(sc));
  }
  const out = (v) => A.map((row) => row.reduce((acc, a, j) => acc + a * v[j], 0));
  const y0 = out(v0);
  const y1 = out(v1);
  const seen = masked ? (n * (n + 1)) / 2 : n * n;
  const W = LEFT + n * CELL + 10;
  const H = TOP + n * CELL + 8;

  return (
    <Viz
      title="인과 마스크: 어느 칸이 가려지나"
      caption="행은 질문 자리, 열은 열쇠 자리입니다. 마스크를 켜면 자기보다 뒤 칸이 가려집니다. 점수는 설명용 값이고 행마다 소프트맥스를 합니다. 토큰의 값은 1, 2, …, n으로 두었습니다. 아래 표에서 마지막 토큰의 값을 바꿔 보면, 가려진 행은 그 영향을 받지 않는 것이 보입니다."
    >
      <Controls>
        <Btn on={masked} onClick={() => setMasked(true)}>마스크 켜기 (앞만 보기)</Btn>
        <Btn on={!masked} onClick={() => setMasked(false)}>마스크 끄기 (전부 보기)</Btn>
        <Btn on={swap} onClick={() => setSwap(!swap)}>마지막 토큰의 값을 {BASE_LAST}으로 바꾸기</Btn>
      </Controls>
      <Controls>
        <Slider label="토큰 수 n" min={2} max={8} step={1} value={n} onChange={setN} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} style={{maxWidth: 340}} role="img" aria-label={`토큰 ${n}개의 어텐션 비율 표. 마스크 ${masked ? '켜짐' : '꺼짐'}`}>
        {A.map((row, i) => (
          <g key={i} onClick={() => setSel(i)} style={{cursor: 'pointer'}}>
            <text x={LEFT - 8} y={TOP + i * CELL + CELL / 2 + 4} className={s.t} textAnchor="end" style={{fontWeight: i === r ? 700 : 400}}>
              자리 {i + 1}
            </text>
            {row.map((a, j) => {
              const hide = masked && j > i;
              return (
                <g key={j}>
                  <rect
                    x={LEFT + j * CELL}
                    y={TOP + i * CELL}
                    width={CELL - 2}
                    height={CELL - 2}
                    fill={hide ? 'var(--ifm-color-emphasis-200)' : 'var(--va)'}
                    fillOpacity={hide ? 1 : Math.min(1, a) * 0.8}
                    stroke="var(--ifm-color-emphasis-300)"
                  />
                  <text x={LEFT + j * CELL + CELL / 2 - 1} y={TOP + i * CELL + CELL / 2 + 4} className={s.ts} textAnchor="middle" style={hide ? {} : {fill: 'var(--ifm-font-color-base)'}}>
                    {hide ? '−∞' : fmt(a, 2)}
                  </text>
                </g>
              );
            })}
            {i === r ? <rect x={LEFT - 2} y={TOP + i * CELL - 2} width={n * CELL + 2} height={CELL + 2} fill="none" stroke="var(--vb)" strokeWidth="2.5" /> : null}
          </g>
        ))}
        {A.map((_, j) => (
          <text key={j} x={LEFT + j * CELL + CELL / 2 - 1} y={TOP - 10} className={s.ts} textAnchor="middle">열쇠 {j + 1}</text>
        ))}
      </svg>
      <Stats>
        <Stat label="읽는 칸" value={`${seen} / ${n * n}`} tone={masked ? 'good' : undefined} />
        <Stat label="가려진 칸" value={n * n - seen} />
        <Stat label={`자리 ${r + 1}이 읽는 토큰`} value={masked ? `1 ~ ${r + 1}` : `1 ~ ${n}`} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>자리</th>
            <th>출력 y (값이 1, 2, …, n일 때)</th>
            {swap ? <th>마지막 값을 {BASE_LAST}으로 바꾼 뒤</th> : null}
            {swap ? <th>변화</th> : null}
          </tr>
        </thead>
        <tbody>
          {y0.map((y, i) => {
            const dlt = y1[i] - y;
            const same = Math.abs(dlt) < 1e-9;
            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{fmt(y, 3)}</td>
                {swap ? <td>{fmt(y1[i], 3)}</td> : null}
                {swap ? <td className={same ? s.good : s.bad}>{same ? '변함없음' : `+${fmt(dlt, 3)}`}</td> : null}
              </tr>
            );
          })}
        </tbody>
      </table>
      {swap && masked ? (
        <Note>마스크가 있으면 마지막 자리만 값이 바뀌고, 앞 자리는 뒤 토큰을 읽지 않아 출력이 그대로입니다. 그래서 문장 하나를 한 번 계산해도 모든 자리가 앞만 보고 다음 토큰을 맞힙니다.</Note>
      ) : null}
      {swap && !masked ? (
        <Note>마스크가 없으면 모든 자리의 출력이 마지막 토큰의 영향을 받습니다. 학습에서 이렇게 두면 앞 자리가 다음 토큰을 미리 보고 베낍니다.</Note>
      ) : null}
    </Viz>
  );
}
