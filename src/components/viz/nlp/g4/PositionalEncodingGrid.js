import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, fmt, styles as s} from '../../Viz';

const NPOS = 16;
const CW = 22;
const CH = 15;
const LEFT = 34;
const TOP = 26;

const pe = (pos, d) => {
  const out = [];
  for (let i = 0; i < d / 2; i += 1) {
    const ang = pos / Math.pow(10000, (2 * i) / d);
    out.push(Math.sin(ang), Math.cos(ang));
  }
  return out;
};

export default function PositionalEncodingGrid() {
  const [d, setD] = useState(4);
  const [pos, setPos] = useState(1);

  const rows = [];
  for (let p = 0; p < NPOS; p += 1) rows.push(pe(p, d));
  const cur = rows[pos];
  const W = LEFT + 16 * CW + 10;
  const H = TOP + NPOS * CH + 8;
  const cw = (16 * CW) / d;

  return (
    <Viz
      title="위치 인코딩: 자리마다 다른 목록"
      caption="가로는 목록의 칸, 세로는 자리 번호입니다. 파랑은 양수, 주황은 음수이고 진할수록 절댓값이 큽니다. 앞쪽 칸 쌍은 자리가 바뀔 때마다 빨리 변하고, 뒤쪽 쌍은 천천히 변합니다. d = 2이면 임베딩 페이지의 [sin, cos] 예와 같습니다."
    >
      <Controls>
        {[2, 4, 8, 16].map((v) => (
          <Btn key={v} on={d === v} onClick={() => setD(v)}>
            길이 d = {v}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="자리 번호 pos" min={0} max={NPOS - 1} step={1} value={pos} onChange={setPos} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={`자리 0부터 ${NPOS - 1}까지, 길이 ${d}인 사인·코사인 위치 목록의 값을 색으로 나타낸 표`}>
        {cur.map((_, c) => (
          <text key={c} x={LEFT + c * cw + cw / 2} y={TOP - 8} className={s.ts} textAnchor="middle">
            {c % 2 === 0 ? 'sin' : 'cos'}
          </text>
        ))}
        {rows.map((r, p) => (
          <g key={p}>
            <text x={LEFT - 6} y={TOP + p * CH + CH - 4} className={s.ts} textAnchor="end">{p}</text>
            {r.map((v, c) => (
              <rect
                key={c}
                x={LEFT + c * cw}
                y={TOP + p * CH}
                width={cw - 1}
                height={CH - 1}
                fill={v >= 0 ? 'var(--va)' : 'var(--vb)'}
                fillOpacity={Math.min(1, Math.abs(v)) * 0.85}
              />
            ))}
          </g>
        ))}
        <rect x={LEFT - 1} y={TOP + pos * CH - 1} width={16 * CW + 1} height={CH + 1} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth="2" />
      </svg>
      <div style={{overflowX: 'auto'}}>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>pos = {pos}</th>
            {cur.map((_, c) => (
              <th key={c}>{c % 2 === 0 ? 'sin' : 'cos'} (쌍 {Math.floor(c / 2) + 1})</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>값</td>
            {cur.map((v, c) => (
              <td key={c} className={s.cellOn}>{fmt(v, 4)}</td>
            ))}
          </tr>
        </tbody>
      </table>
      </div>
      <Note>
        자리 번호가 달라지면 목록이 달라지므로 같은 토큰도 자리에 따라 입력이 다릅니다. 이 목록은 자리 번호로 정한 함수이고, 토큰 목록에 더해 넣습니다.
      </Note>
    </Viz>
  );
}
