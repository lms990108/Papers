import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, styles as s} from '../../Viz';

const W = 560;
const INSTR = 30; // 설명용: 지시문 토큰
const QTOK = 20; // 설명용: 질문 토큰
const LIMIT = 4096; // 설명용: 입력 한도
const f = (n) => n.toLocaleString('en-US');

export default function PromptLength() {
  const [k, setK] = useState(3);
  const [size, setSize] = useState(200);
  const total = (kk) => INSTR + kk * size + QTOK;
  const t = total(k);
  const max = Math.max(LIMIT, t);
  const X = (v) => 10 + (v / max) * (W - 20);
  const segs = [{label: '지시', len: INSTR, c: 'var(--vc)'}];
  for (let i = 1; i <= k; i += 1) segs.push({label: `[${i}]`, len: size, c: 'var(--vok)'});
  segs.push({label: '질문', len: QTOK, c: 'var(--va)'});
  let x = 0;

  return (
    <Viz
      title="k가 커지면 입력이 길어진다"
      caption="k와 청크 크기를 바꿔 보세요. 지시 30, 질문 20, 입력 한도 4,096 토큰은 설명용 값입니다. prefill은 답을 잇기 전에 이 입력 전체를 먼저 읽습니다."
    >
      <Controls>
        <Slider label="k (붙일 청크 수)" min={1} max={10} value={k} onChange={setK} />
        <Slider label="청크 크기(토큰)" min={50} max={500} step={50} value={size} onChange={setSize} />
      </Controls>
      <svg viewBox={`0 0 ${W} 80`} className={s.svg} role="img" aria-label={`입력 ${t} 토큰, 한도 ${LIMIT} 토큰`}>
        {segs.map((sg, i) => {
          const x0 = x;
          x += sg.len;
          return (
            <g key={i}>
              <rect x={X(x0)} y={14} width={Math.max(1, X(x) - X(x0) - 1)} height={30} fill={sg.c} fillOpacity="0.4" stroke={sg.c} />
              {X(x) - X(x0) > 22 ? (
                <text x={(X(x0) + X(x)) / 2} y={33} textAnchor="middle" className={s.ts}>{sg.label}</text>
              ) : null}
            </g>
          );
        })}
        <line x1={X(LIMIT)} x2={X(LIMIT)} y1={6} y2={56} stroke="var(--vbad)" strokeWidth="2" strokeDasharray="4 3" />
        <text x={X(LIMIT)} y={72} textAnchor={X(LIMIT) > W - 80 ? 'end' : 'middle'} className={s.ts}>한도 {f(LIMIT)}</text>
        <text x={10} y={72} className={s.ts}>0</text>
      </svg>
      <Stats>
        <Stat label="입력 토큰 합" value={f(t)} tone={t > LIMIT ? 'bad' : undefined} />
        <Stat label="k = 1일 때 대비" value={`${(t / total(1)).toFixed(2)}배`} />
        <Stat label="한도 사용" value={t > LIMIT ? '한도 초과' : `${Math.round((t / LIMIT) * 100)}%`} tone={t > LIMIT ? 'bad' : 'good'} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>k</th>
            {[1, 2, 3, 4, 5].map((v) => (
              <th key={v}>{v}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>입력 토큰</td>
            {[1, 2, 3, 4, 5].map((v) => (
              <td key={v} className={v === k ? s.cellOn : undefined}>{f(total(v))}</td>
            ))}
          </tr>
          <tr>
            <td>k = 1 대비</td>
            {[1, 2, 3, 4, 5].map((v) => (
              <td key={v} className={v === k ? s.cellOn : undefined}>{(total(v) / total(1)).toFixed(2)}배</td>
            ))}
          </tr>
        </tbody>
      </table>
      <Note>k를 1에서 5로 올리면 늘어나는 것은 붙은 청크 칸이고, 그만큼 prefill이 읽는 양이 커집니다. 청크 크기를 키워도 같은 일이 생깁니다.</Note>
    </Viz>
  );
}
