import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, styles as s} from '../../Viz';
import {trim} from './util';

const L = 8;
const CW = 62;

const pool = (row, mode) =>
  [0, 1, 2, 3].map((k) => (mode === 'max' ? Math.max(row[2 * k], row[2 * k + 1]) : (row[2 * k] + row[2 * k + 1]) / 2));
const stroke = (p) => Array.from({length: L}, (_, k) => (k === p ? 1 : 0));

export default function PoolShift() {
  const [p, setP] = useState(0);
  const [mode, setMode] = useState('avg');

  const row = stroke(p);
  const out = pool(row, mode);
  const prev = p > 0 ? pool(stroke(p - 1), mode) : null;
  const seen = prev ? out.some((v, i) => v !== prev[i]) : null;
  const rows = Array.from({length: L}, (_, q) => pool(stroke(q), mode));

  return (
    <Viz
      title="획이 한 칸씩 움직일 때 풀링 출력"
      caption="여덟 칸 한 줄에서 획 하나(값 1)를 옮겨 보세요. 두 칸마다 하나로 요약합니다. 0번 칸과 1번 칸에서는 첫 덩어리의 평균이 0.5로 같고, 2번 칸으로 가면 덩어리가 바뀌어 출력이 달라집니다."
    >
      <Controls>
        <Slider label="획의 위치" min={0} max={L - 1} value={p} onChange={setP} />
        <Btn onClick={() => setP((p + 1) % L)}>한 칸 옮기기</Btn>
        <Btn on={mode === 'avg'} onClick={() => setMode('avg')}>평균</Btn>
        <Btn on={mode === 'max'} onClick={() => setMode('max')}>최대</Btn>
      </Controls>
      <svg viewBox="0 0 640 190" className={s.svg} role="img" aria-label={`여덟 칸에서 획이 ${p}번 칸에 있을 때 두 칸씩 ${mode === 'max' ? '최대' : '평균'}한 출력 ${out.join(', ')}`}>
        {row.map((v, i) => (
          <g key={i}>
            <rect x={72 + i * CW} y={20} width={CW} height={44} fill="var(--vb)" fillOpacity={v * 0.8} stroke="var(--ifm-color-emphasis-500)" />
            <text x={72 + i * CW + CW / 2} y={48} textAnchor="middle" className={s.t}>{v}</text>
            <text x={72 + i * CW + CW / 2} y={80} textAnchor="middle" className={s.ts}>{i}번</text>
          </g>
        ))}
        {[0, 1, 2, 3].map((k) => (
          <g key={k}>
            <rect x={72 + 2 * k * CW + 2} y={16} width={2 * CW - 4} height={52} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth={2} rx={4} />
            <line x1={72 + (2 * k + 1) * CW} y1={70} x2={72 + (2 * k + 1) * CW} y2={112} stroke="var(--ifm-color-emphasis-500)" />
            <rect x={72 + 2 * k * CW + 2} y={114} width={2 * CW - 4} height={44} fill="var(--va)" fillOpacity={out[k] * 0.8} stroke="var(--ifm-color-emphasis-500)" rx={4} />
            <text x={72 + (2 * k + 1) * CW} y={142} textAnchor="middle" className={s.t} style={{fontWeight: out[k] > 0 ? 700 : 400}}>{trim(out[k])}</text>
          </g>
        ))}
        <text x={4} y={46} className={s.ts}>입력</text>
        <text x={4} y={140} className={s.ts}>출력</text>
        <text x={72} y={180} className={s.ts}>가로 상자 하나가 풀링 덩어리 하나입니다</text>
      </svg>
      <Note>
        {prev === null
          ? '획이 0번 칸에 있습니다. 한 칸 옮겨 보세요.'
          : seen
            ? `${p - 1}번 칸에서 ${p}번 칸으로 옮기자 출력이 달라졌습니다. 덩어리의 경계를 넘었기 때문입니다.`
            : `${p - 1}번 칸에서 ${p}번 칸으로 옮겼지만 출력은 그대로입니다. 같은 덩어리 안에서 움직인 것은 가려집니다.`}
      </Note>
      <table className={s.grid}>
        <thead>
          <tr><th>획의 위치</th><th colSpan={4}>출력 (덩어리 1~4)</th></tr>
        </thead>
        <tbody>
          {rows.map((r, q) => (
            <tr key={q}>
              <td className={q === p ? s.cellOn : undefined}>{q}</td>
              {r.map((v, k) => <td key={k} className={q === p ? s.cellOn : undefined}>{trim(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </Viz>
  );
}
