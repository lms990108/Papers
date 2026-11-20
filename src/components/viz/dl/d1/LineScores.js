import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {num} from './dlmath';

const W0 = [
  [0.5, -0.2],
  [0.1, 0.4],
];

const halo = {stroke: 'var(--ifm-background-surface-color)', strokeWidth: 4, paintOrder: 'stroke'};

// lines=1: 입력 두 개, 줄 하나 / lines=2: 줄 둘
export default function LineScores({lines = 2}) {
  const n = lines === 1 ? 1 : 2;
  const [x, setX] = useState([1, 0]);
  const [w, setW] = useState(W0);
  const setWij = (j, i) => (v) => setW(w.map((row, r) => (r === j ? row.map((c, k) => (k === i ? v : c)) : row)));
  const score = (j, xs) => w[j][0] * xs[0] + w[j][1] * xs[1];
  const sc = [0, 1].slice(0, n).map((j) => score(j, x));
  const best = n === 2 ? (sc[0] > sc[1] ? 1 : sc[1] > sc[0] ? 2 : 0) : 0;
  const inY = n === 1 ? [70, 130] : [50, 130];
  const outY = n === 1 ? [90] : [50, 130];
  const X0 = 90;
  const X1 = 400;

  return (
    <Viz
      title={n === 1 ? '입력 두 개, 줄 하나' : '입력 두 개, 줄 둘'}
      caption={
        n === 1
          ? '밝기와 가중치를 바꿔 보세요. 점선은 밝기가 0이라 이번 입력에서는 합에 더해지지 않는 선입니다. 기본값은 원문의 0.5와 -0.2입니다.'
          : '두 줄은 가중치가 따로입니다. 기본값은 원문의 (0.5, -0.2)와 (0.1, 0.4)이고, 점수가 큰 줄을 답으로 읽습니다.'
      }
    >
      <Controls>
        <Slider label="x₁ 밝기" min={0} max={1} step={0.1} value={x[0]} onChange={(v) => setX([v, x[1]])} format={(v) => fmt(v, 1)} />
        <Slider label="x₂ 밝기" min={0} max={1} step={0.1} value={x[1]} onChange={(v) => setX([x[0], v])} format={(v) => fmt(v, 1)} />
        <Btn on={x[0] === 1 && x[1] === 0} onClick={() => setX([1, 0])}>
          입력 (1, 0)
        </Btn>
        <Btn on={x[0] === 1 && x[1] === 1} onClick={() => setX([1, 1])}>
          입력 (1, 1)
        </Btn>
      </Controls>
      <Controls>
        {[0, 1].slice(0, n).map((j) =>
          [0, 1].map((i) => (
            <Slider
              key={`${j}${i}`}
              label={n === 1 ? `w${i + 1} (칸 ${i + 1}에 곱하는 가중치)` : `${j + 1}줄 w${i + 1} (칸 ${i + 1}의 가중치)`}
              min={-1}
              max={1}
              step={0.1}
              value={w[j][i]}
              onChange={setWij(j, i)}
              format={(v) => fmt(v, 1)}
            />
          )),
        )}
        <Btn onClick={() => setW(W0)}>원문 값으로</Btn>
      </Controls>
      <svg className={s.svg} viewBox="0 0 520 170" role="img" aria-label="입력 두 칸의 밝기에 가중치를 곱해 줄마다 점수를 만드는 그림">
        {[0, 1].slice(0, n).map((j) =>
          [0, 1].map((i) => {
            const y0 = inY[i];
            const y1 = outY[j];
            const t = i === j ? 0.5 : 0.24;
            const lx = X0 + (X1 - X0) * t;
            const ly = y0 + (y1 - y0) * t - (i === j ? 7 : 0) + (i !== j ? (i === 0 ? 11 : -3) : 0);
            const off = x[i] === 0;
            return (
              <g key={`${j}${i}`}>
                <line
                  x1={X0 + 22}
                  y1={y0}
                  x2={X1 - 22}
                  y2={y1}
                  stroke={w[j][i] >= 0 ? 'var(--va)' : 'var(--vb)'}
                  strokeWidth={1 + Math.abs(w[j][i]) * 4}
                  strokeDasharray={off ? '4 4' : undefined}
                  opacity={off ? 0.55 : 1}
                />
                <text x={lx} y={ly} textAnchor="middle" className={s.t} style={halo}>
                  {num(w[j][i], 1)}
                </text>
              </g>
            );
          }),
        )}
        {[0, 1].map((i) => (
          <g key={i}>
            <circle cx={X0} cy={inY[i]} r={22} fill="var(--ifm-background-color)" stroke="var(--ifm-color-emphasis-500)" />
            <text x={X0} y={inY[i] + 4} textAnchor="middle" className={s.t}>
              {fmt(x[i], 1)}
            </text>
            <text x={X0 - 30} y={inY[i] + 4} textAnchor="end" className={s.ts}>
              x{i + 1}
            </text>
          </g>
        ))}
        {sc.map((v, j) => (
          <g key={j}>
            <rect
              x={X1 - 22}
              y={outY[j] - 22}
              width={84}
              height={44}
              rx={8}
              fill="var(--ifm-background-color)"
              stroke={best === j + 1 ? 'var(--vok)' : 'var(--ifm-color-emphasis-500)'}
              strokeWidth={best === j + 1 ? 2.5 : 1}
            />
            <text x={X1 + 20} y={outY[j] - 3} textAnchor="middle" className={s.ts}>
              {n === 1 ? '점수' : `${j + 1}줄 점수`}
            </text>
            <text x={X1 + 20} y={outY[j] + 14} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>
              {fmt(v, 2)}
            </text>
          </g>
        ))}
      </svg>
      {n === 1 ? (
        <Note>
          계산: {num(w[0][0], 1)} × {fmt(x[0], 1)} + ({num(w[0][1], 1)}) × {fmt(x[1], 1)} = {fmt(sc[0], 2)}
          {x[1] === 0 ? ' · x₂가 0이라 w₂는 이번 합에 들어가지 않습니다. x₂를 올려 보세요.' : ''}
        </Note>
      ) : (
        <>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>입력 (x₁, x₂)</th>
                <th>첫 줄</th>
                <th>둘째 줄</th>
                <th>큰 줄</th>
              </tr>
            </thead>
            <tbody>
              {[
                [1, 0],
                [1, 1],
              ].map((xs) => {
                const a = score(0, xs);
                const b = score(1, xs);
                return (
                  <tr key={xs.join()}>
                    <td>({xs.join(', ')})</td>
                    <td className={a > b ? s.cellOn : undefined}>{fmt(a, 2)}</td>
                    <td className={b > a ? s.cellOn : undefined}>{fmt(b, 2)}</td>
                    <td>{a > b ? '첫째' : b > a ? '둘째' : '같음'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Stats>
            <Stat label="첫 줄 점수" value={fmt(sc[0], 2)} />
            <Stat label="둘째 줄 점수" value={fmt(sc[1], 2)} />
            <Stat label="답으로 읽는 줄" value={best === 0 ? '같은 점수' : `${best}번째 줄`} tone={best ? 'good' : undefined} />
          </Stats>
        </>
      )}
    </Viz>
  );
}
