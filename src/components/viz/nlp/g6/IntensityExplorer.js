import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const SIZES = [4, 64, 1024, 4096];
const ROWS = [1, 4, 8];

const big = (x) => {
  if (x < 1000) return String(x);
  const u = [[1e9, 'G'], [1e6, 'M'], [1e3, 'K']];
  for (let i = 0; i < u.length; i += 1) {
    if (x >= u[i][0]) return `${Math.round((x / u[i][0]) * 10) / 10}${u[i][1]}`;
  }
  return String(x);
};

export default function IntensityExplorer() {
  const [m, setM] = useState(4);
  const [n, setN] = useState(4);
  const [cap, setCap] = useState(2);
  const cells = n * n;
  const bytes = 2 * cells;
  const row = (t) => ({t, ops: 2 * t * cells, ai: (2 * t * cells) / bytes});
  const rows = ROWS.includes(m) ? ROWS : ROWS.concat([m]).sort((a, b) => a - b);
  const cur = row(m);
  const mem = cur.ai < cap;
  const Mmax = 32;
  const bw = 17;

  return (
    <Viz
      title="바이트당 연산은 토큰 수만큼"
      caption="막대는 토큰 수 M마다의 바이트당 연산입니다. 점선은 기계가 바이트 하나를 읽는 동안 할 수 있는 연산의 상한인데, 이 글에는 그 값이 없어서 설명용 값을 슬라이더로 둡니다. 막대를 눌러 M을 고를 수도 있습니다."
    >
      <Controls>
        <Slider label="토큰 수 M" min={1} max={Mmax} value={m} onChange={setM} />
        <Slider label="상한 (설명용)" min={1} max={16} value={cap} onChange={setCap} />
      </Controls>
      <Controls>
        <span className={s.ts}>행렬 한 변</span>
        {SIZES.map((v) => (
          <Btn key={v} on={n === v} onClick={() => setN(v)}>
            {v}
          </Btn>
        ))}
      </Controls>
      <svg viewBox="0 0 640 220" className={s.svg} role="img" aria-label="토큰 수에 따른 바이트당 연산 막대와 기계 상한 점선">
        <line x1={30} y1={190} x2={620} y2={190} stroke="var(--ifm-color-emphasis-400)" />
        {Array.from({length: Mmax}).map((_, i) => {
          const t = i + 1;
          const hh = (t / Mmax) * 160;
          const below = t < cap;
          return (
            <g key={t} onClick={() => setM(t)} style={{cursor: 'pointer'}}>
              <rect x={38 + i * 18.2} y={190 - hh} width={bw} height={hh} fill={below ? 'var(--vb)' : 'var(--va)'} fillOpacity={t === m ? 1 : 0.4} stroke={t === m ? 'var(--ifm-font-color-base)' : 'none'} />
              <rect x={38 + i * 18.2} y={30} width={bw} height={160} fill="transparent" />
              {t === 1 || t % 4 === 0 ? <text x={38 + i * 18.2 + bw / 2} y={206} textAnchor="middle" className={s.ts}>{t}</text> : null}
            </g>
          );
        })}
        <line x1={30} y1={190 - (cap / Mmax) * 160} x2={620} y2={190 - (cap / Mmax) * 160} stroke="var(--vbad)" strokeDasharray="6 4" strokeWidth="1.5" />
        <text x={620} y={184 - (cap / Mmax) * 160} textAnchor="end" className={s.ts}>{`기계 상한 ${cap} (설명용)`}</text>
        <text x={34} y={20} className={s.ts}>주황 = 상한보다 낮음(읽기를 기다림), 파랑 = 상한 이상(계산이 병목)</text>
      </svg>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>토큰 수 M</th>
            <th>연산 2·M·{n}²</th>
            <th>읽기 (2·{n}² 바이트)</th>
            <th>바이트당 연산</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const r = row(t);
            return (
              <tr key={t}>
                <td className={t === m ? s.cellOn : undefined}>{t}</td>
                <td>{big(r.ops)}</td>
                <td>{big(bytes)}바이트</td>
                <td className={t === m ? s.cellOn : undefined}>{r.ai}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Stats>
        <Stat label={`M = ${m}의 바이트당 연산`} value={String(cur.ai)} />
        <Stat label="판정 (설명용 상한 기준)" value={mem ? 'memory-bound' : 'compute-bound'} tone={mem ? 'bad' : 'good'} />
      </Stats>
      <Note>
        행렬의 한 변을 4에서 4096으로 바꿔도 바이트당 연산은 M 그대로입니다. 연산과 읽기가 모두 변의 제곱으로 늘기 때문입니다. 값을 정하는 것은 한 번에 곱하는 토큰 수입니다.
      </Note>
    </Viz>
  );
}
