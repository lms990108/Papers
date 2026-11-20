import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const W = 4; // 4x4 가중치 행렬
const CELLS = W * W; // 16칸
const BYTES = CELLS * 2; // bfloat16, 32바이트

export default function PrefillDecodeTimeline() {
  const [m, setM] = useState(4);
  const [n, setN] = useState(4);
  const [step, setStep] = useState(99);
  const shown = Math.min(step, n);

  const passes = [{label: 'prefill', tok: m, ops: 2 * m * CELLS}];
  for (let i = 1; i <= n; i += 1) passes.push({label: `decode ${i}`, tok: 1, ops: 2 * CELLS});
  const maxV = Math.max(BYTES, 2 * m * CELLS);
  const colW = Math.min(76, 620 / passes.length);
  const H = 110;
  const sum = passes.slice(0, shown + 1);
  const totOps = sum.reduce((a, p) => a + p.ops, 0);
  const totRead = sum.length * BYTES;

  return (
    <Viz
      title="prefill 한 번, decode 여러 번"
      caption="색 막대는 그 구간의 연산 횟수이고, 회색 막대는 가중치를 읽는 양(32바이트)입니다. 두 막대는 같은 눈금입니다. 4×4 행렬 한 개를 기준으로 한 설명용 크기입니다. TTFT(time to first token)는 첫 출력 토큰까지의 대기 시간이고, TPOT(time per output token)는 출력 토큰 사이의 간격입니다."
    >
      <Controls>
        <Slider label="프롬프트 토큰 수" min={1} max={16} value={m} onChange={setM} />
        <Slider label="출력 토큰 수 (decode 횟수)" min={1} max={20} value={n} onChange={setN} />
      </Controls>
      <Controls>
        <Btn onClick={() => setStep(0)}>처음부터 한 단계씩</Btn>
        <Btn onClick={() => setStep(Math.min(shown + 1, n))}>다음 단계</Btn>
        <Btn onClick={() => setStep(99)}>전체 보기</Btn>
      </Controls>
      <svg viewBox="0 0 700 190" className={s.svg} role="img" aria-label="prefill 구간은 연산이 크고, decode 구간마다 연산은 작지만 가중치 읽기는 같다">
        <line x1={30} y1={H + 20} x2={690} y2={H + 20} stroke="var(--ifm-color-emphasis-400)" />
        {passes.map((p, i) => {
          const x = 36 + i * colW;
          const bw = Math.max(8, colW / 2 - 6);
          const on = i <= shown;
          const ho = (p.ops / maxV) * H;
          const hr = (BYTES / maxV) * H;
          return (
            <g key={p.label} opacity={on ? 1 : 0.2}>
              <rect x={x} y={H + 20 - ho} width={bw} height={ho} fill={i === 0 ? 'var(--vb)' : 'var(--va)'} />
              <rect x={x + bw + 2} y={H + 20 - hr} width={bw} height={hr} fill="var(--ifm-color-emphasis-500)" />
              {colW >= 30 ? (
                <text x={x + bw} y={H + 36} textAnchor="middle" className={s.ts}>{i === 0 ? 'prefill' : `d${i}`}</text>
              ) : null}
              {colW >= 44 || i === 0 ? (
                <text x={x + bw / 2} y={H + 14 - ho} textAnchor="middle" className={s.ts}>{p.ops}</text>
              ) : null}
            </g>
          );
        })}
        <text x={36} y={14} className={s.ts}>색 막대 = 연산 횟수, 회색 막대 = 읽은 바이트</text>
        <text x={36} y={H + 58} className={s.t}>첫 출력 토큰까지의 대기 = prefill (TTFT)</text>
        <text x={36} y={H + 78} className={s.t}>토큰과 토큰 사이 = decode 한 번 (TPOT)</text>
      </svg>
      <Stats>
        <Stat label="prefill 바이트당 연산" value={fmt(passes[0].ops / BYTES, 0)} tone="good" />
        <Stat label="decode 바이트당 연산" value={fmt((2 * CELLS) / BYTES, 0)} tone="bad" />
        <Stat label="지금까지 연산 합" value={String(totOps)} />
        <Stat label="지금까지 읽은 바이트" value={String(totRead)} />
        <Stat label="합의 바이트당 연산" value={fmt(totOps / totRead, 2)} />
      </Stats>
      <Note>
        프롬프트를 늘리면 prefill의 연산만 커지고 읽기는 그대로입니다. 출력을 늘리면 decode가 한 번 늘 때마다 연산 32와 읽기 32바이트가 똑같이 더해집니다. 원본의 예(프롬프트 4토큰)에서 prefill은 연산 128, decode 한 번은 연산 32입니다.
      </Note>
    </Viz>
  );
}
